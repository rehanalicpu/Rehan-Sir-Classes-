import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import {
  Student,
  FeeCycle,
  Payment,
  NotificationRecord,
  MessageLog,
  StudentFinancialSummary,
  PaymentMethod,
} from '../types';
import {
  getTodayIST,
  generateRequiredCycles,
  computeStudentFinancialSummary,
  allocatePaymentToCycles,
  calculateCycleDates,
  formatINR,
  diffDays,
} from '../utils/feeCycleUtils';

interface TuitionDataContextType {
  students: Student[];
  feeCycles: FeeCycle[];
  payments: Payment[];
  notifications: NotificationRecord[];
  messageLogs: MessageLog[];
  summaries: StudentFinancialSummary[];
  loading: boolean;
  addStudent: (data: Omit<Student, 'id' | 'teacherUid' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  toggleStudentStatus: (studentId: string) => Promise<void>;
  recordPayment: (paymentParams: {
    studentId: string;
    feeCycleId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    notes?: string;
  }) => Promise<Payment>;
  runDailyCycleAudit: () => Promise<{ cyclesCreated: number; notificationsSent: number }>;
  markNotificationRead: (id: string) => Promise<void>;
  logDirectMessage: (log: Omit<MessageLog, 'id' | 'teacherUid' | 'sentAt'>) => Promise<void>;
  seedDemoDataIfEmpty: () => Promise<void>;
}

const TuitionDataContext = createContext<TuitionDataContextType | undefined>(undefined);

export const TuitionDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, settings } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [feeCycles, setFeeCycles] = useState<FeeCycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) {
      setStudents([]);
      setFeeCycles([]);
      setPayments([]);
      setNotifications([]);
      setMessageLogs([]);
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;
    const unsubscribes: (() => void)[] = [];

    // 1. Students
    const studentsQuery = query(collection(db, 'students'), where('teacherUid', '==', uid));
    unsubscribes.push(
      onSnapshot(
        studentsQuery,
        (snap) => {
          const list: Student[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Student));
          setStudents(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'students')
      )
    );

    // 2. Fee Cycles
    const cyclesQuery = query(collection(db, 'feeCycles'), where('teacherUid', '==', uid));
    unsubscribes.push(
      onSnapshot(
        cyclesQuery,
        (snap) => {
          const list: FeeCycle[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FeeCycle));
          setFeeCycles(list);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'feeCycles')
      )
    );

    // 3. Payments
    const paymentsQuery = query(collection(db, 'payments'), where('teacherUid', '==', uid));
    unsubscribes.push(
      onSnapshot(
        paymentsQuery,
        (snap) => {
          const list: Payment[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Payment));
          setPayments(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'payments')
      )
    );

    // 4. Notifications
    const notifsQuery = query(collection(db, 'notifications'), where('teacherUid', '==', uid));
    unsubscribes.push(
      onSnapshot(
        notifsQuery,
        (snap) => {
          const list: NotificationRecord[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as NotificationRecord));
          setNotifications(list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'notifications')
      )
    );

    // 5. Message Logs
    const logsQuery = query(collection(db, 'messageLogs'), where('teacherUid', '==', uid));
    unsubscribes.push(
      onSnapshot(
        logsQuery,
        (snap) => {
          const list: MessageLog[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...d.data() } as MessageLog));
          setMessageLogs(list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
          setLoading(false);
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'messageLogs')
      )
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [currentUser]);

  // Compute live summaries for all students
  const summaries = useMemo(() => {
    const today = getTodayIST();
    return students.map((student) =>
      computeStudentFinancialSummary(student, feeCycles, payments, today)
    );
  }, [students, feeCycles, payments]);

  // Add a new student & initialize fee cycles based on Date of Joining
  const addStudent = async (data: Omit<Student, 'id' | 'teacherUid' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    if (!currentUser) throw new Error('Teacher must be logged in.');

    const studentDocRef = doc(collection(db, 'students'));
    const studentId = studentDocRef.id;
    const now = new Date().toISOString();

    const studentRecord: Student = {
      ...data,
      id: studentId,
      teacherUid: currentUser.uid,
      createdAt: now,
      updatedAt: now,
    };

    const batch = writeBatch(db);
    batch.set(studentDocRef, studentRecord);

    // Automatically compute initial cycles based on Joining Date
    const today = getTodayIST();
    const requiredCycles = generateRequiredCycles(studentRecord, [], today);

    for (const cycle of requiredCycles) {
      const cycleDocRef = doc(db, 'feeCycles', cycle.id);
      batch.set(cycleDocRef, cycle);
    }

    try {
      await batch.commit();
      return studentId;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    }
  };

  // Update student details
  const updateStudent = async (studentId: string, data: Partial<Student>): Promise<void> => {
    if (!currentUser) throw new Error('Not authenticated');
    const path = `students/${studentId}`;
    try {
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Toggle active/deactivated
  const toggleStudentStatus = async (studentId: string): Promise<void> => {
    const s = students.find((item) => item.id === studentId);
    if (!s) return;
    const nextStatus = s.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
    await updateStudent(studentId, { status: nextStatus });
  };

  // Delete student and associated records
  const deleteStudent = async (studentId: string): Promise<void> => {
    if (!currentUser) throw new Error('Not authenticated');
    const path = `students/${studentId}`;
    try {
      const batch = writeBatch(db);
      // Delete student doc
      batch.delete(doc(db, 'students', studentId));

      // Delete cycles for this student
      const studentCycles = feeCycles.filter((c) => c.studentId === studentId);
      studentCycles.forEach((c) => batch.delete(doc(db, 'feeCycles', c.id)));

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  // Record a Fee Payment
  const recordPayment = async (paymentParams: {
    studentId: string;
    feeCycleId: string;
    paymentAmount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    notes?: string;
  }): Promise<Payment> => {
    if (!currentUser) throw new Error('Not authenticated');

    const student = students.find((s) => s.id === paymentParams.studentId);
    if (!student) throw new Error('Student not found');

    const today = getTodayIST();
    const studentCycles = feeCycles.filter((c) => c.studentId === student.id);
    const summary = computeStudentFinancialSummary(student, feeCycles, payments, today);

    const prevOutstanding = summary.totalOutstanding;
    const paymentAmount = paymentParams.paymentAmount;
    const remainingOutstanding = Math.max(0, prevOutstanding - paymentAmount);

    // Allocate payment across unpaid cycles (oldest first)
    const { updatedCycles } = allocatePaymentToCycles(
      studentCycles,
      paymentAmount,
      paymentParams.paymentDate
    );

    const receiptYear = paymentParams.paymentDate.split('-')[0] || '2026';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCPT-${receiptYear}-${randomSuffix}`;
    const paymentDocRef = doc(collection(db, 'payments'));
    const now = new Date().toISOString();

    const paymentRecord: Payment = {
      id: paymentDocRef.id,
      paymentId: paymentDocRef.id,
      receiptNumber,
      studentId: student.id,
      studentName: student.name,
      teacherUid: currentUser.uid,
      feeCycleId: paymentParams.feeCycleId,
      cyclePeriod: summary.currentCycle?.monthLabel || 'Current Period',
      monthlyFee: student.monthlyFee,
      previousOutstanding: prevOutstanding,
      paymentAmount: paymentAmount,
      remainingOutstanding: remainingOutstanding,
      paymentDate: paymentParams.paymentDate,
      paymentMethod: paymentParams.paymentMethod,
      transactionId: paymentParams.transactionId || '',
      notes: paymentParams.notes || '',
      createdAt: now,
    };

    const batch = writeBatch(db);
    batch.set(paymentDocRef, paymentRecord);

    // Update all modified cycles
    for (const cyc of updatedCycles) {
      const cycRef = doc(db, 'feeCycles', cyc.id);
      batch.update(cycRef, {
        paidAmount: cyc.paidAmount,
        outstandingAmount: cyc.outstandingAmount,
        status: cyc.status,
        lastPaymentDate: cyc.lastPaymentDate || paymentParams.paymentDate,
        updatedAt: now,
      });
    }

    // Add confirmation notification
    const notifRef = doc(collection(db, 'notifications'));
    const notifRecord: NotificationRecord = {
      id: notifRef.id,
      teacherUid: currentUser.uid,
      studentId: student.id,
      studentName: student.name,
      title: `PAYMENT RECEIVED - ${student.name}`,
      body: `Received ${formatINR(paymentAmount)} via ${paymentParams.paymentMethod}. Remaining: ${formatINR(remainingOutstanding)}`,
      outstandingAmount: remainingOutstanding,
      type: 'PAYMENT_RECEIVED',
      read: false,
      sentAt: now,
    };
    batch.set(notifRef, notifRecord);

    try {
      await batch.commit();

      // Trigger Web Push Notification if browser allows
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`Payment Received: ${student.name}`, {
            body: `Received ${formatINR(paymentAmount)} (${paymentParams.paymentMethod}). Balance: ${formatINR(remainingOutstanding)}`,
            icon: '/pwa-192x192.png',
          });
        } catch (e) {
          console.debug('Notification trigger skipped:', e);
        }
      }

      return paymentRecord;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    }
  };

  // Daily Fee Cycle Audit and Notification Generator (Automated Daily Process)
  const runDailyCycleAudit = async (): Promise<{ cyclesCreated: number; notificationsSent: number }> => {
    if (!currentUser) return { cyclesCreated: 0, notificationsSent: 0 };

    const today = getTodayIST();
    let cyclesCreatedCount = 0;
    let notifsCount = 0;

    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const student of students) {
      if (student.status !== 'ACTIVE') continue;

      // Check required cycles
      const expectedCycles = generateRequiredCycles(student, feeCycles, today);
      const existingIds = new Set(feeCycles.filter((c) => c.studentId === student.id).map((c) => c.id));

      for (const exp of expectedCycles) {
        if (!existingIds.has(exp.id)) {
          const cycRef = doc(db, 'feeCycles', exp.id);
          batch.set(cycRef, exp);
          cyclesCreatedCount++;
        }
      }

      const summary = computeStudentFinancialSummary(student, feeCycles, payments, today);
      if (summary.totalOutstanding > 0) {
        // Create teacher push notification record
        const title = summary.isOverdue
          ? `FEE OVERDUE - ${student.name} - ${formatINR(summary.totalOutstanding)}`
          : summary.isDueToday
          ? `FEE DUE TODAY - ${student.name} - ${formatINR(summary.totalOutstanding)}`
          : `FEE PENDING - ${student.name} - ${formatINR(summary.totalOutstanding)}`;

        const body = summary.daysOverdue > 0
          ? `${student.name}'s tuition fee is pending for ${summary.daysOverdue} days. Father: ${student.fatherName}`
          : `Monthly fee is due. Amount: ${formatINR(summary.totalOutstanding)}. WhatsApp: ${student.parentWhatsAppNumber}`;

        const notifRef = doc(collection(db, 'notifications'));
        const notifRecord: NotificationRecord = {
          id: notifRef.id,
          teacherUid: currentUser.uid,
          studentId: student.id,
          studentName: student.name,
          title,
          body,
          outstandingAmount: summary.totalOutstanding,
          daysPending: summary.daysOverdue,
          type: summary.isOverdue ? 'OVERDUE' : summary.isDueToday ? 'DUE_TODAY' : 'DUE_TODAY',
          read: false,
          sentAt: now,
        };
        batch.set(notifRef, notifRecord);
        notifsCount++;
      }
    }

    try {
      if (cyclesCreatedCount > 0 || notifsCount > 0) {
        await batch.commit();
      }
      return { cyclesCreated: cyclesCreatedCount, notificationsSent: notifsCount };
    } catch (err) {
      console.error('Daily audit batch commit error:', err);
      return { cyclesCreated: 0, notificationsSent: 0 };
    }
  };

  // Mark notification as read
  const markNotificationRead = async (id: string): Promise<void> => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  // Log communication message
  const logDirectMessage = async (log: Omit<MessageLog, 'id' | 'teacherUid' | 'sentAt'>): Promise<void> => {
    if (!currentUser) return;
    const logRef = doc(collection(db, 'messageLogs'));
    const record: MessageLog = {
      ...log,
      id: logRef.id,
      teacherUid: currentUser.uid,
      sentAt: new Date().toISOString(),
    };
    try {
      await setDoc(logRef, record);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messageLogs');
    }
  };

  // Seed sample realistic student data if the teacher has zero students
  const seedDemoDataIfEmpty = async (): Promise<void> => {
    if (!currentUser || students.length > 0) return;

    // Use current local year and month to produce realistic cycles matching user's prompt
    // Joining date examples:
    // Rahul: joined 2 months ago -> 1st cycle paid, 2nd cycle pending
    // Aman: joined 3 months ago -> pending overdue
    // Priya: joined 1 month ago -> due today
    // Sameer: joined recently -> upcoming cycle
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    const sampleStudents: Omit<Student, 'id' | 'teacherUid' | 'createdAt' | 'updatedAt'>[] = [
      {
        studentId: 'RST-2026-001',
        name: 'Rahul Kumar',
        fatherName: 'Suresh Kumar',
        joiningDate: '2026-09-05',
        mobileNumber: '9876543210',
        parentWhatsAppNumber: '9876543210',
        monthlyFee: 800,
        notes: 'Class 10th Mathematics and Science batch.',
        status: 'ACTIVE',
      },
      {
        studentId: 'RST-2026-002',
        name: 'Aman Sharma',
        fatherName: 'Rajesh Sharma',
        joiningDate: '2026-08-12',
        mobileNumber: '9812345678',
        parentWhatsAppNumber: '9812345678',
        monthlyFee: 1200,
        notes: 'Class 12th Physics and Chemistry.',
        status: 'ACTIVE',
      },
      {
        studentId: 'RST-2026-003',
        name: 'Priya Verma',
        fatherName: 'Manoj Verma',
        joiningDate: '2026-10-06',
        mobileNumber: '9923456789',
        parentWhatsAppNumber: '9923456789',
        monthlyFee: 1000,
        notes: 'Class 9th English and Social Science.',
        status: 'ACTIVE',
      },
      {
        studentId: 'RST-2026-004',
        name: 'Sneha Gupta',
        fatherName: 'Anil Gupta',
        joiningDate: '2026-10-25',
        mobileNumber: '9734567890',
        parentWhatsAppNumber: '9734567890',
        monthlyFee: 900,
        notes: 'Class 8th Foundation batch.',
        status: 'ACTIVE',
      },
      {
        studentId: 'RST-2026-005',
        name: 'Mohammad Zaid',
        fatherName: 'Khurram Zaid',
        joiningDate: '2026-09-20',
        mobileNumber: '9645678901',
        parentWhatsAppNumber: '9645678901',
        monthlyFee: 1500,
        notes: 'IIT Foundation batch.',
        status: 'ACTIVE',
      },
    ];

    const today = getTodayIST();

    for (const sample of sampleStudents) {
      const studentDocRef = doc(collection(db, 'students'));
      const studentId = studentDocRef.id;
      const sRecord: Student = {
        ...sample,
        id: studentId,
        teacherUid: currentUser.uid,
        createdAt: now,
        updatedAt: now,
      };
      batch.set(studentDocRef, sRecord);

      // Generate cycles
      const requiredCycles = generateRequiredCycles(sRecord, [], today);
      for (const cyc of requiredCycles) {
        const cycRef = doc(db, 'feeCycles', cyc.id);
        batch.set(cycRef, cyc);
      }
    }

    try {
      await batch.commit();
    } catch (err) {
      console.error('Error seeding demo data:', err);
    }
  };

  return (
    <TuitionDataContext.Provider
      value={{
        students,
        feeCycles,
        payments,
        notifications,
        messageLogs,
        summaries,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentStatus,
        recordPayment,
        runDailyCycleAudit,
        markNotificationRead,
        logDirectMessage,
        seedDemoDataIfEmpty,
      }}
    >
      {children}
    </TuitionDataContext.Provider>
  );
};

export function useTuitionData() {
  const context = useContext(TuitionDataContext);
  if (!context) {
    throw new Error('useTuitionData must be used within a TuitionDataProvider');
  }
  return context;
}

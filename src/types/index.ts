export interface TeacherProfile {
  uid: string;
  email: string;
  displayName: string;
  tuitionName: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string; // Document ID
  studentId: string; // Unique Roll No / ID e.g. "RST-2026-001"
  teacherUid: string;
  name: string;
  fatherName: string;
  joiningDate: string; // YYYY-MM-DD
  mobileNumber: string;
  parentWhatsAppNumber: string;
  monthlyFee: number;
  photoUrl?: string;
  notes?: string;
  status: 'ACTIVE' | 'DEACTIVATED';
  createdAt: string;
  updatedAt: string;
}

export type FeeCycleStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface FeeCycle {
  id: string; // Document ID
  cycleId: string; // Deterministic cycle identifier
  studentId: string;
  teacherUid: string;
  studentName: string;
  cycleNumber: number; // 1, 2, 3...
  cycleStartDate: string; // YYYY-MM-DD
  cycleDueDate: string; // YYYY-MM-DD
  monthLabel: string; // e.g. "Dec 2026 - Jan 2027" or "Month 1 (Dec 2026)"
  feeAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: FeeCycleStatus;
  lastPaymentDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';

export interface Payment {
  id: string; // Document ID
  paymentId: string;
  receiptNumber: string; // e.g. "RCPT-2026-0001"
  studentId: string;
  studentName: string;
  teacherUid: string;
  feeCycleId: string; // ID of cycle or 'ALL_OUTSTANDING'
  cyclePeriod: string;
  monthlyFee: number;
  previousOutstanding: number;
  paymentAmount: number;
  remainingOutstanding: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  teacherUid: string;
  studentId?: string;
  studentName?: string;
  title: string;
  body: string;
  outstandingAmount?: number;
  daysPending?: number;
  type: 'DUE_TODAY' | 'OVERDUE' | 'PAYMENT_RECEIVED' | 'DAILY_SUMMARY';
  read: boolean;
  sentAt: string;
}

export interface MessageLog {
  id: string;
  teacherUid: string;
  studentId: string;
  studentName: string;
  channel: 'WHATSAPP' | 'SMS';
  recipientNumber: string;
  messageText: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'MANUAL_CLICK_OPENED';
  provider: string;
  errorMessage?: string;
  sentAt: string;
}

export interface WhatsAppConfig {
  phoneNumberId?: string;
  accessToken?: string;
  templateName?: string;
  businessAccountId?: string;
}

export interface SMSConfig {
  apiUrl?: string;
  apiKey?: string;
  senderId?: string;
}

export interface TeacherSettings {
  teacherUid: string;
  teacherName: string;
  tuitionName: string;
  teacherPhone?: string;
  tuitionAddress?: string;
  currency: string;
  timezone: string;
  dailyReminderEnabled: boolean;
  whatsappReminderEnabled: boolean;
  smsReminderEnabled: boolean;
  fcmToken?: string;
  whatsappConfig?: WhatsAppConfig;
  smsConfig?: SMSConfig;
  updatedAt: string;
}

export interface StudentFinancialSummary {
  student: Student;
  currentCycle?: FeeCycle;
  nextDueDate: string;
  currentCycleFee: number;
  currentCyclePending: number;
  previousOutstanding: number;
  totalOutstanding: number;
  isOverdue: boolean;
  isDueToday: boolean;
  daysOverdue: number;
  overallStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'DUE_TODAY';
  allCycles: FeeCycle[];
  allPayments: Payment[];
}

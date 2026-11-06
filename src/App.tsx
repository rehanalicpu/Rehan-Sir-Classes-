import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TuitionDataProvider, useTuitionData } from './context/TuitionDataContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { StudentListView } from './components/StudentListView';
import { CollectFeeView } from './components/CollectFeeView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { StudentFormModal } from './components/StudentFormModal';
import { CollectFeeModal } from './components/CollectFeeModal';
import { ReceiptModal } from './components/ReceiptModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { NotificationsModal } from './components/NotificationsModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StudentFinancialSummary, Student, Payment } from './types';
import { LogIn, GraduationCap, ShieldAlert } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, loading: authLoading, signInWithGoogle } = useAuth();
  const { summaries, loading: dataLoading } = useTuitionData();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modal States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<StudentFinancialSummary | null>(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileSummary, setProfileSummary] = useState<StudentFinancialSummary | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const pendingCount = summaries.filter((s) => s.totalOutstanding > 0).length;

  // Handlers
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setIsAddStudentOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsAddStudentOpen(true);
  };

  const handleOpenCollectFee = (summary: StudentFinancialSummary) => {
    setSelectedStudentSummary(summary);
    setIsCollectFeeOpen(true);
  };

  const handleOpenProfile = (summary: StudentFinancialSummary) => {
    setProfileSummary(summary);
    setIsProfileOpen(true);
  };

  const handlePaymentSuccess = (payment: Payment) => {
    const student = summaries.find((s) => s.student.id === payment.studentId)?.student || null;
    setReceiptPayment(payment);
    setReceiptStudent(student);
    setIsReceiptOpen(true);
  };

  const handleSelectStudentFromNotif = (studentId: string) => {
    const s = summaries.find((item) => item.student.id === studentId);
    if (s) {
      handleOpenProfile(s);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-lg animate-pulse mb-3">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">REHAN SIR TUITION MANAGER</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Cloud Firestore...</p>
      </div>
    );
  }

  // If teacher is not yet signed in with Google, provide instant Google Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-teal-600 text-white flex items-center justify-center shadow-xl mx-auto">
            <GraduationCap className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              Tuition Management System
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              REHAN SIR TUITION MANAGER
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mobile-first platform for fee calculations from joining dates, pending fee tracking, daily teacher reminders, and WhatsApp communication.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Independent monthly cycle from Date of Joining</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Full & partial payments with digital receipts</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Daily teacher notifications & parent WhatsApp</span>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs shadow-lg transition active:scale-98 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Teacher Google Account</span>
          </button>

          <p className="text-[11px] text-slate-400">
            Teacher authorized account: <strong>rehanali55555@gmail.com</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* App Header */}
      <Header
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAddStudent={handleOpenAddStudent}
      />

      {/* Navigation (Desktop Top Bar / Mobile Bottom Bar) */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {currentTab === 'dashboard' && (
          <Dashboard
            onOpenAddStudent={handleOpenAddStudent}
            onOpenCollectFee={handleOpenCollectFee}
            onOpenStudentProfile={handleOpenProfile}
            onNavigateToTab={setCurrentTab}
          />
        )}

        {currentTab === 'students' && (
          <StudentListView
            onOpenAddStudent={handleOpenAddStudent}
            onOpenCollectFee={handleOpenCollectFee}
            onOpenStudentProfile={handleOpenProfile}
            onOpenEditStudent={handleOpenEditStudent}
          />
        )}

        {currentTab === 'collect' && (
          <CollectFeeView
            onOpenCollectFee={handleOpenCollectFee}
            onOpenReceipt={handlePaymentSuccess}
          />
        )}

        {currentTab === 'reports' && <ReportsView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals */}
      <StudentFormModal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        editStudent={editingStudent}
      />

      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        studentSummary={selectedStudentSummary}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        payment={receiptPayment}
        student={receiptStudent}
      />

      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        summary={profileSummary}
        onOpenEdit={() => {
          if (profileSummary) {
            setIsProfileOpen(false);
            handleOpenEditStudent(profileSummary.student);
          }
        }}
        onOpenCollectFee={() => {
          if (profileSummary) {
            setIsProfileOpen(false);
            handleOpenCollectFee(profileSummary);
          }
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectStudentId={handleSelectStudentFromNotif}
      />

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <TuitionDataProvider>
        <MainAppContent />
      </TuitionDataProvider>
    </AuthProvider>
  );
}

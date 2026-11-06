import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Send,
  Calendar,
  Clock,
  History,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Download,
  FileText,
  Phone,
} from 'lucide-react';
import { StudentFinancialSummary, Payment } from '../types';
import { formatINR } from '../utils/feeCycleUtils';
import { useTuitionData } from '../context/TuitionDataContext';
import { useAuth } from '../context/AuthContext';
import { buildWhatsAppLink, generateFeeReminderText } from '../utils/whatsappUtils';
import { generatePDFReceipt } from '../utils/receiptGenerator';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: StudentFinancialSummary | null;
  onOpenEdit: () => void;
  onOpenCollectFee: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  summary,
  onOpenEdit,
  onOpenCollectFee,
}) => {
  const { deleteStudent, toggleStudentStatus, messageLogs, logDirectMessage } = useTuitionData();
  const { settings } = useAuth();
  const [activeTab, setActiveTab] = useState<'cycles' | 'payments' | 'reminders'>('cycles');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !summary) return null;

  const { student, allCycles, allPayments, totalOutstanding } = summary;
  const studentLogs = messageLogs.filter((l) => l.studentId === student.id);

  const handleWhatsAppReminder = () => {
    const text = generateFeeReminderText({
      studentName: student.name,
      feeAmount: summary.currentCycleFee || student.monthlyFee,
      dueDate: summary.nextDueDate,
      outstandingAmount: summary.totalOutstanding,
      tuitionName: settings?.tuitionName,
      teacherName: settings?.teacherName,
    });

    logDirectMessage({
      studentId: student.id,
      studentName: student.name,
      channel: 'WHATSAPP',
      recipientNumber: student.parentWhatsAppNumber,
      messageText: text,
      status: 'MANUAL_CLICK_OPENED',
      provider: 'Meta WhatsApp Link',
    });

    const link = buildWhatsAppLink(student.parentWhatsAppNumber, text);
    window.open(link, '_blank');
  };

  const handleDelete = async () => {
    await deleteStudent(student.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center text-2xl font-black shadow-inner">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">{student.name}</h2>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-800 text-blue-200">
                    {student.studentId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Father: <strong>{student.fatherName}</strong> • WhatsApp: <strong>{student.parentWhatsAppNumber}</strong>
                </p>
                <p className="text-xs text-blue-200 mt-0.5">
                  Joined: <strong>{student.joiningDate}</strong> • Independent Monthly Cycle
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={onOpenCollectFee}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Collect Fee</span>
              </button>
              {totalOutstanding > 0 && (
                <button
                  onClick={handleWhatsAppReminder}
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-md"
                  title="Send WhatsApp Reminder"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={onOpenEdit}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                title="Edit Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Financial Highlights Bar */}
        <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-200 p-4 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Monthly Tuition Fee</span>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {formatINR(student.monthlyFee)}
            </div>
          </div>
          <div className="border-x border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400">Next Due Date</span>
            <div className="text-sm font-extrabold text-slate-900 mt-0.5">
              {summary.nextDueDate || '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding</span>
            <div className={`text-base font-black mt-0.5 ${totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
              {formatINR(totalOutstanding)}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          <button
            onClick={() => setActiveTab('cycles')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'cycles'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Fee Cycles ({allCycles.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'payments'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment Receipts ({allPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'reminders'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Reminder Logs ({studentLogs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[380px] overflow-y-auto space-y-4">
          {/* TAB 1: FEE CYCLES */}
          {activeTab === 'cycles' && (
            <div className="space-y-3">
              {allCycles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No fee cycles calculated yet.</p>
              ) : (
                allCycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-800">{cycle.monthLabel}</strong>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            cycle.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cycle.status === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {cycle.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cycle Period: {cycle.cycleStartDate} to {cycle.cycleDueDate} (Due Date)
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-800">
                        {formatINR(cycle.feeAmount)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Paid: <strong className="text-emerald-700">{formatINR(cycle.paidAmount)}</strong> | Bal: <strong className="text-red-600">{formatINR(cycle.outstandingAmount)}</strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {allPayments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No payments recorded for this student yet.</p>
              ) : (
                allPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-slate-800">{p.receiptNumber}</strong>
                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-semibold">
                          {p.paymentMethod}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Date: {p.paymentDate} • Balance Left: {formatINR(p.remainingOutstanding)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-emerald-700">
                        {formatINR(p.paymentAmount)}
                      </span>
                      <button
                        onClick={() => generatePDFReceipt(p, student, settings || {})}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Download PDF Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: REMINDER LOGS */}
          {activeTab === 'reminders' && (
            <div className="space-y-3">
              {studentLogs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No WhatsApp/SMS reminder logs recorded.</p>
              ) : (
                studentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>{log.channel} • {log.recipientNumber}</span>
                      <span className="text-slate-400">{new Date(log.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line text-[11px] bg-white p-2 rounded-xl border border-slate-100 font-mono">
                      {log.messageText}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Admin Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleStudentStatus(student.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              {student.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5 text-slate-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{student.status === 'ACTIVE' ? 'Deactivate Student' : 'Activate Student'}</span>
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-bold">Confirm delete?</span>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

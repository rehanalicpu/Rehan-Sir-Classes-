import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle2, AlertCircle, Calendar, Receipt, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTuitionData } from '../context/TuitionDataContext';
import { StudentFinancialSummary, PaymentMethod, Payment } from '../types';
import { formatINR, getTodayIST } from '../utils/feeCycleUtils';

interface CollectFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentSummary: StudentFinancialSummary | null;
  onPaymentSuccess: (payment: Payment) => void;
}

export const CollectFeeModal: React.FC<CollectFeeModalProps> = ({
  isOpen,
  onClose,
  studentSummary,
  onPaymentSuccess,
}) => {
  const { recordPayment } = useTuitionData();
  const today = getTodayIST();

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(today);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState('ALL_OUTSTANDING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentSummary) {
      // Default to total outstanding, or student monthly fee if outstanding is 0
      const defaultAmount = studentSummary.totalOutstanding > 0
        ? studentSummary.totalOutstanding
        : studentSummary.student.monthlyFee;
      setPaymentAmount(defaultAmount);
      setPaymentDate(today);
      setPaymentMethod('Cash');
      setTransactionId('');
      setNotes('');
      setSelectedCycleId('ALL_OUTSTANDING');
      setError(null);
    }
  }, [studentSummary, isOpen, today]);

  if (!isOpen || !studentSummary) return null;

  const totalDue = studentSummary.totalOutstanding > 0
    ? studentSummary.totalOutstanding
    : studentSummary.student.monthlyFee;

  const remainingBalance = Math.max(0, totalDue - Number(paymentAmount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentRecord = await recordPayment({
        studentId: studentSummary.student.id,
        feeCycleId: selectedCycleId,
        paymentAmount: amount,
        paymentDate,
        paymentMethod,
        transactionId: transactionId.trim(),
        notes: notes.trim(),
      });

      // Launch confetti if remaining balance is 0 (full payment)
      if (remainingBalance === 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onPaymentSuccess(paymentRecord);
      onClose();
    } catch (err: any) {
      console.error('Fee collection error:', err);
      setError(err.message || 'Failed to record fee payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Collect Tuition Fee</h3>
              <p className="text-xs text-emerald-100">
                {studentSummary.student.name} ({studentSummary.student.studentId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Student Dues Summary Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Monthly Tuition Fee:</span>
              <strong className="text-slate-900">{formatINR(studentSummary.student.monthlyFee)}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Previous Unpaid Pending:</span>
              <strong className={studentSummary.previousOutstanding > 0 ? 'text-red-600' : 'text-slate-700'}>
                {formatINR(studentSummary.previousOutstanding)}
              </strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Current Cycle Due:</span>
              <strong className={studentSummary.currentCyclePending > 0 ? 'text-red-600' : 'text-slate-700'}>
                {formatINR(studentSummary.currentCyclePending)}
              </strong>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Total Outstanding Balance:</span>
              <span className={`text-base font-black ${studentSummary.totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                {formatINR(studentSummary.totalOutstanding)}
              </span>
            </div>
          </div>

          {/* Quick Amount Selector Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaymentAmount(studentSummary.totalOutstanding || studentSummary.student.monthlyFee)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold transition border border-blue-200"
            >
              Full Due ({formatINR(studentSummary.totalOutstanding || studentSummary.student.monthlyFee)})
            </button>
            <button
              type="button"
              onClick={() => setPaymentAmount(studentSummary.student.monthlyFee)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold transition"
            >
              1 Month ({formatINR(studentSummary.student.monthlyFee)})
            </button>
            {studentSummary.totalOutstanding > studentSummary.student.monthlyFee && (
              <button
                type="button"
                onClick={() => setPaymentAmount(studentSummary.previousOutstanding)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold transition border border-rose-200"
              >
                Prev Due ({formatINR(studentSummary.previousOutstanding)})
              </button>
            )}
          </div>

          {/* Payment Amount & Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="w-full pl-7 pr-3 py-2 text-sm font-extrabold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Payment Method *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Cash', 'UPI', 'Bank Transfer', 'Other'] as PaymentMethod[]).map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setPaymentMethod(mode)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-bold border transition ${
                    paymentMethod === mode
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID (For UPI/Bank) */}
          {(paymentMethod === 'UPI' || paymentMethod === 'Bank Transfer') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction ID / Reference (Optional)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. UPI Ref / UTR number"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Live Remaining Balance Calculation Preview */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
            remainingBalance === 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider">
                {remainingBalance === 0 ? 'Full Payment' : 'Partial Payment'}
              </div>
              <div className="text-xs font-semibold">
                {remainingBalance === 0
                  ? 'All dues will be marked FULLY PAID ✅'
                  : 'Pending balance will carry forward'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Remaining Due</div>
              <div className={`text-base font-black ${remainingBalance === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {formatINR(remainingBalance)}
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in cash by father"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : `Record Payment of ${formatINR(Number(paymentAmount || 0))}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

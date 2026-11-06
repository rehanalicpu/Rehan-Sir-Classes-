import React from 'react';
import { X, Download, Share2, CheckCircle2, Printer, Send } from 'lucide-react';
import { Payment, Student } from '../types';
import { formatINR } from '../utils/feeCycleUtils';
import { generatePDFReceipt } from '../utils/receiptGenerator';
import { useAuth } from '../context/AuthContext';
import { buildWhatsAppLink, generatePaymentConfirmationText } from '../utils/whatsappUtils';
import { useTuitionData } from '../context/TuitionDataContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  student: Student | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment, student }) => {
  const { settings } = useAuth();
  const { logDirectMessage } = useTuitionData();

  if (!isOpen || !payment || !student) return null;

  const handleDownloadPDF = () => {
    generatePDFReceipt(payment, student, settings || {});
  };

  const handleSendWhatsAppReceipt = () => {
    const text = generatePaymentConfirmationText({
      studentName: student.name,
      paymentAmount: payment.paymentAmount,
      paymentMethod: payment.paymentMethod,
      receiptNumber: payment.receiptNumber,
      remainingOutstanding: payment.remainingOutstanding,
      paymentDate: payment.paymentDate,
      tuitionName: settings?.tuitionName,
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Payment Recorded</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Voucher Body */}
        <div className="p-6 space-y-4 print:p-0">
          {/* Tuition Voucher Banner */}
          <div className="text-center pb-4 border-b border-dashed border-slate-200">
            <h2 className="text-lg font-black tracking-tight text-blue-900 uppercase">
              {settings?.tuitionName || 'REHAN SIR CLASSES'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {settings?.tuitionAddress || 'Tuition Center, Main Road, India'}
            </p>
            <div className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase">
              FEE PAYMENT RECEIPT
            </div>
          </div>

          {/* Receipt Info Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">RECEIPT NO</span>
              <strong className="text-blue-700 font-mono">{payment.receiptNumber}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">DATE</span>
              <strong className="text-slate-800">{payment.paymentDate}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">STUDENT</span>
              <strong className="text-slate-800">{student.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">ROLL / ID</span>
              <strong className="text-slate-800 font-mono">{student.studentId}</strong>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="space-y-2 text-xs border-y border-slate-200 py-3">
            <div className="flex items-center justify-between text-slate-600">
              <span>Monthly Tuition Fee:</span>
              <span className="font-semibold">{formatINR(payment.monthlyFee)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Previous Pending:</span>
              <span className="font-semibold">{formatINR(payment.previousOutstanding)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-800 font-bold text-sm pt-2 border-t border-slate-100">
              <span>Amount Received ({payment.paymentMethod}):</span>
              <span className="text-emerald-700 font-black text-base">{formatINR(payment.paymentAmount)}</span>
            </div>
          </div>

          {/* Balance Remaining */}
          <div className={`p-3 rounded-2xl flex items-center justify-between text-xs font-bold ${
            payment.remainingOutstanding === 0
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <span>Remaining Outstanding Balance:</span>
            <span className={payment.remainingOutstanding === 0 ? 'text-emerald-700' : 'text-red-600'}>
              {payment.remainingOutstanding === 0 ? 'CLEARED (₹0)' : formatINR(payment.remainingOutstanding)}
            </span>
          </div>

          {payment.transactionId && (
            <div className="text-[11px] text-slate-500">
              Transaction ID: <span className="font-mono text-slate-700 font-bold">{payment.transactionId}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 space-y-2 print:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={handleSendWhatsAppReceipt}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Done & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

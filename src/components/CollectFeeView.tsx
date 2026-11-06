import React, { useState } from 'react';
import { CreditCard, Search, CheckCircle2, User, Clock, AlertCircle } from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { StudentFinancialSummary, Payment } from '../types';
import { formatINR } from '../utils/feeCycleUtils';

interface CollectFeeViewProps {
  onOpenCollectFee: (summary: StudentFinancialSummary) => void;
  onOpenReceipt: (payment: Payment) => void;
}

export const CollectFeeView: React.FC<CollectFeeViewProps> = ({ onOpenCollectFee }) => {
  const { summaries, payments } = useTuitionData();
  const [searchTerm, setSearchTerm] = useState('');

  // Pending students prioritized first
  const sortedSummaries = [...summaries].sort((a, b) => b.totalOutstanding - a.totalOutstanding);

  const filtered = sortedSummaries.filter(
    (s) =>
      s.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student.parentWhatsAppNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Tuition Fee Collection Hub</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Select any student to record full or partial fee payment with instant digital receipt
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name, roll no, father name, or WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* List of Students to Collect Fee */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const hasPending = item.totalOutstanding > 0;
          return (
            <div
              key={item.student.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                hasPending ? 'border-rose-200 shadow-xs' : 'border-slate-200 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-base shrink-0">
                  {item.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900">{item.student.name}</h4>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {item.student.studentId}
                    </span>
                    {item.isOverdue && (
                      <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                        OVERDUE ({item.daysOverdue}d)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Father: <strong className="text-slate-700">{item.student.fatherName}</strong> • Monthly Fee: <strong className="text-slate-800">{formatINR(item.student.monthlyFee)}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Due</span>
                  <div className={`text-base font-black ${hasPending ? 'text-red-600' : 'text-emerald-700'}`}>
                    {hasPending ? formatINR(item.totalOutstanding) : 'CLEARED (₹0)'}
                  </div>
                </div>

                <button
                  onClick={() => onOpenCollectFee(item)}
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition active:scale-95 ${
                    hasPending
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Collect Fee</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

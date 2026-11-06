import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Send,
  Eye,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserX,
  Phone,
  Calendar,
} from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { StudentFinancialSummary, Student } from '../types';
import { formatINR, getTodayIST } from '../utils/feeCycleUtils';
import { buildWhatsAppLink, generateFeeReminderText } from '../utils/whatsappUtils';
import { useAuth } from '../context/AuthContext';

interface StudentListViewProps {
  onOpenAddStudent: () => void;
  onOpenCollectFee: (summary: StudentFinancialSummary) => void;
  onOpenStudentProfile: (summary: StudentFinancialSummary) => void;
  onOpenEditStudent: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  onOpenAddStudent,
  onOpenCollectFee,
  onOpenStudentProfile,
  onOpenEditStudent,
}) => {
  const { summaries, toggleStudentStatus, logDirectMessage } = useTuitionData();
  const { settings } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ACTIVE');
  const [feeFilter, setFeeFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'outstanding' | 'joiningDate'>('name');

  const today = getTodayIST();

  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((item) => {
        const matchesSearch =
          item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.student.mobileNumber.includes(searchTerm) ||
          item.student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter !== 'ALL' && item.student.status !== statusFilter) return false;

        if (feeFilter === 'PENDING') return item.totalOutstanding > 0;
        if (feeFilter === 'OVERDUE') return item.isOverdue;
        if (feeFilter === 'PAID') return item.totalOutstanding === 0;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.student.name.localeCompare(b.student.name);
        if (sortBy === 'outstanding') return b.totalOutstanding - a.totalOutstanding;
        if (sortBy === 'joiningDate') return b.student.joiningDate.localeCompare(a.student.joiningDate);
        return 0;
      });
  }, [summaries, searchTerm, statusFilter, feeFilter, sortBy]);

  const handleWhatsApp = (item: StudentFinancialSummary) => {
    const text = generateFeeReminderText({
      studentName: item.student.name,
      feeAmount: item.currentCycleFee || item.student.monthlyFee,
      dueDate: item.nextDueDate || today,
      outstandingAmount: item.totalOutstanding,
      tuitionName: settings?.tuitionName,
      teacherName: settings?.teacherName,
    });

    logDirectMessage({
      studentId: item.student.id,
      studentName: item.student.name,
      channel: 'WHATSAPP',
      recipientNumber: item.student.parentWhatsAppNumber,
      messageText: text,
      status: 'MANUAL_CLICK_OPENED',
      provider: 'Meta WhatsApp Link',
    });

    const link = buildWhatsAppLink(item.student.parentWhatsAppNumber, text);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Student Directory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage registrations, individual joining-cycle fees, and contact details
          </p>
        </div>

        <button
          onClick={onOpenAddStudent}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, father, roll no, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-semibold"
            >
              <option value="ACTIVE">Active Students</option>
              <option value="DEACTIVATED">Deactivated</option>
              <option value="ALL">All Statuses</option>
            </select>

            <select
              value={feeFilter}
              onChange={(e) => setFeeFilter(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-semibold"
            >
              <option value="ALL">All Fees</option>
              <option value="PENDING">Pending Dues Only</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="PAID">Fully Paid Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-700 font-semibold"
            >
              <option value="name">Sort by Name</option>
              <option value="outstanding">Sort by Pending Amount</option>
              <option value="joiningDate">Sort by Joining Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSummaries.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl p-10 border border-slate-200 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No students found</h4>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search or filter options.</p>
          </div>
        ) : (
          filteredSummaries.map((item) => {
            const hasPending = item.totalOutstanding > 0;
            return (
              <div
                key={item.student.id}
                className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                  item.isOverdue
                    ? 'border-red-300 ring-1 ring-red-100'
                    : hasPending
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onOpenStudentProfile(item)}
                        className="cursor-pointer w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-base shadow-xs"
                      >
                        {item.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4
                          onClick={() => onOpenStudentProfile(item)}
                          className="text-sm font-extrabold text-slate-900 hover:text-blue-700 cursor-pointer"
                        >
                          {item.student.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">
                            {item.student.studentId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.isOverdue
                                ? 'bg-red-600 text-white animate-pulse'
                                : item.isDueToday
                                ? 'bg-amber-500 text-white'
                                : hasPending
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.isOverdue
                              ? `OVERDUE (${item.daysOverdue}d)`
                              : item.isDueToday
                              ? 'DUE TODAY'
                              : hasPending
                              ? 'PENDING'
                              : 'FULLY PAID ✅'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Outstanding</span>
                      <div className={`text-base font-black ${hasPending ? 'text-red-600' : 'text-emerald-700'}`}>
                        {formatINR(item.totalOutstanding)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Father's Name</span>
                      <strong className="text-slate-800">{item.student.fatherName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">WhatsApp / Mobile</span>
                      <strong className="text-slate-800">{item.student.parentWhatsAppNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Date of Joining</span>
                      <strong className="text-slate-800">{item.student.joiningDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Next Fee Due Date</span>
                      <strong className="text-blue-800">{item.nextDueDate || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenStudentProfile(item)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                      title="View Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEditStudent(item.student)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPending && (
                      <button
                        onClick={() => handleWhatsApp(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                    <button
                      onClick={() => onOpenCollectFee(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Collect Fee</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

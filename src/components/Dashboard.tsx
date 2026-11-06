import React, { useState, useMemo } from 'react';
import {
  Users,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  ArrowUpDown,
  Send,
  Eye,
  FileText,
  DollarSign,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { StudentFinancialSummary, Student } from '../types';
import { formatINR, getTodayIST } from '../utils/feeCycleUtils';
import { buildWhatsAppLink, generateFeeReminderText } from '../utils/whatsappUtils';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onOpenAddStudent: () => void;
  onOpenCollectFee: (studentSummary: StudentFinancialSummary) => void;
  onOpenStudentProfile: (studentSummary: StudentFinancialSummary) => void;
  onNavigateToTab: (tab: any) => void;
}

export type FilterStatus = 'ALL' | 'PENDING' | 'OVERDUE' | 'DUE_TODAY' | 'PAID';

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenAddStudent,
  onOpenCollectFee,
  onOpenStudentProfile,
  onNavigateToTab,
}) => {
  const { summaries, students, payments, seedDemoDataIfEmpty, logDirectMessage } = useTuitionData();
  const { settings } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'outstanding' | 'dueDate' | 'joiningDate'>('outstanding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const today = getTodayIST();

  // Metrics
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'ACTIVE').length;

    // Total expected monthly fees: sum of monthlyFee for all active students
    const totalExpectedMonthly = students
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

    // Total fees collected: sum of all recorded payments
    const totalCollected = payments.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    // Today's payments
    const todaysPayments = payments
      .filter((p) => p.paymentDate === today)
      .reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    // Total pending across all students
    const totalPending = summaries.reduce((sum, s) => sum + s.totalOutstanding, 0);

    // Due today count & overdue count
    const dueTodayCount = summaries.filter((s) => s.isDueToday).length;
    const overdueCount = summaries.filter((s) => s.isOverdue).length;
    const pendingStudentsCount = summaries.filter((s) => s.totalOutstanding > 0).length;
    const paidStudentsCount = summaries.filter((s) => s.totalOutstanding === 0 && s.student.status === 'ACTIVE').length;

    return {
      totalStudents,
      activeStudents,
      totalExpectedMonthly,
      totalCollected,
      todaysPayments,
      totalPending,
      dueTodayCount,
      overdueCount,
      pendingStudentsCount,
      paidStudentsCount,
    };
  }, [students, payments, summaries, today]);

  // Filter & Sort
  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((item) => {
        const matchesSearch =
          item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.student.fatherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.student.mobileNumber.includes(searchTerm) ||
          item.student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'PENDING') return item.totalOutstanding > 0;
        if (statusFilter === 'OVERDUE') return item.isOverdue;
        if (statusFilter === 'DUE_TODAY') return item.isDueToday;
        if (statusFilter === 'PAID') return item.totalOutstanding === 0 && item.student.status === 'ACTIVE';

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'name') {
          diff = a.student.name.localeCompare(b.student.name);
        } else if (sortBy === 'outstanding') {
          diff = a.totalOutstanding - b.totalOutstanding;
        } else if (sortBy === 'dueDate') {
          diff = a.nextDueDate.localeCompare(b.nextDueDate);
        } else if (sortBy === 'joiningDate') {
          diff = a.student.joiningDate.localeCompare(b.student.joiningDate);
        }
        return sortOrder === 'asc' ? diff : -diff;
      });
  }, [summaries, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleWhatsAppReminder = (item: StudentFinancialSummary) => {
    const text = generateFeeReminderText({
      studentName: item.student.name,
      feeAmount: item.currentCycleFee || item.student.monthlyFee,
      dueDate: item.nextDueDate || today,
      outstandingAmount: item.totalOutstanding,
      tuitionName: settings?.tuitionName,
      teacherName: settings?.teacherName,
    });

    // Log the reminder in messageLogs
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
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-700/60 border border-blue-500/40 text-[11px] font-semibold text-blue-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Independent Joining-Date Billing Active</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Welcome, {settings?.teacherName || 'Rehan Sir'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              {metrics.totalStudents} enrolled students • ₹{metrics.totalPending.toLocaleString('en-IN')} pending fees to collect.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenAddStudent}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Register Student</span>
            </button>
            <button
              onClick={() => onNavigateToTab('reports')}
              className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm border border-blue-500/40 transition"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Demo Seed Banner if 0 students */}
      {students.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Get started immediately</h4>
              <p className="text-xs text-amber-700">
                Populate sample students (Rahul, Aman, Priya) with calculated fee cycles to explore all features.
              </p>
            </div>
          </div>
          <button
            onClick={seedDemoDataIfEmpty}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition"
          >
            Load Sample Students
          </button>
        </div>
      )}

      {/* High-Level Financial Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pending Fees (RED ACCENT) */}
        <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Total Pending</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-red-600">
              {formatINR(metrics.totalPending)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {metrics.pendingStudentsCount} students with dues
            </p>
          </div>
        </div>

        {/* Total Collected (GREEN ACCENT) */}
        <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Fees Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatINR(metrics.totalCollected)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {metrics.paidStudentsCount} cleared students
            </p>
          </div>
        </div>

        {/* Expected Monthly Fees */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Monthly Expected</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatINR(metrics.totalExpectedMonthly)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {metrics.activeStudents} active tuition enrollments
            </p>
          </div>
        </div>

        {/* Today's Payments Collected */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Today's Received</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {formatINR(metrics.todaysPayments)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Collected on {today}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar (Due Today & Overdue) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('OVERDUE')}
          className={`cursor-pointer rounded-xl p-3 border transition flex items-center justify-between ${
            statusFilter === 'OVERDUE' ? 'bg-red-50 border-red-400 ring-2 ring-red-300' : 'bg-red-50/50 border-red-200 hover:bg-red-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center text-xs font-bold">
              !
            </div>
            <div>
              <div className="text-xs font-bold text-red-900">Overdue Students</div>
              <div className="text-[11px] text-red-700">Past joining due date</div>
            </div>
          </div>
          <span className="text-lg font-black text-red-700">{metrics.overdueCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('DUE_TODAY')}
          className={`cursor-pointer rounded-xl p-3 border transition flex items-center justify-between ${
            statusFilter === 'DUE_TODAY' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' : 'bg-amber-50/50 border-amber-200 hover:bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold">
              ★
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">Fees Due Today</div>
              <div className="text-[11px] text-amber-700">Exact 1-month cycle date</div>
            </div>
          </div>
          <span className="text-lg font-black text-amber-800">{metrics.dueTodayCount}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        {/* Sections Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL' as FilterStatus, label: 'ALL STUDENTS', count: summaries.length },
            { id: 'PENDING' as FilterStatus, label: 'PENDING FEES', count: metrics.pendingStudentsCount, badgeColor: 'bg-red-600 text-white' },
            { id: 'OVERDUE' as FilterStatus, label: 'OVERDUE', count: metrics.overdueCount, badgeColor: 'bg-red-700 text-white animate-pulse' },
            { id: 'DUE_TODAY' as FilterStatus, label: 'DUE TODAY', count: metrics.dueTodayCount, badgeColor: 'bg-amber-500 text-white' },
            { id: 'PAID' as FilterStatus, label: 'FULLY PAID', count: metrics.paidStudentsCount, badgeColor: 'bg-emerald-600 text-white' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${tab.badgeColor || (isActive ? 'bg-blue-900 text-white' : 'bg-slate-300 text-slate-800')}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, father, mobile or roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs rounded-xl border border-slate-200 px-2.5 py-2 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="outstanding">Pending Amount</option>
              <option value="dueDate">Due Date</option>
              <option value="name">Student Name</option>
              <option value="joiningDate">Joining Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Student List Cards */}
      <div className="space-y-3">
        {filteredSummaries.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No students found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No students match this category.'}
            </p>
          </div>
        ) : (
          filteredSummaries.map((item) => {
            const hasPending = item.totalOutstanding > 0;
            const isFullyPaid = item.totalOutstanding === 0;

            return (
              <div
                key={item.student.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-xs hover:shadow-md ${
                  item.isOverdue
                    ? 'border-red-300 ring-1 ring-red-100'
                    : item.isDueToday
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : hasPending
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Student info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      onClick={() => onOpenStudentProfile(item)}
                      className="cursor-pointer w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs"
                    >
                      {item.student.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => onOpenStudentProfile(item)}
                          className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-blue-700 cursor-pointer truncate"
                        >
                          {item.student.name}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {item.student.studentId}
                        </span>

                        {/* Status Badges */}
                        {item.isOverdue ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-600 text-white animate-pulse">
                            OVERDUE ({item.daysOverdue}d)
                          </span>
                        ) : item.isDueToday ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white">
                            DUE TODAY
                          </span>
                        ) : hasPending ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 border border-red-300">
                            PENDING
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            FULLY PAID ✅
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                        <span>Father: <strong className="text-slate-800">{item.student.fatherName}</strong></span>
                        <span>WhatsApp: <strong className="text-slate-800">{item.student.parentWhatsAppNumber}</strong></span>
                        <span>Joined: <strong className="text-slate-800">{item.student.joiningDate}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Joining-date cycle & Fee breakdown */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full lg:w-auto border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Fee</div>
                      <div className="text-sm font-extrabold text-slate-800">
                        {formatINR(item.student.monthlyFee)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Due: <strong className="text-slate-700">{item.nextDueDate || '—'}</strong>
                      </div>
                    </div>

                    <div className="text-right pl-4 border-l border-slate-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding</div>
                      <div className={`text-base sm:text-lg font-black ${hasPending ? 'text-red-600' : 'text-emerald-700'}`}>
                        {formatINR(item.totalOutstanding)}
                      </div>
                      {/* Carry forward separation: current cycle + previous pending */}
                      {hasPending && item.previousOutstanding > 0 && (
                        <div className="text-[10px] text-red-500 font-semibold">
                          Curr: {formatINR(item.currentCyclePending)} + Prev: {formatINR(item.previousOutstanding)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions (Large buttons for Android phones) */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    {/* Collect Fee Button */}
                    <button
                      onClick={() => onOpenCollectFee(item)}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 ${
                        hasPending
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Collect Fee</span>
                    </button>

                    {/* WhatsApp Reminder Button */}
                    {hasPending && (
                      <button
                        onClick={() => handleWhatsAppReminder(item)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
                        title="Send WhatsApp Fee Reminder to Parent"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

                    {/* View Profile */}
                    <button
                      onClick={() => onOpenStudentProfile(item)}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition"
                      title="View Student Profile & Fee Cycles History"
                    >
                      <Eye className="w-4 h-4" />
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

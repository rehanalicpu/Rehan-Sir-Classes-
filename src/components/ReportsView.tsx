import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { exportReportToPDF, exportToExcel } from '../utils/receiptGenerator';
import { formatINR, getTodayIST } from '../utils/feeCycleUtils';

export type ReportType =
  | 'daily_collection'
  | 'weekly_collection'
  | 'monthly_collection'
  | 'student_wise'
  | 'pending_fees'
  | 'overdue_fees'
  | 'expected_vs_collected'
  | 'payment_history';

export const ReportsView: React.FC = () => {
  const { students, payments, summaries, feeCycles } = useTuitionData();
  const [selectedReport, setSelectedReport] = useState<ReportType>('daily_collection');
  const today = getTodayIST();

  const reportList: { id: ReportType; title: string; desc: string }[] = [
    { id: 'daily_collection', title: 'Daily Fee Collection Report', desc: "Today's fee receipts & total collection" },
    { id: 'weekly_collection', title: 'Weekly Fee Collection Report', desc: 'Fee collections over the last 7 days' },
    { id: 'monthly_collection', title: 'Monthly Fee Collection Report', desc: 'Summary of fee collection for current month' },
    { id: 'student_wise', title: 'Student-wise Fee Report', desc: 'Comprehensive individual student financial breakdown' },
    { id: 'pending_fees', title: 'Pending Fee Report', desc: 'All students with unpaid current & carryover dues' },
    { id: 'overdue_fees', title: 'Overdue Fee Report', desc: 'Fees past joining-cycle due date requiring reminders' },
    { id: 'expected_vs_collected', title: 'Expected vs Collected Fee Report', desc: 'Variance & tuition collection efficiency' },
    { id: 'payment_history', title: 'Payment History Report', desc: 'Complete log of digital payment vouchers issued' },
  ];

  // Report Data Computation
  const currentReportData = useMemo(() => {
    switch (selectedReport) {
      case 'daily_collection': {
        const list = payments.filter((p) => p.paymentDate === today);
        const headers = ['Receipt No', 'Student Name', 'Amount (INR)', 'Payment Mode', 'Txn Ref', 'Date'];
        const rows = list.map((p) => [
          p.receiptNumber,
          p.studentName,
          p.paymentAmount,
          p.paymentMethod,
          p.transactionId || '—',
          p.paymentDate,
        ]);
        const total = list.reduce((sum, p) => sum + p.paymentAmount, 0);
        return {
          title: `Daily Collection Report (${today})`,
          headers,
          rows,
          excelData: list.map((p) => ({
            'Receipt Number': p.receiptNumber,
            'Student Name': p.studentName,
            'Payment Amount (INR)': p.paymentAmount,
            'Payment Method': p.paymentMethod,
            'Transaction Ref': p.transactionId || '',
            'Payment Date': p.paymentDate,
          })),
          summary: `Total Collections Today: ${formatINR(total)} across ${list.length} payments.`,
        };
      }

      case 'weekly_collection': {
        // Last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const list = payments.filter((p) => p.paymentDate >= sevenDaysAgo);
        const headers = ['Date', 'Receipt No', 'Student Name', 'Amount (INR)', 'Mode'];
        const rows = list.map((p) => [
          p.paymentDate,
          p.receiptNumber,
          p.studentName,
          p.paymentAmount,
          p.paymentMethod,
        ]);
        const total = list.reduce((sum, p) => sum + p.paymentAmount, 0);
        return {
          title: 'Weekly Fee Collection Report (Last 7 Days)',
          headers,
          rows,
          excelData: list.map((p) => ({
            Date: p.paymentDate,
            'Receipt No': p.receiptNumber,
            'Student Name': p.studentName,
            'Amount (INR)': p.paymentAmount,
            Method: p.paymentMethod,
          })),
          summary: `Total Weekly Collection: ${formatINR(total)} from ${list.length} payments.`,
        };
      }

      case 'monthly_collection': {
        const currentMonthPrefix = today.substring(0, 7); // YYYY-MM
        const list = payments.filter((p) => p.paymentDate.startsWith(currentMonthPrefix));
        const headers = ['Receipt No', 'Student Name', 'Amount (INR)', 'Date', 'Method'];
        const rows = list.map((p) => [
          p.receiptNumber,
          p.studentName,
          p.paymentAmount,
          p.paymentDate,
          p.paymentMethod,
        ]);
        const total = list.reduce((sum, p) => sum + p.paymentAmount, 0);
        return {
          title: `Monthly Fee Collection Report (${currentMonthPrefix})`,
          headers,
          rows,
          excelData: list.map((p) => ({
            'Receipt No': p.receiptNumber,
            'Student Name': p.studentName,
            'Amount (INR)': p.paymentAmount,
            Date: p.paymentDate,
            Method: p.paymentMethod,
          })),
          summary: `Month-to-Date Collections: ${formatINR(total)} across ${list.length} transactions.`,
        };
      }

      case 'student_wise': {
        const headers = ['Roll No', 'Student Name', 'Monthly Fee', 'Total Due', 'Paid Sum', 'Status'];
        const rows = summaries.map((s) => {
          const paidSum = s.allPayments.reduce((sum, p) => sum + p.paymentAmount, 0);
          return [
            s.student.studentId,
            s.student.name,
            s.student.monthlyFee,
            s.totalOutstanding,
            paidSum,
            s.overallStatus,
          ];
        });
        return {
          title: 'Student-wise Fee Report',
          headers,
          rows,
          excelData: summaries.map((s) => ({
            'Roll No': s.student.studentId,
            'Student Name': s.student.name,
            "Father's Name": s.student.fatherName,
            'Monthly Fee (INR)': s.student.monthlyFee,
            'Outstanding (INR)': s.totalOutstanding,
            'Next Due Date': s.nextDueDate,
            Status: s.overallStatus,
          })),
          summary: `Report covering all ${summaries.length} enrolled students.`,
        };
      }

      case 'pending_fees': {
        const list = summaries.filter((s) => s.totalOutstanding > 0);
        const headers = ['Roll No', 'Student Name', 'Father', 'WhatsApp', 'Monthly Fee', 'Outstanding', 'Due Date'];
        const rows = list.map((s) => [
          s.student.studentId,
          s.student.name,
          s.student.fatherName,
          s.student.parentWhatsAppNumber,
          s.student.monthlyFee,
          s.totalOutstanding,
          s.nextDueDate,
        ]);
        const totalPending = list.reduce((sum, s) => sum + s.totalOutstanding, 0);
        return {
          title: 'Pending Fee Report (All Dues)',
          headers,
          rows,
          excelData: list.map((s) => ({
            'Student ID': s.student.studentId,
            'Student Name': s.student.name,
            'Father Name': s.student.fatherName,
            'WhatsApp Number': s.student.parentWhatsAppNumber,
            'Monthly Fee': s.student.monthlyFee,
            'Current Cycle Pending': s.currentCyclePending,
            'Previous Outstanding': s.previousOutstanding,
            'Total Outstanding (INR)': s.totalOutstanding,
            'Due Date': s.nextDueDate,
          })),
          summary: `Total Pending Fees: ${formatINR(totalPending)} across ${list.length} students.`,
        };
      }

      case 'overdue_fees': {
        const list = summaries.filter((s) => s.isOverdue);
        const headers = ['Student Name', 'Roll No', 'Days Overdue', 'Due Date', 'Overdue Amount', 'WhatsApp'];
        const rows = list.map((s) => [
          s.student.name,
          s.student.studentId,
          `${s.daysOverdue} days`,
          s.nextDueDate,
          s.totalOutstanding,
          s.student.parentWhatsAppNumber,
        ]);
        const totalOverdue = list.reduce((sum, s) => sum + s.totalOutstanding, 0);
        return {
          title: 'Overdue Fee Report (Past Cycle Date)',
          headers,
          rows,
          excelData: list.map((s) => ({
            'Student Name': s.student.name,
            'Roll No': s.student.studentId,
            'Days Overdue': s.daysOverdue,
            'Due Date': s.nextDueDate,
            'Amount Due (INR)': s.totalOutstanding,
            'WhatsApp Number': s.student.parentWhatsAppNumber,
          })),
          summary: `Critical: ${list.length} students overdue by 1+ days, totaling ${formatINR(totalOverdue)}.`,
        };
      }

      case 'expected_vs_collected': {
        const totalExpected = students.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + s.monthlyFee, 0);
        const totalCollected = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
        const totalPending = summaries.reduce((sum, s) => sum + s.totalOutstanding, 0);
        const headers = ['Metric', 'Amount (INR)', 'Percentage (%)'];
        const rows = [
          ['Total Monthly Expected Fees', totalExpected, '100%'],
          ['Total Fees Collected', totalCollected, totalExpected > 0 ? `${Math.round((totalCollected / totalExpected) * 100)}%` : '0%'],
          ['Total Outstanding Pending', totalPending, totalExpected > 0 ? `${Math.round((totalPending / totalExpected) * 100)}%` : '0%'],
        ];
        return {
          title: 'Total Expected vs Collected Fee Analysis',
          headers,
          rows,
          excelData: [
            { Metric: 'Total Expected Fees', 'Amount (INR)': totalExpected },
            { Metric: 'Total Collected Fees', 'Amount (INR)': totalCollected },
            { Metric: 'Total Pending Fees', 'Amount (INR)': totalPending },
          ],
          summary: `Monthly Target: ${formatINR(totalExpected)} | Realized: ${formatINR(totalCollected)}.`,
        };
      }

      case 'payment_history':
      default: {
        const headers = ['Receipt No', 'Date', 'Student Name', 'Amount (INR)', 'Mode', 'Txn Ref'];
        const rows = payments.map((p) => [
          p.receiptNumber,
          p.paymentDate,
          p.studentName,
          p.paymentAmount,
          p.paymentMethod,
          p.transactionId || '—',
        ]);
        const total = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
        return {
          title: 'Complete Payment History Report',
          headers,
          rows,
          excelData: payments.map((p) => ({
            'Receipt No': p.receiptNumber,
            'Payment Date': p.paymentDate,
            'Student Name': p.studentName,
            'Amount (INR)': p.paymentAmount,
            Method: p.paymentMethod,
            'Txn ID': p.transactionId || '',
            Notes: p.notes || '',
          })),
          summary: `All-time ledger: ${payments.length} receipts totaling ${formatINR(total)}.`,
        };
      }
    }
  }, [selectedReport, payments, students, summaries, today]);

  const handleExportPDF = () => {
    exportReportToPDF(
      currentReportData.title,
      currentReportData.headers,
      currentReportData.rows,
      currentReportData.summary
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      selectedReport,
      'Report Data',
      currentReportData.excelData
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Reports Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Tuition Financial Reports</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics, fee reconciliation, and PDF/Excel export
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {reportList.map((r) => {
          const isSelected = selectedReport === r.id;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`p-3 text-left rounded-2xl border transition ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-100 text-blue-900 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <h4 className="text-xs font-bold line-clamp-1">{r.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Report Data Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Card Header & Summary */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">{currentReportData.title}</h3>
            <p className="text-xs text-blue-800 font-semibold mt-0.5">{currentReportData.summary}</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {today}
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {currentReportData.rows.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transaction or student data available for this report criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  {currentReportData.headers.map((h, i) => (
                    <th key={i} className="py-3 px-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentReportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-800 font-medium">
                        {typeof cell === 'number' && cIdx > 1 ? formatINR(cell) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

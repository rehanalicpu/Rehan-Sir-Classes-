import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Payment, Student, FeeCycle, StudentFinancialSummary, TeacherSettings } from '../types';
import { formatINR } from './feeCycleUtils';

/**
 * Generates and downloads a branded PDF receipt for a payment
 */
export function generatePDFReceipt(
  payment: Payment,
  student: Student,
  settings: Partial<TeacherSettings>
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard receipt voucher size
  });

  const tuitionName = settings.tuitionName || 'REHAN SIR CLASSES';
  const teacherName = settings.teacherName || 'Rehan Sir';
  const phone = settings.teacherPhone || '+91 98765 43210';
  const address = settings.tuitionAddress || 'Main Road, Tuition Complex, India';

  // Header Background banner
  doc.setFillColor(30, 64, 175); // Royal Blue
  doc.rect(0, 0, 148, 30, 'F');

  // Header Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(tuitionName.toUpperCase(), 74, 13, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${address} | Mobile: ${phone}`, 74, 20, { align: 'center' });
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 74, 26, { align: 'center' });

  // Receipt Number & Date Box
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 35, 128, 16, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('RECEIPT NO:', 14, 41);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.text(payment.receiptNumber, 14, 47);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('PAYMENT DATE:', 90, 41);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(payment.paymentDate, 90, 47);

  // Student Info Card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 55, 128, 38, 2, 2, 'D');

  doc.setTextColor(30, 64, 175);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', 14, 61);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  doc.text('Student Name:', 14, 68);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name, 45, 68);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text("Father's Name:", 14, 75);
  doc.setTextColor(15, 23, 42);
  doc.text(student.fatherName, 45, 75);

  doc.setTextColor(100, 116, 139);
  doc.text('Student ID / Roll:', 14, 82);
  doc.setTextColor(15, 23, 42);
  doc.text(student.studentId, 45, 82);

  doc.setTextColor(100, 116, 139);
  doc.text('WhatsApp Number:', 14, 89);
  doc.setTextColor(15, 23, 42);
  doc.text(student.parentWhatsAppNumber, 45, 89);

  // Payment Breakdown Table
  let y = 100;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y, 128, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION', 14, y + 5.5);
  doc.text('AMOUNT (INR)', 134, y + 5.5, { align: 'right' });

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Tuition Monthly Fee`, 14, y);
  doc.text(formatINR(payment.monthlyFee), 134, y, { align: 'right' });

  y += 7;
  doc.text(`Previous Outstanding Balance`, 14, y);
  doc.text(formatINR(payment.previousOutstanding), 134, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Due Before Payment`, 14, y);
  doc.text(formatINR(payment.previousOutstanding + payment.monthlyFee), 134, y, { align: 'right' });

  // Paid Banner Box
  y += 9;
  doc.setFillColor(236, 253, 245); // Emerald light
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(10, y, 128, 14, 2, 2, 'FD');

  doc.setTextColor(4, 120, 87);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('AMOUNT PAID RECEIVED:', 14, y + 9);
  doc.setFontSize(13);
  doc.text(formatINR(payment.paymentAmount), 134, y + 9, { align: 'right' });

  // Mode and remaining balance
  y += 18;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Mode: ${payment.paymentMethod}${payment.transactionId ? ` (Txn ID: ${payment.transactionId})` : ''}`, 14, y);

  y += 6;
  if (payment.remainingOutstanding > 0) {
    doc.setTextColor(220, 38, 38); // Red
    doc.setFont('helvetica', 'bold');
    doc.text(`Remaining Balance Due: ${formatINR(payment.remainingOutstanding)} (PENDING)`, 14, y);
  } else {
    doc.setTextColor(5, 150, 105); // Green
    doc.setFont('helvetica', 'bold');
    doc.text('All Fees Cleared - FULLY PAID ✅', 14, y);
  }

  // Footer / Signature
  y = 180;
  doc.setDrawColor(203, 213, 225);
  doc.line(95, y, 134, y);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Authorized Signatory`, 114, y + 4, { align: 'center' });
  doc.text(teacherName, 114, y + 8, { align: 'center' });

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer generated receipt from Rehan Sir Tuition Manager.', 74, 200, { align: 'center' });

  // Save / Trigger Download
  doc.save(`${payment.receiptNumber}_${student.name.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Export collection/financial report to PDF
 */
export function exportReportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  summaryText?: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 297, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('REHAN SIR TUITION MANAGER', 14, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), 14, 19);

  if (summaryText) {
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(summaryText, 14, 32);
  }

  // Simple clean table rendering
  let startY = summaryText ? 38 : 30;
  const colWidth = 269 / headers.length;

  // Header row
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 269, 8, 'F');
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    doc.text(h, 16 + i * colWidth, startY + 5.5);
  });

  startY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  rows.forEach((row, rIdx) => {
    if (startY > 190) {
      doc.addPage();
      startY = 20;
    }
    const bg = rIdx % 2 === 0 ? 255 : 248;
    doc.setFillColor(bg, bg, bg);
    doc.rect(14, startY, 269, 7, 'F');
    doc.setTextColor(15, 23, 42);

    row.forEach((cell, cIdx) => {
      const text = String(cell);
      doc.text(text.substring(0, 28), 16 + cIdx * colWidth, startY + 5);
    });

    startY += 7;
  });

  doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export table data to Excel (.xlsx)
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, string | number>[]
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

import { formatINR } from './feeCycleUtils';

export interface WhatsAppReminderData {
  studentName: string;
  feeAmount: number;
  dueDate: string;
  outstandingAmount: number;
  tuitionName?: string;
  teacherName?: string;
}

export interface WhatsAppPaymentConfirmationData {
  studentName: string;
  paymentAmount: number;
  paymentMethod: string;
  receiptNumber: string;
  remainingOutstanding: number;
  paymentDate: string;
  tuitionName?: string;
}

/**
 * Clean phone number to WhatsApp international standard (e.g. 919876543210)
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) {
    return '91' + digits; // Default India country code
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return '91' + digits.substring(1);
  }
  return digits;
}

/**
 * Generate official fee reminder text strictly following the specified template
 */
export function generateFeeReminderText(data: WhatsAppReminderData): string {
  const tuition = data.tuitionName || 'Rehan Sir Classes';
  return (
`Hello,
This is a fee reminder from ${tuition}.
The monthly tuition fee for ${data.studentName} is now due.
Fee Amount: ${formatINR(data.feeAmount)}
Due Date: ${data.dueDate}
Outstanding Balance: ${formatINR(data.outstandingAmount)}
Please submit the tuition fee at your earliest convenience.
Thank you.
${tuition}.`
  );
}

/**
 * Generate payment confirmation text
 */
export function generatePaymentConfirmationText(data: WhatsAppPaymentConfirmationData): string {
  const tuition = data.tuitionName || 'Rehan Sir Classes';
  return (
`Hello,
Payment Confirmation from ${tuition}.
We have received ${formatINR(data.paymentAmount)} for ${data.studentName} via ${data.paymentMethod}.
Receipt No: ${data.receiptNumber}
Date: ${data.paymentDate}
Remaining Balance: ${formatINR(data.remainingOutstanding)}
${data.remainingOutstanding === 0 ? 'Status: Fully Paid ✅' : 'Status: Partially Paid'}
Thank you for your prompt payment!
${tuition}.`
  );
}

/**
 * Build a Click-to-WhatsApp URL that opens directly in WhatsApp mobile app or web
 */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const cleanPhone = sanitizeWhatsAppNumber(phoneNumber);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Build standard SMS URL (sms:phone?body=message)
 */
export function buildSMSLink(phoneNumber: string, message: string): string {
  const cleanPhone = (phoneNumber || '').replace(/[^\d+]/g, '');
  const encodedText = encodeURIComponent(message);
  return `sms:${cleanPhone}?body=${encodedText}`;
}

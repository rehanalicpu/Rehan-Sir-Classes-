import { FeeCycle, FeeCycleStatus, Payment, Student, StudentFinancialSummary } from '../types';

/**
 * Returns current date in Asia/Kolkata (IST) timezone as YYYY-MM-DD string
 */
export function getTodayIST(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    // Fallback if Intl timeZone unavailable
    const d = new Date();
    return d.toISOString().split('T')[0];
  }
}

/**
 * Formats amount into Indian Rupee representation (e.g., ₹1,500)
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Days in a specific year and month (1-indexed month)
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calculates start and due date for a specific cycle number (1-based index)
 * Cycle 1 starts on joiningDate and is due after 1 complete month.
 * Properly clamps days (e.g., Jan 31 -> Feb 28/29, Mar 31, etc.)
 */
export function calculateCycleDates(joiningDateStr: string, cycleNumber: number): {
  startDate: string;
  dueDate: string;
  monthLabel: string;
} {
  const [jYear, jMonth, jDay] = joiningDateStr.split('-').map(Number);

  // Cycle (k) starts (k - 1) months after joining
  const startMonthsOffset = cycleNumber - 1;
  const startTotalMonths = jYear * 12 + (jMonth - 1) + startMonthsOffset;
  const sYear = Math.floor(startTotalMonths / 12);
  const sMonth = (startTotalMonths % 12) + 1;
  const sMaxDay = getDaysInMonth(sYear, sMonth);
  const sDay = Math.min(jDay, sMaxDay);
  const startDate = `${sYear}-${String(sMonth).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;

  // Cycle (k) is due (k) months after joining (1 complete month after start)
  const dueMonthsOffset = cycleNumber;
  const dueTotalMonths = jYear * 12 + (jMonth - 1) + dueMonthsOffset;
  const dYear = Math.floor(dueTotalMonths / 12);
  const dMonth = (dueTotalMonths % 12) + 1;
  const dMaxDay = getDaysInMonth(dYear, dMonth);
  const dDay = Math.min(jDay, dMaxDay);
  const dueDate = `${dYear}-${String(dMonth).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;

  // Human readable label e.g. "Month 1 (05 Dec 2026)"
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthLabel = `Month ${cycleNumber} (${monthNames[dMonth - 1]} ${dYear})`;

  return { startDate, dueDate, monthLabel };
}

/**
 * Returns difference in whole calendar days (dateA - dateB)
 */
export function diffDays(dateA: string, dateB: string): number {
  const msA = new Date(dateA + 'T00:00:00Z').getTime();
  const msB = new Date(dateB + 'T00:00:00Z').getTime();
  return Math.floor((msA - msB) / (1000 * 60 * 60 * 24));
}

/**
 * Determines which fee cycles should exist up to today + next upcoming cycle
 */
export function generateRequiredCycles(
  student: Student,
  existingCycles: FeeCycle[],
  todayStr: string = getTodayIST()
): FeeCycle[] {
  if (!student.joiningDate || student.status === 'DEACTIVATED') {
    return existingCycles.filter(c => c.studentId === student.id);
  }

  const existingMap = new Map<number, FeeCycle>();
  for (const c of existingCycles) {
    if (c.studentId === student.id) {
      existingMap.set(c.cycleNumber, c);
    }
  }

  const result: FeeCycle[] = [];
  let cycleNum = 1;
  let keepGenerating = true;

  // Generate all cycles whose due date is on or before today, plus one upcoming cycle
  while (keepGenerating) {
    const { startDate, dueDate, monthLabel } = calculateCycleDates(student.joiningDate, cycleNum);

    if (existingMap.has(cycleNum)) {
      result.push(existingMap.get(cycleNum)!);
    } else {
      // New cycle needs to be created
      const isDue = dueDate <= todayStr;
      const initialOutstanding = student.monthlyFee;
      const newCycle: FeeCycle = {
        id: `${student.id}_c${cycleNum}`,
        cycleId: `${student.studentId}_cycle_${cycleNum}`,
        studentId: student.id,
        teacherUid: student.teacherUid,
        studentName: student.name,
        cycleNumber: cycleNum,
        cycleStartDate: startDate,
        cycleDueDate: dueDate,
        monthLabel,
        feeAmount: student.monthlyFee,
        paidAmount: 0,
        outstandingAmount: initialOutstanding,
        status: isDue ? 'PENDING' : 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      result.push(newCycle);
    }

    // Stop after generating all past/current due cycles and 1 upcoming cycle
    if (dueDate > todayStr) {
      keepGenerating = false;
    } else {
      cycleNum++;
      if (cycleNum > 120) keepGenerating = false; // Safety bound (10 years)
    }
  }

  return result.sort((a, b) => a.cycleNumber - b.cycleNumber);
}

/**
 * Calculates financial summary for a student, separating current cycle from previous pending
 */
export function computeStudentFinancialSummary(
  student: Student,
  allCycles: FeeCycle[],
  allPayments: Payment[],
  todayStr: string = getTodayIST()
): StudentFinancialSummary {
  const studentCycles = allCycles
    .filter(c => c.studentId === student.id)
    .sort((a, b) => a.cycleNumber - b.cycleNumber);

  const studentPayments = allPayments
    .filter(p => p.studentId === student.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Cycles that are already due as of today
  const dueCycles = studentCycles.filter(c => c.cycleDueDate <= todayStr);
  const upcomingCycle = studentCycles.find(c => c.cycleDueDate > todayStr);

  // The latest due cycle is the "Current Cycle"
  const currentCycle = dueCycles.length > 0 ? dueCycles[dueCycles.length - 1] : undefined;

  let currentCycleFee = 0;
  let currentCyclePending = 0;
  let previousOutstanding = 0;

  if (currentCycle) {
    currentCycleFee = currentCycle.feeAmount;
    currentCyclePending = currentCycle.outstandingAmount;

    // Previous cycles are all due cycles before the current one
    const prevCycles = dueCycles.slice(0, -1);
    previousOutstanding = prevCycles.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0);
  } else if (upcomingCycle) {
    // If no cycle is due yet (first month not completed), current cycle fee is student's monthly fee
    currentCycleFee = student.monthlyFee;
    currentCyclePending = 0;
    previousOutstanding = 0;
  }

  const totalOutstanding = currentCyclePending + previousOutstanding;

  // Next due date: if student has an upcoming cycle, use that; otherwise calculate cycle 1 or next
  let nextDueDate = '';
  if (upcomingCycle) {
    nextDueDate = upcomingCycle.cycleDueDate;
  } else if (currentCycle) {
    const nextDates = calculateCycleDates(student.joiningDate, currentCycle.cycleNumber + 1);
    nextDueDate = nextDates.dueDate;
  } else {
    const firstDates = calculateCycleDates(student.joiningDate, 1);
    nextDueDate = firstDates.dueDate;
  }

  // Days overdue calculation
  let isOverdue = false;
  let isDueToday = false;
  let daysOverdue = 0;

  if (totalOutstanding > 0 && dueCycles.length > 0) {
    // Find the oldest unpaid cycle
    const oldestUnpaid = dueCycles.find(c => c.outstandingAmount > 0);
    if (oldestUnpaid) {
      const days = diffDays(todayStr, oldestUnpaid.cycleDueDate);
      if (days === 0) {
        isDueToday = true;
      } else if (days > 0) {
        isOverdue = true;
        daysOverdue = days;
      }
    }
  }

  let overallStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'DUE_TODAY' = 'PAID';
  if (totalOutstanding > 0) {
    if (isOverdue) overallStatus = 'OVERDUE';
    else if (isDueToday) overallStatus = 'DUE_TODAY';
    else overallStatus = 'PENDING';
  }

  return {
    student,
    currentCycle,
    nextDueDate,
    currentCycleFee,
    currentCyclePending,
    previousOutstanding,
    totalOutstanding,
    isOverdue,
    isDueToday,
    daysOverdue,
    overallStatus,
    allCycles: studentCycles,
    allPayments: studentPayments,
  };
}

/**
 * Distributes payment amount sequentially across unpaid cycles (FIFO: oldest first)
 * Returns updated cycles array
 */
export function allocatePaymentToCycles(
  cycles: FeeCycle[],
  paymentAmount: number,
  paymentDateStr: string
): { updatedCycles: FeeCycle[]; remainingUnallocated: number } {
  let remainingPayment = paymentAmount;
  const sortedCycles = [...cycles].sort((a, b) => a.cycleNumber - b.cycleNumber);

  const updatedCycles = sortedCycles.map(cycle => {
    if (remainingPayment <= 0 || cycle.outstandingAmount <= 0) {
      return { ...cycle };
    }

    const amountToApply = Math.min(remainingPayment, cycle.outstandingAmount);
    const newPaidAmount = cycle.paidAmount + amountToApply;
    const newOutstanding = cycle.outstandingAmount - amountToApply;
    remainingPayment -= amountToApply;

    const newStatus: FeeCycleStatus = newOutstanding === 0 ? 'PAID' : 'PARTIAL';

    return {
      ...cycle,
      paidAmount: newPaidAmount,
      outstandingAmount: newOutstanding,
      status: newStatus,
      lastPaymentDate: paymentDateStr,
      updatedAt: new Date().toISOString(),
    };
  });

  return { updatedCycles, remainingUnallocated: remainingPayment };
}

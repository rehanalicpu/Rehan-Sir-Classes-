import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, Phone, DollarSign, User, FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { Student } from '../types';
import { getTodayIST, calculateCycleDates, formatINR } from '../utils/feeCycleUtils';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editStudent?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ isOpen, onClose, editStudent }) => {
  const { addStudent, updateStudent, students } = useTuitionData();
  const today = getTodayIST();

  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [joiningDate, setJoiningDate] = useState(today);
  const [mobileNumber, setMobileNumber] = useState('');
  const [parentWhatsAppNumber, setParentWhatsAppNumber] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<number>(800);
  const [studentId, setStudentId] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate deterministic roll number / student ID if adding
  useEffect(() => {
    if (editStudent) {
      setName(editStudent.name);
      setFatherName(editStudent.fatherName);
      setJoiningDate(editStudent.joiningDate);
      setMobileNumber(editStudent.mobileNumber);
      setParentWhatsAppNumber(editStudent.parentWhatsAppNumber);
      setMonthlyFee(editStudent.monthlyFee);
      setStudentId(editStudent.studentId);
      setNotes(editStudent.notes || '');
      setPhotoUrl(editStudent.photoUrl || '');
    } else {
      const nextNum = students.length + 1;
      const year = today.split('-')[0] || '2026';
      setStudentId(`RST-${year}-${String(nextNum).padStart(3, '0')}`);
      setName('');
      setFatherName('');
      setJoiningDate(today);
      setMobileNumber('');
      setParentWhatsAppNumber('');
      setMonthlyFee(800);
      setNotes('');
      setPhotoUrl('');
    }
    setError(null);
  }, [editStudent, isOpen, students.length, today]);

  if (!isOpen) return null;

  // Real-time calculation preview of first due date
  const firstCycleDates = calculateCycleDates(joiningDate || today, 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Student Name is required.');
      return;
    }
    if (!fatherName.trim()) {
      setError("Father's Name is required.");
      return;
    }
    if (!joiningDate) {
      setError('Date of Joining is required.');
      return;
    }
    if (!parentWhatsAppNumber.trim()) {
      setError('Parent WhatsApp Number is required for fee reminders.');
      return;
    }
    if (monthlyFee <= 0) {
      setError('Monthly fee must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editStudent) {
        await updateStudent(editStudent.id, {
          name: name.trim(),
          fatherName: fatherName.trim(),
          joiningDate,
          mobileNumber: mobileNumber.trim() || parentWhatsAppNumber.trim(),
          parentWhatsAppNumber: parentWhatsAppNumber.trim(),
          monthlyFee: Number(monthlyFee),
          studentId: studentId.trim(),
          notes: notes.trim(),
          photoUrl: photoUrl.trim(),
        });
      } else {
        await addStudent({
          studentId: studentId.trim(),
          name: name.trim(),
          fatherName: fatherName.trim(),
          joiningDate,
          mobileNumber: mobileNumber.trim() || parentWhatsAppNumber.trim(),
          parentWhatsAppNumber: parentWhatsAppNumber.trim(),
          monthlyFee: Number(monthlyFee),
          notes: notes.trim(),
          photoUrl: photoUrl.trim(),
          status: 'ACTIVE',
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save student details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700/80 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">
                {editStudent ? 'Edit Student Details' : 'Student Registration'}
              </h3>
              <p className="text-xs text-blue-200">
                Individual joining-date monthly fee cycles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student ID / Roll No *
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Monthly Tuition Fee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Tuition Fee (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  required
                  placeholder="e.g. 800"
                  className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Rahul Kumar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Father's Name *
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                required
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Joining */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date of Joining *
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Parent WhatsApp Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent WhatsApp Number *
              </label>
              <input
                type="tel"
                value={parentWhatsAppNumber}
                onChange={(e) => {
                  setParentWhatsAppNumber(e.target.value);
                  if (!mobileNumber) setMobileNumber(e.target.value);
                }}
                required
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Student Mobile Number (Optional / Direct) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Student Mobile Number (Optional)
            </label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Calculated Fee Schedule Preview Box */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Independent Fee Cycle Schedule Preview</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Based on Joining Date <strong>{joiningDate || today}</strong>, the first monthly fee of{' '}
              <strong>{formatINR(monthlyFee)}</strong> will be due on{' '}
              <strong className="text-blue-900 underline">{firstCycleDates.dueDate}</strong> (1 complete month cycle).
              Subsequent fees continue on the same date each month.
            </p>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Optional Notes / Batch Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Class 10th CBSE Batch, Science & Math"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editStudent ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Bell, CheckCircle2, Clock, AlertTriangle, CreditCard, CheckCheck } from 'lucide-react';
import { useTuitionData } from '../context/TuitionDataContext';
import { formatINR } from '../utils/feeCycleUtils';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudentId?: (studentId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  onSelectStudentId,
}) => {
  const { notifications, markNotificationRead } = useTuitionData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Teacher Daily Fee Notifications</h3>
              <p className="text-xs text-slate-300">
                Daily automated reminders for pending & overdue student fees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification List */}
        <div className="p-5 max-h-[420px] overflow-y-auto divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-50" />
              <p className="font-semibold text-slate-700">No active fee alerts</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All fees are settled or no cycles are currently pending.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isOverdue = notif.type === 'OVERDUE';
              const isPayment = notif.type === 'PAYMENT_RECEIVED';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationRead(notif.id);
                    if (notif.studentId && onSelectStudentId) {
                      onSelectStudentId(notif.studentId);
                      onClose();
                    }
                  }}
                  className={`py-3.5 px-3 rounded-2xl transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white ${
                      isPayment
                        ? 'bg-emerald-600'
                        : isOverdue
                        ? 'bg-red-600'
                        : 'bg-amber-500'
                    }`}
                  >
                    {isPayment ? (
                      <CreditCard className="w-4 h-4" />
                    ) : isOverdue ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(notif.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {notif.body}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      {notif.daysPending !== undefined && notif.daysPending > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">
                          Pending: {notif.daysPending} days
                        </span>
                      )}
                      {!notif.read && (
                        <span className="text-blue-600 font-bold">• New</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {notifications.filter((n) => !n.read).length} unread alerts
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Bell, RefreshCw, Smartphone, GraduationCap, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTuitionData } from '../context/TuitionDataContext';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenAddStudent: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications, onOpenAddStudent }) => {
  const { teacherProfile, settings, currentUser, signInWithGoogle, signOutUser } = useAuth();
  const { notifications, runDailyCycleAudit } = useTuitionData();
  const [isAuditing, setIsAuditing] = React.useState(false);
  const [auditMessage, setAuditMessage] = React.useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditMessage(null);
    try {
      const result = await runDailyCycleAudit();
      setAuditMessage(`Audit complete: ${result.cyclesCreated} cycles checked, ${result.notificationsSent} reminders generated.`);
      setTimeout(() => setAuditMessage(null), 4000);
    } catch {
      setAuditMessage('Audit finished.');
      setTimeout(() => setAuditMessage(null), 3000);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-teal-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
                  REHAN SIR TUITION MANAGER
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  IST (Asia/Kolkata)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {settings?.tuitionName || 'Rehan Sir Classes'} • {teacherProfile?.displayName || 'Rehan Sir'}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Daily Audit Button */}
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              title="Run Automated Daily Fee Cycle Audit & Reminders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isAuditing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Run Daily Audit</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Auth / Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div
                  title={`Logged in as ${currentUser.email}`}
                  className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs ring-2 ring-blue-100 cursor-pointer"
                  onClick={signOutUser}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'R'}
                </div>
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition shadow-xs"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Banner feedback */}
      {auditMessage && (
        <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 text-xs font-medium text-emerald-800 flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{auditMessage}</span>
        </div>
      )}
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  MessageSquare,
  Smartphone,
  Save,
  CheckCircle2,
  Clock,
  Globe,
  DollarSign,
  ShieldCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTuitionData } from '../context/TuitionDataContext';
import { formatINR } from '../utils/feeCycleUtils';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useAuth();
  const { runDailyCycleAudit } = useTuitionData();

  const [teacherName, setTeacherName] = useState(settings?.teacherName || 'Rehan Sir');
  const [tuitionName, setTuitionName] = useState(settings?.tuitionName || 'Rehan Sir Classes');
  const [teacherPhone, setTeacherPhone] = useState(settings?.teacherPhone || '+91 98765 43210');
  const [tuitionAddress, setTuitionAddress] = useState(settings?.tuitionAddress || 'Main Road, Tuition Complex, India');

  // Reminders Toggles
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(settings?.dailyReminderEnabled ?? true);
  const [whatsappReminderEnabled, setWhatsappReminderEnabled] = useState(settings?.whatsappReminderEnabled ?? true);
  const [smsReminderEnabled, setSmsReminderEnabled] = useState(settings?.smsReminderEnabled ?? false);

  // WhatsApp Meta Cloud API
  const [waPhoneNumberId, setWaPhoneNumberId] = useState(settings?.whatsappConfig?.phoneNumberId || '');
  const [waAccessToken, setWaAccessToken] = useState(settings?.whatsappConfig?.accessToken || '');
  const [waTemplateName, setWaTemplateName] = useState(settings?.whatsappConfig?.templateName || 'fee_reminder_rehan_sir');

  // SMS Gateway
  const [smsApiUrl, setSmsApiUrl] = useState(settings?.smsConfig?.apiUrl || '');
  const [smsApiKey, setSmsApiKey] = useState(settings?.smsConfig?.apiKey || '');
  const [smsSenderId, setSmsSenderId] = useState(settings?.smsConfig?.senderId || 'REHAN_SIR');

  // Notification Permission State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setTeacherName(settings.teacherName || 'Rehan Sir');
      setTuitionName(settings.tuitionName || 'Rehan Sir Classes');
      setTeacherPhone(settings.teacherPhone || '+91 98765 43210');
      setTuitionAddress(settings.tuitionAddress || 'Main Road, Tuition Complex, India');
      setDailyReminderEnabled(settings.dailyReminderEnabled ?? true);
      setWhatsappReminderEnabled(settings.whatsappReminderEnabled ?? true);
      setSmsReminderEnabled(settings.smsReminderEnabled ?? false);
      setWaPhoneNumberId(settings.whatsappConfig?.phoneNumberId || '');
      setWaAccessToken(settings.whatsappConfig?.accessToken || '');
      setWaTemplateName(settings.whatsappConfig?.templateName || 'fee_reminder_rehan_sir');
      setSmsApiUrl(settings.smsConfig?.apiUrl || '');
      setSmsApiKey(settings.smsConfig?.apiKey || '');
      setSmsSenderId(settings.smsConfig?.senderId || 'REHAN_SIR');
    }
  }, [settings]);

  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Rehan Sir Tuition Manager', {
          body: 'Push notifications are now enabled! You will receive daily fee alerts.',
          icon: '/pwa-192x192.png',
        });
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      await updateSettings({
        teacherName: teacherName.trim(),
        tuitionName: tuitionName.trim(),
        teacherPhone: teacherPhone.trim(),
        tuitionAddress: tuitionAddress.trim(),
        dailyReminderEnabled,
        whatsappReminderEnabled,
        smsReminderEnabled,
        whatsappConfig: {
          phoneNumberId: waPhoneNumberId.trim(),
          accessToken: waAccessToken.trim(),
          templateName: waTemplateName.trim(),
        },
        smsConfig: {
          apiUrl: smsApiUrl.trim(),
          apiKey: smsApiKey.trim(),
          senderId: smsSenderId.trim(),
        },
      });

      setSuccessMsg('Settings saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">Tuition Manager Settings</h2>
            <p className="text-xs text-slate-500">Configure center branding, daily reminders, and communication channels</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Center & Teacher Branding */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Tuition & Teacher Profile</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teacher Name *
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tuition Centre Name *
              </label>
              <input
                type="text"
                value={tuitionName}
                onChange={(e) => setTuitionName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teacher Mobile Number
              </label>
              <input
                type="text"
                value={teacherPhone}
                onChange={(e) => setTeacherPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Centre Address (Appears on Receipts)
              </label>
              <input
                type="text"
                value={tuitionAddress}
                onChange={(e) => setTuitionAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. Automated Daily Reminders & Notifications */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Daily Automatic Fee Reminders</span>
          </h3>

          <div className="space-y-3">
            {/* Daily Teacher Push Notification */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-xs font-bold text-slate-800 block">Daily Teacher Push Notifications</strong>
                <p className="text-[11px] text-slate-500">
                  Sends fee pending & overdue alerts to your phone every morning until paid.
                </p>
              </div>
              <input
                type="checkbox"
                checked={dailyReminderEnabled}
                onChange={(e) => setDailyReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Parent WhatsApp Reminders */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-xs font-bold text-slate-800 block">Parent WhatsApp Reminders</strong>
                <p className="text-[11px] text-slate-500">
                  Enables 1-tap Click-to-WhatsApp and automated Meta Cloud API message dispatches.
                </p>
              </div>
              <input
                type="checkbox"
                checked={whatsappReminderEnabled}
                onChange={(e) => setWhatsappReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {/* SMS Reminders */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-xs font-bold text-slate-800 block">SMS Gateway Reminders</strong>
                <p className="text-[11px] text-slate-500">
                  Optional SMS integration via configurable HTTP gateway.
                </p>
              </div>
              <input
                type="checkbox"
                checked={smsReminderEnabled}
                onChange={(e) => setSmsReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Browser Push Permission Status */}
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-blue-900">Android / Browser Push Permission:</span>
                <span className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                  notificationPermission === 'granted'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}>
                  {notificationPermission.toUpperCase()}
                </span>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Allows notifications even when the app is in the background.
                </p>
              </div>

              {notificationPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition"
                >
                  Enable Notifications
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Official Meta WhatsApp Cloud API Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Official Meta WhatsApp Business Cloud API</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Optional API Keys
            </span>
          </div>

          <p className="text-xs text-slate-500">
            If API credentials are not provided, the app uses <strong>Direct 1-Tap Click-to-WhatsApp</strong> with the official pre-filled template message at zero cost!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                value={waPhoneNumberId}
                onChange={(e) => setWaPhoneNumberId(e.target.value)}
                placeholder="e.g. 100482939281923"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={waTemplateName}
                onChange={(e) => setWaTemplateName(e.target.value)}
                placeholder="e.g. fee_reminder_rehan_sir"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Permanent Access Token
            </label>
            <input
              type="password"
              value={waAccessToken}
              onChange={(e) => setWaAccessToken(e.target.value)}
              placeholder="EAAGm0PX4ZC5..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* 4. SMS Gateway API Configuration */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>SMS Gateway Configuration</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              Optional Gateway
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SMS Gateway Endpoint URL
              </label>
              <input
                type="url"
                value={smsApiUrl}
                onChange={(e) => setSmsApiUrl(e.target.value)}
                placeholder="https://api.sms-gateway.com/send"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sender ID
              </label>
              <input
                type="text"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                placeholder="e.g. REHANS"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gateway API Key / Token
            </label>
            <input
              type="password"
              value={smsApiKey}
              onChange={(e) => setSmsApiKey(e.target.value)}
              placeholder="API Authorization Key"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 5. Currency & Timezone Standards */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-4 h-4 text-slate-700" />
            <span>Localization & Billing Standards</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold">APPLICATION CURRENCY</span>
              <strong className="text-slate-900 text-sm">Indian Rupees (INR - ₹)</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block text-[10px] font-bold">APPLICATION TIMEZONE</span>
              <strong className="text-slate-900 text-sm">Asia/Kolkata (IST, UTC+05:30)</strong>
            </div>
          </div>
        </div>

        {/* 6. Technical Setup & Deployment Guide */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 space-y-3 shadow-md">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Architecture & Deployment Instructions</span>
          </div>
          <div className="text-[11px] space-y-1.5 text-slate-300 leading-relaxed">
            <p>• <strong>Cloud Firestore</strong> is connected via the secure, auto-provisioned database ID: <code className="text-emerald-300 font-mono">ai-studio-rehansirtuitionm-64daf06e-29fd-4324-b630-f8f0cc438c46</code>.</p>
            <p>• <strong>Fee Calculation</strong> runs independently from each student's joining date (Cycle 1 due exactly 1 month after joining). Month-ends (28/29/30/31) clamp automatically.</p>
            <p>• <strong>Full Stack Backend</strong> runs Express on port 3000 with <code className="text-blue-300 font-mono">/api/scheduler/run-daily-audit</code> and an automated daily cron background worker.</p>
            <p>• <strong>PWA Install</strong> is active on Chromium, Android, and iOS Safari with service worker precaching.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-extrabold shadow-md transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

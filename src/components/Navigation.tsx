import React from 'react';
import { LayoutDashboard, Users, CreditCard, BarChart3, Settings } from 'lucide-react';

export type NavTab = 'dashboard' | 'students' | 'collect' | 'reports' | 'settings';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onSelectTab, pendingCount }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students' as NavTab, label: 'Students', icon: Users },
    { id: 'collect' as NavTab, label: 'Collect Fee', icon: CreditCard, isHighlight: true },
    { id: 'reports' as NavTab, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-white border-b border-slate-200 px-6 py-2 shadow-2xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'students' && pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Currency: <span className="font-bold text-slate-800">INR (₹)</span> • Cycle: <span className="font-bold text-slate-800">Joining Date</span>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Large touch targets for Android/iOS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;

            if (tab.isHighlight) {
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 mt-1">Collect</span>
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-500 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700 scale-110' : 'text-slate-500'}`} />
                  {tab.id === 'students' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-red-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

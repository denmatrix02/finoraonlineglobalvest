import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Landmark,
  Settings,
  ShieldCheck,
  LogOut,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';
import logoImg from '../../assets/logo-30_3x.png';

export default function AdminSidebar() {
  const { currentUser, logout } = useAuth();
  const { totalAdminUnread } = useMessaging();

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { path: '/admin/users', label: 'User Management', icon: Users },
    { path: '/admin/loans', label: 'Loan Underwriting', icon: Landmark },
    { path: '/admin/transactions', label: 'System Audit & Transfers', icon: ArrowLeftRight },
    { path: '/admin/inbox', label: 'Support Inbox', icon: MessageSquare, badge: totalAdminUnread },
  ];

  return (
    <aside className="fixed bottom-0 left-0 w-full z-50 flex flex-row bg-[#141414] border-t border-[#262626] md:sticky md:top-0 md:w-64 md:h-screen md:flex-col md:border-t-0 md:border-r md:p-5 shrink-0 justify-between">
      <div className="flex flex-row md:flex-col gap-2 md:gap-8 flex-1 overflow-x-auto no-scrollbar items-center md:items-stretch px-2 py-1 md:p-0">
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 px-2 pt-2">
          <img src={logoImg} alt="Finora Logo" width="28" height="28" className="object-contain" />
          <div>
            <span className="text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
              Finora Admin
            </span>
            <span className="text-[10px] text-[#6EE7B7] font-mono tracking-widest uppercase">
              Control Panel
            </span>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="hidden md:flex bg-[#CAFF33]/10 border border-[#CAFF33]/30 p-3 rounded-2xl items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#CAFF33] text-[#111111] flex items-center justify-center font-bold text-xs">
            <ShieldCheck size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.name || 'Administrator'}</p>
            <p className="text-[10px] text-[#CAFF33] font-mono">Master Rights Active</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-row md:flex-col gap-1.5 flex-1">
          <span className="hidden md:block text-[10px] uppercase font-mono text-[#8A8A8A] tracking-wider px-3 mb-1">
            Core Modules
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl font-medium text-[10px] md:text-xs transition-all min-w-[76px] md:min-w-0 ${
                    isActive
                      ? 'text-[#111111] bg-[#CAFF33] font-semibold md:shadow-lg md:shadow-[#CAFF33]/10'
                      : 'text-[#8A8A8A] hover:bg-[#1F1F1F] hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="md:w-4 md:h-4" />
                <span className="hidden md:inline">{item.label}</span>
                <span className="md:hidden truncate">{item.label.split(' ')[0]}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-1 md:static md:ml-auto bg-[#FF5555] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Sign out */}
      <div className="hidden md:flex flex-col gap-3 border-t border-[#262626] pt-4">
        <div className="flex items-center justify-between text-[11px] text-[#8A8A8A]">
          <span>Engine Version</span>
          <span className="text-white font-mono text-[10px]">v2.4.0 (Supabase)</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-[#1A1A1A] hover:bg-[#FF5555]/10 text-[#FF5555] border border-[#262626] hover:border-[#FF5555]/30 rounded-xl text-xs font-medium transition-all"
        >
          <LogOut size={14} /> Exit Admin Suite
        </button>
      </div>
    </aside>
  );
}

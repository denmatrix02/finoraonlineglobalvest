import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Send, Download, Landmark, PiggyBank,
  FileText, Bell, User, LogOut, CreditCard, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { useMessaging } from '../../context/MessagingContext';
import logoImg from '../../assets/logo-30_3x.png';
import MonoAmount from './MonoAmount';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/transfers', label: 'Send Money', icon: Send },
  { path: '/receive', label: 'Receive Money', icon: Download },
  { path: '/loans', label: 'Loans', icon: Landmark },
  { path: '/savings', label: 'Savings', icon: PiggyBank },
  { path: '/statements', label: 'Statements', icon: FileText },
  { path: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifs' },
  { path: '/support', label: 'Support', icon: MessageSquare, badgeKey: 'support' },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function UserSidebar() {
  const { currentUser, logout } = useAuth();
  const { getUserBalances, notifications } = useBanking();
  const { getUserUnread } = useMessaging();
  const navigate = useNavigate();

  const balances = getUserBalances();
  const unreadNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.read).length;
  const unreadSupport = getUserUnread(currentUser?.id);

  const getBadge = (badgeKey) => {
    if (badgeKey === 'notifs') return unreadNotifs;
    if (badgeKey === 'support') return unreadSupport;
    return 0;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Initials fallback
  const initials = currentUser?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <aside className="fixed bottom-0 left-0 w-full z-50 flex flex-row bg-[#141414] border-t border-[#1F1F1F] md:sticky md:top-0 md:w-[240px] md:h-screen md:flex-col md:border-t-0 md:border-r shrink-0">
      {/* Logo */}
      <div className="hidden md:flex items-center gap-2.5 px-5 pt-6 pb-4 border-b border-[#1F1F1F]">
        <img src={logoImg} alt="Finora" width="24" height="24" className="object-contain" />
        <span className="text-[14px] font-semibold text-white tracking-tight font-['Poppins']">Finora</span>
      </div>

      {/* Balance widget */}
      <div className="hidden md:block mx-4 mt-4 mb-2 bg-gradient-to-br from-[#CAFF33]/10 to-[#1A1A1A] border border-[#CAFF33]/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-[#666] uppercase tracking-widest font-['Inter']">Checking Balance</span>
          <CreditCard size={13} className="text-[#CAFF33]" />
        </div>
        <MonoAmount amount={balances.checking} size="xl" direction="credit" />
        <div className="mt-2 pt-2 border-t border-[#CAFF33]/10 flex justify-between text-[10px] text-[#555]">
          <span>Savings</span>
          <MonoAmount amount={balances.savings} size="xs" direction="credit" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row md:flex-col gap-1 md:gap-0.5 px-2 py-2 flex-1 overflow-x-auto no-scrollbar items-center md:items-stretch">
        <p className="hidden md:block text-[9px] uppercase tracking-[0.15em] text-[#444] font-['Inter'] font-semibold px-2 py-2">
          Banking
        </p>
        {navItems.map(({ path, label, icon: Icon, end, badgeKey }) => {
          const badgeCount = badgeKey ? getBadge(badgeKey) : 0;
          return (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-2 md:py-2.5 rounded-xl text-[10px] md:text-[13px] font-medium transition-all duration-150 font-['Inter'] min-w-[72px] md:min-w-0 ${
                  isActive
                    ? 'text-[#CAFF33] md:bg-[#CAFF33] md:text-[#111] font-semibold md:shadow-sm'
                    : 'text-[#777] hover:bg-[#1E1E1E] hover:text-white'
                }`
              }
            >
              <Icon size={18} className="shrink-0 md:w-[16px] md:h-[16px]" />
              <span className="hidden md:inline md:flex-1">{label}</span>
              <span className="md:hidden truncate">{label.split(' ')[0]}</span>
              {badgeCount > 0 && (
                <span className="absolute top-1 right-2 md:static bg-[#FF5555] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="hidden md:block border-t border-[#1F1F1F] p-4 space-y-3">
        <div className="flex items-center gap-3">
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#333]"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#CAFF33]/20 border border-[#CAFF33]/30 flex items-center justify-center text-[#CAFF33] text-xs font-bold font-mono-figures">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white truncate font-['Inter']">{currentUser?.name}</p>
            <p className="text-[10px] text-[#555] font-mono-figures truncate">{currentUser?.accountNo}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 text-[12px] text-[#666] hover:text-[#FF5555] hover:bg-[#FF5555]/5 border border-[#222] hover:border-[#FF5555]/20 rounded-xl transition-all font-['Inter']"
        >
          <LogOut size={13} />
          Log Out
        </button>
      </div>
    </aside>
  );
}

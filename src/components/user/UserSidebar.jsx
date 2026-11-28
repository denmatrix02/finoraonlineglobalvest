import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Send, Download, Landmark, PiggyBank,
  FileText, Bell, User, LogOut, CreditCard, MessageSquare,
  LayoutGrid, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { useMessaging } from '../../context/MessagingContext';
import logoImg from '../../assets/logo-30_3x.png';
import MonoAmount from './MonoAmount';
import UserAvatar from './UserAvatar';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { path: '/transfers', label: 'Send Money', icon: Send },
  { path: '/receive', label: 'Receive Money', icon: Download },
  { path: '/cards', label: 'Cards', icon: CreditCard },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const balances = getUserBalances();
  const unreadNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.read).length;
  const unreadSupport = getUserUnread(currentUser?.id);
  const totalBadge = unreadNotifs + unreadSupport;

  const getBadge = (badgeKey) => {
    if (badgeKey === 'notifs') return unreadNotifs;
    if (badgeKey === 'support') return unreadSupport;
    return 0;
  };

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Desktop Sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex md:sticky md:top-0 md:w-[240px] md:h-screen md:flex-col bg-[#141414] border-r border-[#1F1F1F] shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-4 border-b border-[#1F1F1F]">
          <img src={logoImg} alt="Finora" width="24" height="24" className="object-contain" />
          <span className="text-[14px] font-semibold text-white tracking-tight font-['Poppins']">Finora</span>
        </div>

        {/* Balance widget */}
        <div className="mx-4 mt-4 mb-2 bg-gradient-to-br from-[#CAFF33]/10 to-[#1A1A1A] border border-[#CAFF33]/20 rounded-xl p-4">
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
        <nav className="flex flex-col gap-0.5 px-2 py-2 flex-1 overflow-y-auto no-scrollbar">
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#444] font-['Inter'] font-semibold px-2 py-2">
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
                  `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 font-['Inter'] ${
                    isActive
                      ? 'bg-[#CAFF33] text-[#111] font-semibold shadow-sm'
                      : 'text-[#777] hover:bg-[#1E1E1E] hover:text-white'
                  }`
                }
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badgeCount > 0 && (
                  <span className="bg-[#FF5555] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#1F1F1F] p-4 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="sm" ringClassName="border border-[#333]" />
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

      {/* ── Mobile Quick Services Slide-up Drawer (< md) ──────────────────── */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-[#151515] border-t border-[#262626] rounded-t-3xl p-5 pb-24 max-h-[82vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar user={currentUser} size="md" showStatus />
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-white font-['Poppins'] truncate">{currentUser?.name}</p>
                  <p className="text-[11px] text-[#666] font-mono-figures truncate">{currentUser?.accountNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-[#222] text-[#999] hover:text-white"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {navItems.map(({ path, label, icon: Icon, end, badgeKey }) => {
                const badgeCount = badgeKey ? getBadge(badgeKey) : 0;
                return (
                  <NavLink
                    key={path}
                    to={path}
                    end={end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                        isActive
                          ? 'bg-[#CAFF33]/15 border-[#CAFF33]/40 text-[#CAFF33]'
                          : 'bg-[#1B1B1B] border-[#242424] text-[#AAA] hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="text-[11px] font-medium font-['Inter'] leading-tight">
                      {label.replace(' Money', '')}
                    </span>
                    {badgeCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-[#FF5555] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px]">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#FF5555]/10 border border-[#FF5555]/25 text-[#FF5555] text-[13px] font-semibold font-['Inter']"
            >
              <LogOut size={15} />
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Dock (< md) ─────────────────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/95 backdrop-blur-lg border-t border-[#222] px-2 h-[66px] grid grid-cols-5 items-center"
      >
        <MobileTab to="/dashboard" label="Home" icon={LayoutDashboard} end onSelect={() => setMobileMenuOpen(false)} />
        <MobileTab to="/transfers" label="Send" icon={Send} onSelect={() => setMobileMenuOpen(false)} />

        {/* Center Floating Grid Button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="All banking services"
            className={`relative -mt-6 w-12 h-12 rounded-full flex items-center justify-center border-4 border-[#111] shadow-[0_6px_22px_rgba(202,255,51,0.3)] transition-all active:scale-95 ${
              mobileMenuOpen ? 'bg-white text-[#111]' : 'bg-[#CAFF33] text-[#111]'
            }`}
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <LayoutGrid size={20} strokeWidth={2.2} />}
            {!mobileMenuOpen && totalBadge > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF5555] ring-2 ring-[#111]" />
            )}
          </button>
        </div>

        <MobileTab to="/cards" label="Cards" icon={CreditCard} onSelect={() => setMobileMenuOpen(false)} />
        <MobileTab to="/profile" label="Profile" icon={User} onSelect={() => setMobileMenuOpen(false)} />
      </nav>
    </>
  );
}

function MobileTab({ to, label, icon: Icon, end, onSelect }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onSelect}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-medium font-['Inter'] transition-colors ${
          isActive ? 'text-[#CAFF33] font-semibold' : 'text-[#777] hover:text-white'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

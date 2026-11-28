import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Download, Landmark, PiggyBank, ArrowUpRight, ArrowDownLeft,
  ChevronRight, Bell, TrendingUp, Zap, Eye, EyeOff, ShieldCheck,
  Activity, Wallet, Copy, Check, CreditCard, Snowflake,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import StatusBadge from '../../components/user/StatusBadge';
import MonoAmount from '../../components/user/MonoAmount';
import TxDetailModal from '../../components/user/TxDetailModal';
import UserAvatar from '../../components/user/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import logoImg from '../../assets/logo-30_3x.png';

/**
 * Formats live real-time New York, USA (America/New_York) clock, date,
 * timezone abbreviation (EST/EDT), and time-of-day greeting.
 */
function getNewYorkDateTime(date) {
  const tz = 'America/New_York';

  const hourParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);
  const hour24 = parseInt(hourParts.find((p) => p.type === 'hour')?.value || '0', 10) % 24;

  let greeting = 'Good Evening';
  if (hour24 >= 5 && hour24 < 12) greeting = 'Good Morning';
  else if (hour24 >= 12 && hour24 < 17) greeting = 'Good Afternoon';

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).formatToParts(date);

  const tzAbbr = timeParts.find((p) => p.type === 'timeZoneName')?.value || 'EST';
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  return { greeting, timeStr, dateStr, tzAbbr };
}

const QuickAction = ({ to, icon: Icon, label, sub, accent }) => (
  <Link
    to={to}
    className={`flex flex-col justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] hover:shadow-lg group
      ${accent
        ? 'bg-[#CAFF33] border-[#CAFF33] hover:bg-[#b8e820] hover:border-[#b8e820] hover:shadow-[#CAFF33]/20'
        : 'bg-[#1D1D1D] border-[#262626] hover:border-[#363636] hover:bg-[#222] hover:shadow-black/40'
      }`}
  >
    <div className={`p-2.5 rounded-xl w-fit ${accent ? 'bg-[#111]/15' : 'bg-[#CAFF33]/10 border border-[#CAFF33]/15'}`}>
      <Icon size={18} className={accent ? 'text-[#111]' : 'text-[#CAFF33]'} />
    </div>
    <div className="min-w-0">
      <p className={`text-[13px] sm:text-[14px] font-semibold font-['Poppins'] truncate ${accent ? 'text-[#111]' : 'text-white'}`}>
        {label}
      </p>
      <p className={`text-[11px] font-['Inter'] truncate mt-0.5 ${accent ? 'text-[#111]/75' : 'text-[#6B7280]'}`}>
        {sub}
      </p>
    </div>
  </Link>
);

export default function UserDashboardPage() {
  const { currentUser } = useAuth();
  const { getUserBalances, getVisibleTransactions, notifications, loans, savingsMeta, virtualCards, lastFundedAt, settings } = useBanking();

  const balances = getUserBalances();
  const userTx = getVisibleTransactions();
  const myNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.read);
  const myCards = (virtualCards || []).filter((c) => c.userId === currentUser?.id && c.status !== 'Terminated');
  const primaryCard = myCards[0] || null;
  const [selectedTx, setSelectedTx] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [hideBalance, setHideBalance] = useState(() => {
    try {
      return localStorage.getItem('finora_hide_balance') === 'true';
    } catch {
      return false;
    }
  });
  const prevFundedRef = useRef(null);

  // Live New York clock tick (1s)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Detect admin funding event -> animate balance
  useEffect(() => {
    const funded = lastFundedAt[currentUser?.id];
    if (funded && funded !== prevFundedRef.current) {
      prevFundedRef.current = funded;
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(t);
    }
  }, [lastFundedAt, currentUser?.id]);

  const toggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('finora_hide_balance', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleCopyAccount = () => {
    if (!currentUser?.accountNo) return;
    navigator.clipboard?.writeText(currentUser.accountNo).catch(() => {});
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 1800);
  };

  const nyClock = getNewYorkDateTime(now);
  const firstName = currentUser?.name?.split(' ')[0] || 'Member';
  const activeLoan = loans.find((l) => l.userId === currentUser?.id && l.status === 'Active');
  const myMeta = savingsMeta[currentUser?.id] || { accruedInterest: 0, lastCreditedAt: '—' };
  const recentTx = userTx.slice(0, 5);
  const isActive = (currentUser?.status || 'Active') === 'Active';

  const maskedText = '••••••';
  const formatUsd = (val) =>
    Math.abs(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              to="/"
              className="md:hidden w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center shrink-0"
              title="Finora Home"
            >
              <img src={logoImg} alt="Finora" width="18" height="18" className="object-contain" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[15px] sm:text-[18px] font-bold text-white font-['Poppins'] truncate">
                Welcome back, <span className="text-[#CAFF33]">{firstName}</span> 👋
              </h1>
              <p className="text-[10px] sm:text-[11px] text-[#666] font-mono-figures mt-0.5 truncate">
                {currentUser?.accountNo}
              </p>
            </div>
          </div>

          {/* Notification Bell + Profile Avatar side-by-side */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/notifications"
              aria-label="Notifications"
              title="Notifications"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-[#262626] hover:border-[#CAFF33]/40 flex items-center justify-center transition-colors"
            >
              <Bell size={17} className="text-[#B5B5B5]" />
              {myNotifs.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF5555] text-white text-[9px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center ring-2 ring-[#111]">
                  {myNotifs.length > 9 ? '9+' : myNotifs.length}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              aria-label="Profile & Security"
              title={`${currentUser?.name || 'Profile'} — View Profile`}
              className="rounded-full p-0.5 hover:scale-105 transition-transform"
            >
              <UserAvatar
                user={currentUser}
                size="md"
                showStatus
                ringClassName="border-2 border-[#CAFF33]/45 hover:border-[#CAFF33] transition-colors"
              />
            </Link>
          </div>
        </header>

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Sleek Hero Banking Card */}
          <div
            className={`relative rounded-[24px] sm:rounded-[28px] border p-4 sm:p-6 overflow-hidden transition-all duration-700 shadow-[0_20px_50px_rgba(0,0,0,0.45)] ${
              highlight
                ? 'border-[#CAFF33] shadow-[0_0_45px_rgba(202,255,51,0.2)] bg-gradient-to-br from-[#233817] via-[#151D13] to-[#111412]'
                : 'border-[#CAFF33]/20 bg-gradient-to-br from-[#192814] via-[#131914] to-[#0E1110]'
            }`}
          >
            {/* Ambient decorative lighting */}
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#CAFF33]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-12 w-40 h-40 bg-[#CAFF33]/5 rounded-full blur-2xl pointer-events-none" />

            {highlight && (
              <div className="mb-3 inline-flex items-center gap-1.5 bg-[#CAFF33]/20 border border-[#CAFF33]/40 rounded-full px-3 py-1">
                <Zap size={11} className="text-[#CAFF33]" />
                <span className="text-[10px] text-[#CAFF33] font-semibold font-mono-figures">Funds Credited!</span>
              </div>
            )}

            {/* Card Top Row: Profile Avatar + Dynamic Greeting | Real-Time NY Time & Date */}
            <div className="relative flex items-start justify-between gap-3 mb-5 sm:mb-6">
              <Link to="/profile" className="flex items-center gap-3 min-w-0 group">
                <UserAvatar
                  user={currentUser}
                  size="lg"
                  ringClassName="border-2 border-[#CAFF33]/40 group-hover:border-[#CAFF33] transition-colors shadow-md"
                />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-[12px] text-[#9FB390] font-['Inter']">
                    {nyClock.greeting}
                  </p>
                  <p className="text-[15px] sm:text-[17px] font-bold text-white font-['Poppins'] truncate">
                    {firstName}
                  </p>
                </div>
              </Link>

              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white/[0.07] border border-white/10 text-[#CAFF33] font-mono-figures">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CAFF33] animate-pulse" />
                    NY · {nyClock.tzAbbr}
                  </span>
                  <span className="font-mono-figures tabular-nums text-[13px] sm:text-[16px] font-bold text-white tracking-tight">
                    {nyClock.timeStr}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#8FA183] font-['Inter'] mt-1">
                  {nyClock.dateStr}
                </p>
              </div>
            </div>

            {/* Card Middle Row: Available Balance + Eye Toggle */}
            <div className="relative flex items-end justify-between gap-3 mb-5">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-[12px] text-[#9AA892] font-['Inter'] tracking-wide mb-1">
                  Available Balance
                </p>
                <div className="flex items-baseline flex-wrap gap-x-2">
                  {hideBalance ? (
                    <span className="font-mono-figures font-bold text-[26px] sm:text-[36px] leading-tight text-white tracking-wider">
                      $ ••••••••
                    </span>
                  ) : (
                    <span className="font-mono-figures font-bold text-[26px] sm:text-[36px] leading-tight text-white tracking-tight">
                      ${formatUsd(balances.checking)}
                    </span>
                  )}
                  <span className="text-[13px] sm:text-[16px] font-bold text-[#CAFF33] font-['Poppins']">
                    USD
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleHideBalance}
                aria-label={hideBalance ? 'Show balances' : 'Hide balances'}
                title={hideBalance ? 'Show balances' : 'Hide balances'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-[#D4DFCD] hover:text-[#CAFF33] transition-all shrink-0 active:scale-95"
              >
                {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Card Bottom Glass Strip: Account Number + Status + Action Pills */}
            <div className="relative bg-black/35 backdrop-blur-md border border-white/[0.08] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0">
                  <ShieldCheck size={17} className="text-[#CAFF33]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] text-[#8E9B87] font-['Inter']">
                    Your Account Number
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="text-[13px] sm:text-[14px] font-bold text-white font-mono-figures">
                      {currentUser?.accountNo || 'ACC-000000'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      aria-label="Copy account number"
                      title="Copy account number"
                      className="text-[#7E8C76] hover:text-[#CAFF33] transition-colors p-0.5"
                    >
                      {copiedAcc ? <Check size={13} className="text-[#CAFF33]" /> : <Copy size={13} />}
                    </button>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-[#CAFF33]/15 border-[#CAFF33]/30 text-[#CAFF33]'
                          : 'bg-[#FF5555]/15 border-[#FF5555]/30 text-[#FF5555]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#CAFF33]' : 'bg-[#FF5555]'}`} />
                      {currentUser?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
                <Link
                  to="/statements"
                  className="bg-white hover:bg-[#CAFF33] text-[#111] font-semibold text-[11px] sm:text-[12px] px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-['Poppins'] whitespace-nowrap"
                >
                  <Activity size={13} />
                  Transactions
                </Link>
                <Link
                  to="/receive"
                  className="bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white font-semibold text-[11px] sm:text-[12px] px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors font-['Poppins'] whitespace-nowrap"
                >
                  <Wallet size={13} className="text-[#CAFF33]" />
                  Top up
                </Link>
              </div>
            </div>

            {/* Responsive 3-column Account Breakdown Strip */}
            <div className="relative mt-4 pt-3.5 border-t border-white/[0.08] grid grid-cols-3 gap-2 sm:gap-4 text-[11px] sm:text-[12px] font-['Inter']">
              <div className="min-w-0">
                <p className="text-[#88967F] text-[10px] sm:text-[11px]">Savings</p>
                {hideBalance ? (
                  <p className="font-mono-figures font-semibold text-[#CAFF33] mt-0.5">{maskedText}</p>
                ) : (
                  <MonoAmount amount={balances.savings} size="sm" direction="credit" />
                )}
              </div>
              <div className="min-w-0 border-l border-white/[0.08] pl-2.5 sm:pl-4">
                <p className="text-[#88967F] text-[10px] sm:text-[11px]">Active Loan</p>
                {hideBalance ? (
                  <p className="font-mono-figures font-semibold text-white mt-0.5">{maskedText}</p>
                ) : (
                  <MonoAmount amount={balances.loan} size="sm" direction={balances.loan > 0 ? 'debit' : 'neutral'} />
                )}
              </div>
              <div className="min-w-0 border-l border-white/[0.08] pl-2.5 sm:pl-4">
                <p className="text-[#88967F] text-[10px] sm:text-[11px]">Net Worth</p>
                {hideBalance ? (
                  <p className="font-mono-figures font-semibold text-[#CAFF33] mt-0.5">{maskedText}</p>
                ) : (
                  <MonoAmount amount={balances.netWorth} size="sm" direction={balances.netWorth >= 0 ? 'credit' : 'debit'} />
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Container */}
          <div className="bg-[#161616] border border-[#1F1F1F] rounded-3xl p-4 sm:p-5">
            <div className="mb-3.5 sm:mb-4">
              <h2 className="text-[15px] sm:text-[16px] font-bold text-white font-['Poppins']">
                What would you like to do today?
              </h2>
              <p className="text-[11px] sm:text-[12px] text-[#666] font-['Inter'] mt-0.5">
                Choose from our popular banking actions below
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              <QuickAction to="/transfers" icon={Send} label="Send Money" sub="Instant transfer" accent />
              <QuickAction to="/receive" icon={Download} label="Account Info" sub="Wire & Finora ID" />
              <QuickAction to="/loans" icon={Landmark} label="Apply for Loan" sub={`From ${settings.loanBaseRate || 4.5}% rate`} />
              <QuickAction to="/savings" icon={PiggyBank} label="Add to Savings" sub={`Earn ${settings.savingsAPY}% APY`} />
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
            {/* Recent Transactions */}
            <div className="xl:col-span-2 bg-[#1A1A1A] border border-[#1F1F1F] rounded-3xl overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[#222]">
                <div>
                  <h2 className="text-[14px] font-semibold text-white font-['Poppins']">Recent Transactions</h2>
                  <p className="text-[11px] text-[#555] font-['Inter']">Last {recentTx.length} activities</p>
                </div>
                <Link to="/statements" className="text-[11px] text-[#CAFF33] hover:underline font-['Inter'] flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              <div className="p-2.5 sm:p-3 space-y-1">
                {recentTx.length === 0 ? (
                  <p className="text-[12px] text-[#555] text-center py-10 font-['Inter']">No transactions yet.</p>
                ) : (
                  recentTx.map((tx) => {
                    const isDebit = tx.senderId === currentUser?.id && tx.recipientId !== currentUser?.id;
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl hover:bg-[#222] transition-colors text-left group"
                      >
                        <div className={`p-2 sm:p-2.5 rounded-xl border shrink-0 ${
                          isDebit
                            ? 'bg-[#FF5555]/10 border-[#FF5555]/20 text-[#FF5555]'
                            : 'bg-[#CAFF33]/10 border-[#CAFF33]/20 text-[#CAFF33]'
                        }`}>
                          {isDebit ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white font-['Inter'] truncate">
                            {isDebit ? `To ${tx.recipientName}` : `From ${tx.senderName}`}
                          </p>
                          <p className="text-[10px] text-[#555] font-['Inter'] truncate">
                            {tx.timestamp} · {(tx.note === 'Admin credit' || tx.category === 'Admin Credit') ? 'Account Deposit' : (tx.note || tx.category)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          {hideBalance ? (
                            <span className="font-mono-figures font-semibold text-sm text-[#888]">••••</span>
                          ) : (
                            <MonoAmount
                              amount={tx.amount}
                              direction={isDebit ? 'debit' : 'credit'}
                              sign
                              size="sm"
                            />
                          )}
                          <div className="flex justify-end">
                            <StatusBadge status={tx.status} size="sm" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Side cards */}
            <div className="space-y-4">
              {/* Virtual Card Widget */}
              <div className="bg-gradient-to-br from-[#192415] to-[#161616] border border-[#CAFF33]/20 rounded-3xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={15} className="text-[#CAFF33]" />
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">Virtual Card</span>
                  </div>
                  {primaryCard ? (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      primaryCard.status === 'Frozen'
                        ? 'bg-sky-400/10 border-sky-400/30 text-sky-300'
                        : 'bg-[#CAFF33]/10 border-[#CAFF33]/25 text-[#CAFF33]'
                    }`}>
                      {primaryCard.status === 'Frozen' && <Snowflake size={10} />}
                      {primaryCard.status}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] font-mono-figures px-2 py-0.5 rounded-full">
                      Instant Issue
                    </span>
                  )}
                </div>

                {primaryCard ? (
                  <>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      {hideBalance ? (
                        <p className="font-mono-figures font-semibold text-xl text-white">{maskedText}</p>
                      ) : (
                        <MonoAmount amount={primaryCard.balance} size="xl" direction="credit" />
                      )}
                      <span className="text-[11px] text-[#888] font-mono-figures">
                        {primaryCard.brand} •••• {String(primaryCard.cardNumber).slice(-4)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777] font-['Inter'] truncate">
                      {primaryCard.label} · {myCards.length} active {myCards.length === 1 ? 'card' : 'cards'}
                    </p>
                    <Link to="/cards" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                      Manage cards & top up <ChevronRight size={12} />
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-[#888] font-['Inter'] mb-3">
                      Create an instant Visa or Mastercard virtual debit card for secure online payments.
                    </p>
                    <Link
                      to="/cards"
                      className="flex items-center justify-center gap-2 py-2.5 bg-[#CAFF33] hover:bg-[#b8e820] rounded-xl text-[12px] text-[#111] font-bold font-['Poppins'] transition-colors"
                    >
                      Get Virtual Card
                    </Link>
                  </>
                )}
              </div>

              {/* Active loan card */}
              {activeLoan ? (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-3xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Landmark size={14} className="text-[#FF5555]" />
                      <span className="text-[12px] font-semibold text-white font-['Poppins']">Active Loan</span>
                    </div>
                    <StatusBadge status={activeLoan.status} size="sm" />
                  </div>
                  {hideBalance ? (
                    <p className="font-mono-figures font-semibold text-xl text-white">{maskedText}</p>
                  ) : (
                    <MonoAmount amount={activeLoan.remainingAmount} size="xl" direction="debit" />
                  )}
                  <p className="text-[10px] text-[#555] mt-1 font-['Inter']">
                    remaining of {hideBalance ? maskedText : <MonoAmount amount={activeLoan.amount} size="xs" />} at {activeLoan.interestRate}% APR
                  </p>
                  <div className="mt-3">
                    <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF5555] rounded-full transition-all"
                        style={{ width: `${Math.round((activeLoan.remainingAmount / activeLoan.amount) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#555] mt-1 font-mono-figures">
                      <span>{Math.round((1 - activeLoan.remainingAmount / activeLoan.amount) * 100)}% repaid</span>
                      <span>Next: {activeLoan.repaymentSchedule?.find((s) => s.status === 'Pending')?.dueDate || '—'}</span>
                    </div>
                  </div>
                  <Link to="/loans" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                    Manage loan <ChevronRight size={12} />
                  </Link>
                </div>
              ) : (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-3xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark size={14} className="text-[#666]" />
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">Loans</span>
                  </div>
                  <p className="text-[12px] text-[#666] font-['Inter'] mb-3">
                    No active loans. Apply for up to <MonoAmount amount={settings.maxLoanAmount || 50000} size="xs" direction="credit" />.
                  </p>
                  <Link to="/loans" className="flex items-center justify-center gap-2 py-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-xl text-[12px] text-[#CAFF33] font-semibold hover:bg-[#CAFF33]/20 transition-colors">
                    Apply Now
                  </Link>
                </div>
              )}

              {/* Savings card */}
              <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-3xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={14} className="text-[#CAFF33]" />
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">High-Yield Savings</span>
                  </div>
                  <span className="text-[10px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] font-mono-figures px-2 py-0.5 rounded-full">
                    {settings.savingsAPY}% APY
                  </span>
                </div>
                {hideBalance ? (
                  <p className="font-mono-figures font-semibold text-xl text-[#CAFF33]">{maskedText}</p>
                ) : (
                  <MonoAmount amount={balances.savings} size="xl" direction="credit" />
                )}
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#CAFF33] font-['Inter']">
                  <TrendingUp size={10} />
                  <span>
                    +{hideBalance ? maskedText : <MonoAmount amount={myMeta.accruedInterest} size="xs" direction="credit" />} accrued interest
                  </span>
                </div>
                <Link to="/savings" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                  Manage savings <ChevronRight size={12} />
                </Link>
              </div>

              {/* Notifications preview */}
              {myNotifs.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-3xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">Notifications</span>
                    <span className="text-[9px] bg-[#FF5555]/10 border border-[#FF5555]/20 text-[#FF5555] font-mono-figures px-2 py-0.5 rounded-full">
                      {myNotifs.length} new
                    </span>
                  </div>
                  <div className="space-y-2">
                    {myNotifs.slice(0, 3).map((n) => (
                      <div key={n.id} className="p-2.5 bg-[#CAFF33]/5 border border-[#CAFF33]/10 rounded-xl">
                        <p className="text-[11px] font-semibold text-white font-['Inter']">{n.title}</p>
                        <p className="text-[10px] text-[#666] mt-0.5 font-['Inter'] line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                  </div>
                  <Link to="/notifications" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                    See all <ChevronRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedTx && (
        <TxDetailModal
          tx={selectedTx}
          currentUserId={currentUser?.id}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}

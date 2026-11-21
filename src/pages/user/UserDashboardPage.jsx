import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Download, Landmark, PiggyBank, ArrowUpRight, ArrowDownLeft,
  Coins, ChevronRight, Bell, TrendingUp, Zap,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import StatusBadge from '../../components/user/StatusBadge';
import MonoAmount from '../../components/user/MonoAmount';
import TxDetailModal from '../../components/user/TxDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';

const QuickAction = ({ to, icon: Icon, label, sub, accent }) => (
  <Link
    to={to}
    className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:-translate-y-0.5 hover:shadow-lg group
      ${accent
        ? 'bg-[#CAFF33] border-[#CAFF33] hover:bg-[#b8e820] hover:border-[#b8e820] hover:shadow-[#CAFF33]/20'
        : 'bg-[#1A1A1A] border-[#222] hover:border-[#333] hover:shadow-black/40'
      }`}
  >
    <div className={`p-2.5 rounded-xl w-fit ${accent ? 'bg-[#111]/20' : 'bg-[#CAFF33]/10'}`}>
      <Icon size={18} className={accent ? 'text-[#111]' : 'text-[#CAFF33]'} />
    </div>
    <div>
      <p className={`text-[13px] font-semibold font-['Poppins'] ${accent ? 'text-[#111]' : 'text-white'}`}>{label}</p>
      <p className={`text-[11px] font-['Inter'] ${accent ? 'text-[#111]/70' : 'text-[#555]'}`}>{sub}</p>
    </div>
  </Link>
);

export default function UserDashboardPage() {
  const { currentUser } = useAuth();
  const { getUserBalances, getVisibleTransactions, notifications, loans, savingsMeta, lastFundedAt, settings } = useBanking();

  const balances = getUserBalances();
  const userTx = getVisibleTransactions();
  const myNotifs = notifications.filter((n) => n.userId === currentUser?.id && !n.read);
  const [selectedTx, setSelectedTx] = useState(null);
  const [highlight, setHighlight] = useState(false);
  const prevFundedRef = useRef(null);

  // Detect admin funding event → animate balance
  useEffect(() => {
    const funded = lastFundedAt[currentUser?.id];
    if (funded && funded !== prevFundedRef.current) {
      prevFundedRef.current = funded;
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 3000);
      return () => clearTimeout(t);
    }
  }, [lastFundedAt, currentUser?.id]);

  const activeLoan = loans.find((l) => l.userId === currentUser?.id && l.status === 'Active');
  const myMeta = savingsMeta[currentUser?.id] || { accruedInterest: 0, lastCreditedAt: '—' };

  const recentTx = userTx.slice(0, 5);

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-16 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Top header bar */}
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-white font-['Poppins']">
              Welcome back, <span className="text-[#CAFF33]">{currentUser?.name?.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-[11px] text-[#555] font-mono-figures mt-0.5">{currentUser?.accountNo}</p>
          </div>
          <Link to="/notifications" className="relative p-2 rounded-xl bg-[#1A1A1A] border border-[#222] hover:border-[#333] transition-colors">
            <Bell size={16} className="text-[#666]" />
            {myNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF5555] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {myNotifs.length > 9 ? '9+' : myNotifs.length}
              </span>
            )}
          </Link>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Wallet Balance Hero */}
          <div
            className={`relative rounded-2xl border p-6 overflow-hidden transition-all duration-700 ${
              highlight
                ? 'border-[#CAFF33] shadow-[0_0_40px_rgba(202,255,51,0.15)] bg-gradient-to-br from-[#CAFF33]/10 to-[#1A1A1A]'
                : 'border-[#1F1F1F] bg-gradient-to-br from-[#1A1A1A] to-[#141414]'
            }`}
          >
            {highlight && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#CAFF33]/20 border border-[#CAFF33]/40 rounded-full px-3 py-1">
                <Zap size={11} className="text-[#CAFF33]" />
                <span className="text-[10px] text-[#CAFF33] font-semibold font-mono-figures">Funds Added!</span>
              </div>
            )}
            {/* decorative dots */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#CAFF33]/5 rounded-full blur-2xl pointer-events-none" />

            <p className="text-[11px] text-[#555] uppercase tracking-widest font-['Inter'] mb-2">Total Checking Balance</p>
            <MonoAmount amount={balances.checking} size="4xl" direction="credit" />
            <div className="mt-4 flex items-center gap-6 text-[12px] font-['Inter']">
              <div>
                <p className="text-[#555]">Savings</p>
                <MonoAmount amount={balances.savings} size="sm" direction="credit" />
              </div>
              <div className="w-px h-8 bg-[#222]" />
              <div>
                <p className="text-[#555]">Active Loan</p>
                <MonoAmount amount={balances.loan} size="sm" direction={balances.loan > 0 ? 'debit' : 'neutral'} />
              </div>
              <div className="w-px h-8 bg-[#222]" />
              <div>
                <p className="text-[#555]">Net Worth</p>
                <MonoAmount amount={balances.netWorth} size="sm" direction={balances.netWorth >= 0 ? 'credit' : 'debit'} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickAction to="/transfers" icon={Send} label="Send Money" sub="Transfer funds" accent />
              <QuickAction to="/receive" icon={Download} label="Receive" sub="Your Finora ID" />
              <QuickAction to="/loans" icon={Landmark} label="Apply for Loan" sub="From 4.5% rate" />
              <QuickAction to="/savings" icon={PiggyBank} label="Add to Savings" sub={`Earn ${settings.savingsAPY}% APY`} />
            </div>
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Recent Transactions */}
            <div className="xl:col-span-2 bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F1F1F]">
                <div>
                  <h2 className="text-[14px] font-semibold text-white font-['Poppins']">Recent Transactions</h2>
                  <p className="text-[11px] text-[#444] font-['Inter']">Last {recentTx.length} activities</p>
                </div>
                <Link to="/statements" className="text-[11px] text-[#CAFF33] hover:underline font-['Inter'] flex items-center gap-1">
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              <div className="p-3 space-y-1">
                {recentTx.length === 0 ? (
                  <p className="text-[12px] text-[#444] text-center py-10 font-['Inter']">No transactions yet.</p>
                ) : (
                  recentTx.map((tx) => {
                    const isDebit = tx.senderId === currentUser?.id && tx.recipientId !== currentUser?.id;
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setSelectedTx(tx)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#222] transition-colors text-left group"
                      >
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
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
                          <p className="text-[10px] text-[#444] font-['Inter'] truncate">
                            {tx.timestamp} · {(tx.note === 'Admin credit' || tx.category === 'Admin Credit') ? 'Account Deposit' : (tx.note || tx.category)}
                          </p>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <MonoAmount
                            amount={tx.amount}
                            direction={isDebit ? 'debit' : 'credit'}
                            sign
                            size="sm"
                          />
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
              {/* Active loan card */}
              {activeLoan ? (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Landmark size={14} className="text-[#FF5555]" />
                      <span className="text-[12px] font-semibold text-white font-['Poppins']">Active Loan</span>
                    </div>
                    <StatusBadge status={activeLoan.status} size="sm" />
                  </div>
                  <MonoAmount amount={activeLoan.remainingAmount} size="xl" direction="debit" />
                  <p className="text-[10px] text-[#444] mt-1 font-['Inter']">remaining of <MonoAmount amount={activeLoan.amount} size="xs" /> at {activeLoan.interestRate}% APR</p>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF5555] rounded-full transition-all"
                        style={{ width: `${Math.round((activeLoan.remainingAmount / activeLoan.amount) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-[#444] mt-1 font-mono-figures">
                      <span>{Math.round((1 - activeLoan.remainingAmount / activeLoan.amount) * 100)}% repaid</span>
                      <span>Next: {activeLoan.repaymentSchedule?.find(s => s.status === 'Pending')?.dueDate || '—'}</span>
                    </div>
                  </div>
                  <Link to="/loans" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                    Manage loan <ChevronRight size={12} />
                  </Link>
                </div>
              ) : (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark size={14} className="text-[#666]" />
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">Loans</span>
                  </div>
                  <p className="text-[12px] text-[#444] font-['Inter'] mb-3">No active loans. Apply for up to <MonoAmount amount={50000} size="xs" direction="credit" />.</p>
                  <Link to="/loans" className="flex items-center justify-center gap-2 py-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-xl text-[12px] text-[#CAFF33] font-semibold hover:bg-[#CAFF33]/20 transition-colors">
                    Apply Now
                  </Link>
                </div>
              )}

              {/* Savings card */}
              <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={14} className="text-[#CAFF33]" />
                    <span className="text-[12px] font-semibold text-white font-['Poppins']">High-Yield Savings</span>
                  </div>
                  <span className="text-[10px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] font-mono-figures px-2 py-0.5 rounded-full">
                    {settings.savingsAPY}% APY
                  </span>
                </div>
                <MonoAmount amount={balances.savings} size="xl" direction="credit" />
                <div className="mt-2 flex items-center gap-1 text-[10px] text-[#CAFF33] font-['Inter']">
                  <TrendingUp size={10} />
                  <span>+<MonoAmount amount={myMeta.accruedInterest} size="xs" direction="credit" /> accrued interest</span>
                </div>
                <Link to="/savings" className="mt-3 flex items-center justify-between text-[11px] text-[#CAFF33] font-['Inter'] hover:underline">
                  Manage savings <ChevronRight size={12} />
                </Link>
              </div>

              {/* Notifications preview */}
              {myNotifs.length > 0 && (
                <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-5">
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
                        <p className="text-[10px] text-[#555] mt-0.5 font-['Inter'] line-clamp-2">{n.message}</p>
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

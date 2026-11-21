import React, { useState } from 'react';
import {
  ArrowUpRight, ArrowDownLeft, Coins, Landmark, PiggyBank,
  Search, Filter, ChevronDown,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import MonoAmount from '../../components/user/MonoAmount';
import StatusBadge from '../../components/user/StatusBadge';
import TxDetailModal from '../../components/user/TxDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';

const FILTERS = ['All', 'Sent', 'Received', 'Deposits', 'Loans', 'Savings'];

const TYPE_ICON = {
  transfer: { icon: ArrowUpRight, sentColor: 'text-[#FF5555]', receivedColor: 'text-[#CAFF33]', sentBg: 'bg-[#FF5555]/10 border-[#FF5555]/20', receivedBg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  deposit: { icon: Coins, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  withdraw: { icon: ArrowUpRight, color: 'text-[#FF5555]', bg: 'bg-[#FF5555]/10 border-[#FF5555]/20' },
  loan_disbursement: { icon: Landmark, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  loan_repayment: { icon: Landmark, color: 'text-[#FF5555]', bg: 'bg-[#FF5555]/10 border-[#FF5555]/20' },
};

function getTxMeta(tx, userId) {
  const isDebit = tx.senderId === userId && tx.recipientId !== userId;
  const icon = TYPE_ICON[tx.type] || TYPE_ICON.deposit;

  let iconClass, bgClass, Icon, label;

  if (tx.type === 'transfer') {
    Icon = isDebit ? ArrowUpRight : ArrowDownLeft;
    iconClass = isDebit ? icon.sentColor : icon.receivedColor;
    bgClass = isDebit ? icon.sentBg : icon.receivedBg;
    label = isDebit ? `To ${tx.recipientName}` : `From ${tx.senderName}`;
  } else if (tx.type === 'deposit') {
    Icon = Coins;
    iconClass = 'text-[#CAFF33]';
    bgClass = 'bg-[#CAFF33]/10 border-[#CAFF33]/20';
    label = tx.category === 'Admin Credit' ? 'Account Deposit' : (tx.category || 'Direct Credit');
  } else if (tx.type === 'loan_disbursement') {
    Icon = Landmark;
    iconClass = 'text-[#CAFF33]';
    bgClass = 'bg-[#CAFF33]/10 border-[#CAFF33]/20';
    label = 'Loan Disbursement';
  } else if (tx.type === 'loan_repayment') {
    Icon = Landmark;
    iconClass = 'text-[#FF5555]';
    bgClass = 'bg-[#FF5555]/10 border-[#FF5555]/20';
    label = 'Loan Repayment';
  } else if (tx.type === 'withdraw') {
    Icon = ArrowUpRight;
    iconClass = 'text-[#FF5555]';
    bgClass = 'bg-[#FF5555]/10 border-[#FF5555]/20';
    label = tx.category === 'Admin Credit' ? 'Account Credit' : tx.category;
  } else {
    Icon = PiggyBank;
    iconClass = isDebit ? 'text-[#FF5555]' : 'text-[#CAFF33]';
    bgClass = isDebit ? 'bg-[#FF5555]/10 border-[#FF5555]/20' : 'bg-[#CAFF33]/10 border-[#CAFF33]/20';
    label = tx.category === 'Admin Credit' ? 'Account Deposit' : tx.category;
  }

  const direction = isDebit || tx.type === 'loan_repayment' || tx.type === 'withdraw' ? 'debit' : 'credit';

  return { Icon, iconClass, bgClass, label, isDebit, direction };
}

function filterTx(tx, activeFilter, userId) {
  switch (activeFilter) {
    case 'Sent': return tx.type === 'transfer' && tx.senderId === userId;
    case 'Received': return tx.type === 'transfer' && tx.recipientId === userId && tx.senderId !== userId;
    case 'Deposits': return tx.type === 'deposit';
    case 'Loans': return tx.type === 'loan_disbursement' || tx.type === 'loan_repayment';
    case 'Savings': return tx.category === 'Savings Deposit' || tx.category === 'Savings Withdrawal';
    default: return true;
  }
}

export default function UserStatementsPage() {
  const { currentUser } = useAuth();
  const { getVisibleTransactions } = useBanking();

  const allTx = getVisibleTransactions();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [showCount, setShowCount] = useState(20);

  const filtered = allTx
    .filter((tx) => filterTx(tx, filter, currentUser?.id))
    .filter((tx) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        tx.id?.toLowerCase().includes(q) ||
        tx.senderName?.toLowerCase().includes(q) ||
        tx.recipientName?.toLowerCase().includes(q) ||
        tx.note?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q)
      );
    });

  const totalCredit = filtered.reduce((sum, tx) => {
    const { direction } = getTxMeta(tx, currentUser?.id);
    return direction === 'credit' ? sum + tx.amount : sum;
  }, 0);
  const totalDebit = filtered.reduce((sum, tx) => {
    const { direction } = getTxMeta(tx, currentUser?.id);
    return direction === 'debit' ? sum + tx.amount : sum;
  }, 0);

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-16 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-8 py-4">
          <h1 className="text-[18px] font-bold text-white font-['Poppins']">Account Statements</h1>
          <p className="text-[11px] text-[#444] font-['Inter']">{allTx.length} total transactions</p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Summary strip — 2-col on mobile (Net spans full width), 3-col on md+ */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl p-3 md:p-4">
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#444] font-['Inter'] mb-1">Total In</p>
              <MonoAmount amount={totalCredit} direction="credit" size="sm" className="md:!text-lg" />
            </div>
            <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl p-3 md:p-4">
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#444] font-['Inter'] mb-1">Total Out</p>
              <MonoAmount amount={totalDebit} direction="debit" size="sm" className="md:!text-lg" />
            </div>
            <div className="col-span-2 md:col-span-1 bg-[#1A1A1A] border border-[#1F1F1F] rounded-xl p-3 md:p-4">
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#444] font-['Inter'] mb-1">Net</p>
              <MonoAmount amount={totalCredit - totalDebit} direction={totalCredit >= totalDebit ? 'credit' : 'debit'} size="sm" className="md:!text-lg" />
            </div>
          </div>

          {/* Filters + Search */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, note, or TX ID…"
                className="w-full bg-[#1A1A1A] border border-[#222] focus:border-[#CAFF33] rounded-full pl-10 pr-4 py-2.5 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-full text-[11px] font-medium border transition-all font-['Inter'] ${
                    filter === f
                      ? 'bg-[#CAFF33] border-[#CAFF33] text-[#111] font-bold'
                      : 'border-[#222] text-[#555] hover:border-[#333] hover:text-white'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions table */}
          <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 border-b border-[#1F1F1F] text-[10px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold">
              <span>Type</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Status</span>
            </div>

            <div>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-[#444]">
                  <Filter size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-[13px] font-['Inter']">No transactions match your filter.</p>
                </div>
              ) : (
                filtered.slice(0, showCount).map((tx) => {
                  const { Icon, iconClass, bgClass, label, direction } = getTxMeta(tx, currentUser?.id);
                  const displayNote = tx.note === 'Admin credit' || tx.category === 'Admin Credit'
                    ? 'Account Deposit'
                    : (tx.note || tx.category);

                  return (
                    <button
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="w-full grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-[#1A1A1A] hover:bg-[#1F1F1F] transition-colors text-left group"
                    >
                      <div className={`p-2 rounded-lg border shrink-0 ${bgClass}`}>
                        <Icon size={13} className={iconClass} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-white font-['Inter'] truncate group-hover:text-[#CAFF33] transition-colors">{label}</p>
                        <p className="text-[10px] text-[#444] font-['Inter'] truncate">{tx.timestamp} · {displayNote}</p>
                        <p className="text-[9px] text-[#333] font-mono-figures mt-0.5">{tx.id}</p>
                      </div>
                      <MonoAmount amount={tx.amount} direction={direction} sign size="sm" />
                      <StatusBadge status={tx.status} size="sm" />
                    </button>
                  );
                })
              )}
            </div>

            {filtered.length > showCount && (
              <button
                onClick={() => setShowCount((c) => c + 20)}
                className="w-full flex items-center justify-center gap-2 py-4 text-[12px] text-[#555] hover:text-[#CAFF33] transition-colors border-t border-[#1F1F1F] font-['Inter']"
              >
                <ChevronDown size={14} /> Load More ({filtered.length - showCount} remaining)
              </button>
            )}
          </div>
        </div>
      </main>

      {selectedTx && (
        <TxDetailModal tx={selectedTx} currentUserId={currentUser?.id} onClose={() => setSelectedTx(null)} />
      )}
    </div>
  );
}

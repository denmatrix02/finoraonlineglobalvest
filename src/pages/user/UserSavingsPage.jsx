import React, { useState } from 'react';
import { PiggyBank, TrendingUp, ArrowDownLeft, ArrowUpRight, Zap } from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import MonoAmount from '../../components/user/MonoAmount';
import StatusBadge from '../../components/user/StatusBadge';
import TxDetailModal from '../../components/user/TxDetailModal';
import ErrorModal from '../../components/user/ErrorModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';

export default function UserSavingsPage() {
  const { currentUser } = useAuth();
  const { getUserBalances, settings, manageSavingsDeposit, simulateInterestAccrual, savingsMeta, getVisibleTransactions } = useBanking();

  const balances = getUserBalances();
  const meta = savingsMeta[currentUser?.id] || { accruedInterest: 0, lastCreditedAt: '—' };

  const [tab, setTab] = useState('deposit'); // 'deposit' | 'withdraw'
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const savingsTx = getVisibleTransactions().filter(
    (tx) => tx.category === 'Savings Deposit' || tx.category === 'Savings Withdrawal'
  );

  const handleAction = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await manageSavingsDeposit({ action: tab, amount });
      const amt = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
      setSuccess(`$${amt} successfully ${tab === 'deposit' ? 'deposited into' : 'withdrawn from'} savings.`);
      setAmount('');
    } catch (err) {
      setError(err.message || 'Operation failed.');
    }
  };

  const handleSimulateInterest = () => {
    simulateInterestAccrual();
    setSuccess('Interest accrued and credited to all savings accounts!');
  };

  // Monthly interest preview
  const monthlyInterest = (balances.savings * ((settings.savingsAPY || 5.2) / 100)) / 12;
  const yearlyInterest = balances.savings * ((settings.savingsAPY || 5.2) / 100);

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-16 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-8 py-4">
          <h1 className="text-[18px] font-bold text-white font-['Poppins']">High-Yield Savings</h1>
          <p className="text-[11px] text-[#444] font-['Inter']">
            Earning <span className="text-[#CAFF33] font-semibold font-mono-figures">{settings.savingsAPY}% APY</span>
            · Paid {settings.savingsPayoutFrequency || 'Monthly'}
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Balance Hero */}
          <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#CAFF33]/20 rounded-2xl p-6 overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#CAFF33]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#555] font-['Inter'] mb-2">Savings Balance</p>
                <MonoAmount amount={balances.savings} size="4xl" direction="credit" />
              </div>
              <span className="px-3 py-1.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-full text-[#CAFF33] font-mono-figures text-[12px] font-bold">
                {settings.savingsAPY}% APY
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#CAFF33]/10">
              <Stat label="Accrued Interest" value={<MonoAmount amount={meta.accruedInterest} size="sm" direction="credit" />} />
              <Stat label="Est. Monthly" value={<MonoAmount amount={monthlyInterest} size="sm" direction="credit" />} />
              <Stat label="Est. Yearly" value={<MonoAmount amount={yearlyInterest} size="sm" direction="credit" />} />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Deposit / Withdraw form */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl p-6 space-y-5">
              <h2 className="text-[15px] font-semibold text-white font-['Poppins']">Manage Savings</h2>

              {/* Tab toggle */}
              <div className="flex bg-[#141414] border border-[#222] rounded-full p-1 gap-1">
                {['deposit', 'withdraw'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setAmount(''); setError(''); setSuccess(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-semibold transition-all font-['Poppins'] ${
                      tab === t
                        ? 'bg-[#CAFF33] text-[#111]'
                        : 'text-[#555] hover:text-white'
                    }`}
                  >
                    {t === 'deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-[#444] font-['Inter']">
                {tab === 'deposit'
                  ? `Available in checking: `
                  : `Available in savings: `}
                <MonoAmount amount={tab === 'deposit' ? balances.checking : balances.savings} size="xs" direction="credit" />
              </p>

              <form onSubmit={handleAction} className="space-y-4">
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] font-bold font-mono-figures text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(''); }}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                    className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-full pl-10 pr-5 py-4 text-[20px] text-white font-mono-figures placeholder:text-[#333] outline-none transition-colors text-center"
                  />
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 flex-wrap">
                  {[100, 250, 500, 1000, 2500].map((v) => (
                    <button key={v} type="button" onClick={() => setAmount(String(v))}
                      className="px-3 py-1.5 rounded-full border border-[#2A2A2A] text-[11px] text-[#555] hover:border-[#CAFF33] hover:text-[#CAFF33] transition-colors font-mono-figures">
                      ${v.toLocaleString()}
                    </button>
                  ))}
                </div>

                {error && <p className="text-[12px] text-[#FF5555] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-xl px-4 py-2.5 font-['Inter']">{error}</p>}
                {success && <p className="text-[12px] text-[#CAFF33] bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-xl px-4 py-2.5 font-['Inter']">{success}</p>}

                <button type="submit"
                  className="w-full py-3.5 rounded-full bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors">
                  {tab === 'deposit' ? 'Deposit to Savings' : 'Withdraw to Checking'}
                </button>
              </form>

              {/* Simulate interest button (demo) */}
              <button
                onClick={handleSimulateInterest}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#CAFF33]/20 rounded-full text-[12px] text-[#CAFF33] hover:bg-[#CAFF33]/5 transition-colors font-['Inter']"
              >
                <Zap size={13} />
                Simulate Interest Credit (Demo)
              </button>
            </div>

            {/* Savings history */}
            <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl">
              <div className="px-5 py-4 border-b border-[#1F1F1F]">
                <h2 className="text-[14px] font-semibold text-white font-['Poppins']">Savings History</h2>
                <p className="text-[11px] text-[#444] font-['Inter']">{savingsTx.length} transactions</p>
              </div>
              <div className="p-3 space-y-1 max-h-96 overflow-y-auto">
                {savingsTx.length === 0 ? (
                  <p className="text-[12px] text-[#444] text-center py-10 font-['Inter']">No savings transactions yet.</p>
                ) : (
                  savingsTx.map((tx) => {
                    const isDeposit = tx.category === 'Savings Deposit';
                    return (
                      <button key={tx.id} onClick={() => setSelectedTx(tx)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#222] transition-colors text-left">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${
                          isDeposit ? 'bg-[#CAFF33]/10 border-[#CAFF33]/20 text-[#CAFF33]' : 'bg-[#FF5555]/10 border-[#FF5555]/20 text-[#FF5555]'
                        }`}>
                          {isDeposit ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-white font-['Inter'] truncate">{tx.category}</p>
                          <p className="text-[10px] text-[#444] font-['Inter']">{tx.timestamp}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <MonoAmount amount={tx.amount} direction={isDeposit ? 'credit' : 'debit'} sign size="sm" />
                          <div className="flex justify-end mt-1">
                            <StatusBadge status={tx.status} size="sm" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Interest info card */}
          <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} className="text-[#CAFF33]" />
              <h3 className="text-[13px] font-semibold text-white font-['Poppins']">How Your Interest Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px] font-['Inter']">
              <div className="p-3 bg-[#141414] rounded-xl">
                <p className="text-[#555] mb-1">Annual Percentage Yield</p>
                <p className="text-[#CAFF33] font-bold font-mono-figures text-[16px]">{settings.savingsAPY}%</p>
              </div>
              <div className="p-3 bg-[#141414] rounded-xl">
                <p className="text-[#555] mb-1">Payout Frequency</p>
                <p className="text-white font-semibold">{settings.savingsPayoutFrequency || 'Monthly'}</p>
              </div>
              <div className="p-3 bg-[#141414] rounded-xl">
                <p className="text-[#555] mb-1">Last Interest Credit</p>
                <p className="text-white font-semibold font-mono-figures">{meta.lastCreditedAt}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {selectedTx && <TxDetailModal tx={selectedTx} currentUserId={currentUser?.id} onClose={() => setSelectedTx(null)} />}
      <ErrorModal title="Savings Action Failed" message={error} onClose={() => setError('')} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-widest text-[#444] font-['Inter'] mb-1">{label}</p>
      {value}
    </div>
  );
}

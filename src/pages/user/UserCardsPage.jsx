import { useState } from 'react';
import {
  CreditCard, Plus, Eye, EyeOff, Copy, Check, RotateCw, Snowflake,
  ArrowUpRight, ArrowDownLeft, ShoppingBag, ShieldCheck, Globe,
  Sliders, Trash2, X, AlertCircle, Sparkles, Lock,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import VirtualCardVisual from '../../components/user/VirtualCardVisual';
import MonoAmount from '../../components/user/MonoAmount';
import StatusBadge from '../../components/user/StatusBadge';
import TxDetailModal from '../../components/user/TxDetailModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { CARD_THEMES } from '../../utils/virtualCardUtils';

const QUICK_MERCHANTS = [
  { name: 'Apple Store', amount: '19.99' },
  { name: 'Netflix', amount: '15.99' },
  { name: 'Amazon Prime', amount: '49.50' },
  { name: 'Uber Rides', amount: '24.00' },
];

export default function UserCardsPage() {
  const { currentUser } = useAuth();
  const {
    virtualCards,
    getUserBalances,
    getVisibleTransactions,
    issueVirtualCard,
    fundVirtualCard,
    unloadVirtualCard,
    toggleFreezeVirtualCard,
    updateVirtualCardControls,
    chargeVirtualCard,
    terminateVirtualCard,
  } = useBanking();

  const balances = getUserBalances();
  const myCards = virtualCards.filter(
    (c) => c.userId === currentUser?.id && c.status !== 'Terminated'
  );

  const [selectedCardId, setSelectedCardId] = useState(myCards[0]?.id || null);
  const activeCard = myCards.find((c) => c.id === selectedCardId) || myCards[0] || null;

  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [copiedPan, setCopiedPan] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueLabel, setIssueLabel] = useState('Online Shopping');
  const [issueBrand, setIssueBrand] = useState('VISA');
  const [issueTheme, setIssueTheme] = useState('obsidian');
  const [issueFund, setIssueFund] = useState('');
  const [issueLimit, setIssueLimit] = useState('5000');
  const [issueError, setIssueError] = useState('');

  // Fund / Unload Modal ('fund' | 'unload' | null)
  const [walletModal, setWalletModal] = useState(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletError, setWalletError] = useState('');

  // Spend Limit Edit
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [controlError, setControlError] = useState('');

  // Simulate Purchase Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMerchant, setPayMerchant] = useState('Amazon Prime');
  const [payAmount, setPayAmount] = useState('');
  const [payIntl, setPayIntl] = useState(false);
  const [payError, setPayError] = useState('');

  // Close Card Confirmation
  const [confirmClose, setConfirmClose] = useState(false);

  const cardTransactions = getVisibleTransactions()
    .filter((tx) =>
      ['Card Top-Up', 'Card Unload', 'Card Payment', 'Card Refund'].includes(tx.category)
    )
    .slice(0, 8);

  const handleCopyPan = () => {
    if (!activeCard?.cardNumber) return;
    navigator.clipboard?.writeText(activeCard.cardNumber).catch(() => {});
    setCopiedPan(true);
    setTimeout(() => setCopiedPan(false), 1800);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueError('');
    try {
      const created = await issueVirtualCard({
        label: issueLabel,
        brand: issueBrand,
        theme: issueTheme,
        initialFund: issueFund || 0,
        spendingLimit: issueLimit || 5000,
      });
      setSelectedCardId(created.id);
      setRevealed(false);
      setFlipped(false);
      setIssueFund('');
      setShowIssueModal(false);
    } catch (err) {
      setIssueError(err.message || 'Could not issue card.');
    }
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    setWalletError('');
    if (!activeCard) return;
    try {
      if (walletModal === 'fund') {
        await fundVirtualCard(activeCard.id, walletAmount);
      } else {
        await unloadVirtualCard(activeCard.id, walletAmount);
      }
      setWalletAmount('');
      setWalletModal(null);
    } catch (err) {
      setWalletError(err.message || 'Action failed.');
    }
  };

  const handleSaveLimit = async (e) => {
    e.preventDefault();
    setControlError('');
    if (!activeCard) return;
    try {
      await updateVirtualCardControls(activeCard.id, { spendingLimit: limitInput });
      setEditingLimit(false);
    } catch (err) {
      setControlError(err.message || 'Invalid limit.');
    }
  };

  const handleSimulatePay = async (e) => {
    e.preventDefault();
    setPayError('');
    if (!activeCard) return;
    try {
      await chargeVirtualCard(activeCard.id, {
        merchant: payMerchant,
        amount: payAmount,
        isInternational: payIntl,
      });
      setPayAmount('');
      setShowPayModal(false);
    } catch (err) {
      setPayError(err.message || 'Payment declined.');
    }
  };

  const handleConfirmTerminate = async () => {
    if (!activeCard) return;
    await terminateVirtualCard(activeCard.id);
    setConfirmClose(false);
  };

  const spendPct = activeCard
    ? Math.min(100, Math.round((activeCard.spentThisMonth / Math.max(1, activeCard.spendingLimit)) * 100))
    : 0;

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[17px] sm:text-[18px] font-bold text-white font-['Poppins'] flex items-center gap-2">
              Virtual Cards
              <span className="text-[10px] font-mono-figures px-2 py-0.5 rounded-[1.5px] bg-[#1C1C1C] border border-[#2A2A2A] text-[#CAFF33]">
                {myCards.length}/5
              </span>
            </h1>
            <p className="text-[11px] text-[#555] font-['Inter'] truncate">
              Instant virtual Visa & Mastercard debit cards with live spend controls
            </p>
          </div>
          {myCards.length < 5 && (
            <button
              type="button"
              onClick={() => {
                setIssueError('');
                setShowIssueModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[12px] sm:text-[13px] font-bold font-['Poppins'] transition-colors shrink-0"
            >
              <Plus size={15} /> Issue Card
            </button>
          )}
        </div>

        <div className="px-4 sm:px-8 py-5 sm:py-6 space-y-6">
          {/* Card Switcher Pills */}
          {myCards.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {myCards.map((c) => {
                const isSelected = activeCard?.id === c.id;
                const last4 = String(c.cardNumber).slice(-4);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCardId(c.id);
                      setFlipped(false);
                      setConfirmClose(false);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-[2px] border text-[12px] font-medium whitespace-nowrap transition-all shrink-0 ${
                      isSelected
                        ? 'bg-[#CAFF33]/15 border-[#CAFF33]/50 text-[#CAFF33] font-semibold'
                        : 'bg-[#171717] border-[#242424] text-[#888] hover:text-white'
                    }`}
                  >
                    <CreditCard size={13} />
                    <span>{c.label}</span>
                    <span className="font-mono-figures text-[11px] opacity-80">•••• {last4}</span>
                    {c.status === 'Frozen' && (
                      <Snowflake size={11} className="text-sky-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State if no cards yet */}
          {!activeCard ? (
            <div className="bg-gradient-to-br from-[#192614] via-[#151814] to-[#111] border border-[#CAFF33]/25 rounded-[2px] p-6 sm:p-10 text-center max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-[2px] bg-[#CAFF33]/15 border border-[#CAFF33]/30 flex items-center justify-center mx-auto mb-4 text-[#CAFF33]">
                <CreditCard size={26} />
              </div>
              <h2 className="text-[20px] sm:text-[22px] font-bold text-white font-['Poppins'] mb-2">
                Get Your Finora Virtual Card
              </h2>
              <p className="text-[13px] text-[#94A18B] font-['Inter'] max-w-md mx-auto mb-6">
                Create an instant virtual Visa or Mastercard funded directly from your Checking account
                (${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })} available).
                Freeze anytime, set monthly caps, and shop securely worldwide.
              </p>
              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors shadow-[0_10px_30px_rgba(202,255,51,0.2)]"
              >
                <Sparkles size={16} /> Issue Virtual Card Now
              </button>
            </div>
          ) : (
            /* Main 2-Column Workspace */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT: Card Visual + Quick Controls + Card Wallet */}
              <div className="xl:col-span-5 space-y-5">
                <VirtualCardVisual
                  card={activeCard}
                  revealed={revealed}
                  flipped={flipped}
                  onToggleFlip={() => setFlipped((f) => !f)}
                />

                {/* Quick Action Bar directly under card */}
                <div className="grid grid-cols-4 gap-2 max-w-[400px] mx-auto">
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => !r)}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-[2px] bg-[#1A1A1A] border border-[#242424] hover:border-[#CAFF33]/40 text-[#CCC] hover:text-white transition-all"
                  >
                    {revealed ? <EyeOff size={16} className="text-[#CAFF33]" /> : <Eye size={16} />}
                    <span className="text-[10px] font-medium font-['Inter']">
                      {revealed ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPan}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-[2px] bg-[#1A1A1A] border border-[#242424] hover:border-[#CAFF33]/40 text-[#CCC] hover:text-white transition-all"
                  >
                    {copiedPan ? <Check size={16} className="text-[#CAFF33]" /> : <Copy size={16} />}
                    <span className="text-[10px] font-medium font-['Inter']">
                      {copiedPan ? 'Copied' : 'Copy No.'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipped((f) => !f)}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-[2px] bg-[#1A1A1A] border border-[#242424] hover:border-[#CAFF33]/40 text-[#CCC] hover:text-white transition-all"
                  >
                    <RotateCw size={16} className={flipped ? 'text-[#CAFF33]' : ''} />
                    <span className="text-[10px] font-medium font-['Inter']">
                      {flipped ? 'Front' : 'CVV'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFreezeVirtualCard(activeCard.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-[2px] border transition-all ${
                      activeCard.status === 'Frozen'
                        ? 'bg-sky-500/15 border-sky-400/40 text-sky-300'
                        : 'bg-[#1A1A1A] border-[#242424] hover:border-sky-400/40 text-[#CCC] hover:text-sky-300'
                    }`}
                  >
                    <Snowflake size={16} />
                    <span className="text-[10px] font-medium font-['Inter']">
                      {activeCard.status === 'Frozen' ? 'Unfreeze' : 'Freeze'}
                    </span>
                  </button>
                </div>

                {/* Card Wallet Balance & Spend Progress */}
                <div className="bg-[#181818] border border-[#222] rounded-[2px] p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[#666] font-['Inter'] mb-1">
                        Card Balance
                      </p>
                      <MonoAmount amount={activeCard.balance} size="3xl" direction="credit" />
                      <p className="text-[11px] text-[#555] font-['Inter'] mt-1">
                        Checking Available:{' '}
                        <span className="text-[#AAA] font-mono-figures">
                          ${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                    </div>
                    <StatusBadge status={activeCard.status === 'Frozen' ? 'Pending' : 'Active'} />
                  </div>

                  {/* Card Wallet Primary Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWalletError('');
                        setWalletAmount('');
                        setWalletModal('fund');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[12px] font-bold font-['Poppins'] transition-colors"
                    >
                      <ArrowDownLeft size={14} /> Top Up
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setWalletError('');
                        setWalletAmount('');
                        setWalletModal('unload');
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-[2px] bg-[#222] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-white text-[12px] font-semibold font-['Poppins'] transition-colors"
                    >
                      <ArrowUpRight size={14} /> Withdraw
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPayError('');
                        setPayAmount('');
                        setShowPayModal(true);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-[2px] bg-[#CAFF33]/10 hover:bg-[#CAFF33]/20 border border-[#CAFF33]/30 text-[#CAFF33] text-[12px] font-semibold font-['Poppins'] transition-colors"
                    >
                      <ShoppingBag size={14} /> Pay Test
                    </button>
                  </div>

                  {/* Monthly Spend Limit Meter */}
                  <div className="pt-3 border-t border-[#222] space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-['Inter']">
                      <span className="text-[#777]">Monthly Spend Limit</span>
                      <button
                        type="button"
                        onClick={() => {
                          setLimitInput(String(activeCard.spendingLimit));
                          setControlError('');
                          setEditingLimit((v) => !v);
                        }}
                        className="text-[#CAFF33] hover:underline font-medium"
                      >
                        {editingLimit ? 'Cancel' : 'Edit Limit'}
                      </button>
                    </div>

                    {editingLimit ? (
                      <form onSubmit={handleSaveLimit} className="flex items-center gap-2">
                        <input
                          type="number"
                          min="50"
                          step="10"
                          value={limitInput}
                          onChange={(e) => setLimitInput(e.target.value)}
                          className="flex-1 bg-[#111] border border-[#2E2E2E] focus:border-[#CAFF33] rounded-[2px] px-3 py-2 text-[13px] font-mono-figures text-white outline-none"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-[2px] bg-[#CAFF33] text-[#111] text-[12px] font-bold font-['Poppins']"
                        >
                          Save
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="h-2 bg-[#252525] rounded-[1.5px] overflow-hidden">
                          <div
                            className={`h-full rounded-[2px] transition-all duration-500 ${
                              spendPct >= 90 ? 'bg-[#FF5555]' : 'bg-[#CAFF33]'
                            }`}
                            style={{ width: `${spendPct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono-figures text-[#888]">
                          <span>
                            Spent: <strong className="text-white">${activeCard.spentThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                          </span>
                          <span>
                            Cap: <strong className="text-white">${activeCard.spendingLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                          </span>
                        </div>
                      </>
                    )}
                    {controlError && <p className="text-[11px] text-[#FF5555]">{controlError}</p>}
                  </div>
                </div>
              </div>

              {/* RIGHT: Security Controls + Card Transactions */}
              <div className="xl:col-span-7 space-y-5">
                {/* Security & Payment Controls */}
                <div className="bg-[#181818] border border-[#222] rounded-[2px] p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sliders size={15} className="text-[#CAFF33]" />
                      <h2 className="text-[14px] font-semibold text-white font-['Poppins']">
                        Security & Card Controls
                      </h2>
                    </div>
                    <span className="text-[10px] text-[#666] font-mono-figures">
                      {activeCard.brand} •••• {String(activeCard.cardNumber).slice(-4)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <ControlToggle
                      icon={Snowflake}
                      title="Freeze Virtual Card"
                      desc="Temporarily block all new purchases and authorizations"
                      enabled={activeCard.status === 'Frozen'}
                      accentColor="sky"
                      onToggle={() => toggleFreezeVirtualCard(activeCard.id)}
                    />
                    <ControlToggle
                      icon={Lock}
                      title="Online & E-Commerce Payments"
                      desc="Allow internet checkouts, subscriptions, and digital wallets"
                      enabled={activeCard.onlinePayments}
                      onToggle={() =>
                        updateVirtualCardControls(activeCard.id, {
                          onlinePayments: !activeCard.onlinePayments,
                        })
                      }
                    />
                    <ControlToggle
                      icon={Globe}
                      title="International / Multi-Currency"
                      desc="Enable cross-border USD & FX merchant authorizations"
                      enabled={activeCard.internationalPayments}
                      onToggle={() =>
                        updateVirtualCardControls(activeCard.id, {
                          internationalPayments: !activeCard.internationalPayments,
                        })
                      }
                    />
                  </div>

                  {/* Theme & Danger Zone */}
                  <div className="pt-3 border-t border-[#222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#666] font-['Inter']">Card Finish:</span>
                      {Object.values(CARD_THEMES).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateVirtualCardControls(activeCard.id, { theme: t.id })}
                          className={`px-2.5 py-1 rounded-[1.5px] text-[10px] font-medium border transition-all ${
                            activeCard.theme === t.id
                              ? 'bg-[#CAFF33]/15 border-[#CAFF33]/40 text-[#CAFF33]'
                              : 'bg-[#141414] border-[#262626] text-[#777] hover:text-white'
                          }`}
                        >
                          {t.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    {confirmClose ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmClose(false)}
                          className="px-3 py-1.5 rounded-[2px] bg-[#222] text-[11px] text-[#BBB]"
                        >
                          Keep Card
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmTerminate}
                          className="px-3 py-1.5 rounded-[2px] bg-[#FF5555] text-white text-[11px] font-semibold"
                        >
                          Confirm Close
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmClose(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] text-[#FF5555]/80 hover:text-[#FF5555] transition-colors self-start sm:self-auto"
                      >
                        <Trash2 size={13} /> Terminate Card
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Activity Feed */}
                <div className="bg-[#181818] border border-[#222] rounded-[2px] overflow-hidden">
                  <div className="px-4 sm:px-5 py-4 border-b border-[#222] flex items-center justify-between">
                    <div>
                      <h2 className="text-[14px] font-semibold text-white font-['Poppins']">
                        Virtual Card Activity
                      </h2>
                      <p className="text-[11px] text-[#555] font-['Inter']">
                        Top-ups, withdrawals, and merchant charges
                      </p>
                    </div>
                    <ShieldCheck size={16} className="text-[#CAFF33]" />
                  </div>

                  <div className="p-2.5 sm:p-3 space-y-1">
                    {cardTransactions.length === 0 ? (
                      <p className="text-[12px] text-[#555] text-center py-10 font-['Inter']">
                        No card transactions yet. Top up your card or run a merchant Pay Test to see live activity.
                      </p>
                    ) : (
                      cardTransactions.map((tx) => {
                        const isCredit = tx.type === 'deposit';
                        return (
                          <button
                            key={tx.id}
                            type="button"
                            onClick={() => setSelectedTx(tx)}
                            className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-[2px] hover:bg-[#222] transition-colors text-left"
                          >
                            <div
                              className={`p-2 rounded-[2px] border shrink-0 ${
                                isCredit
                                  ? 'bg-[#CAFF33]/10 border-[#CAFF33]/20 text-[#CAFF33]'
                                  : 'bg-[#FF5555]/10 border-[#FF5555]/20 text-[#FF5555]'
                              }`}
                            >
                              {isCredit ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-white font-['Inter'] truncate">
                                {isCredit ? tx.senderName : tx.recipientName}
                              </p>
                              <p className="text-[10px] text-[#555] font-['Inter'] truncate">
                                {tx.timestamp} · {tx.category}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <MonoAmount
                                amount={tx.amount}
                                direction={isCredit ? 'credit' : 'debit'}
                                sign
                                size="sm"
                              />
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══ MODAL: Issue New Virtual Card ═══════════════════════════════════ */}
      {showIssueModal && (
        <ModalShell title="Issue Virtual Debit Card" onClose={() => setShowIssueModal(false)}>
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            {issueError && <ModalError message={issueError} />}

            <div>
              <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Card Label / Nickname</label>
              <input
                type="text"
                value={issueLabel}
                onChange={(e) => setIssueLabel(e.target.value)}
                placeholder="e.g. Online Shopping, Travel, SaaS"
                maxLength={28}
                required
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-4 py-3 text-[13px] text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Network</label>
                <div className="grid grid-cols-2 gap-2">
                  {['VISA', 'MASTERCARD'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setIssueBrand(b)}
                      className={`py-2.5 rounded-[2px] border text-[11px] font-bold transition-all ${
                        issueBrand === b
                          ? 'bg-[#CAFF33]/15 border-[#CAFF33] text-[#CAFF33]'
                          : 'bg-[#141414] border-[#262626] text-[#888]'
                      }`}
                    >
                      {b === 'MASTERCARD' ? 'Mastercard' : 'VISA'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Monthly Limit ($)</label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={issueLimit}
                  onChange={(e) => setIssueLimit(e.target.value)}
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-3.5 py-2.5 text-[13px] font-mono-figures text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Card Finish</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(CARD_THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setIssueTheme(t.id)}
                    className={`py-2 px-2 rounded-[2px] border text-[11px] font-medium transition-all ${
                      issueTheme === t.id
                        ? 'bg-[#CAFF33]/15 border-[#CAFF33] text-[#CAFF33]'
                        : 'bg-[#141414] border-[#262626] text-[#888]'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <label className="text-[#777] font-['Inter']">Initial Funding from Checking (Optional)</label>
                <span className="text-[#AAA] font-mono-figures">
                  Avail: ${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={issueFund}
                onChange={(e) => setIssueFund(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-4 py-3 text-[14px] font-mono-figures text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors"
            >
              Generate Virtual Card
            </button>
          </form>
        </ModalShell>
      )}

      {/* ══ MODAL: Fund / Unload Card Wallet ════════════════════════════════ */}
      {walletModal && activeCard && (
        <ModalShell
          title={walletModal === 'fund' ? 'Top Up Virtual Card' : 'Withdraw Card Balance'}
          onClose={() => setWalletModal(null)}
        >
          <form onSubmit={handleWalletSubmit} className="space-y-4">
            {walletError && <ModalError message={walletError} />}

            <p className="text-[12px] text-[#777] font-['Inter']">
              {walletModal === 'fund'
                ? `Move funds from Checking ($${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}) to •••• ${String(activeCard.cardNumber).slice(-4)}.`
                : `Return funds from •••• ${String(activeCard.cardNumber).slice(-4)} ($${activeCard.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}) back to Checking.`}
            </p>

            <div className="grid grid-cols-4 gap-2">
              {['50', '100', '250', '500'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setWalletAmount(amt)}
                  className="py-2 rounded-[2px] bg-[#141414] border border-[#262626] hover:border-[#CAFF33]/50 text-[12px] font-mono-figures text-[#CCC]"
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CAFF33] text-lg font-bold font-mono-figures">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] pl-9 pr-4 py-3.5 text-[18px] font-mono-figures text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors"
            >
              {walletModal === 'fund' ? 'Confirm Top Up' : 'Withdraw to Checking'}
            </button>
          </form>
        </ModalShell>
      )}

      {/* ══ MODAL: Simulate Real-Case Merchant Checkout ═════════════════════ */}
      {showPayModal && activeCard && (
        <ModalShell title="Simulate Virtual Card Checkout" onClose={() => setShowPayModal(false)}>
          <form onSubmit={handleSimulatePay} className="space-y-4">
            {payError && <ModalError message={payError} />}

            <p className="text-[12px] text-[#777] font-['Inter']">
              Test real-time card authorization rules (freeze block, online toggle, monthly spend cap, and card wallet balance) with •••• {String(activeCard.cardNumber).slice(-4)}.
            </p>

            <div className="flex flex-wrap gap-2">
              {QUICK_MERCHANTS.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setPayMerchant(m.name);
                    setPayAmount(m.amount);
                  }}
                  className="px-3 py-1.5 rounded-[2px] bg-[#141414] border border-[#262626] hover:border-[#CAFF33]/40 text-[11px] text-[#CCC]"
                >
                  {m.name} (${m.amount})
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Merchant Name</label>
              <input
                type="text"
                value={payMerchant}
                onChange={(e) => setPayMerchant(e.target.value)}
                required
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-4 py-3 text-[13px] text-white outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#777] font-['Inter'] mb-1.5 block">Charge Amount (USD)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="15.99"
                required
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-4 py-3 text-[16px] font-mono-figures text-white outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-[12px] text-[#AAA] cursor-pointer">
              <input
                type="checkbox"
                checked={payIntl}
                onChange={(e) => setPayIntl(e.target.checked)}
                className="accent-[#CAFF33]"
              />
              International / Cross-border merchant
            </label>

            <button
              type="submit"
              className="w-full py-3.5 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors"
            >
              Authorize Payment
            </button>
          </form>
        </ModalShell>
      )}

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

function ControlToggle({ icon: Icon, title, desc, enabled, onToggle, accentColor = 'lime' }) {
  const activeBg = accentColor === 'sky' ? 'bg-sky-400' : 'bg-[#CAFF33]';
  const activeBadge =
    accentColor === 'sky'
      ? 'bg-sky-400/15 text-sky-300 border-sky-400/30'
      : 'bg-[#CAFF33]/10 text-[#CAFF33] border-[#CAFF33]/25';

  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-[2px] bg-[#141414] border border-[#222]">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-[2px] border flex items-center justify-center shrink-0 ${
            enabled ? activeBadge : 'bg-[#1B1B1B] border-[#282828] text-[#666]'
          }`}
        >
          <Icon size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white font-['Inter'] truncate">{title}</p>
          <p className="text-[11px] text-[#555] font-['Inter'] truncate">{desc}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        className={`w-11 h-6 rounded-[2px] p-0.5 transition-colors shrink-0 ${
          enabled ? activeBg : 'bg-[#2B2B2B]'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-[2px] bg-[#111] shadow transition-transform ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function ModalShell({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] border border-[#2A2A2A] rounded-[2px] w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-white font-['Poppins']">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[2px] bg-[#242424] text-[#999] hover:text-white"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalError({ message }) {
  return (
    <div className="flex items-start gap-2 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] rounded-[2px] p-3 text-[12px] font-['Inter']">
      <AlertCircle size={15} className="shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

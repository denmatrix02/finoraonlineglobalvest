import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, CheckCircle2, Send, X, Copy, Check,
  Building2, Bitcoin, Clock, ChevronRight, AlertCircle, ShieldCheck, Loader2,
  RefreshCw, XCircle, TriangleAlert,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import MonoAmount from '../../components/user/MonoAmount';
import StatusBadge from '../../components/user/StatusBadge';
import OtpModal from '../../components/user/OtpModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { initiateTransferOtp, fetchPendingTransactions, cancelPendingTransaction } from '../../lib/otpService';
import { sendOtpEmail } from '../../lib/emailService';
import { supabase } from '../../lib/supabase';

const STEPS = ['Recipient', 'Amount', 'Review', 'Success'];
const TABS = [
  { id: 'internal', label: 'Finora Transfer', icon: Send },
  { id: 'bank',     label: 'External Bank',    icon: Building2 },
  { id: 'crypto',   label: 'Crypto / USDT',    icon: Bitcoin },
];

export default function UserTransferPage() {
  const { currentUser } = useAuth();
  const { lookupUserByIdentifier, transferFunds, getUserBalances, transactions, submitExternalTransfer } = useBanking();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('internal');

  // ── OTP Modal State ──────────────────────────────────────────────────────
  const [otpModalConfig, setOtpModalConfig] = useState({
    isOpen: false,
    transactionId: null,
    amount: 0,
    recipientName: '',
    transferType: 'Transfer',
    onVerifySuccessCallback: null,
  });

  // ── Internal transfer state ──────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [txError, setTxError] = useState('');
  const [completedTx, setCompletedTx] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── External bank state (all required recipient fields) ───────────────────
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: '',
    bankAddress: '',
    amount: '',
    note: '',
  });
  const [bankError, setBankError] = useState('');
  const [bankSubmitted, setBankSubmitted] = useState(false);
  const [completedBankTx, setCompletedBankTx] = useState(null);

  // ── Crypto state ─────────────────────────────────────────────────────────
  const [cryptoForm, setCryptoForm] = useState({ walletAddress: '', network: 'TRC20', amount: '', note: '' });
  const [cryptoError, setCryptoError] = useState('');
  const [cryptoSubmitted, setCryptoSubmitted] = useState(false);
  const [completedCryptoTx, setCompletedCryptoTx] = useState(null);

  // ── Shared loading state for OTP submission buttons ───────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Pending abandoned transactions ─────────────────────────────────
  const [pendingTxs, setPendingTxs] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [resumingId, setResumingId] = useState(null);

  const balances = getUserBalances();

  // Load pending transactions on mount and whenever the OTP modal closes
  const loadPendingTxs = async () => {
    if (!currentUser) return;
    setPendingLoading(true);
    try {
      const rows = await fetchPendingTransactions(currentUser);
      setPendingTxs(rows);
    } catch (e) {
      console.warn('[UserTransferPage] fetchPendingTransactions:', e);
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => { loadPendingTxs(); }, [currentUser?.id]);

  // Build "recent recipients"
  const recentRecipients = useMemo(() => {
    if (!currentUser) return [];
    const seen = new Set();
    const results = [];
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    for (const tx of sorted) {
      if (tx.senderId !== currentUser.id) continue;
      if (tx.recipientId === currentUser.id) continue;
      if (seen.has(tx.recipientId)) continue;
      seen.add(tx.recipientId);
      const user = lookupUserByIdentifier(tx.recipientId) || {
        id: tx.recipientId, name: tx.recipientName, accountNo: tx.recipientAccount,
      };
      results.push(user);
      if (results.length >= 5) break;
    }
    return results;
  }, [transactions, currentUser]);

  const initials = (name) => name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  // ── Internal flow lookup ──────────────────────────────────────────────────
  const handleLookup = async () => {
    setLookupError('');
    if (!query || !query.trim()) return;

    let found = lookupUserByIdentifier(query);

    if (!found) {
      try {
        const q = query.trim().toLowerCase();
        const { data } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.%${q}%,username.ilike.%${q}%,name.ilike.%${q}%,account_no.ilike.%${q}%,id.eq.${q}`)
          .limit(1);

        if (data && data.length > 0) {
          const u = data[0];
          found = {
            ...u,
            accountNo: u.account_no || u.accountNo,
            avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
          };
        }
      } catch (err) {
        console.warn('[handleLookup] Supabase query error:', err);
      }
    }

    if (!found) {
      setLookupError('No user found with that name, email, username, or Finora ID.');
      return;
    }
    if (found.id === currentUser?.id) {
      setLookupError('You cannot send money to yourself.');
      return;
    }
    setRecipient(found);
    setStep(1);
  };

  const handleAmountNext = () => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setTxError('Enter a valid amount greater than $0.00.'); return; }
    if (parsed > balances.checking) { setTxError('Insufficient funds in your checking account.'); return; }
    setTxError('');
    setStep(2);
  };

  // ── Initiate Internal Finora Transfer with Backend OTP ───────────────────
  const handleConfirmInternal = async () => {
    setTxError('');
    setIsSubmitting(true);
    try {
      const { transactionId } = await initiateTransferOtp({
        currentUser,
        recipient,
        amount,
        note,
        transferType: 'internal',
      });

      setOtpModalConfig({
        isOpen: true,
        transactionId,
        amount: parseFloat(amount),
        recipientName: recipient?.name || '',
        transferType: 'Finora Transfer',
        onVerifySuccessCallback: async (pendingTx) => {
          const completed = await transferFunds({ recipientId: recipient.id, amount, note });
          setCompletedTx(completed || pendingTx);
          setStep(3);
          setOtpModalConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } catch (err) {
      setTxError(err.message || 'Failed to initiate transfer security code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setStep(0); setQuery(''); setRecipient(null);
    setAmount(''); setNote(''); setTxError(''); setLookupError(''); setCompletedTx(null);
    loadPendingTxs(); // refresh panel after a completed transfer
  };

  // ── Resume an abandoned pending transaction ──────────────────────────
  const handleResumePending = async (tx) => {
    setResumingId(tx.id);
    try {
      // Re-dispatch a fresh OTP for the existing transaction ID.
      // The edge function handles the 60s cooldown and upserts the new hash.
      await sendOtpEmail({
        email: currentUser.email,
        transactionId: tx.id,
        amount: tx.amount,
        recipientName: tx.recipientName,
      });

      // Re-open the OTP modal bound to this transaction
      setOtpModalConfig({
        isOpen: true,
        transactionId: tx.id,
        amount: tx.amount,
        recipientName: tx.recipientName,
        transferType: tx.category || 'Transfer',
        onVerifySuccessCallback: async (pendingTx) => {
          // For internal transfers, settle the funds
          if (tx.recipientId && tx.recipientId !== 'ext_recipient') {
            await transferFunds({ recipientId: tx.recipientId, amount: tx.amount, note: tx.note });
          }
          setOtpModalConfig((prev) => ({ ...prev, isOpen: false }));
          loadPendingTxs();
        },
      });
    } catch (err) {
      alert(err.message || 'Could not resume transfer. Please try again.');
    } finally {
      setResumingId(null);
    }
  };

  // ── Cancel an abandoned pending transaction ─────────────────────────
  const handleCancelPending = async (transactionId) => {
    setCancellingId(transactionId);
    try {
      await cancelPendingTransaction({ transactionId, currentUser });
      setPendingTxs((prev) => prev.filter((t) => t.id !== transactionId));
    } catch (err) {
      alert(err.message || 'Failed to cancel. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const copyTxId = () => {
    navigator.clipboard.writeText(completedTx?.id || completedBankTx?.id || completedCryptoTx?.id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Initiate External Bank Wire with Backend OTP ──────────────────────────
  const handleBankSubmit = async () => {
    setBankError('');
    const { bankName, accountHolder, accountNumber, routingNumber, swiftCode, bankAddress, amount: bAmt, note: bNote } = bankForm;

    if (!bankName || !accountHolder || !accountNumber || !routingNumber || !swiftCode || !bankAddress || !bAmt) {
      return setBankError('Please fill in all recipient details (Bank Name, Account Name, Account Number, Routing Number, SWIFT Code, Bank Address).');
    }

    const parsed = parseFloat(bAmt);
    if (isNaN(parsed) || parsed <= 0) return setBankError('Enter a valid transfer amount.');
    if (parsed > balances.checking) return setBankError('Insufficient funds in your checking account.');

    setIsSubmitting(true);
    try {
      const { transactionId } = await initiateTransferOtp({
        currentUser,
        recipient: { name: accountHolder, accountNo: accountNumber },
        externalDetails: bankForm,
        amount: parsed,
        note: bNote,
        transferType: 'bank',
      });

      setOtpModalConfig({
        isOpen: true,
        transactionId,
        amount: parsed,
        recipientName: accountHolder,
        transferType: 'External Bank Wire',
        onVerifySuccessCallback: async (pendingTx) => {
          const submitted = await submitExternalTransfer({ transferType: 'bank', amount: parsed, ...bankForm });
          setCompletedBankTx(submitted || pendingTx);
          setBankSubmitted(true);
          setOtpModalConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } catch (err) {
      setBankError(err.message || 'Failed to initiate bank authorization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Initiate Crypto USDT Withdrawal with Backend OTP ──────────────────────
  const handleCryptoSubmit = async () => {
    setCryptoError('');
    const { walletAddress, network, amount: cAmt, note: cNote } = cryptoForm;
    if (!walletAddress || !network || !cAmt) return setCryptoError('Please fill in all required wallet details.');
    const parsed = parseFloat(cAmt);
    if (isNaN(parsed) || parsed <= 0) return setCryptoError('Enter a valid amount.');
    if (parsed > balances.checking) return setCryptoError('Insufficient funds in your checking account.');

    setIsSubmitting(true);
    try {
      const { transactionId } = await initiateTransferOtp({
        currentUser,
        recipient: { name: `Crypto (${network})`, accountNo: walletAddress },
        externalDetails: cryptoForm,
        amount: parsed,
        note: cNote,
        transferType: 'crypto',
      });

      setOtpModalConfig({
        isOpen: true,
        transactionId,
        amount: parsed,
        recipientName: `USDT Wallet (${network})`,
        transferType: 'Crypto Transfer',
        onVerifySuccessCallback: async (pendingTx) => {
          const submitted = await submitExternalTransfer({ transferType: 'crypto', amount: parsed, ...cryptoForm });
          setCompletedCryptoTx(submitted || pendingTx);
          setCryptoSubmitted(true);
          setOtpModalConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } catch (err) {
      setCryptoError(err.message || 'Failed to initiate crypto authorization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-white font-['Poppins']">Send Money</h1>
            <p className="text-[11px] text-[#555] font-['Inter']">Authorize transfers via Email OTP security</p>
          </div>
          <div className="flex items-center gap-2 bg-[#CAFF33]/10 border border-[#CAFF33]/20 px-3 py-1.5 rounded-[6px] shrink-0">
            <ShieldCheck size={14} className="text-[#CAFF33]" />
            <span className="text-[11px] text-[#CAFF33] font-semibold font-['Inter']">OTP Protected</span>
          </div>
        </div>

        <div className="px-4 sm:px-8 py-5 sm:py-8 flex justify-center">
          <div className="w-full max-w-lg">

            {/* ── Pending Abandoned Transfers Panel ────────────────────── */}
            <PendingTransfersPanel
              pendingTxs={pendingTxs}
              loading={pendingLoading}
              resumingId={resumingId}
              cancellingId={cancellingId}
              onResume={handleResumePending}
              onCancel={handleCancelPending}
            />

            {/* Tab selector */}
            <div className="flex gap-2 mb-8 bg-[#161616] border border-[#222] rounded-[4px] p-1.5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[4px] text-[12px] font-semibold font-['Inter'] transition-all
                    ${activeTab === id
                      ? 'bg-[#CAFF33] text-[#111]'
                      : 'text-[#555] hover:text-white'}`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════ */}
            {/* TAB 1 — INTERNAL Finora Transfer                   */}
            {/* ════════════════════════════════════════════════════ */}
            {activeTab === 'internal' && (
              <>
                {/* Step indicator */}
                <div className="flex items-center gap-0 mb-8">
                  {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center text-[11px] font-bold transition-all
                          ${i < step ? 'bg-[#CAFF33] text-[#111]'
                            : i === step ? 'bg-[#CAFF33]/20 border border-[#CAFF33] text-[#CAFF33]'
                            : 'bg-[#1A1A1A] border border-[#222] text-[#444]'}`}>
                          {i < step ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        <span className={`text-[9px] font-['Inter'] whitespace-nowrap ${i === step ? 'text-[#CAFF33]' : 'text-[#444]'}`}>{label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-px mx-2 mb-4 transition-all ${i < step ? 'bg-[#CAFF33]' : 'bg-[#222]'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 0 — Recipient */}
                {step === 0 && (
                  <div className="bg-[#1A1A1A] border border-[#222] rounded-[6px] p-6 space-y-5">
                    <div>
                      <h2 className="text-[16px] font-semibold text-white font-['Poppins'] mb-1">Find Recipient</h2>
                      <p className="text-[12px] text-[#444] font-['Inter']">Enter an email, username, or Finora Account ID.</p>
                    </div>

                    <div className="relative">
                      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#444]" />
                      <input
                        type="text" value={query}
                        onChange={(e) => { setQuery(e.target.value); setLookupError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        placeholder="alex@finora.app · alex.johnson · ACC-849204"
                        className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] pl-10 pr-4 py-3.5 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
                      />
                    </div>

                    {lookupError && (
                      <p className="text-[12px] text-[#FF5555] font-['Inter'] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[6px] px-4 py-2.5">{lookupError}</p>
                    )}

                    <button onClick={handleLookup} disabled={!query.trim()}
                      className="w-full py-3.5 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-semibold font-['Poppins'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Find Recipient
                    </button>

                    {/* Recent recipients */}
                    {recentRecipients.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#333] font-['Inter'] mb-2">Recent Recipients</p>
                        <div className="space-y-2">
                          {recentRecipients.map((u) => (
                            <button key={u.id} onClick={() => { setRecipient(u); setStep(1); }}
                              className="w-full flex items-center gap-3 p-3 bg-[#141414] border border-[#222] rounded-[6px] hover:border-[#CAFF33]/30 hover:bg-[#CAFF33]/5 transition-all text-left">
                              {u.avatar
                                ? <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-[#333]" />
                                : <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[11px] font-bold text-[#CAFF33]">{initials(u.name)}</div>
                              }
                              <div className="flex-1">
                                <p className="text-[13px] font-semibold text-white font-['Inter']">{u.name}</p>
                                <p className="text-[10px] text-[#444] font-mono">{u.accountNo}</p>
                              </div>
                              <ChevronRight size={14} className="text-[#444]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1 — Amount */}
                {step === 1 && recipient && (
                  <div className="space-y-4">
                    <div className="bg-[#1A1A1A] border border-[#CAFF33]/20 rounded-[6px] p-4 flex items-center gap-3">
                      <div className="p-1.5 bg-[#CAFF33]/10 rounded-[4px]"><CheckCircle2 size={16} className="text-[#CAFF33]" /></div>
                      {recipient.avatar
                        ? <img src={recipient.avatar} alt={recipient.name} className="w-10 h-10 rounded-full object-cover border border-[#333]" />
                        : <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-[13px] font-bold text-[#CAFF33]">{initials(recipient.name)}</div>
                      }
                      <div className="flex-1">
                        <p className="text-[14px] font-semibold text-white font-['Poppins']">{recipient.name}</p>
                        <p className="text-[11px] text-[#555] font-mono">{recipient.accountNo}</p>
                      </div>
                      <button onClick={() => { setRecipient(null); setStep(0); }} className="text-[#444] hover:text-white transition-colors"><X size={15} /></button>
                    </div>

                    <div className="bg-[#1A1A1A] border border-[#222] rounded-[6px] p-6 space-y-5">
                      <div>
                        <h2 className="text-[16px] font-semibold text-white font-['Poppins'] mb-1">Enter Amount</h2>
                        <p className="text-[12px] text-[#444] font-['Inter']">Available: <MonoAmount amount={balances.checking} size="xs" direction="credit" /></p>
                      </div>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] text-xl font-bold font-mono">$</span>
                        <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setTxError(''); }}
                          placeholder="0.00" min="0.01" step="0.01"
                          className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] pl-10 pr-5 py-4 text-[20px] text-white font-mono placeholder:text-[#333] outline-none transition-colors text-center" />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {[50, 100, 250, 500, 1000].map((v) => (
                          <button key={v} onClick={() => setAmount(String(v))}
                            className="px-3 py-1.5 rounded-[6px] border border-[#2A2A2A] text-[11px] text-[#666] hover:border-[#CAFF33] hover:text-[#CAFF33] transition-colors font-mono">${v}</button>
                        ))}
                      </div>
                      <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a comment / note (optional)"
                        className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']" />
                      {txError && <p className="text-[12px] text-[#FF5555] font-['Inter'] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[6px] px-4 py-2.5">{txError}</p>}
                      <div className="flex gap-3">
                        <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-[6px] border border-[#2A2A2A] text-[13px] text-[#666] hover:text-white hover:border-[#333] transition-colors font-['Inter']">Back</button>
                        <button onClick={handleAmountNext} disabled={!amount}
                          className="flex-[2] py-3 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-semibold font-['Poppins'] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          Review Transfer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 — Review & OTP Authorization Trigger */}
                {step === 2 && recipient && (
                  <div className="bg-[#1A1A1A] border border-[#222] rounded-[6px] p-6 space-y-5">
                    <h2 className="text-[16px] font-semibold text-white font-['Poppins']">Review & Authorize</h2>
                    <div className="bg-[#141414] border border-[#222] rounded-[6px] p-4 space-y-3 text-[13px]">
                      <Row label="From Account" value={currentUser?.name} sub={currentUser?.accountNo} />
                      <div className="h-px bg-[#222]" />
                      <Row label="Recipient" value={recipient.name} sub={recipient.accountNo} />
                      <div className="h-px bg-[#222]" />
                      <div className="flex justify-between items-center">
                        <span className="text-[#555] font-['Inter']">Transfer Amount</span>
                        <MonoAmount amount={parseFloat(amount)} direction="debit" sign size="lg" />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#555] font-['Inter']">Processing Fee</span>
                        <span className="font-mono text-[#CAFF33] text-[12px]">$0.00 (Free)</span>
                      </div>
                      {note && (<><div className="h-px bg-[#222]" /><div className="flex justify-between items-start"><span className="text-[#555] font-['Inter']">Comment / Note</span><span className="text-white text-[12px] font-['Inter'] text-right max-w-[180px]">{note}</span></div></>)}
                      <div className="h-px bg-[#CAFF33]/20" />
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold font-['Poppins']">Total Amount</span>
                        <MonoAmount amount={parseFloat(amount)} direction="debit" sign size="lg" />
                      </div>
                    </div>

                    <div className="p-3 bg-[#CAFF33]/5 border border-[#CAFF33]/15 rounded-[6px] flex items-center gap-2 text-[11px] text-[#CAFF33] font-['Inter']">
                      <ShieldCheck size={16} className="shrink-0" />
                      <span>Submitting will send a secure 6-digit OTP code to <strong className="text-white">{currentUser?.email}</strong>.</span>
                    </div>

                    {txError && <p className="text-[12px] text-[#FF5555] font-['Inter'] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[6px] px-4 py-2.5">{txError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setStep(1)} className="flex-1 py-3.5 rounded-[6px] border border-[#2A2A2A] text-[13px] text-[#666] hover:text-white hover:border-[#333] transition-colors font-['Inter']" disabled={isSubmitting}>Back</button>
                      <button
                        onClick={handleConfirmInternal}
                        disabled={isSubmitting || otpModalConfig.isOpen}
                        className="flex-[2] py-3.5 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#CAFF33]"
                      >
                        {isSubmitting ? (
                          <><Loader2 size={15} className="animate-spin" /> Sending OTP...</>
                        ) : otpModalConfig.isOpen ? (
                          <><ShieldCheck size={15} /> OTP Sent — Awaiting Code</>
                        ) : (
                          <><Send size={15} /> Send OTP & Authorize</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 — Success & Formal Receipt */}
                {step === 3 && completedTx && (
                  <div className="bg-[#1A1A1A] border border-[#CAFF33]/20 rounded-[6px] p-8 text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="p-5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[6px]"><CheckCircle2 size={40} className="text-[#CAFF33]" /></div>
                    </div>
                    <div>
                      <h2 className="text-[22px] font-bold text-white font-['Poppins'] mb-1">Transfer Authorized!</h2>
                      <p className="text-[13px] text-[#555] font-['Inter']">Your transfer to <span className="text-white font-semibold">{recipient?.name}</span> was verified via Email OTP.</p>
                    </div>
                    <MonoAmount amount={completedTx.amount} direction="credit" size="3xl" />
                    <StatusBadge status={completedTx.status} size="md" />

                    <div className="bg-[#141414] border border-[#222] rounded-[6px] p-4 text-left space-y-3">
                      <Row label="Transaction Reference" value={completedTx.id} sub="Verified via OTP" />
                      <div className="h-px bg-[#222]" />
                      <Row label="Sender" value={currentUser?.name} sub={currentUser?.accountNo} />
                      <div className="h-px bg-[#222]" />
                      <Row label="Recipient" value={completedTx.recipientName} sub={completedTx.recipientAccount} />
                    </div>

                    <div className="bg-[#141414] border border-[#222] rounded-[6px] px-4 py-3 flex items-center justify-between gap-3">
                      <div className="text-left">
                        <p className="text-[10px] text-[#444] font-['Inter'] uppercase tracking-widest mb-0.5">Transaction ID</p>
                        <p className="text-[12px] text-white font-mono">{completedTx.id}</p>
                      </div>
                      <button onClick={copyTxId} className="text-[#666] hover:text-[#CAFF33] transition-colors flex items-center gap-1 text-[12px] font-['Inter']">
                        {copied ? <Check size={14} className="text-[#CAFF33]" /> : <Copy size={14} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={resetFlow} className="flex-1 py-3 rounded-[6px] border border-[#2A2A2A] text-[13px] text-white hover:border-[#333] transition-colors font-['Inter']">Send Another</button>
                      <button onClick={() => navigate('/statements')} className="flex-1 py-3 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-semibold font-['Poppins'] transition-colors">View Receipt</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ════════════════════════════════════════════════════ */}
            {/* TAB 2 — EXTERNAL BANK WIRE (ALL RECIPIENT FIELDS)    */}
            {/* ════════════════════════════════════════════════════ */}
            {activeTab === 'bank' && (
              bankSubmitted ? (
                <PendingCard
                  icon={<Building2 size={36} className="text-[#CAFF33]" />}
                  title="Bank Wire Authorized & Submitted"
                  desc={`Your external bank wire of $${parseFloat(bankForm.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} has been verified via OTP and submitted for processing.`}
                  txId={completedBankTx?.id}
                  onReset={() => { setBankSubmitted(false); setBankForm({ bankName: '', accountHolder: '', accountNumber: '', routingNumber: '', swiftCode: '', bankAddress: '', amount: '', note: '' }); }}
                />
              ) : (
                <div className="bg-[#1A1A1A] border border-[#222] rounded-[6px] p-6 space-y-4">
                  <div>
                    <h2 className="text-[16px] font-semibold text-white font-['Poppins'] mb-1">External Bank Wire</h2>
                    <p className="text-[12px] text-[#555] font-['Inter']">Enter full wire details. Available: <span className="text-[#CAFF33] font-mono">${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                  </div>

                  <Field label="Bank Name *" value={bankForm.bankName} onChange={(v) => setBankForm(p => ({ ...p, bankName: v }))} placeholder="e.g. JPMorgan Chase Bank" />
                  <Field label="Account Holder Name *" value={bankForm.accountHolder} onChange={(v) => setBankForm(p => ({ ...p, accountHolder: v }))} placeholder="Full legal name on recipient account" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Account Number *" value={bankForm.accountNumber} onChange={(v) => setBankForm(p => ({ ...p, accountNumber: v }))} placeholder="1234567890" mono />
                    <Field label="Routing Number (ABA) *" value={bankForm.routingNumber} onChange={(v) => setBankForm(p => ({ ...p, routingNumber: v }))} placeholder="021000021" mono />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="SWIFT Code *" value={bankForm.swiftCode} onChange={(v) => setBankForm(p => ({ ...p, swiftCode: v }))} placeholder="CHASUS33XXX" mono />
                    <Field label="Bank Address *" value={bankForm.bankAddress} onChange={(v) => setBankForm(p => ({ ...p, bankAddress: v }))} placeholder="270 Park Ave, New York, NY" />
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] text-[#555] font-['Inter'] mb-1.5">Amount (USD) *</label>
                    <span className="absolute left-4 bottom-3.5 text-[#CAFF33] font-mono font-bold">$</span>
                    <input type="number" min="0.01" step="0.01" value={bankForm.amount} onChange={(e) => setBankForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] pl-8 pr-4 py-3 text-[14px] text-white font-mono placeholder:text-[#333] outline-none transition-colors" />
                  </div>
                  <Field label="Transfer Comment / Note (optional)" value={bankForm.note} onChange={(v) => setBankForm(p => ({ ...p, note: v }))} placeholder="Invoice #, business purpose..." />

                  {bankError && <ErrorBanner message={bankError} />}

                  <div className="pt-1 bg-[#CAFF33]/5 border border-[#CAFF33]/15 rounded-[6px] px-4 py-3 flex gap-2 items-start">
                    <ShieldCheck size={16} className="text-[#CAFF33] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[#888] font-['Inter']">Submitting will send a secure 6-digit verification OTP code to your registered email address before completing authorization.</p>
                  </div>

                  <button
                    onClick={handleBankSubmit}
                    disabled={isSubmitting || otpModalConfig.isOpen}
                    className="w-full py-3.5 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#CAFF33]"
                  >
                    {isSubmitting ? (
                      <><Loader2 size={15} className="animate-spin" /> Sending OTP...</>
                    ) : otpModalConfig.isOpen ? (
                      <><ShieldCheck size={15} /> OTP Sent — Awaiting Code</>
                    ) : (
                      <><Building2 size={15} /> Send OTP & Submit Wire</>
                    )}
                  </button>
                </div>
              )
            )}

            {/* ════════════════════════════════════════════════════ */}
            {/* TAB 3 — CRYPTO / USDT TRANSFER                      */}
            {/* ════════════════════════════════════════════════════ */}
            {activeTab === 'crypto' && (
              cryptoSubmitted ? (
                <PendingCard
                  icon={<Bitcoin size={36} className="text-[#F7931A]" />}
                  title="USDT Transfer Authorized & Submitted"
                  desc="Your crypto withdrawal has been authorized via Email OTP and submitted for blockchain processing."
                  txId={completedCryptoTx?.id}
                  onReset={() => { setCryptoSubmitted(false); setCryptoForm({ walletAddress: '', network: 'TRC20', amount: '', note: '' }); }}
                />
              ) : (
                <div className="bg-[#1A1A1A] border border-[#222] rounded-[6px] p-6 space-y-4">
                  <div>
                    <h2 className="text-[16px] font-semibold text-white font-['Poppins'] mb-1">USDT Crypto Transfer</h2>
                    <p className="text-[12px] text-[#555] font-['Inter']">Send USDT securely. Available: <span className="text-[#CAFF33] font-mono">${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></p>
                  </div>

                  <Field label="USDT Wallet Address *" value={cryptoForm.walletAddress} onChange={(v) => setCryptoForm(p => ({ ...p, walletAddress: v }))} placeholder="T... / 0x..." mono />

                  <div>
                    <label className="block text-[11px] text-[#555] font-['Inter'] mb-1.5">Network *</label>
                    <div className="flex gap-2">
                      {['TRC20', 'ERC20', 'BEP20'].map((net) => (
                        <button key={net} onClick={() => setCryptoForm(p => ({ ...p, network: net }))}
                          className={`flex-1 py-2.5 rounded-[6px] border text-[12px] font-bold font-mono transition-all
                            ${cryptoForm.network === net
                              ? 'bg-[#CAFF33]/10 border-[#CAFF33] text-[#CAFF33]'
                              : 'border-[#2A2A2A] text-[#555] hover:border-[#333] hover:text-white'}`}>
                          {net}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-[11px] text-[#555] font-['Inter'] mb-1.5">Amount (USD equivalent) *</label>
                    <span className="absolute left-4 bottom-3.5 text-[#CAFF33] font-mono font-bold">$</span>
                    <input type="number" min="0.01" step="0.01" value={cryptoForm.amount} onChange={(e) => setCryptoForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] pl-8 pr-4 py-3 text-[14px] text-white font-mono placeholder:text-[#333] outline-none transition-colors" />
                  </div>
                  <Field label="Memo / Comment (optional)" value={cryptoForm.note} onChange={(v) => setCryptoForm(p => ({ ...p, note: v }))} placeholder="Optional reference..." />

                  {cryptoError && <ErrorBanner message={cryptoError} />}

                  <div className="pt-1 bg-[#F7931A]/5 border border-[#F7931A]/15 rounded-[6px] px-4 py-3 flex gap-2 items-start">
                    <ShieldCheck size={16} className="text-[#F7931A] mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[#888] font-['Inter']">Requires 6-digit Email OTP authorization. Crypto transfers are irreversible once processed.</p>
                  </div>

                  <button
                    onClick={handleCryptoSubmit}
                    disabled={isSubmitting || otpModalConfig.isOpen}
                    className="w-full py-3.5 rounded-[6px] text-[14px] font-bold font-['Poppins'] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: isSubmitting || otpModalConfig.isOpen ? '#b8720d' : 'linear-gradient(135deg, #F7931A, #FFAB40)', color: '#111' }}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={15} className="animate-spin" /> Sending OTP...</>
                    ) : otpModalConfig.isOpen ? (
                      <><ShieldCheck size={15} /> OTP Sent — Awaiting Code</>
                    ) : (
                      <><Bitcoin size={15} /> Send OTP & Submit USDT</>
                    )}
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* 6-Digit Backend Email OTP Verification Modal */}
        <OtpModal
          isOpen={otpModalConfig.isOpen}
          onClose={() => setOtpModalConfig((prev) => ({ ...prev, isOpen: false }))}
          transactionId={otpModalConfig.transactionId}
          onVerifySuccess={otpModalConfig.onVerifySuccessCallback}
          amount={otpModalConfig.amount}
          recipientName={otpModalConfig.recipientName}
          transferType={otpModalConfig.transferType}
        />
      </main>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <div>
      <label className="block text-[11px] text-[#555] font-['Inter'] mb-1.5">{label}</label>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[6px] px-4 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors ${mono ? 'font-mono' : "font-['Inter']"}`}
      />
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-2 bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[6px] px-4 py-2.5">
      <AlertCircle size={14} className="text-[#FF5555] shrink-0" />
      <p className="text-[12px] text-[#FF5555] font-['Inter']">{message}</p>
    </div>
  );
}

function PendingCard({ icon, title, desc, txId, onReset }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#CAFF33]/15 rounded-[6px] p-8 text-center space-y-5">
      <div className="flex justify-center">
        <div className="p-4 bg-[#CAFF33]/8 border border-[#CAFF33]/15 rounded-[6px]">{icon}</div>
      </div>
      <div className="flex justify-center">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] text-[11px] font-semibold font-['Inter']">
          <ShieldCheck size={12} /> Email OTP Authorized
        </span>
      </div>
      <div>
        <h2 className="text-[20px] font-bold text-white font-['Poppins'] mb-2">{title}</h2>
        <p className="text-[13px] text-[#888] font-['Inter'] leading-relaxed">{desc}</p>
        {txId && <p className="text-[11px] text-[#555] font-mono mt-2">Ref: {txId}</p>}
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onReset} className="flex-1 py-3 rounded-[6px] border border-[#2A2A2A] text-[13px] text-white hover:border-[#333] transition-colors font-['Inter']">New Transfer</button>
        <button onClick={() => window.location.href = '/statements'} className="flex-1 py-3 rounded-[6px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-semibold font-['Poppins'] transition-colors">View Statements</button>
      </div>
    </div>
  );
}

function Row({ label, value, sub }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-[#555] font-['Inter'] shrink-0">{label}</span>
      <div className="text-right">
        <p className="text-white font-semibold font-['Inter']">{value}</p>
        {sub && <p className="text-[10px] text-[#444] font-mono mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Pending Abandoned Transfers Panel ─────────────────────────────────────────
function PendingTransfersPanel({ pendingTxs, loading, resumingId, cancellingId, onResume, onCancel }) {
  // Don't render the panel at all when there are no pending txs and not loading
  if (!loading && pendingTxs.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-amber-500/10 rounded-[4px] border border-amber-500/20">
          <TriangleAlert size={13} className="text-amber-400" />
        </div>
        <p className="text-[12px] font-semibold text-amber-400 font-['Inter']">
          Pending Transfers Awaiting Authorization
        </p>
        {loading && <Loader2 size={12} className="text-[#444] animate-spin ml-auto" />}
      </div>

      <div className="space-y-2">
        {pendingTxs.map((tx) => {
          const isCancelling = cancellingId === tx.id;
          const isResuming = resumingId === tx.id;
          const otpExpired = tx.otp?.expires_at
            ? new Date(tx.otp.expires_at).getTime() < Date.now()
            : true;
          const otpUsed = tx.otp?.is_used === true;
          const otpLocked = tx.otp?.attempts_count >= 3;

          // Compute minutes left on OTP
          const msLeft = tx.otp?.expires_at
            ? new Date(tx.otp.expires_at).getTime() - Date.now()
            : 0;
          const minsLeft = Math.max(0, Math.ceil(msLeft / 60000));

          const canResume = !otpUsed;

          return (
            <div
              key={tx.id}
              className="bg-[#1A1A1A] border border-amber-500/20 rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              {/* Left: Transfer info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[12px] font-bold text-white font-['Poppins'] truncate">
                    {tx.recipientName || 'Unknown Recipient'}
                  </span>
                  <span className="text-[10px] font-mono text-[#555] truncate">{tx.recipientAccount}</span>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[13px] font-mono font-bold text-amber-400">
                    ${parseFloat(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#444] font-['Inter']">{tx.category}</span>

                  {/* OTP status badge */}
                  {otpUsed ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#333] text-[#666] font-['Inter']">
                      OTP used
                    </span>
                  ) : otpLocked ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-red-500/10 border border-red-500/20 text-red-400 font-['Inter']">
                      Locked (3 attempts)
                    </span>
                  ) : otpExpired ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] font-['Inter'] flex items-center gap-1">
                      <RefreshCw size={9} /> OTP expired — resend available
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] font-['Inter'] flex items-center gap-1">
                      <Clock size={9} /> OTP valid {minsLeft}m left
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-[#444] font-mono mt-1 truncate">{tx.id}</p>
              </div>

              {/* Right: Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {canResume && (
                  <button
                    onClick={() => onResume(tx)}
                    disabled={isResuming || isCancelling}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[11px] font-bold font-['Poppins'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isResuming ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    {otpExpired || otpLocked ? 'Resend & Complete' : 'Enter OTP'}
                  </button>
                )}

                <button
                  onClick={() => onCancel(tx.id)}
                  disabled={isCancelling || isResuming}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[4px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[11px] font-semibold font-['Inter'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isCancelling ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


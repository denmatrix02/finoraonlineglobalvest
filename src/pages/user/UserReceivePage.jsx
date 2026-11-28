import React, { useState } from 'react';
import { Copy, Check, QrCode, Share2, ArrowRight, Send, Building2, Globe, FileText } from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import MonoAmount from '../../components/user/MonoAmount';
import ErrorModal from '../../components/user/ErrorModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { getExternalBankDetails, formatExternalBankText } from '../../utils/externalBankUtils';
import logoImg from '../../assets/logo-30_3x.png';

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between p-3.5 bg-[#141414] border border-[#222] rounded-[2px] group hover:border-[#333] transition-colors">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-[9px] uppercase tracking-widest text-[#555] font-['Inter'] mb-0.5">{label}</p>
        <p className="text-[13px] text-white font-mono-figures truncate">{value}</p>
      </div>
      <button
        onClick={handleCopy}
        className="p-2 text-[#555] hover:text-[#CAFF33] transition-colors rounded-[1.5px] hover:bg-[#CAFF33]/10 shrink-0"
        title={`Copy ${label}`}
      >
        {copied ? <Check size={14} className="text-[#CAFF33]" /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export default function UserReceivePage() {
  const { currentUser } = useAuth();
  const { createMoneyRequest, lookupUserByIdentifier, notifications } = useBanking();

  const [reqAmount, setReqAmount] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [reqRecipient, setReqRecipient] = useState('');
  const [reqError, setReqError] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');
  const [copiedAll, setCopiedAll] = useState(false);

  const extBank = getExternalBankDetails(currentUser);

  const handleRequest = async (e) => {
    e.preventDefault();
    setReqError('');
    setReqSuccess('');
    try {
      const from = reqRecipient ? lookupUserByIdentifier(reqRecipient) : null;
      await createMoneyRequest({
        fromUserId: from?.id || null,
        amount: reqAmount,
        note: reqNote,
      });
      setReqSuccess(`Request sent! ${from ? `${from.name} has been notified.` : 'Share your Finora ID to receive payment.'}`);
      setReqAmount('');
      setReqNote('');
      setReqRecipient('');
    } catch (err) {
      setReqError(err.message || 'Money request failed.');
    }
  };

  const handleCopyAllExtDetails = () => {
    if (!extBank) return;
    const formatted = formatExternalBankText(extBank);
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Pending requests directed at this user
  const incomingRequests = notifications.filter(
    (n) => n.userId === currentUser?.id && n.type === 'money_request'
  );

  const initials = currentUser?.name
    ?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4">
          <h1 className="text-[18px] font-bold text-white font-['Poppins']">Receive Money</h1>
          <p className="text-[11px] text-[#444] font-['Inter']">Internal Finora ID & External Bank Account details for incoming transfers</p>
        </div>

        <div className="px-4 sm:px-8 py-5 sm:py-8 grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 max-w-5xl">

          {/* Left Column: Finora IDentity + External Bank Details */}
          <div className="space-y-6">
            
            {/* 1. Finora Internal Identity */}
            <div className="space-y-4">
              <h2 className="text-[14px] font-semibold text-white font-['Poppins']">Your Finora Internal Account</h2>

              {/* Visual Card */}
              <div className="relative bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#CAFF33]/20 rounded-[2px] p-6 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
                {/* Decorative glow */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#CAFF33]/8 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-5 -bottom-5 w-24 h-24 bg-[#CAFF33]/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-6">
                  <img src={logoImg} alt="Finora" width="20" className="object-contain opacity-60" />
                  <span className="text-[11px] text-[#555] font-['Poppins'] font-semibold tracking-wider uppercase">Finora Digital Bank</span>
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-4 mb-6">
                  {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-[2px] object-cover border-2 border-[#CAFF33]/30" />
                  ) : (
                    <div className="w-16 h-16 rounded-[2px] bg-[#CAFF33]/10 border-2 border-[#CAFF33]/30 flex items-center justify-center text-[22px] font-bold text-[#CAFF33] font-mono-figures">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-[18px] font-bold text-white font-['Poppins']">{currentUser?.name}</p>
                    <p className="text-[12px] text-[#555] font-mono-figures">@{currentUser?.username || currentUser?.name?.toLowerCase().replace(/\s+/g, '.')}</p>
                  </div>
                </div>

                {/* QR stand-in — dotted square with account no */}
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 border-2 border-dashed border-[#CAFF33]/30 rounded-[2px] flex flex-col items-center justify-center gap-1">
                    <QrCode size={22} className="text-[#CAFF33]/50" />
                    <span className="text-[8px] text-[#CAFF33]/50 font-mono-figures text-center leading-tight">SCAN TO<br />PAY</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[2px] px-4 py-3 text-center">
                      <p className="text-[9px] text-[#666] uppercase tracking-widest font-['Inter'] mb-1">Finora Account ID</p>
                      <p className="text-[20px] font-bold text-[#CAFF33] font-mono-figures tracking-wider">{currentUser?.accountNo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Copyable fields */}
              <div className="space-y-2">
                <CopyField label="Account Number" value={currentUser?.accountNo || ''} />
                <CopyField label="Username" value={`@${currentUser?.username || currentUser?.name?.toLowerCase().replace(/\s+/g, '.')}`} />
                <CopyField label="Email" value={currentUser?.email || ''} />
              </div>
            </div>

            {/* 2. External Wire & ACH Bank Details */}
            <div className="space-y-4 pt-4 border-t border-[#222]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold text-white font-['Poppins'] flex items-center gap-2">
                    <Building2 size={16} className="text-[#CAFF33]" /> External Bank Details (Wire & ACH)
                  </h2>
                  <p className="text-[11px] text-[#555] font-['Inter'] mt-0.5">
                    Share these details to receive direct deposits or external bank transfers
                  </p>
                </div>

                <button
                  onClick={handleCopyAllExtDetails}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CAFF33]/10 border border-[#CAFF33]/30 rounded-[2px] text-[11px] font-semibold text-[#CAFF33] hover:bg-[#CAFF33]/20 transition-all font-['Inter'] shrink-0"
                >
                  {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAll ? 'Copied All!' : 'Copy All Details'}
                </button>
              </div>

              {/* Bank Details Card */}
              <div className="bg-[#151515] border border-[#262626] rounded-[2px] p-5 space-y-2.5">
                <CopyField label="Bank Name" value={extBank?.bankName || 'JPMorgan Chase'} />
                <CopyField label="Account Name" value={extBank?.accountName || currentUser?.name || ''} />
                <CopyField label="Account Number" value={extBank?.accountNumber || ''} />
                <CopyField label="Routing Number (ABA)" value={extBank?.routingNumber || ''} />
                <CopyField label="SWIFT Code" value={extBank?.swiftCode || ''} />
                <CopyField label="Bank Address" value={extBank?.bankAddress?.replace(/\n/g, ', ') || ''} />
              </div>
            </div>

          </div>

          {/* Right Column: Request Money form + Incoming Requests */}
          <div className="space-y-6">
            
            {/* Request Money Form */}
            <div className="space-y-4">
              <h2 className="text-[14px] font-semibold text-white font-['Poppins']">Request Money</h2>

              <form onSubmit={handleRequest} className="bg-[#1A1A1A] border border-[#222] rounded-[2px] p-6 space-y-4">
                <p className="text-[12px] text-[#444] font-['Inter']">
                  Generate a payment request for a specific amount. The payer will be notified to complete it through their Send flow.
                </p>

                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] text-xl font-bold font-mono-figures">$</span>
                  <input
                    type="number"
                    value={reqAmount}
                    onChange={(e) => setReqAmount(e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] pl-10 pr-5 py-4 text-[18px] text-white font-mono-figures placeholder:text-[#333] outline-none transition-colors"
                  />
                </div>

                <input
                  type="text"
                  value={reqRecipient}
                  onChange={(e) => setReqRecipient(e.target.value)}
                  placeholder="Request from (email, username, or account) — optional"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
                />

                <input
                  type="text"
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  placeholder="Add a note (e.g. Rent split, Dinner)"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[2px] px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
                />

                {reqError && <p className="text-[12px] text-[#FF5555] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[2px] px-4 py-2.5 font-['Inter']">{reqError}</p>}
                {reqSuccess && <p className="text-[12px] text-[#CAFF33] bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[2px] px-4 py-2.5 font-['Inter']">{reqSuccess}</p>}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={15} /> Send Request
                </button>
              </form>
            </div>

            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div className="bg-[#1A1A1A] border border-[#222] rounded-[2px] p-5 space-y-3">
                <h3 className="text-[13px] font-semibold text-white font-['Poppins']">Incoming Requests</h3>
                {incomingRequests.slice(0, 5).map((n) => (
                  <div key={n.id} className="flex items-center justify-between p-3 bg-[#141414] border border-[#222] rounded-[2px]">
                    <div>
                      <p className="text-[12px] font-semibold text-white font-['Inter']">{n.title}</p>
                      <p className="text-[10px] text-[#444] font-['Inter'] mt-0.5">{n.message}</p>
                    </div>
                    <button
                      onClick={() => (window.location.href = '/transfers')}
                      className="flex items-center gap-1 text-[11px] text-[#CAFF33] hover:underline font-['Inter']"
                    >
                      Pay <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </main>
      <ErrorModal title="Request Failed" message={reqError} onClose={() => setReqError('')} />
    </div>
  );
}


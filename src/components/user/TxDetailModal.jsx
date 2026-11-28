import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Landmark, PiggyBank, Coins, AlertCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import MonoAmount from './MonoAmount';

const TYPE_ICONS = {
  transfer: { sent: ArrowUpRight, received: ArrowDownLeft },
  deposit: Coins,
  withdraw: ArrowUpRight,
  loan_disbursement: Landmark,
  loan_repayment: Landmark,
};

export default function TxDetailModal({ tx, currentUserId, onClose }) {
  if (!tx) return null;
  const navigate = useNavigate();

  const handleContactSupport = () => {
    onClose();
    navigate('/support', { state: { prefillTxId: tx.id } });
  };

  const isDebit =
    tx.senderId === currentUserId &&
    tx.recipientId !== currentUserId;
  const direction = isDebit ? 'debit' : 'credit';

  const Icon = tx.type === 'transfer'
    ? (isDebit ? ArrowUpRight : ArrowDownLeft)
    : TYPE_ICONS[tx.type] || Coins;

  const iconColor = isDebit ? 'text-[#FF5555]' : 'text-[#CAFF33]';
  const iconBg = isDebit ? 'bg-[#FF5555]/10 border-[#FF5555]/20' : 'bg-[#CAFF33]/10 border-[#CAFF33]/20';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[2px] w-full max-w-md shadow-2xl shadow-black/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#262626]">
          <span className="text-sm font-semibold text-white font-['Poppins']">Transaction Details</span>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Amount hero */}
          <div className="flex flex-col items-center text-center gap-2 py-4">
            <div className={`p-4 rounded-[2px] border ${iconBg}`}>
              <Icon size={28} className={iconColor} />
            </div>
            <MonoAmount
              amount={tx.amount}
              direction={direction}
              size="3xl"
              sign
            />
            <StatusBadge status={tx.status} size="md" />
          </div>

          {/* Failure reason */}
          {tx.status === 'Failed' && tx.failureReason && (
            <div className="flex items-start gap-2 bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[2px] p-3">
              <AlertCircle size={14} className="text-[#FF5555] mt-0.5 shrink-0" />
              <p className="text-xs text-[#FF5555] leading-relaxed">
                <span className="font-semibold">Reason: </span>{tx.failureReason}
              </p>
            </div>
          )}

          {/* Details grid */}
          <div className="space-y-3 text-sm">
            <DetailRow label="Transaction ID" value={tx.id} mono />
            <DetailRow label="Date & Time" value={tx.timestamp} />
            <DetailRow label="Type" value={tx.category === 'Admin Credit' ? 'Account Deposit' : tx.category} />
            <div className="h-px bg-[#262626]" />
            <DetailRow label="From" value={`${tx.senderName}`} sub={tx.senderAccount} />
            <DetailRow label="To" value={`${tx.recipientName}`} sub={tx.recipientAccount} />
            <div className="h-px bg-[#262626]" />
            {tx.note && <DetailRow label="Note" value={tx.note === 'Admin credit' ? 'Account Deposit' : tx.note} />}
            <DetailRow label="Fee" value="$0.00" mono />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-2">
          {tx.status === 'Failed' && (
            <button
              onClick={handleContactSupport}
              className="w-full py-3 flex items-center justify-center gap-2 bg-[#FF5555]/10 hover:bg-[#FF5555]/15 border border-[#FF5555]/25 rounded-[2px] text-sm text-[#FF5555] font-semibold transition-colors font-['Poppins']"
            >
              <MessageCircle size={14} /> Contact Support About This
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#222] hover:bg-[#2A2A2A] border border-[#333] rounded-[2px] text-sm text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, sub, mono }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#666] text-xs shrink-0 font-['Inter']">{label}</span>
      <div className="text-right">
        <span className={`text-xs text-white font-medium ${mono ? 'font-mono-figures' : "font-['Inter']"} break-all`}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[#555] font-mono-figures mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

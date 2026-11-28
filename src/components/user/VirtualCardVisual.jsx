import { useState } from 'react';
import { Wifi, Snowflake, Copy, Check, RotateCw } from 'lucide-react';
import { CARD_THEMES, formatCardNumber } from '../../utils/virtualCardUtils';
import logoImg from '../../assets/logo-30_3x.png';

/**
 * VirtualCardVisual — Interactive 3D-flippable Finora virtual debit card.
 * Displays brand, contactless symbol, EMV chip, masked/revealed 16-digit PAN,
 * holder name, expiry, Frozen glass state, and back CVV strip.
 */
export default function VirtualCardVisual({
  card,
  revealed = false,
  flipped = false,
  onToggleFlip,
}) {
  const [copiedPan, setCopiedPan] = useState(false);

  if (!card) return null;

  const theme = CARD_THEMES[card.theme] || CARD_THEMES.obsidian;
  const isFrozen = card.status === 'Frozen';
  const last4 = String(card.cardNumber || '').slice(-4);

  const handleCopyPan = (e) => {
    e.stopPropagation();
    if (!card.cardNumber) return;
    navigator.clipboard?.writeText(card.cardNumber).catch(() => {});
    setCopiedPan(true);
    setTimeout(() => setCopiedPan(false), 1800);
  };

  return (
    <div
      className="w-full max-w-[400px] mx-auto select-none"
      style={{ perspective: '1200px' }}
    >
      <div
        onClick={onToggleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && onToggleFlip) {
            e.preventDefault();
            onToggleFlip();
          }
        }}
        aria-label="Flip virtual card to view security details"
        className="relative w-full aspect-[1.586/1] cursor-pointer transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ══ FRONT FACE ══════════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 rounded-[2px] sm:rounded-[2px] border p-5 sm:p-6 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${theme.bgClass} ${theme.borderClass} shadow-[0_22px_50px_rgba(0,0,0,0.55)]`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Ambient radial glow & diagonal card sheen */}
          <div className={`absolute -right-12 -top-12 w-44 h-44 ${theme.glowClass} rounded-full blur-3xl pointer-events-none`} />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.06] pointer-events-none" />

          {/* Frozen frosted overlay */}
          {isFrozen && (
            <div className="absolute inset-0 z-20 bg-[#0A141D]/70 backdrop-blur-[3px] flex flex-col items-center justify-center gap-2 border-2 border-sky-400/30 rounded-[2px] sm:rounded-[2px]">
              <div className="w-11 h-11 rounded-[2px] bg-sky-400/15 border border-sky-400/35 flex items-center justify-center text-sky-300">
                <Snowflake size={20} />
              </div>
              <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-sky-200 font-['Poppins']">
                Card Frozen
              </span>
              <span className="text-[10px] text-sky-300/75 font-['Inter']">
                All charges blocked until unfrozen
              </span>
            </div>
          )}

          {/* Top Row: Finora Brand + Card Label + Contactless */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img src={logoImg} alt="Finora" width="20" height="20" className="object-contain" />
              <span className="text-[13px] sm:text-[14px] font-bold text-white tracking-tight font-['Poppins']">
                FINORA
              </span>
              <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[1.5px] bg-white/[0.08] border border-white/10 text-[#C9D2C4] font-['Inter'] truncate max-w-[130px]">
                {card.label || 'Virtual'}
              </span>
            </div>
            <Wifi size={18} className="text-white/60 rotate-90 shrink-0" />
          </div>

          {/* Middle: EMV Chip + PAN */}
          <div className="relative z-10 space-y-3 sm:space-y-3.5 my-auto pt-1">
            {/* Metallic EMV Chip */}
            <div className="flex items-center justify-between">
              <div className={`w-10 h-7 sm:w-11 sm:h-8 rounded-[1.5px] bg-gradient-to-br ${theme.chipGradient} p-[1px] shadow-inner`}>
                <div className="w-full h-full rounded-[1.5px] border border-black/25 grid grid-cols-3 gap-[1px] opacity-75">
                  <div className="border-r border-black/25" />
                  <div className="border-r border-black/25" />
                  <div />
                </div>
              </div>
              <span className="text-[10px] text-white/45 font-mono-figures flex items-center gap-1">
                <RotateCw size={10} /> Tap to flip
              </span>
            </div>

            {/* Card Number + quick copy */}
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono-figures text-[15px] sm:text-[18px] font-semibold text-white tracking-[0.09em] truncate">
                {formatCardNumber(card.cardNumber, !revealed)}
              </p>
              <button
                type="button"
                onClick={handleCopyPan}
                aria-label="Copy card number"
                title="Copy 16-digit card number"
                className="p-1.5 rounded-[1.5px] bg-white/[0.08] hover:bg-white/[0.18] text-white/75 hover:text-[#CAFF33] transition-colors shrink-0"
              >
                {copiedPan ? <Check size={13} className="text-[#CAFF33]" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          {/* Bottom Row: Cardholder, Expiry, Network Logo */}
          <div className="relative z-10 flex items-end justify-between gap-3">
            <div className="flex items-center gap-5 sm:gap-7 min-w-0">
              <div className="min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/45 font-['Inter']">
                  Card Holder
                </p>
                <p className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-white truncate max-w-[150px] font-['Poppins']">
                  {card.holderName || 'FINORA MEMBER'}
                </p>
              </div>
              <div className="shrink-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.14em] text-white/45 font-['Inter']">
                  Expires
                </p>
                <p className="text-[11px] sm:text-[12px] font-semibold text-white font-mono-figures">
                  {card.expiry || '11/30'}
                </p>
              </div>
            </div>

            {/* Network Emblem */}
            <div className="shrink-0 flex items-center">
              {card.brand === 'MASTERCARD' ? (
                <div className="flex items-center -space-x-2">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#EB001B]/90 inline-block" />
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#F79E1B]/90 inline-block mix-blend-screen" />
                </div>
              ) : (
                <span className="text-[17px] sm:text-[20px] font-black italic tracking-tight text-white font-['Poppins']">
                  VISA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ══ BACK FACE ═══════════════════════════════════════════════════ */}
        <div
          className={`absolute inset-0 rounded-[2px] sm:rounded-[2px] border flex flex-col justify-between overflow-hidden bg-gradient-to-br ${theme.bgClass} ${theme.borderClass} shadow-[0_22px_50px_rgba(0,0,0,0.55)]`}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-10 sm:h-12 bg-black/85 mt-5 sm:mt-6 border-y border-white/[0.06]" />

          {/* Signature & CVV Bar */}
          <div className="px-5 sm:px-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-9 sm:h-10 rounded-[1.5px] bg-[#E6ECE2]/90 flex items-center px-3 justify-between">
                <span className="text-[10px] italic text-black/45 font-serif tracking-wide truncate">
                  {card.holderName || 'Authorized Signature'}
                </span>
                <span className="text-[9px] text-black/45 font-mono-figures">
                  •••• {last4}
                </span>
              </div>
              <div className="w-16 sm:w-20 h-9 sm:h-10 rounded-[1.5px] bg-black/50 border border-white/15 flex flex-col items-center justify-center shrink-0">
                <span className="text-[8px] uppercase tracking-wider text-white/45 font-['Inter']">
                  CVV
                </span>
                <span className={`text-[13px] sm:text-[14px] font-bold font-mono-figures ${theme.accentText}`}>
                  {revealed ? card.cvv : '•••'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Footer */}
          <div className="px-5 sm:px-6 pb-4 sm:pb-5 flex items-center justify-between text-[9px] sm:text-[10px] text-white/45 font-['Inter']">
            <span>Finora Global Virtual Debit · Instant Controls</span>
            <span className="flex items-center gap-1 text-white/60">
              <RotateCw size={10} /> Flip
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Send, UserCircle2 } from 'lucide-react';

export default function TransferWidget() {
  const [amount, setAmount] = useState('1,250.00');

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shimmer-hover mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-text-main tracking-wide">Quick Transfer</p>
        <button className="text-[10px] text-text-muted hover:text-primary transition-colors uppercase tracking-wider font-medium">
          View All
        </button>
      </div>

      {/* Recent Contacts (Avatars) */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:-translate-y-0.5 transition-transform">
          <UserCircle2 size={16} className="text-black" />
        </div>
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center cursor-pointer hover:-translate-y-0.5 transition-transform overflow-hidden"
          >
            <img
              src={`https://i.pravatar.cc/100?img=${i + 12}`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <button className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center text-text-muted hover:text-text-main hover:border-border-light transition-colors text-xs font-medium">
          +
        </button>
      </div>

      {/* Amount Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-text-muted text-sm font-medium">$</span>
        </div>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-[#222222] border border-border rounded-xl py-2.5 pl-7 pr-4 text-sm font-semibold text-text-main focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Send Button */}
      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary-hover transition-colors">
        <Send size={14} />
        Send Money
      </button>
    </div>
  );
}

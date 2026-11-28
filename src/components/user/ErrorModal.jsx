import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorModal({ title = 'Action Failed', message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#1A1A1A] border border-[#FF5555]/30 rounded-[8px] w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF5555] to-[#FF8888]" />
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 text-[#FF5555] mb-3">
          <div className="p-2.5 bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[6px] shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold font-['Poppins'] text-white">{title}</h3>
            <p className="text-[10px] text-[#FF5555] font-mono-figures uppercase tracking-wider">Action Error</p>
          </div>
        </div>

        <p className="text-[13px] text-[#CCC] leading-relaxed font-['Inter'] mb-6 bg-[#111] p-3.5 rounded-[6px] border border-[#262626]">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-[6px] bg-[#FF5555] hover:bg-[#ff4444] text-white font-semibold text-[13px] transition-all shadow-lg shadow-[#FF5555]/20"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
}

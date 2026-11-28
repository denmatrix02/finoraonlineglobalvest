import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function SuccessModal() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const handleSuccess = (e) => {
      const detail = e.detail;
      if (!detail) return;
      const payload = typeof detail === 'string' ? { title: 'Request Successful', message: detail } : detail;
      setData(payload);
    };

    window.addEventListener('finora:success', handleSuccess);
    return () => window.removeEventListener('finora:success', handleSuccess);
  }, []);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      setData(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full mx-4 sm:mx-0 animate-bounce-in">
      <div className="bg-[#181818]/95 border border-[#CAFF33]/30 rounded-[2px] p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden flex items-start gap-3.5 text-white">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#CAFF33]" />

        <div className="p-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[2px] shrink-0 text-[#CAFF33] mt-0.5">
          <CheckCircle2 size={20} />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-[14px] font-bold font-['Poppins'] text-white flex items-center gap-2">
            {data.title || 'Request Successful'}
          </h4>
          <p className="text-[12px] text-[#BBB] leading-relaxed font-['Inter'] mt-0.5">
            {data.message}
          </p>
        </div>

        <button
          onClick={() => setData(null)}
          className="text-[#666] hover:text-white transition-colors p-1 rounded-[1.5px] hover:bg-[#222] shrink-0"
          aria-label="Close success notification"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

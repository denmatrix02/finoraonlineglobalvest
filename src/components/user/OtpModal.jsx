import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Mail, RefreshCw, X, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { verifyTransferOtp } from '../../lib/otpService';
import { sendOtpEmail } from '../../lib/emailService';

export default function OtpModal({
  isOpen,
  onClose,
  transactionId,
  amount,
  recipientName,
  transferType = 'Transfer',
  onVerifySuccess,
}) {
  const { currentUser } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isShaking, setIsShaking] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoNotice, setInfoNotice] = useState('');

  const inputRefs = useRef([]);

  // Reset state whenever modal opens or transactionId changes
  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setInfoNotice('');
      setVerifying(false);
      setResending(false);
      setResendTimer(60);
      setIsShaking(false);

      // Focus first digit box after short animation delay
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 150);
    }
  }, [isOpen, transactionId]);

  // 60-Second Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (isOpen && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, resendTimer]);

  if (!isOpen) return null;

  const emailToDisplay = currentUser?.email || 'finoraonlineglobalvest@gmail.com';
  const maskedEmail = emailToDisplay.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length));

  const handleInputChange = (index, value) => {
    setError('');
    setInfoNotice('');
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next box
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit when all 6 digits are typed
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyCode(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerifyCode(pastedData);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || resending || verifying) return;
    setResending(true);
    setError('');
    setInfoNotice('');

    try {
      // Call the edge function to generate a new hashed OTP and send the email
      await sendOtpEmail({
        email: currentUser?.email,
        transactionId,
        amount: amount || 0,
        recipientName: recipientName || 'Recipient',
      });
      setOtp(['', '', '', '', '', '']);
      setResendTimer(60);
      setInfoNotice('A fresh 6-digit verification code has been dispatched to your email.');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (codeToTest) => {
    const code = codeToTest || otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setVerifying(true);
    setError('');
    setInfoNotice('');

    try {
      const result = await verifyTransferOtp({
        transactionId,
        submittedOtp: code,
        currentUser,
        onSuccessSettle: async (tx) => {
          if (onVerifySuccess) {
            await onVerifySuccess(tx);
          }
        },
      });

      if (result?.success) {
        setVerifying(false);
      }
    } catch (err) {
      setError(err.message || 'Authorization failed. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setOtp(['', '', '', '', '', '']);
      setVerifying(false);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-fade">
      <div
        className={`relative bg-[#151515] border border-[#2A2A2A] rounded-[2px] p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-modal-pop overflow-hidden ${
          isShaking ? 'animate-otp-shake' : ''
        }`}
      >
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CAFF33] to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={verifying}
          className="absolute top-6 right-6 p-2 rounded-[2px] text-[#666] hover:text-white hover:bg-[#222] transition-colors disabled:opacity-30"
          title="Cancel Authorization"
        >
          <X size={18} />
        </button>

        {/* Shield Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-[2px] bg-[#CAFF33]/10 border border-[#CAFF33]/30 flex items-center justify-center text-[#CAFF33] shadow-[0_0_25px_rgba(202,255,51,0.2)]">
              <ShieldCheck size={32} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-[2px] bg-[#111] border border-[#2A2A2A] flex items-center justify-center text-[#CAFF33]">
              <Lock size={12} />
            </div>
          </div>

          <h2 className="text-[20px] font-bold text-white font-['Poppins'] tracking-tight">
            Transaction OTP Verification
          </h2>
          <p className="text-[12px] text-[#888] font-['Inter'] mt-1 max-w-xs">
            Authorize outbound {transferType.toLowerCase()} of{' '}
            <span className="text-[#CAFF33] font-semibold font-mono">
              ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            {recipientName ? <> to <span className="text-white font-medium">{recipientName}</span></> : ''}.
          </p>
        </div>

        {/* Email Notification Box */}
        <div className="mb-6 p-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-[2px] flex items-center gap-3 text-left">
          <div className="p-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[2px] text-[#CAFF33]">
            <Mail size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#888] font-['Inter']">
              One-Time Password (OTP) sent to:
            </p>
            <p className="text-[13px] font-semibold text-white font-mono tracking-wide mt-0.5">
              {maskedEmail}
            </p>
          </div>
        </div>

        {/* 6 Digit Input Boxes */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={verifying}
                className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-[2px] border outline-none transition-all duration-200 ${
                  digit
                    ? 'bg-[#1A1A1A] border-[#CAFF33] text-[#CAFF33] shadow-[0_0_12px_rgba(202,255,51,0.25)]'
                    : 'bg-[#111] border-[#2A2A2A] text-white focus:border-[#CAFF33] focus:bg-[#161616] focus:shadow-[0_0_10px_rgba(202,255,51,0.15)]'
                }`}
              />
            ))}
          </div>

          {infoNotice && (
            <div className="text-[12px] text-[#CAFF33] bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[2px] px-4 py-2.5 text-center font-['Inter']">
              {infoNotice}
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-[12px] text-[#FF5555] bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[2px] px-4 py-2.5 animate-modal-fade font-['Inter']">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleVerifyCode()}
            disabled={verifying || otp.some((d) => !d)}
            className="w-full py-4 rounded-[2px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(202,255,51,0.25)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {verifying ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Authorizing Transfer...
              </>
            ) : (
              <>
                <KeyRound size={17} /> Verify OTP & Transfer
              </>
            )}
          </button>

          {/* Resend & Cancel Options */}
          <div className="flex items-center justify-between px-2 pt-1 text-[12px] font-['Inter']">
            <button
              onClick={handleResendCode}
              disabled={resendTimer > 0 || resending || verifying}
              className={`flex items-center gap-1.5 transition-colors ${
                resendTimer > 0 || resending || verifying
                  ? 'text-[#555] cursor-not-allowed'
                  : 'text-[#CAFF33] hover:text-[#b8e820] font-semibold'
              }`}
            >
              {resending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <RefreshCw size={13} className={resendTimer > 0 ? '' : 'animate-spin-once'} />
              )}
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend OTP Code'}
            </button>

            <button
              onClick={onClose}
              disabled={verifying}
              className="text-[#666] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

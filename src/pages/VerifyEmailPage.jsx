import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle2, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-30_3x.png';

const RESEND_COOLDOWN = 60; // seconds

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resendVerificationEmail, currentUser } = useAuth();

  // Pick up email/name from navigation state (set by SignUpPage)
  const stateEmail = location.state?.email || '';
  const stateName = location.state?.name || '';

  // Supabase automatically sends the first confirmation email on signUp,
  // so start the cooldown immediately to prevent duplicate sends on mount.
  const [resendCooldown, setResendCooldown] = useState(stateEmail ? RESEND_COOLDOWN : 0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  // If user somehow lands here already verified, push to dashboard
  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!stateEmail || resendCooldown > 0 || resendLoading) return;
    setResendError('');
    setResendSuccess(false);
    setResendLoading(true);
    try {
      await resendVerificationEmail(stateEmail);
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setResendError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Mask the email for display: alex***@gmail.com
  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    const visible = local.slice(0, Math.min(3, local.length));
    return `${visible}${'*'.repeat(Math.max(0, local.length - visible.length))}@${domain}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      {/* Back to signup */}
      <div className="w-full max-w-md mb-6">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-[13px] text-[#555] hover:text-white transition-colors font-['Inter']"
        >
          <ArrowLeft size={14} />
          Back to sign up
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        {/* Top accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #CAFF33, #b8e820, #CAFF33)', borderRadius: '3px 3px 0 0' }} />

        <div className="bg-[#141414] border border-[#1E1E1E] border-t-0 rounded-b-3xl px-8 py-10 text-center space-y-7">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #1a1a1a, #222)',
              border: '1px solid rgba(202,255,51,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px',
              boxShadow: '0 0 24px rgba(202,255,51,0.1)',
            }}>
              <img src={logo} alt="Finora" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>

          {/* Animated envelope */}
          <div className="flex justify-center">
            <div style={{ position: 'relative' }}>
              {/* Outer pulse ring */}
              <div style={{
                position: 'absolute', inset: '-12px', borderRadius: '50%',
                background: 'rgba(202,255,51,0.06)',
                animation: 'ping 2s ease-in-out infinite',
              }} />
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(202,255,51,0.08)',
                border: '1px solid rgba(202,255,51,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Mail size={34} color="#CAFF33" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-[24px] font-bold text-white font-['Poppins'] mb-2">
              {stateName ? `Almost there, ${stateName.split(' ')[0]}!` : 'Check your inbox'}
            </h1>
            <p className="text-[13px] text-[#666] font-['Inter'] leading-relaxed">
              We've sent a confirmation link to
            </p>
            <p className="text-[14px] font-semibold text-[#CAFF33] font-mono mt-1">
              {maskEmail(stateEmail) || 'your email address'}
            </p>
          </div>

          {/* Steps */}
          <div className="bg-[#0e0e0e] border border-[#1E1E1E] rounded-2xl p-4 text-left space-y-3">
            {[
              { n: 1, text: 'Open the email from Finora' },
              { n: 2, text: 'Click the "Verify Email Address" button' },
              { n: 3, text: "You'll be automatically logged in" },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-3">
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'rgba(202,255,51,0.1)',
                  border: '1px solid rgba(202,255,51,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="text-[11px] font-bold text-[#CAFF33] font-mono">{n}</span>
                </div>
                <p className="text-[12px] text-[#888] font-['Inter']">{text}</p>
              </div>
            ))}
          </div>

          {/* Resend success / error feedback */}
          {resendSuccess && (
            <div className="flex items-center gap-2 bg-[#CAFF33]/8 border border-[#CAFF33]/20 rounded-xl px-4 py-3">
              <CheckCircle2 size={15} className="text-[#CAFF33] shrink-0" />
              <p className="text-[12px] text-[#CAFF33] font-['Inter']">New link sent! Check your inbox.</p>
            </div>
          )}
          {resendError && (
            <div className="flex items-center gap-2 bg-[#FF5555]/8 border border-[#FF5555]/20 rounded-xl px-4 py-3">
              <AlertCircle size={15} className="text-[#FF5555] shrink-0" />
              <p className="text-[12px] text-[#FF5555] font-['Inter']">{resendError}</p>
            </div>
          )}

          {/* Resend button */}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading || !stateEmail}
            className="w-full py-3.5 rounded-full border border-[#2A2A2A] text-[13px] font-semibold font-['Inter'] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#CAFF33]/50"
            style={{ color: resendCooldown > 0 ? '#555' : '#CAFF33' }}
          >
            {resendLoading
              ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
              : resendCooldown > 0
                ? <><RefreshCw size={14} /> Resend in {resendCooldown}s</>
                : <><RefreshCw size={14} /> Resend verification email</>
            }
          </button>

          {/* Tip */}
          <p className="text-[11px] text-[#3A3A3A] font-['Inter'] leading-relaxed">
            Can't find the email? Check your spam folder.<br />
            The link expires in <span className="text-[#555]">24 hours</span>.
          </p>
        </div>
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(0.9); opacity: 0.6; }
          70% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

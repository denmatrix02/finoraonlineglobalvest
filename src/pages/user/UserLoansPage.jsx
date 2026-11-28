import React, { useState, useMemo } from 'react';
import { Landmark, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import MonoAmount from '../../components/user/MonoAmount';
import StatusBadge from '../../components/user/StatusBadge';
import ErrorModal from '../../components/user/ErrorModal';
import OtpModal from '../../components/user/OtpModal';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';

function calcMonthlyPayment(principal, annualRate, termMonths) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export default function UserLoansPage() {
  const { currentUser } = useAuth();
  const { loans, settings, applyForLoan, repayLoanInstallment, getUserBalances } = useBanking();

  const myLoans = loans.filter((l) => l.userId === currentUser?.id);
  const activeLoan = myLoans.find((l) => l.status === 'Active');
  const balances = getUserBalances();

  // OTP Security Modal State
  const [otpModalConfig, setOtpModalConfig] = useState({
    isOpen: false,
    amount: 0,
    recipientName: '',
    transferType: 'Transfer',
    onVerifyCallback: null,
  });

  // Apply form state
  const [applyAmount, setApplyAmount] = useState('5000');
  const [applyTerm, setApplyTerm] = useState(12);
  const [applyReason, setApplyReason] = useState('');
  const [applyError, setApplyError] = useState('');
  const [applySuccess, setApplySuccess] = useState('');
  const [showApply, setShowApply] = useState(true);

  // Filter tabs
  const [loanFilter, setLoanFilter] = useState('all');

  const filteredLoans = useMemo(() => {
    return myLoans.filter((l) => {
      if (loanFilter === 'pending') return l.status === 'Pending' || l.status === 'Pending Review';
      if (loanFilter === 'active') return l.status === 'Active';
      if (loanFilter === 'repaid') return l.status === 'Repaid' || l.status === 'Rejected';
      return true;
    });
  }, [myLoans, loanFilter]);

  // Repay modal
  const [repayLoanId, setRepayLoanId] = useState(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayError, setRepayError] = useState('');

  // Live repayment preview
  const monthlyPayment = useMemo(() => {
    const p = parseFloat(applyAmount);
    if (isNaN(p) || p <= 0) return 0;
    return calcMonthlyPayment(p, settings.loanBaseRate || 4.5, applyTerm);
  }, [applyAmount, applyTerm, settings.loanBaseRate]);

  const totalRepayable = monthlyPayment * applyTerm;
  const totalInterest = totalRepayable - parseFloat(applyAmount || 0);

  const handleApply = async (e) => {
    e.preventDefault();
    setApplyError('');
    setApplySuccess('');
    try {
      const createdLoan = await applyForLoan({
        amount: applyAmount,
        termMonths: applyTerm,
        reason: applyReason,
      });
      if (createdLoan?.status === 'Active') {
        setApplySuccess(`Loan of $${parseFloat(applyAmount).toLocaleString()} approved and disbursed to your checking account!`);
      } else {
        setApplySuccess(`Loan application of $${parseFloat(applyAmount).toLocaleString()} submitted and is pending admin approval.`);
      }
      setShowApply(false);
    } catch (err) {
      setApplyError(err.message || 'Loan application failed.');
    }
  };

  const handleRepay = (e) => {
    e.preventDefault();
    setRepayError('');
    const amt = parseFloat(repayAmount);
    if (isNaN(amt) || amt <= 0) return setRepayError('Enter a valid amount.');

    setOtpModalConfig({
      isOpen: true,
      amount: amt,
      recipientName: 'Finora Bank (Loan Repayment)',
      transferType: 'Loan Repayment',
      onVerifyCallback: async () => {
        await repayLoanInstallment(repayLoanId, repayAmount);
        setRepayLoanId(null);
        setRepayAmount('');
        setOtpModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const terms = [3, 6, 12, 24, 36].filter(
    (t) => t >= (settings.minTermMonths || 3) && t <= (settings.maxTermMonths || 36)
  );
  const minAmt = settings.minLoanAmount || 500;
  const maxAmt = settings.maxLoanAmount || 50000;

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-white font-['Poppins']">Loans</h1>
            <p className="text-[11px] text-[#444] font-['Inter']">From {settings.loanBaseRate}% APR · Auto-approved up to <MonoAmount amount={settings.autoApprovalLoanLimit} size="xs" direction="credit" /></p>
          </div>
          {!showApply && (
            <button
              onClick={() => setShowApply(true)}
              className="px-4 py-2 rounded-[3px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-semibold font-['Poppins'] transition-colors"
            >
              + Apply for Loan
            </button>
          )}
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
          {applySuccess && (
            <div className="flex items-start gap-2 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[3px] p-4">
              <CheckCircle2 size={15} className="text-[#CAFF33] mt-0.5 shrink-0" />
              <p className="text-[13px] text-[#CAFF33] font-['Inter']">{applySuccess}</p>
            </div>
          )}

          {/* Apply form */}
          {showApply && (
            <div className="bg-[#1A1A1A] border border-[#222] rounded-[3px] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-white font-['Poppins']">Apply for Loan</h2>
                <button onClick={() => setShowApply(false)} className="text-[#444] hover:text-white transition-colors">
                  <ChevronUp size={18} />
                </button>
              </div>

              <form onSubmit={handleApply} className="space-y-5">
                {/* Amount slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[12px] text-[#555] font-['Inter']">Loan Amount</label>
                    <MonoAmount amount={parseFloat(applyAmount) || 0} direction="credit" size="lg" />
                  </div>
                  <input
                    type="range"
                    min={minAmt}
                    max={maxAmt}
                    step={500}
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    className="w-full accent-[#CAFF33]"
                  />
                  <div className="flex justify-between text-[10px] text-[#444] font-mono-figures mt-1">
                    <span>${minAmt.toLocaleString()}</span>
                    <span>${maxAmt.toLocaleString()}</span>
                  </div>
                </div>

                {/* Manual input */}
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] font-bold font-mono-figures">$</span>
                  <input
                    type="number"
                    value={applyAmount}
                    onChange={(e) => setApplyAmount(e.target.value)}
                    min={minAmt}
                    max={maxAmt}
                    className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[3px] pl-10 pr-5 py-3 text-[15px] text-white font-mono-figures outline-none transition-colors"
                  />
                </div>

                {/* Term selector */}
                <div>
                  <label className="text-[12px] text-[#555] font-['Inter'] mb-2 block">Repayment Term</label>
                  <div className="flex gap-2 flex-wrap">
                    {terms.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setApplyTerm(t)}
                        className={`px-4 py-2 rounded-[3px] border text-[12px] font-medium font-['Inter'] transition-all ${
                          applyTerm === t
                            ? 'bg-[#CAFF33] border-[#CAFF33] text-[#111] font-bold'
                            : 'border-[#2A2A2A] text-[#555] hover:border-[#CAFF33] hover:text-[#CAFF33]'
                        }`}
                      >
                        {t} mo
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <input
                  type="text"
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Reason for loan (optional)"
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[3px] px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
                />

                {/* Live repayment preview */}
                <div className="bg-[#141414] border border-[#CAFF33]/15 rounded-[3px] p-4 space-y-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#555] font-['Inter'] font-semibold mb-3">Repayment Preview</p>
                  <PreviewRow label="Interest Rate" value={`${settings.loanBaseRate}% APR`} />
                  <PreviewRow label="Monthly Payment" value={<MonoAmount amount={monthlyPayment} size="sm" direction="debit" />} />
                  <PreviewRow label="Total Interest" value={<MonoAmount amount={totalInterest} size="sm" direction="debit" />} />
                  <div className="h-px bg-[#222]" />
                  <PreviewRow label="Total Repayable" bold value={<MonoAmount amount={totalRepayable} size="sm" direction="debit" />} />
                  <PreviewRow label="Auto-approval" value={
                    parseFloat(applyAmount) <= settings.autoApprovalLoanLimit
                      ? <span className="text-[#CAFF33] text-[11px] font-mono-figures">✓ Instant</span>
                      : <span className="text-[#F5A623] text-[11px] font-mono-figures">Pending Review</span>
                  } />
                </div>

                {applyError && (
                  <div className="flex items-start gap-2 bg-[#FF5555]/10 border border-[#FF5555]/20 rounded-[3px] p-3">
                    <AlertCircle size={13} className="text-[#FF5555] mt-0.5 shrink-0" />
                    <p className="text-[12px] text-[#FF5555] font-['Inter']">{applyError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-[3px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[14px] font-bold font-['Poppins'] transition-colors"
                >
                  Apply Now — <MonoAmount amount={parseFloat(applyAmount) || 0} size="sm" />
                </button>
              </form>
            </div>
          )}

          {/* My Loans list */}
          {myLoans.length === 0 ? (
            <div className="text-center py-16 text-[#444]">
              <Landmark size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-[14px] font-['Inter']">No loans yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <h2 className="text-[14px] font-semibold text-white font-['Poppins']">My Loans</h2>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#222] rounded-[2px] text-[11px] font-['Inter'] self-start sm:self-auto overflow-x-auto max-w-full">
                  {[
                    { id: 'all', label: 'All Loans', count: myLoans.length },
                    { id: 'pending', label: 'Pending Review', count: myLoans.filter(l => l.status === 'Pending' || l.status === 'Pending Review').length },
                    { id: 'active', label: 'Active', count: myLoans.filter(l => l.status === 'Active').length },
                    { id: 'repaid', label: 'Completed', count: myLoans.filter(l => l.status === 'Repaid' || l.status === 'Rejected').length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setLoanFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-[2px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        loanFilter === tab.id
                          ? 'bg-[#CAFF33] text-[#111] font-semibold shadow-sm'
                          : 'text-[#888] hover:text-white hover:bg-[#1F1F1F]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-[2px] text-[9px] font-mono ${
                          loanFilter === tab.id ? 'bg-[#111]/20 text-[#111]' : 'bg-[#222] text-[#AAA]'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-[#555] bg-[#141414] border border-[#222] rounded-[3px]">
                  <p className="text-[13px] font-['Inter']">No {loanFilter !== 'all' ? loanFilter : ''} loans found.</p>
                </div>
              ) : (
                filteredLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    onRepay={(loanId) => { setRepayLoanId(loanId); setRepayAmount(String(loan.monthlyPayment)); }}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Repay modal */}
      {repayLoanId && (() => {
        const targetLoan = loans.find((l) => l.id === repayLoanId);
        const remaining = targetLoan ? targetLoan.remainingAmount : 0;
        const monthly = targetLoan ? targetLoan.monthlyPayment : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-[#222] rounded-[4px] w-full max-w-md p-6 space-y-5 shadow-2xl">
              <div>
                <h3 className="text-[16px] font-bold text-white font-['Poppins']">Make a Loan Repayment</h3>
                <p className="text-[12px] text-[#888] font-['Inter'] mt-0.5">
                  Choose a repayment mode or specify a custom dollar amount.
                </p>
              </div>

              {/* Quick Mode Options */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRepayAmount(String(monthly))}
                  className={`p-3 rounded-[3px] border text-left transition-all ${
                    repayAmount === String(monthly)
                      ? 'bg-[#CAFF33]/10 border-[#CAFF33] text-white'
                      : 'bg-[#141414] border-[#222] text-[#888] hover:border-[#333] hover:text-white'
                  }`}
                >
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#CAFF33]">Single Installment</p>
                  <p className="text-[14px] font-bold font-mono text-white mt-1">
                    ${monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRepayAmount(String(remaining))}
                  className={`p-3 rounded-[3px] border text-left transition-all ${
                    repayAmount === String(remaining)
                      ? 'bg-[#CAFF33]/10 border-[#CAFF33] text-white'
                      : 'bg-[#141414] border-[#222] text-[#888] hover:border-[#333] hover:text-white'
                  }`}
                >
                  <p className="text-[10px] uppercase font-mono tracking-wider text-[#CAFF33]">Pay Off In Full</p>
                  <p className="text-[14px] font-bold font-mono text-white mt-1">
                    ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </button>
              </div>

              <form onSubmit={handleRepay} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-[#888] font-['Inter'] mb-1.5">Custom Repayment Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] font-bold font-mono-figures">$</span>
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      min="1"
                      max={remaining}
                      step="0.01"
                      required
                      className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-[3px] pl-10 pr-5 py-3.5 text-[16px] text-white font-mono-figures outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-['Inter'] text-[#666]">
                  <span>Checking Balance:</span>
                  <MonoAmount amount={balances.checking} size="xs" direction="credit" />
                </div>

                {repayError && <p className="text-[12px] text-[#FF5555] font-['Inter']">{repayError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setRepayLoanId(null); setRepayError(''); }}
                    className="flex-1 py-3 rounded-[3px] border border-[#2A2A2A] text-[13px] text-[#666] hover:text-white transition-colors font-['Inter']"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 rounded-[3px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-bold font-['Poppins'] transition-colors shadow-lg"
                  >
                    Confirm Repayment
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      <ErrorModal title="Loan Action Failed" message={applyError || repayError} onClose={() => { setApplyError(''); setRepayError(''); }} />
      <OtpModal
        isOpen={otpModalConfig.isOpen}
        onClose={() => setOtpModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onVerify={otpModalConfig.onVerifyCallback}
        amount={otpModalConfig.amount}
        recipientName={otpModalConfig.recipientName}
        transferType={otpModalConfig.transferType}
      />
    </div>
  );
}

function LoanCard({ loan, onRepay }) {
  const [expanded, setExpanded] = useState(false);
  const paidCount = loan.repaymentSchedule.filter((s) => s.status === 'Paid').length;
  const progress = loan.amount > 0 ? ((loan.amount - loan.remainingAmount) / loan.amount) * 100 : 0;
  const nextDue = loan.repaymentSchedule.find((s) => s.status === 'Pending');

  return (
    <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-[3px] overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={loan.status} />
              <span className="text-[10px] text-[#444] font-mono-figures">{loan.id}</span>
            </div>
            <MonoAmount amount={loan.remainingAmount} size="2xl" direction="debit" />
            <p className="text-[11px] text-[#444] mt-0.5 font-['Inter']">
              remaining of <span className="font-mono-figures">${loan.amount.toLocaleString()}</span> at {loan.interestRate}% APR
            </p>
          </div>
          {(loan.status === 'Active') && (
            <button
              onClick={() => onRepay(loan.id)}
              className="px-4 py-2 rounded-[3px] bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] text-[12px] font-semibold hover:bg-[#CAFF33] hover:text-[#111] transition-all font-['Poppins']"
            >
              Repay
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-4">
          <div className="h-1.5 bg-[#222] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#CAFF33] to-[#b8e820] rounded-[3px] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono-figures text-[#444]">
            <span>{Math.round(progress)}% repaid</span>
            <span>{paidCount}/{loan.repaymentSchedule.length} payments</span>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-5 text-[11px] font-['Inter']">
          <div className="flex items-center gap-1.5 text-[#555]">
            <CalendarDays size={12} />
            <span>Next: <span className="text-white font-medium">{nextDue?.dueDate || 'All paid'}</span></span>
          </div>
          <div className="text-[#555]">
            Monthly: <MonoAmount amount={loan.monthlyPayment} size="xs" direction="debit" />
          </div>
          <div className="text-[#555]">{loan.termMonths} mo term</div>
        </div>
      </div>

      {/* Repayment schedule toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 border-t border-[#1F1F1F] text-[11px] text-[#444] hover:text-white hover:bg-[#1F1F1F] transition-colors font-['Inter']"
      >
        <span>Repayment Schedule ({loan.repaymentSchedule.length} installments)</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="border-t border-[#1F1F1F]">
          <div className="max-h-56 overflow-y-auto">
            {loan.repaymentSchedule.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-[#1A1A1A] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'Paid' ? 'bg-[#CAFF33]' : 'bg-[#333]'}`} />
                  <span className="text-[11px] text-[#555] font-['Inter']">#{s.id} · {s.dueDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MonoAmount amount={s.amount} size="xs" />
                  <StatusBadge status={s.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[12px] font-['Inter'] ${bold ? 'text-white font-semibold' : 'text-[#555]'}`}>{label}</span>
      <span className={`text-[12px] ${bold ? 'text-white font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatusBadge from '../../components/user/StatusBadge';
import MonoAmount from '../../components/user/MonoAmount';
import { useBanking } from '../../context/BankingContext';
import {
  Landmark,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  DollarSign,
  Calendar,
} from 'lucide-react';

export default function AdminLoansPage() {
  const { loans, accounts, approveLoan, rejectLoan } = useBanking();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'active' | 'rejected' | 'repaid' | 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLoanId, setExpandedLoanId] = useState(null);

  // Grouped stats
  const pendingLoans = useMemo(() => loans.filter((l) => l.status === 'Pending' || l.status === 'Pending Review'), [loans]);
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'Active'), [loans]);
  const rejectedLoans = useMemo(() => loans.filter((l) => l.status === 'Rejected'), [loans]);
  const repaidLoans = useMemo(() => loans.filter((l) => l.status === 'Repaid'), [loans]);

  const stats = useMemo(() => {
    return {
      pendingCount: pendingLoans.length,
      pendingTotal: pendingLoans.reduce((sum, l) => sum + (l.amount || 0), 0),
      activeCount: activeLoans.length,
      activeTotal: activeLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0),
      repaidCount: repaidLoans.length,
      repaidTotal: repaidLoans.reduce((sum, l) => sum + (l.amount || 0), 0),
      rejectedCount: rejectedLoans.length,
    };
  }, [pendingLoans, activeLoans, repaidLoans, rejectedLoans]);

  // Filtered loans list based on active tab and search query
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Tab matching
      if (activeTab === 'pending' && loan.status !== 'Pending' && loan.status !== 'Pending Review') return false;
      if (activeTab === 'active' && loan.status !== 'Active') return false;
      if (activeTab === 'rejected' && loan.status !== 'Rejected') return false;
      if (activeTab === 'repaid' && loan.status !== 'Repaid') return false;

      // Search term matching
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = loan.userName?.toLowerCase().includes(query);
        const matchId = loan.id?.toLowerCase().includes(query);
        const matchUser = loan.userId?.toLowerCase().includes(query);
        const matchReason = loan.reason?.toLowerCase().includes(query);
        return matchName || matchId || matchUser || matchReason;
      }

      return true;
    });
  }, [loans, activeTab, searchTerm]);

  const handleApprove = async (loanId) => {
    try {
      await approveLoan(loanId);
    } catch (err) {
      alert(err.message || 'Failed to approve loan.');
    }
  };

  const handleReject = async (loanId) => {
    const reason = prompt('Reason for rejecting loan application:', 'Underwriting criteria not met');
    if (reason !== null) {
      try {
        await rejectLoan(loanId, reason);
      } catch (err) {
        alert(err.message || 'Failed to reject loan.');
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0D0F14] text-white">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/30 rounded-2xl text-[#CAFF33]">
              <Landmark size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white font-['Poppins']">
                Loan Management & Underwriting
              </h1>
              <p className="text-xs text-[#8A8A8A] font-['Inter']">
                Review loan applications, approve capital disbursements, and audit global loan status.
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl">
            <div className="flex items-center justify-between text-[#F5A623] mb-2">
              <span className="text-[11px] uppercase font-mono tracking-wider">Pending Underwriting</span>
              <Clock size={16} />
            </div>
            <p className="text-xl font-bold font-mono text-white">
              ${stats.pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#888] mt-1 font-['Inter']">
              {stats.pendingCount} loan request{stats.pendingCount === 1 ? '' : 's'} pending
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl">
            <div className="flex items-center justify-between text-[#CAFF33] mb-2">
              <span className="text-[11px] uppercase font-mono tracking-wider">Active Outstanding</span>
              <TrendingUp size={16} />
            </div>
            <p className="text-xl font-bold font-mono text-white">
              ${stats.activeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#888] mt-1 font-['Inter']">
              {stats.activeCount} active loan{stats.activeCount === 1 ? '' : 's'}
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl">
            <div className="flex items-center justify-between text-[#4ADE80] mb-2">
              <span className="text-[11px] uppercase font-mono tracking-wider">Total Repaid</span>
              <CheckCircle2 size={16} />
            </div>
            <p className="text-xl font-bold font-mono text-white">
              ${stats.repaidTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#888] mt-1 font-['Inter']">
              {stats.repaidCount} loan{stats.repaidCount === 1 ? '' : 's'} settled in full
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl">
            <div className="flex items-center justify-between text-[#FF5555] mb-2">
              <span className="text-[11px] uppercase font-mono tracking-wider">Rejected Loans</span>
              <XCircle size={16} />
            </div>
            <p className="text-xl font-bold font-mono text-white">
              {stats.rejectedCount}
            </p>
            <p className="text-[11px] text-[#888] mt-1 font-['Inter']">
              Applications rejected
            </p>
          </div>
        </div>

        {/* Search & Tabs Toolbar */}
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: 'pending', label: 'Pending Review', count: stats.pendingCount },
                { id: 'active', label: 'Approved / Active', count: stats.activeCount },
                { id: 'repaid', label: 'Repaid / Completed', count: stats.repaidCount },
                { id: 'rejected', label: 'Rejected', count: stats.rejectedCount },
                { id: 'all', label: 'All Loans', count: loans.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-[#CAFF33] text-[#111111] font-bold shadow-md shadow-[#CAFF33]/10'
                      : 'text-[#8A8A8A] hover:bg-[#1F1F1F] hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        activeTab === tab.id ? 'bg-[#111]/20 text-[#111]' : 'bg-[#262626] text-[#AAA]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" />
              <input
                type="text"
                placeholder="Search applicant or loan ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-[#262626] focus:border-[#CAFF33] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#555] outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loans Table */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl overflow-hidden shadow-2xl">
          {filteredLoans.length === 0 ? (
            <div className="p-16 text-center text-[#666] font-['Inter']">
              <Landmark size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No {activeTab !== 'all' ? activeTab : ''} loans found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-[#8A8A8A] uppercase font-mono bg-[#141414]">
                    <th className="py-3.5 px-4">Loan ID</th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Principal</th>
                    <th className="py-3.5 px-4">Remaining</th>
                    <th className="py-3.5 px-4">Term</th>
                    <th className="py-3.5 px-4">Monthly</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {filteredLoans.map((loan) => {
                    const isExpanded = expandedLoanId === loan.id;
                    const statusLower = (loan.status || '').toLowerCase();
                    const isPending = statusLower === 'pending' || statusLower.includes('pending') || statusLower === 'pending review';

                    return (
                      <React.Fragment key={loan.id}>
                        <tr className="hover:bg-[#222222] transition-colors">
                          <td className="py-4 px-4 font-mono font-semibold text-[#CAFF33]">
                            {loan.id}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-white">{loan.userName}</p>
                            <p className="text-[10px] text-[#666] font-mono">{loan.userId}</p>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-white">
                            ${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 font-mono font-semibold text-[#BBB]">
                            ${loan.remainingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-4 text-[#AAA]">
                            {loan.termMonths} mo ({loan.interestRate}% APR)
                          </td>
                          <td className="py-4 px-4 font-mono text-[#AAA]">
                            ${loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge status={loan.status} />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApprove(loan.id)}
                                    className="px-3.5 py-1.5 rounded-lg bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[11px] font-extrabold transition-all font-['Poppins'] shadow-md shadow-[#CAFF33]/20 flex items-center gap-1"
                                  >
                                    <CheckCircle2 size={13} />
                                    Approve & Disburse
                                  </button>
                                  <button
                                    onClick={() => handleReject(loan.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#FF5555]/10 hover:bg-[#FF5555]/20 border border-[#FF5555]/30 text-[#FF5555] text-[11px] font-semibold transition-all font-['Poppins']"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                                className="p-1.5 rounded-lg border border-[#262626] hover:bg-[#262626] text-[#888] hover:text-white transition-colors"
                                title="Inspect Repayment Schedule"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Repayment Schedule Details */}
                        {isExpanded && (
                          <tr className="bg-[#141414]">
                            <td colSpan={8} className="p-4 border-b border-[#262626]">
                              <div className="bg-[#1A1A1A] border border-[#262626] rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                                    <Calendar size={14} className="text-[#CAFF33]" />
                                    Repayment Schedule & Audit Details (#${loan.id})
                                  </h4>
                                  <p className="text-[11px] text-[#666]">
                                    Reason: <span className="text-[#AAA] font-medium">{loan.reason || 'Personal loan'}</span>
                                  </p>
                                </div>

                                {loan.repaymentSchedule && loan.repaymentSchedule.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                                    {loan.repaymentSchedule.map((item) => (
                                      <div
                                        key={item.id}
                                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                                          item.status === 'Paid'
                                            ? 'bg-[#CAFF33]/5 border-[#CAFF33]/20 text-[#CAFF33]'
                                            : 'bg-[#111] border-[#222] text-[#888]'
                                        }`}
                                      >
                                        <div>
                                          <p className="font-mono text-[10px] text-[#666]">Installment #{item.id}</p>
                                          <p className="font-bold text-white mt-0.5">
                                            ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                          </p>
                                          <p className="text-[10px] text-[#666] mt-0.5">{item.dueDate}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                                          item.status === 'Paid' ? 'bg-[#CAFF33]/20 text-[#CAFF33]' : 'bg-[#222] text-[#666]'
                                        }`}>
                                          {item.status}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-[#666] italic">No detailed repayment schedule generated.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

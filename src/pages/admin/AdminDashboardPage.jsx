import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import {
  Users,
  Coins,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Sliders,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import adminDashboardImg from '../../assets/ADMIN DASHBOARD.jpg';

export default function AdminDashboardPage() {
  const { users, createUserByAdmin, deleteUserByAdmin } = useAuth();
  const { accounts, transactions, loans, settings, updateSettings, mintCurrency, approveLoan, rejectLoan } = useBanking();
  const pendingLoans = loans.filter((l) => l.status === 'Pending' || l.status === 'Pending Review');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedUserForFund, setSelectedUserForFund] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [fundSuccess, setFundSuccess] = useState('');
  const [fundError, setFundError] = useState('');

  // Create User state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Delete User state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Settings local form state
  const [savingsAPY, setSavingsAPY] = useState(settings.savingsAPY);
  const [loanBaseRate, setLoanBaseRate] = useState(settings.loanBaseRate);
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(settings.autoApprovalLoanLimit);
  const [minLoanAmount, setMinLoanAmount] = useState(settings.minLoanAmount || 500);
  const [maxLoanAmount, setMaxLoanAmount] = useState(settings.maxLoanAmount || 50000);
  const [transparentAudits, setTransparentAudits] = useState(settings.transparentSymmetricAudits);

  // Compute System Analytics
  const totalUsersCount = users.filter((u) => u.role !== 'admin').length;
  const totalFundedChecking = Object.values(accounts).reduce((sum, a) => sum + (a.checking || 0), 0);
  const totalSavingsVolume = Object.values(accounts).reduce((sum, a) => sum + (a.savings || 0), 0);
  const totalActiveLoansAmount = loans
    .filter((l) => l.status === 'Active')
    .reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    setFundError('');
    setFundSuccess('');
    try {
      if (!selectedUserForFund) throw new Error('Please select a target user account.');
      await mintCurrency({
        targetUserId: selectedUserForFund,
        amount: fundAmount,
        note: fundNote || 'Admin dashboard funding',
      });
      setFundSuccess('Successfully funded account with capital!');
      setFundAmount('');
      setFundNote('');
      setTimeout(() => setShowFundModal(false), 1500);
    } catch (err) {
      setFundError(err.message || 'Funding action failed.');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      savingsAPY: parseFloat(savingsAPY),
      loanBaseRate: parseFloat(loanBaseRate),
      autoApprovalLoanLimit: parseFloat(autoApprovalLimit),
      minLoanAmount: parseFloat(minLoanAmount),
      maxLoanAmount: parseFloat(maxLoanAmount),
      transparentSymmetricAudits: transparentAudits,
    });
    setShowSettingsModal(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    try {
      if (!newUserName || !newUserEmail) throw new Error('Please fill in all fields.');
      await createUserByAdmin({ name: newUserName, email: newUserEmail, role: newUserRole });
      setCreateSuccess(`Account created successfully for ${newUserName}!`);
      setNewUserName('');
      setNewUserEmail('');
      setTimeout(() => setShowCreateModal(false), 1500);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteSuccess('');
    try {
      if (!selectedUserToDelete) throw new Error('Please select a user to delete.');
      await deleteUserByAdmin(selectedUserToDelete);
      setDeleteSuccess('User deleted successfully.');
      setTimeout(() => setShowDeleteModal(false), 1500);
    } catch (err) {
      setDeleteError(err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#0D0F14] min-h-screen text-white font-sans pb-16 md:pb-0">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#262626]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              System Administration Dashboard
              <span className="bg-[#CAFF33]/10 text-[#CAFF33] border border-[#CAFF33]/30 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
                LIVE METRICS
              </span>
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-1">
              Real-time monitoring of account balances, accounts, loans, interest settings & symmetric audit logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#262626] text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            >
              <Sliders size={15} className="text-[#CAFF33]" /> Settings
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#262626] text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            >
              <UserPlus size={15} className="text-[#CAFF33]" /> Create Account
            </button>
            <button
              onClick={() => {
                if (users.filter((u) => u.role !== 'admin').length > 0) {
                  setSelectedUserToDelete(users.find((u) => u.role !== 'admin').id);
                }
                setShowDeleteModal(true);
              }}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#222222] border border-[#262626] text-[#FF5555] px-4 py-2.5 rounded-xl text-xs font-medium transition-all"
            >
              <UserMinus size={15} /> Delete Account
            </button>
            <button
              onClick={() => {
                if (users.filter((u) => u.role !== 'admin').length > 0) {
                  setSelectedUserForFund(users.find((u) => u.role !== 'admin').id);
                }
                setShowFundModal(true);
              }}
              className="flex items-center gap-2 bg-[#CAFF33] hover:bg-[#b8e820] text-[#111111] font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#CAFF33]/10"
            >
              <Coins size={15} /> Fund User Account
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8A8A8A] mb-3">
              <span className="text-xs uppercase font-mono tracking-wider">Total Active Users</span>
              <Users size={16} className="text-[#CAFF33]" />
            </div>
            <p className="text-2xl font-bold font-mono text-white">{totalUsersCount}</p>
            <p className="text-[11px] text-[#8A8A8A] mt-2 flex items-center gap-1">
              <TrendingUp size={12} className="text-[#CAFF33]" /> 100% Verified System Accounts
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8A8A8A] mb-3">
              <span className="text-xs uppercase font-mono tracking-wider">Total Checking Volume</span>
              <Coins size={16} className="text-[#CAFF33]" />
            </div>
            <p className="text-2xl font-bold font-mono text-[#CAFF33]">
              ${totalFundedChecking.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#8A8A8A] mt-2">Liquid Capital</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8A8A8A] mb-3">
              <span className="text-xs uppercase font-mono tracking-wider">Savings Volume ({settings.savingsAPY}% APY)</span>
              <DollarSign size={16} className="text-[#CAFF33]" />
            </div>
            <p className="text-2xl font-bold font-mono text-white">
              ${totalSavingsVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#8A8A8A] mt-2">Compounding Savings Pool</p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#262626] p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between text-[#8A8A8A] mb-3">
              <span className="text-xs uppercase font-mono tracking-wider">Active Loans Outstanding</span>
              <ArrowUpRight size={16} className="text-[#CAFF33]" />
            </div>
            <p className="text-2xl font-bold font-mono text-white">
              ${totalActiveLoansAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-[#8A8A8A] mt-2">Base Loan Rate: {settings.loanBaseRate}%</p>
          </div>
        </div>

        {/* System Audit Transparency Banner */}
        <div className="bg-gradient-to-r from-[#1A1A1A] via-[#1F1F1F] to-[#1A1A1A] border border-[#262626] p-6 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#CAFF33]/10 border border-[#CAFF33]/30 rounded-2xl text-[#CAFF33] shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Symmetric Transparency Guarantee
                <span className="text-[10px] bg-[#CAFF33]/20 text-[#CAFF33] px-2 py-0.5 rounded font-mono">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-[#8A8A8A] mt-1 max-w-2xl leading-relaxed">
                Every peer-to-peer transfer executes symmetrically: sender debited and recipient credited in a single atomic transaction step. Both counterparties receive real-time transparent audit logs.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Loan Applications Review */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                🏛️ Pending Loan Underwriting Requests
                <span className="text-[11px] bg-[#F5A623]/20 text-[#F5A623] px-2 py-0.5 rounded font-mono font-semibold">
                  {pendingLoans.length} PENDING
                </span>
              </h2>
              <p className="text-xs text-[#8A8A8A]">Review loan applications submitted by client accounts before capital disbursement</p>
            </div>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[#262626] rounded-xl bg-[#141414]">
              <p className="text-xs text-[#666] font-['Inter']">No pending loan applications requiring admin review.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#262626] text-[#8A8A8A] uppercase font-mono">
                    <th className="pb-3 px-3">Loan ID</th>
                    <th className="pb-3 px-3">Applicant</th>
                    <th className="pb-3 px-3">Amount</th>
                    <th className="pb-3 px-3">Term</th>
                    <th className="pb-3 px-3">Monthly</th>
                    <th className="pb-3 px-3">Reason</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {pendingLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-[#222222] transition-colors">
                      <td className="py-3.5 px-3 font-mono text-[#CAFF33] font-semibold">{loan.id}</td>
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-white">{loan.userName}</p>
                        <p className="text-[10px] text-[#666] font-mono">{loan.userId}</p>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-white">
                        ${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-[#BBB]">{loan.termMonths} months</td>
                      <td className="py-3.5 px-3 font-mono text-[#BBB]">
                        ${loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                      </td>
                      <td className="py-3.5 px-3 text-[#8A8A8A] max-w-xs truncate">{loan.reason}</td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await approveLoan(loan.id);
                              } catch (err) {
                                alert(err.message);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[11px] font-bold transition-all font-['Poppins']"
                          >
                            Approve & Disburse
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt('Reason for rejecting loan application:', 'Risk criteria not met');
                              if (reason !== null) {
                                try {
                                  await rejectLoan(loan.id, reason);
                                } catch (err) {
                                  alert(err.message);
                                }
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#FF5555]/10 hover:bg-[#FF5555]/20 border border-[#FF5555]/30 text-[#FF5555] text-[11px] font-semibold transition-all font-['Poppins']"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent System-wide Transactions */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">System Transaction Audit Feed</h2>
              <p className="text-xs text-[#8A8A8A]">Live global ledger entries across all users</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[#8A8A8A] uppercase font-mono">
                  <th className="pb-3 px-3">Tx ID</th>
                  <th className="pb-3 px-3">Date / Time</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Sender (Debit)</th>
                  <th className="pb-3 px-3">Recipient (Credit)</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {transactions.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#222222] transition-colors">
                    <td className="py-3.5 px-3 font-mono text-[#8A8A8A]">{tx.id}</td>
                    <td className="py-3.5 px-3 text-[#A1A1A1]">{tx.timestamp}</td>
                    <td className="py-3.5 px-3">
                      <span className="bg-[#262626] text-white px-2 py-1 rounded text-[11px] font-mono">
                        {tx.category || tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-white">{tx.senderName}</p>
                      <p className="text-[10px] text-[#8A8A8A] font-mono">{tx.senderAccount}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-medium text-white">{tx.recipientName}</p>
                      <p className="text-[10px] text-[#8A8A8A] font-mono">{tx.recipientAccount}</p>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#CAFF33]">
                      ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-[#CAFF33]/10 text-[#CAFF33] px-2 py-0.5 rounded text-[10px] font-medium border border-[#CAFF33]/30">
                        <CheckCircle2 size={10} /> {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Fund User Account Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Coins className="text-[#CAFF33]" size={20} /> Fund User Account
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Instantly credit funds to any target user checking account.
            </p>

            {fundError && (
              <div className="mb-4 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} /> {fundError}
              </div>
            )}

            {fundSuccess && (
              <div className="mb-4 bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={15} /> {fundSuccess}
              </div>
            )}

            <form onSubmit={handleFundSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Select Target Account</label>
                <select
                  value={selectedUserForFund}
                  onChange={(e) => setSelectedUserForFund(e.target.value)}
                  className="input-field"
                >
                  {users
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.accountNo}) - {u.email}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Fund Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5000.00"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Audit Note</label>
                <input
                  type="text"
                  placeholder="e.g. Seed Funding"
                  value={fundNote}
                  onChange={(e) => setFundNote(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="px-4 py-2 text-xs text-[#8A8A8A] hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs px-5 py-2">
                  Confirm Funding & Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Settings & Rates Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Sliders className="text-[#CAFF33]" size={20} /> Bank Policy & Rate Settings
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Configure system-wide savings interest APY, loan interest rates, auto-approval thresholds.
            </p>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Savings APY Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={savingsAPY}
                  onChange={(e) => setSavingsAPY(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Base Loan Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={loanBaseRate}
                  onChange={(e) => setLoanBaseRate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Auto-Approval Loan Limit ($)</label>
                <input
                  type="number"
                  value={autoApprovalLimit}
                  onChange={(e) => setAutoApprovalLimit(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Min Loan ($)</label>
                  <input
                    type="number"
                    value={minLoanAmount}
                    onChange={(e) => setMinLoanAmount(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Max Loan ($)</label>
                  <input
                    type="number"
                    value={maxLoanAmount}
                    onChange={(e) => setMaxLoanAmount(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="transparency"
                  checked={transparentAudits}
                  onChange={(e) => setTransparentAudits(e.target.checked)}
                  className="w-4 h-4 accent-[#CAFF33] rounded"
                />
                <label htmlFor="transparency" className="text-xs text-white">
                  Transparent Symmetric Audits (Sender & Recipient visibility)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs text-[#8A8A8A] hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs px-5 py-2">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="text-[#CAFF33]" size={20} /> Create User Account
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Add a new user to the Finora ecosystem.
            </p>

            {createError && (
              <div className="mb-4 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} /> {createError}
              </div>
            )}

            {createSuccess && (
              <div className="mb-4 bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={15} /> {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. David Miller"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. david@finora.app"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Role Access</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="input-field"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-[#8A8A8A] hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs px-5 py-2">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserMinus className="text-[#FF5555]" size={20} /> Delete User Account
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Permanently remove a user account from the system. This action cannot be undone.
            </p>

            {deleteError && (
              <div className="mb-4 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} /> {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="mb-4 bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] p-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={15} /> {deleteSuccess}
              </div>
            )}

            <form onSubmit={handleDeleteUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Select Target Account</label>
                <select
                  value={selectedUserToDelete}
                  onChange={(e) => setSelectedUserToDelete(e.target.value)}
                  className="input-field"
                >
                  {users
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.accountNo}) - {u.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs text-[#8A8A8A] hover:text-white"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-[#FF5555] hover:bg-[#ff3333] text-white rounded-full font-semibold text-xs px-5 py-2 transition-all">
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

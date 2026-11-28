import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import {
  Users,
  Coins,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Ban,
  DollarSign,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { FUNDING_SOURCES } from '../../utils/transactionDisplay';

export default function AdminUsersPage() {
  const { users, createUserByAdmin, toggleUserStatus } = useAuth();
  const { accounts, mintCurrency } = useBanking();

  const [searchTerm, setSearchTerm] = useState('');

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Fund Modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundSource, setFundSource] = useState('wire_transfer');
  const [fundSenderName, setFundSenderName] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [fundSuccess, setFundSuccess] = useState('');
  const [fundError, setFundError] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.accountNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    try {
      if (!newUserName || !newUserEmail) throw new Error('Please fill in all fields.');
      createUserByAdmin({ name: newUserName, email: newUserEmail, role: newUserRole });
      setCreateSuccess(`Account created successfully for ${newUserName}!`);
      setNewUserName('');
      setNewUserEmail('');
      setTimeout(() => setShowCreateModal(false), 1500);
    } catch (err) {
      setCreateError(err.message);
    }
  };

  const handleFundSubmit = async (e) => {
    e.preventDefault();
    setFundError('');
    setFundSuccess('');
    try {
      if (!selectedUser) throw new Error('No user selected.');
      await mintCurrency({
        targetUserId: selectedUser.id,
        amount: fundAmount,
        note: fundNote,
        fundingSource: fundSource,
        customSenderName: fundSenderName,
      });
      setFundSuccess(`Funded ${selectedUser.name} with $${parseFloat(fundAmount).toLocaleString('en-US')}!`);
      setFundAmount('');
      setFundNote('');
      setFundSenderName('');
      setTimeout(() => setShowFundModal(false), 1500);
    } catch (err) {
      setFundError(err.message || 'Funding action failed.');
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
              User Account Management & Funding
              <span className="bg-[#CAFF33]/10 text-[#CAFF33] border border-[#CAFF33]/30 text-xs px-2.5 py-1 rounded-full font-mono font-medium">
                FUND & MINT
              </span>
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-1">
              Create test accounts, inspect balances, suspend accounts, and inject funds directly.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#CAFF33] hover:bg-[#b8e820] text-[#111111] font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#CAFF33]/10"
          >
            <UserPlus size={15} /> Create Test User Account
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-3.5 text-[#8A8A8A]" />
            <input
              type="text"
              placeholder="Search by name, email, or account number (e.g. ACC-849204)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="text-xs text-[#8A8A8A] font-mono shrink-0">
            Showing <span className="text-[#CAFF33] font-bold">{filteredUsers.length}</span> Registered Users
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#141414] text-[#8A8A8A] uppercase font-mono">
                  <th className="py-4 px-4">User Details</th>
                  <th className="py-4 px-4">Account Number</th>
                  <th className="py-4 px-4 text-right">Checking Balance</th>
                  <th className="py-4 px-4 text-right">Savings Balance</th>
                  <th className="py-4 px-4 text-right">Active Loan</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredUsers.map((u) => {
                  const uAcc = accounts[u.id] || { checking: 0, savings: 0, loan: 0 };
                  return (
                    <tr key={u.id} className="hover:bg-[#222222] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#262626]"
                          />
                          <div>
                            <p className="font-semibold text-white text-sm flex items-center gap-1.5">
                              {u.name}
                              {u.role === 'admin' && (
                                <span className="bg-[#CAFF33]/10 text-[#CAFF33] text-[9px] px-1.5 py-0.2 rounded uppercase font-mono">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[#8A8A8A] text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[#A1A1A1]">{u.accountNo}</td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-[#CAFF33]">
                        ${uAcc.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-white">
                        ${uAcc.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-[#FF5555]">
                        ${uAcc.loan.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            u.status === 'Active'
                              ? 'bg-[#CAFF33]/10 text-[#CAFF33] border-[#CAFF33]/30'
                              : 'bg-[#FF5555]/10 text-[#FF5555] border-[#FF5555]/30'
                          }`}
                        >
                          {u.status === 'Active' ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                          {u.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowFundModal(true);
                            }}
                            className="bg-[#CAFF33]/10 hover:bg-[#CAFF33] text-[#CAFF33] hover:text-[#111111] border border-[#CAFF33]/30 px-3 py-1.5 rounded-lg font-medium text-[11px] transition-all flex items-center gap-1"
                          >
                            <Coins size={12} /> Fund Account
                          </button>

                          {u.role !== 'admin' && (
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`p-1.5 rounded-lg border transition-all ${
                                u.status === 'Active'
                                  ? 'bg-[#FF5555]/10 border-[#FF5555]/30 text-[#FF5555] hover:bg-[#FF5555] hover:text-white'
                                  : 'bg-[#CAFF33]/10 border-[#CAFF33]/30 text-[#CAFF33] hover:bg-[#CAFF33] hover:text-[#111111]'
                              }`}
                              title={u.status === 'Active' ? 'Suspend User' : 'Activate User'}
                            >
                              <Ban size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="text-[#CAFF33]" size={20} /> Create Test User Account
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Add a new user to the Finora ecosystem with an auto-assigned account number.
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
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund User Modal */}
      {showFundModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Coins className="text-[#CAFF33]" size={20} /> Fund Account
            </h2>
            <p className="text-xs text-[#8A8A8A] mb-5">
              Directly inject funds into <strong className="text-white">{selectedUser.name}</strong> ({selectedUser.accountNo}).
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
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Funding Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10000.00"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Deposit Channel / Source</label>
                <select
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value)}
                  className="input-field"
                >
                  {FUNDING_SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label} — {s.senderName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Sender / Institution (Optional Override)</label>
                <input
                  type="text"
                  placeholder="Leave blank for default source name"
                  value={fundSenderName}
                  onChange={(e) => setFundSenderName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Deposit Description / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Incoming Domestic Wire Transfer"
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
                  Confirm Funding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

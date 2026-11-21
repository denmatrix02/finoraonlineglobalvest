import React, { useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import {
  ArrowLeftRight, Play, CheckCircle2, AlertCircle, Filter,
  Clock, Building2, Bitcoin, X, Check, ChevronDown, Zap,
} from 'lucide-react';

const PAGE_TABS = [
  { id: 'ledger', label: 'Internal Ledger' },
  { id: 'external', label: 'External Transfers' },
];

export default function AdminTransactionsPage() {
  const { users } = useAuth();
  const { transactions, transferFunds, settings, toggleTransactionStatus, externalTransfers, resolveExternalTransfer } = useBanking();

  const [pageTab, setPageTab] = useState('ledger');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Simulation form state
  const [senderId, setSenderId] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [simAmount, setSimAmount] = useState('');
  const [simNote, setSimNote] = useState('');
  const [simSuccess, setSimSuccess] = useState('');
  const [simError, setSimError] = useState('');

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  // External filter
  const [extFilter, setExtFilter] = useState('all'); // all | bank | crypto | Pending | Completed | Failed

  const filteredTx = transactions.filter((tx) => {
    if (categoryFilter === 'all') return true;
    return tx.type === categoryFilter || tx.category === categoryFilter;
  });

  const filteredExt = externalTransfers.filter((e) => {
    if (extFilter === 'all') return true;
    return e.transferType === extFilter || e.status === extFilter;
  });

  const pendingExtCount = externalTransfers.filter(e => e.status === 'Pending').length;

  const handleSimulateSubmit = (evt) => {
    evt.preventDefault();
    setSimError(''); setSimSuccess('');
    try {
      if (!senderId || !recipientAccount || !simAmount) throw new Error('All simulation parameters are required.');
      const senderUser = users.find((u) => u.id === senderId);
      if (!senderUser) throw new Error('Sender user not found.');
      transferFunds({ recipientAccountNo: recipientAccount, amount: simAmount, note: simNote || 'Admin simulated symmetric transfer', sourceAccountType: 'checking' });
      setSimSuccess('Simulation executed! Symmetric debits/credits updated atomically.');
      setSimAmount(''); setSimNote('');
      setTimeout(() => setShowSimulateModal(false), 1500);
    } catch (err) { setSimError(err.message); }
  };

  const handleApprove = async (extId) => {
    try { await resolveExternalTransfer(extId, { status: 'Completed' }); }
    catch (err) { console.error(err); }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await resolveExternalTransfer(rejectTarget, { status: 'Failed', failureReason: rejectReason || 'Request declined by admin.' });
      setRejectTarget(null); setRejectReason('');
    } catch (err) { console.error(err); }
    finally { setRejectLoading(false); }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#0D0F14] min-h-screen text-white font-sans pb-16 md:pb-0">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#262626]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Transaction Management
              <span className="bg-[#CAFF33]/10 text-[#CAFF33] border border-[#CAFF33]/30 text-xs px-2.5 py-1 rounded-full font-mono font-medium">AUDIT</span>
              {pendingExtCount > 0 && (
                <span className="bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/30 text-xs px-2 py-1 rounded-full font-mono font-medium">
                  {pendingExtCount} pending
                </span>
              )}
            </h1>
            <p className="text-sm text-[#8A8A8A] mt-1">Internal ledger and external transfer approvals.</p>
          </div>

          <button
            onClick={() => {
              if (users.filter((u) => u.role !== 'admin').length > 0) setSenderId(users.find((u) => u.role !== 'admin').id);
              setShowSimulateModal(true);
            }}
            className="flex items-center gap-2 bg-[#CAFF33] hover:bg-[#b8e820] text-[#111111] font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-[#CAFF33]/10"
          >
            <Play size={15} /> Simulate Transfer
          </button>
        </div>

        {/* Page Tabs */}
        <div className="flex gap-2 mb-6 bg-[#161616] border border-[#262626] rounded-xl p-1">
          {PAGE_TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setPageTab(id)}
              className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${pageTab === id ? 'bg-[#CAFF33] text-[#111]' : 'text-[#666] hover:text-white'}`}>
              {label}
              {id === 'external' && pendingExtCount > 0 && (
                <span className="ml-2 bg-[#F5A623] text-[#111] text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingExtCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════ INTERNAL LEDGER ══════════════════════════════ */}
        {pageTab === 'ledger' && (
          <>
            <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={15} className="text-[#CAFF33]" />
                <span className="text-xs text-[#8A8A8A] font-mono">Filter:</span>
                {['all', 'transfer', 'deposit', 'loan_disbursement', 'loan_repayment'].map((cat) => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${categoryFilter === cat ? 'bg-[#CAFF33] text-[#111111] font-semibold' : 'bg-[#222222] text-[#8A8A8A] hover:text-white'}`}>
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[#8A8A8A] font-mono">Entries: <span className="text-[#CAFF33] font-bold">{filteredTx.length}</span></div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#262626] bg-[#141414] text-[#8A8A8A] uppercase font-mono">
                      <th className="py-4 px-4">Tx ID / Date</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Sender (Debit)</th>
                      <th className="py-4 px-4">Recipient (Credit)</th>
                      <th className="py-4 px-4">Note</th>
                      <th className="py-4 px-4 text-right">Amount</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262626]">
                    {filteredTx.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#222222] transition-colors">
                        <td className="py-4 px-4">
                          <p className="font-mono text-[#CAFF33] font-semibold truncate max-w-[140px]">{tx.id}</p>
                          <p className="text-[#8A8A8A] text-[10px] flex items-center gap-1 mt-0.5"><Clock size={10} /> {tx.timestamp}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-[#262626] text-white px-2.5 py-1 rounded-full text-[11px] font-mono border border-[#333]">{tx.category || tx.type}</span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-white">{tx.senderName}</p>
                          <p className="text-[10px] text-[#8A8A8A] font-mono">{tx.senderAccount}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-white">{tx.recipientName}</p>
                          <p className="text-[10px] text-[#8A8A8A] font-mono">{tx.recipientAccount}</p>
                        </td>
                        <td className="py-4 px-4 text-[#A1A1A1] italic">{tx.note || '-'}</td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-[#CAFF33]">
                          ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {tx.status === 'Completed' ? (
                            <span className="inline-flex items-center gap-1 bg-[#CAFF33]/10 text-[#CAFF33] px-2 py-0.5 rounded text-[10px] font-medium border border-[#CAFF33]/30"><CheckCircle2 size={10} /> Completed</span>
                          ) : tx.status === 'Failed' ? (
                            <span className="inline-flex flex-col items-start gap-0.5">
                              <span className="inline-flex items-center gap-1 bg-[#FF5555]/10 text-[#FF5555] px-2 py-0.5 rounded text-[10px] font-medium border border-[#FF5555]/30"><AlertCircle size={10} /> Failed</span>
                              {tx.failureReason && <span className="text-[9px] text-[#FF5555]/60 italic ml-1">{tx.failureReason}</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-[#F5A623]/10 text-[#F5A623] px-2 py-0.5 rounded text-[10px] font-medium border border-[#F5A623]/30"><Clock size={10} /> {tx.status}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button onClick={() => toggleTransactionStatus(tx.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${tx.status === 'Failed' ? 'bg-[#CAFF33]/10 border-[#CAFF33]/30 text-[#CAFF33] hover:bg-[#CAFF33] hover:text-[#111]' : 'bg-[#FF5555]/10 border-[#FF5555]/30 text-[#FF5555] hover:bg-[#FF5555] hover:text-white'}`}
                            title={tx.status === 'Failed' ? 'Restore to Completed' : 'Simulate Failure'}>
                            <Zap size={11} className="inline mr-1" />{tx.status === 'Failed' ? 'Restore' : 'Fail'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════ EXTERNAL TRANSFERS ══════════════════════════ */}
        {pageTab === 'external' && (
          <>
            <div className="bg-[#1A1A1A] border border-[#262626] p-4 rounded-2xl mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={15} className="text-[#CAFF33]" />
                <span className="text-xs text-[#8A8A8A] font-mono">Filter:</span>
                {['all', 'bank', 'crypto', 'Pending', 'Completed', 'Failed'].map((f) => (
                  <button key={f} onClick={() => setExtFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${extFilter === f ? 'bg-[#CAFF33] text-[#111] font-semibold' : 'bg-[#222] text-[#8A8A8A] hover:text-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="text-xs text-[#8A8A8A] font-mono">Requests: <span className="text-[#CAFF33] font-bold">{filteredExt.length}</span></div>
            </div>

            {filteredExt.length === 0 ? (
              <div className="text-center py-20 text-[#444] font-['Inter'] text-sm">No external transfer requests yet.</div>
            ) : (
              <div className="space-y-4">
                {filteredExt.map((ext) => (
                  <div key={ext.id} className={`bg-[#1A1A1A] border rounded-2xl p-5 transition-all ${ext.status === 'Pending' ? 'border-[#F5A623]/30' : ext.status === 'Completed' ? 'border-[#CAFF33]/20' : 'border-[#FF5555]/20'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Type icon */}
                      <div className={`p-3 rounded-xl shrink-0 ${ext.transferType === 'crypto' ? 'bg-[#F7931A]/10' : 'bg-[#CAFF33]/8'}`}>
                        {ext.transferType === 'crypto'
                          ? <Bitcoin size={22} className="text-[#F7931A]" />
                          : <Building2 size={22} className="text-[#CAFF33]" />}
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-bold text-white font-['Poppins']">{ext.userName}</p>
                          <span className="text-[10px] font-mono text-[#555]">{ext.id}</span>
                          <StatusDot status={ext.status} />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-[12px]">
                          <InfoRow label="Type" value={ext.transferType === 'crypto' ? 'USDT Crypto' : 'Bank Wire'} />
                          <InfoRow label="Amount" value={`$${ext.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} highlight />
                          <InfoRow label="Date" value={ext.createdAt ? new Date(ext.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />

                          {ext.transferType === 'bank' ? (
                            <>
                              <InfoRow label="Bank" value={ext.bankName || '—'} />
                              <InfoRow label="Account Holder" value={ext.accountHolder || '—'} />
                              <InfoRow label="Account No." value={ext.accountNumber || '—'} mono />
                              <InfoRow label="Routing" value={ext.routingNumber || '—'} mono />
                            </>
                          ) : (
                            <>
                              <InfoRow label="Wallet" value={ext.walletAddress ? `${ext.walletAddress.slice(0, 8)}…${ext.walletAddress.slice(-6)}` : '—'} mono />
                              <InfoRow label="Network" value={ext.network || '—'} />
                            </>
                          )}

                          {ext.note && <InfoRow label="Note" value={ext.note} />}
                          {ext.failureReason && <InfoRow label="Decline Reason" value={ext.failureReason} red />}
                        </div>
                      </div>

                      {/* Actions (only for Pending) */}
                      {ext.status === 'Pending' && (
                        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                          <button onClick={() => handleApprove(ext.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] text-[12px] font-bold hover:bg-[#CAFF33] hover:text-[#111] transition-all">
                            <Check size={13} /> Approve
                          </button>
                          <button onClick={() => setRejectTarget(ext.id)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] text-[12px] font-bold hover:bg-[#FF5555] hover:text-white transition-all">
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Reject Reason Modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#FF5555]/30 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF5555]/10 rounded-lg"><AlertCircle size={20} className="text-[#FF5555]" /></div>
              <h3 className="text-[16px] font-bold text-white font-['Poppins']">Decline Transfer</h3>
            </div>
            <p className="text-[13px] text-[#888] font-['Inter']">Provide a reason for declining. This will be sent to the user's notifications.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Wallet address could not be verified. Please contact support."
              rows={3}
              className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#FF5555] rounded-xl px-4 py-3 text-[13px] text-white placeholder:text-[#333] outline-none resize-none font-['Inter']"
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="flex-1 py-2.5 rounded-xl border border-[#2A2A2A] text-[#666] hover:text-white text-[13px] transition-colors font-['Inter']">Cancel</button>
              <button onClick={handleRejectConfirm} disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] hover:bg-[#FF5555] hover:text-white text-[13px] font-bold transition-all disabled:opacity-50 font-['Poppins']">
                {rejectLoading ? 'Declining…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Simulate Transfer Modal ── */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#262626] rounded-2xl w-full max-w-md p-6 relative">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2"><Play className="text-[#CAFF33]" size={20} /> Simulate Transfer</h2>
            <p className="text-xs text-[#8A8A8A] mb-5">Execute a real-time atomic transfer between two users.</p>
            {simError && <div className="mb-4 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-3 rounded-xl text-xs flex items-center gap-2"><AlertCircle size={15} /> {simError}</div>}
            {simSuccess && <div className="mb-4 bg-[#CAFF33]/10 border border-[#CAFF33]/30 text-[#CAFF33] p-3 rounded-xl text-xs flex items-center gap-2"><CheckCircle2 size={15} /> {simSuccess}</div>}
            <form onSubmit={handleSimulateSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Sender Account</label>
                <select value={senderId} onChange={(e) => setSenderId(e.target.value)} className="input-field">
                  {users.filter((u) => u.role !== 'admin').map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.accountNo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Recipient Account No</label>
                <input type="text" placeholder="e.g. ACC-392019" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Amount ($)</label>
                <input type="number" step="0.01" placeholder="e.g. 250.00" value={simAmount} onChange={(e) => setSimAmount(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="block text-xs text-[#8A8A8A] mb-1 font-mono">Note</label>
                <input type="text" placeholder="Simulation note" value={simNote} onChange={(e) => setSimNote(e.target.value)} className="input-field" />
              </div>
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#262626]">
                <button type="button" onClick={() => setShowSimulateModal(false)} className="px-4 py-2 text-xs text-[#8A8A8A] hover:text-white">Cancel</button>
                <button type="submit" className="btn btn-primary text-xs px-5 py-2">Run Simulation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }) {
  const map = { Pending: 'bg-[#F5A623] text-[#F5A623]', Completed: 'bg-[#CAFF33] text-[#CAFF33]', Failed: 'bg-[#FF5555] text-[#FF5555]' };
  const colors = map[status] || 'bg-[#555] text-[#555]';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status === 'Pending' ? 'bg-[#F5A623]/10 border-[#F5A623]/30 text-[#F5A623]' : status === 'Completed' ? 'bg-[#CAFF33]/10 border-[#CAFF33]/30 text-[#CAFF33]' : 'bg-[#FF5555]/10 border-[#FF5555]/30 text-[#FF5555]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${map[status]?.split(' ')[0] || 'bg-[#555]'}`} />
      {status}
    </span>
  );
}

function InfoRow({ label, value, highlight, mono, red }) {
  return (
    <div>
      <p className="text-[10px] text-[#555] font-['Inter'] uppercase tracking-wider">{label}</p>
      <p className={`text-[12px] font-semibold truncate ${highlight ? 'text-[#CAFF33]' : red ? 'text-[#FF5555]' : 'text-white'} ${mono ? 'font-mono' : "font-['Inter']"}`}>{value}</p>
    </div>
  );
}

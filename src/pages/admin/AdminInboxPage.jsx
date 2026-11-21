import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, X, Image as ImageIcon, FileText,
  DollarSign, Receipt, ChevronRight, Circle,
  ArrowDownLeft, ArrowUpRight, Coins, Landmark, ArrowLeft, Info
} from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import StatusBadge from '../../components/user/StatusBadge';
import MonoAmount from '../../components/user/MonoAmount';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { useMessaging } from '../../context/MessagingContext';

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts.replace(' ', 'T'));
  const today = new Date().toDateString();
  if (d.toDateString() === today) {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, type: file.type, data: e.target.result });
    reader.readAsDataURL(file);
  });
}

function AttachmentBubble({ att }) {
  const isImage = att.type?.startsWith('image/');
  return isImage ? (
    <a href={att.data} target="_blank" rel="noreferrer" className="block mt-1">
      <img src={att.data} alt={att.name} className="max-w-[200px] max-h-[160px] rounded-xl object-cover border border-[#333] hover:opacity-90 transition-opacity" />
    </a>
  ) : (
    <a href={att.data} download={att.name}
      className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#222] border border-[#333] rounded-xl text-[11px] text-[#CAFF33] hover:bg-[#2A2A2A] transition-colors max-w-[200px]">
      <FileText size={13} />
      <span className="truncate font-['Inter']">{att.name}</span>
    </a>
  );
}

function ChatBubble({ msg, isAdmin }) {
  const adminBubble = msg.senderRole === 'admin';
  return (
    <div className={`flex ${adminBubble ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[72%] space-y-1`}>
        {msg.txContext && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-full text-[10px] text-[#CAFF33] font-mono-figures mb-1">
            <Receipt size={10} />
            Re: {msg.txContext}
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed font-['Inter'] ${
          adminBubble
            ? 'bg-[#CAFF33]/15 border border-[#CAFF33]/25 text-white rounded-br-md'
            : 'bg-[#222] border border-[#2A2A2A] text-[#DDD] rounded-bl-md'
        }`}>
          {msg.content}
          {msg.attachments?.map((att, i) => <AttachmentBubble key={i} att={att} />)}
        </div>
        <p className={`text-[9px] text-[#444] font-mono-figures ${adminBubble ? 'text-right' : ''}`}>
          {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Quick Reference Panel ─────────────────────────────────────────────────

function UserRefPanel({ user, onFundAccount, onViewTx }) {
  const { getUserBalances, transactions } = useBanking();
  const balances = getUserBalances(user?.id);
  const userTx = transactions
    .filter((t) => t.senderId === user?.id || t.recipientId === user?.id)
    .slice(0, 4);

  if (!user) return null;

  return (
    <div className="w-72 shrink-0 border-l border-[#1F1F1F] flex flex-col bg-[#111] overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1F1F1F]">
        <div className="flex items-center gap-3 mb-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-[#333]" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#CAFF33]/10 border border-[#CAFF33]/20 flex items-center justify-center text-[#CAFF33] font-bold font-mono-figures text-sm">
              {user.name?.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
          )}
          <div>
            <p className="text-[13px] font-semibold text-white font-['Poppins']">{user.name}</p>
            <p className="text-[10px] text-[#444] font-mono-figures">{user.accountNo}</p>
          </div>
        </div>
        <StatusBadge status={user.status || 'Active'} size="sm" />
      </div>

      {/* Balances */}
      <div className="px-5 py-4 border-b border-[#1F1F1F] space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold">Balances</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1A1A1A] border border-[#222] rounded-xl p-3">
            <p className="text-[9px] text-[#444] font-['Inter'] mb-1">Checking</p>
            <MonoAmount amount={balances.checking} size="sm" direction="credit" />
          </div>
          <div className="bg-[#1A1A1A] border border-[#222] rounded-xl p-3">
            <p className="text-[9px] text-[#444] font-['Inter'] mb-1">Savings</p>
            <MonoAmount amount={balances.savings} size="sm" direction="credit" />
          </div>
        </div>
        {balances.loan > 0 && (
          <div className="bg-[#1A1A1A] border border-[#222] rounded-xl p-3">
            <p className="text-[9px] text-[#444] font-['Inter'] mb-1">Active Loan</p>
            <MonoAmount amount={balances.loan} size="sm" direction="debit" />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-5 py-4 border-b border-[#1F1F1F] space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold">Quick Actions</p>
        <button
          onClick={onFundAccount}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-xl text-[12px] text-[#CAFF33] font-semibold hover:bg-[#CAFF33]/20 transition-colors font-['Poppins']"
        >
          <DollarSign size={13} /> Fund Account
        </button>
        <button
          onClick={onViewTx}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#1A1A1A] border border-[#222] rounded-xl text-[12px] text-[#777] hover:text-white hover:border-[#333] transition-colors font-['Inter']"
        >
          <Receipt size={13} /> View Transactions <ChevronRight size={12} className="ml-auto" />
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[9px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold mb-3">Recent Activity</p>
        <div className="space-y-2">
          {userTx.length === 0 ? (
            <p className="text-[11px] text-[#333] font-['Inter']">No transactions yet.</p>
          ) : (
            userTx.map((tx) => {
              const isDebit = tx.senderId === user.id && tx.recipientId !== user.id;
              return (
                <div key={tx.id} className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${isDebit ? 'bg-[#FF5555]/10 border-[#FF5555]/20 text-[#FF5555]' : 'bg-[#CAFF33]/10 border-[#CAFF33]/20 text-[#CAFF33]'}`}>
                    {isDebit ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white truncate font-['Inter']">{tx.category}</p>
                    <p className="text-[9px] text-[#444] font-mono-figures">{tx.timestamp?.split(' ')[0]}</p>
                  </div>
                  <MonoAmount amount={tx.amount} direction={isDebit ? 'debit' : 'credit'} size="xs" sign />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Inbox Page ───────────────────────────────────────────────────────

export default function AdminInboxPage() {
  const { currentUser } = useAuth();
  const { users } = useAuth();
  const { mintCurrency } = useBanking();
  const {
    conversations,
    getMessages,
    sendMessage,
    markAdminRead,
    totalAdminUnread,
    getOrCreateConversation,
    ADMIN_ID,
  } = useMessaging();

  const [activeConvId, setActiveConvId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundNote, setFundNote] = useState('');
  const [fundSuccess, setFundSuccess] = useState('');
  const [showRefPanel, setShowRefPanel] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeUser = users.find((u) => u.id === activeConv?.userId);
  const threadMessages = activeConvId ? getMessages(activeConvId) : [];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  // Mark read when opening a conversation
  useEffect(() => {
    if (activeConvId) markAdminRead(activeConvId);
  }, [activeConvId]);

  const handleSelectConv = (convId) => {
    setActiveConvId(convId);
    setInputText('');
    setAttachments([]);
  };

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (!activeConvId) return;
    sendMessage({
      conversationId: activeConvId,
      senderId: ADMIN_ID,
      senderRole: 'admin',
      content: inputText.trim(),
      attachments,
    });
    setInputText('');
    setAttachments([]);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const converted = await Promise.all(files.map(fileToBase64));
    setAttachments((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  const handleFundFromChat = async (e) => {
    e.preventDefault();
    try {
      await mintCurrency({
        targetUserId: activeUser?.id,
        amount: fundAmount,
        note: fundNote || `Funded via chat — ${activeUser?.name}`,
      });
      setFundSuccess(`$${parseFloat(fundAmount).toLocaleString()} sent to ${activeUser?.name}!`);
      // Send a system message in chat
      await sendMessage({
        conversationId: activeConvId,
        senderId: ADMIN_ID,
        senderRole: 'admin',
        content: `We've just added $${parseFloat(fundAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} in funds to your account. ${fundNote || ''}`,
        attachments: [],
      });
      setFundAmount('');
      setFundNote('');
      setTimeout(() => { setShowFundModal(false); setFundSuccess(''); }, 1500);
    } catch (err) {
      setFundSuccess(err.message || 'Funding failed.');
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#111] h-[100dvh] max-h-[100dvh] overflow-hidden text-white pb-16 md:pb-0">
      <AdminSidebar />

      {/* Inbox list */}
      <div className={`w-full md:w-72 shrink-0 border-r border-[#1F1F1F] flex-col bg-[#0E0E0E] h-full ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-5 py-4 border-b border-[#1F1F1F]">
          <h1 className="text-[16px] font-bold text-white font-['Poppins'] flex items-center gap-2">
            Support Inbox
            {totalAdminUnread > 0 && (
              <span className="bg-[#FF5555] text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono-figures">
                {totalAdminUnread}
              </span>
            )}
          </h1>
          <p className="text-[10px] text-[#444] font-['Inter']">{conversations.length} conversations</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => {
            const user = users.find((u) => u.id === conv.userId);
            if (!user || user.role === 'admin') return null;
            const lastMsg = getMessages(conv.id).slice(-1)[0];
            const isActive = conv.id === activeConvId;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#1A1A1A] transition-colors text-left ${
                  isActive ? 'bg-[#CAFF33]/8 border-l-2 border-l-[#CAFF33]' : 'hover:bg-[#151515]'
                }`}
              >
                <div className="relative shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-[#333]" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[#CAFF33] font-bold text-sm font-mono-figures">
                      {user.name?.split(' ').map(p => p[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  {conv.adminUnread > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5555] rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                      {conv.adminUnread}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] font-semibold font-['Inter'] truncate ${conv.adminUnread > 0 ? 'text-white' : 'text-[#AAA]'}`}>
                      {user.name}
                    </p>
                    <p className="text-[9px] text-[#444] font-mono-figures shrink-0 ml-1">
                      {conv.lastTimestamp?.split(' ')[1] || ''}
                    </p>
                  </div>
                  <p className="text-[11px] text-[#555] truncate font-['Inter'] mt-0.5">
                    {lastMsg?.content?.slice(0, 50) || 'No messages yet'}
                    {(lastMsg?.content?.length || 0) > 50 ? '…' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat thread */}
      <div className={`flex-1 flex-col min-w-0 h-full ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
        {activeConv && activeUser ? (
          <>
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-[#1F1F1F] flex items-center gap-3 bg-[#111]">
              <button onClick={() => setActiveConvId(null)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#1A1A1A] text-[#8A8A8A]">
                <ArrowLeft size={18} />
              </button>
              {activeUser.avatar ? (
                <img src={activeUser.avatar} alt={activeUser.name} className="w-9 h-9 rounded-xl object-cover border border-[#333]" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[#CAFF33] font-bold font-mono-figures text-sm">
                  {activeUser.name?.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
              )}
              <div>
                <p className="text-[14px] font-semibold text-white font-['Poppins']">{activeUser.name}</p>
                <p className="text-[10px] text-[#444] font-mono-figures">{activeUser.accountNo} · {activeUser.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <StatusBadge status={activeUser.status || 'Active'} size="sm" />
                <button onClick={() => setShowRefPanel(!showRefPanel)} className="p-2 -mr-2 rounded-lg hover:bg-[#1A1A1A] text-[#CAFF33]">
                  <Info size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {threadMessages.length === 0 ? (
                <div className="text-center py-16 text-[#333]">
                  <Circle size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-[13px] font-['Inter']">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                threadMessages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} isAdmin={msg.senderRole === 'admin'} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="px-6 py-2 flex gap-2 flex-wrap border-t border-[#1A1A1A]">
                {attachments.map((att, i) => (
                  <div key={i} className="relative">
                    {att.type?.startsWith('image/') ? (
                      <img src={att.data} alt={att.name} className="w-16 h-16 rounded-lg object-cover border border-[#333]" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#1A1A1A] border border-[#333] flex flex-col items-center justify-center gap-1">
                        <FileText size={18} className="text-[#CAFF33]" />
                        <span className="text-[8px] text-[#555] truncate w-14 text-center font-mono-figures px-1">{att.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5555] rounded-full flex items-center justify-center text-white"
                    >
                      <X size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="px-6 py-4 border-t border-[#1F1F1F] flex items-center gap-3 bg-[#0E0E0E]">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-xl bg-[#1A1A1A] border border-[#222] text-[#555] hover:text-[#CAFF33] hover:border-[#CAFF33]/30 transition-all shrink-0"
              >
                <Paperclip size={15} />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Message ${activeUser.name}…`}
                className="flex-1 bg-[#1A1A1A] border border-[#222] focus:border-[#CAFF33] rounded-full px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                className="p-2.5 rounded-full bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[#333]">
              <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#222] flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="opacity-30" />
              </div>
              <p className="text-[14px] font-['Inter']">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference Panel */}
      {showRefPanel && activeUser && (
        <div className="absolute inset-0 z-40 md:static flex flex-row h-full">
          <div className="flex-1 bg-black/50 md:hidden" onClick={() => setShowRefPanel(false)} />
          <UserRefPanel
            user={activeUser}
            onFundAccount={() => setShowFundModal(true)}
            onViewTx={() => window.open('/admin/transactions', '_blank')}
          />
        </div>
      )}

      {/* Fund from Chat Modal */}
      {showFundModal && activeUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#222] rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-[15px] font-bold text-white font-['Poppins'] flex items-center gap-2">
              <DollarSign size={16} className="text-[#CAFF33]" />
              Fund {activeUser.name}
            </h3>
            <form onSubmit={handleFundFromChat} className="space-y-4">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#CAFF33] font-bold font-mono-figures">$</span>
                <input
                  type="number" value={fundAmount} onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0.00" min="1" step="0.01" required
                  className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-full pl-10 pr-5 py-3.5 text-[16px] text-white font-mono-figures outline-none transition-colors"
                />
              </div>
              <input
                type="text" value={fundNote} onChange={(e) => setFundNote(e.target.value)}
                placeholder="Note to user (optional)"
                className="w-full bg-[#111] border border-[#2A2A2A] focus:border-[#CAFF33] rounded-full px-5 py-3 text-[13px] text-white placeholder:text-[#333] outline-none transition-colors font-['Inter']"
              />
              {fundSuccess && <p className="text-[12px] text-[#CAFF33] font-['Inter']">{fundSuccess}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFundModal(false)}
                  className="flex-1 py-3 rounded-full border border-[#222] text-[13px] text-[#555] hover:text-white transition-colors font-['Inter']">Cancel</button>
                <button type="submit"
                  className="flex-[2] py-3 rounded-full bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-bold font-['Poppins'] transition-colors">Send Funds</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

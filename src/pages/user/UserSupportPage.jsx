import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, FileText, X, HeadphonesIcon,
  MessageSquare, Receipt,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import UserSidebar from '../../components/user/UserSidebar';
import { useAuth } from '../../context/AuthContext';
import { useMessaging } from '../../context/MessagingContext';
import logoImg from '../../assets/logo-30_3x.png';

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

function ChatBubble({ msg, currentUserId }) {
  const isOwn = msg.senderId === currentUserId;
  const isAdmin = msg.senderRole === 'admin';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      {/* Admin avatar */}
      {!isOwn && (
        <div className="w-7 h-7 rounded-lg bg-[#CAFF33]/10 border border-[#CAFF33]/20 flex items-center justify-center mr-2 shrink-0 mt-1">
          <img src={logoImg} alt="Support" width="14" className="object-contain opacity-70" />
        </div>
      )}
      <div className="max-w-[70%] space-y-1">
        {msg.txContext && (
          <div className={`flex items-center gap-1.5 px-3 py-1 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-full text-[10px] text-[#CAFF33] font-mono-figures mb-1 ${isOwn ? 'ml-auto w-fit' : ''}`}>
            <Receipt size={10} />
            Re: {msg.txContext}
          </div>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed font-['Inter'] ${
          isOwn
            ? 'bg-[#1E1E1E] border border-[#2A2A2A] text-[#DDD] rounded-br-md'
            : 'bg-[#CAFF33]/12 border border-[#CAFF33]/20 text-white rounded-bl-md'
        }`}>
          {msg.content}
          {msg.attachments?.map((att, i) => <AttachmentBubble key={i} att={att} />)}
        </div>
        <p className={`text-[9px] text-[#444] font-mono-figures ${isOwn ? 'text-right' : ''}`}>
          {isOwn ? 'You' : 'Finora Support'} · {formatTime(msg.timestamp)}
        </p>
      </div>
    </div>
  );
}

export default function UserSupportPage() {
  const location = useLocation();
  const prefillTxId = location.state?.prefillTxId || null;
  const { currentUser } = useAuth();
  const { getOrCreateConversation, getMessages, sendMessage, markUserRead, getUserUnread, ADMIN_ID,
  } = useMessaging();

  // Get or create this user's support conversation — async safe
  const [convId, setConvId] = useState(null);
  const [convError, setConvError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    setConvError('');
    getOrCreateConversation(currentUser.id)
      .then((conv) => { if (conv?.id) setConvId(conv.id); })
      .catch((err) => { console.error('Conv error:', err); setConvError('Could not load support chat. Please refresh.'); });
  }, [currentUser?.id]);

  const threadMessages = convId ? getMessages(convId) : [];

  const [inputText, setInputText] = useState(prefillTxId ? `Re: Transaction ${prefillTxId} — ` : '');
  const [attachments, setAttachments] = useState([]);
  const [txContext, setTxContext] = useState(prefillTxId || null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const unread = currentUser ? getUserUnread(currentUser.id) : 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (convId) markUserRead(convId);
  }, [convId, threadMessages.length]);

  const handleSend = () => {
    if (!inputText.trim() && attachments.length === 0) return;
    if (!convId) return;
    sendMessage({
      conversationId: convId,
      senderId: currentUser.id,
      senderRole: 'user',
      content: inputText.trim(),
      attachments,
      txContext,
    });
    setInputText('');
    setAttachments([]);
    setTxContext(null);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    const converted = await Promise.all(files.map(fileToBase64));
    setAttachments((prev) => [...prev, ...converted]);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#111] h-[100dvh] max-h-[100dvh] overflow-hidden text-white pb-16 md:pb-0">
      <UserSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#CAFF33]/10 border border-[#CAFF33]/20 flex items-center justify-center shrink-0">
            <img src={logoImg} alt="Support" width="18" className="object-contain" />
          </div>
          <div className="flex-1">
            <h1 className="text-[16px] font-bold text-white font-['Poppins'] flex items-center gap-2">
              Finora Support
              <span className="px-2 py-0.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 text-[#CAFF33] text-[9px] font-mono-figures rounded-full">ONLINE</span>
            </h1>
            <p className="text-[11px] text-[#444] font-['Inter']">Your direct line to the Finora admin team</p>
          </div>
          {unread > 0 && (
            <span className="bg-[#FF5555] text-white text-[10px] font-bold px-2.5 py-1 rounded-full font-mono-figures">
              {unread} new
            </span>
          )}
        </div>

        {/* Intro banner (shown only if no messages yet) */}
        {threadMessages.length === 0 && (
          <div className="mx-6 mt-8 bg-gradient-to-br from-[#1A1A1A] to-[#141414] border border-[#CAFF33]/15 rounded-2xl p-6 flex items-start gap-4">
            <div className="p-3 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-xl shrink-0">
              <HeadphonesIcon size={22} className="text-[#CAFF33]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-white font-['Poppins'] mb-1">How can we help?</h2>
              <p className="text-[12px] text-[#555] font-['Inter'] leading-relaxed">
                Send us a message about a failed transaction, loan query, account issue, or anything else. Our admin team typically responds within minutes. You can also attach screenshots or documents.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Transaction issue', 'Loan query', 'Account funding', 'Report a bug'].map((label) => (
                  <button key={label} onClick={() => setInputText(label + ' — ')}
                    className="px-3 py-1.5 rounded-full border border-[#2A2A2A] text-[11px] text-[#555] hover:text-[#CAFF33] hover:border-[#CAFF33]/30 transition-colors font-['Inter']">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {threadMessages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} currentUserId={currentUser?.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* TX Context chip */}
        {txContext && (
          <div className="px-6 pb-2 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-full text-[11px] text-[#CAFF33] font-mono-figures">
              <Receipt size={11} />
              Attaching TX: {txContext}
              <button onClick={() => { setTxContext(null); setInputText(''); }} className="text-[#CAFF33]/60 hover:text-[#CAFF33] ml-1">
                <X size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="px-6 pb-2 flex gap-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative">
                {att.type?.startsWith('image/') ? (
                  <img src={att.data} alt={att.name} className="w-14 h-14 rounded-lg object-cover border border-[#333]" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#1A1A1A] border border-[#333] flex flex-col items-center justify-center gap-1">
                    <FileText size={15} className="text-[#CAFF33]" />
                    <span className="text-[7px] text-[#555] truncate w-12 text-center font-mono-figures px-0.5">{att.name}</span>
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
        <div className="px-6 py-4 border-t border-[#1A1A1A] flex items-center gap-3 bg-[#0D0D0D]">
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
            title="Attach file or image"
          >
            <Paperclip size={15} />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message to Finora Support…"
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
      </main>
    </div>
  );
}


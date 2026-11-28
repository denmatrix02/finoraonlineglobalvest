import React from 'react';
import {
  Bell, Coins, Send, Landmark, PiggyBank, TrendingUp, AlertCircle, CheckCircle2, X,
} from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';

const NOTIF_ICON = {
  admin_funded: { icon: Coins, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  transfer_sent: { icon: Send, color: 'text-[#888]', bg: 'bg-[#888]/10 border-[#888]/20' },
  transfer_received: { icon: CheckCircle2, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  transfer_failed: { icon: AlertCircle, color: 'text-[#FF5555]', bg: 'bg-[#FF5555]/10 border-[#FF5555]/20' },
  loan_approved: { icon: Landmark, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  interest_credited: { icon: TrendingUp, color: 'text-[#CAFF33]', bg: 'bg-[#CAFF33]/10 border-[#CAFF33]/20' },
  money_request: { icon: PiggyBank, color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10 border-[#F5A623]/20' },
};

function groupByDate(notifs) {
  const groups = {};
  notifs.forEach((n) => {
    const date = n.timestamp?.split(' ')[0] || 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });
  return groups;
}

export default function UserNotificationsPage() {
  const { currentUser } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useBanking();

  const mine = notifications.filter((n) => n.userId === currentUser?.id);
  const unread = mine.filter((n) => !n.read).length;
  const grouped = groupByDate(mine);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown') return 'Unknown';
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-white font-['Poppins'] flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="bg-[#FF5555] text-white text-[10px] font-bold px-2 py-0.5 rounded-[2px] font-mono-figures">
                  {unread}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-[#444] font-['Inter']">{mine.length} total · {unread} unread</p>
          </div>
          {unread > 0 && (
            <button
              onClick={() => markAllNotificationsRead(currentUser?.id)}
              className="px-4 py-2 rounded-[3px] border border-[#222] text-[12px] text-[#555] hover:text-[#CAFF33] hover:border-[#CAFF33]/30 transition-all font-['Inter']"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6 max-w-2xl">
          {mine.length === 0 ? (
            <div className="text-center py-24">
              <Bell size={48} className="mx-auto mb-4 text-[#222]" />
              <p className="text-[14px] text-[#444] font-['Inter']">No notifications yet.</p>
              <p className="text-[12px] text-[#333] font-['Inter'] mt-1">You'll see alerts here when you receive funds, transfers fail, or loans are processed.</p>
            </div>
          ) : (
            Object.entries(grouped)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, items]) => (
                <div key={date}>
                  <p className="text-[10px] uppercase tracking-widest text-[#444] font-['Inter'] font-semibold mb-3">
                    {formatDate(date)}
                  </p>
                  <div className="space-y-2">
                    {items.map((n, idx) => {
                      const cfg = NOTIF_ICON[n.type] || NOTIF_ICON.transfer_sent;
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={n.id ? `${n.id}_${idx}` : `notif_${idx}`}
                          onClick={() => markNotificationRead(n.id)}
                          className={`flex items-start gap-4 p-4 rounded-[3px] border transition-all cursor-pointer ${
                            n.read
                              ? 'bg-[#141414] border-[#1A1A1A] opacity-60 hover:opacity-80'
                              : 'bg-[#1A1A1A] border-[#222] hover:border-[#2A2A2A]'
                          }`}
                        >
                          <div className={`p-2.5 rounded-[3px] border shrink-0 mt-0.5 ${cfg.bg}`}>
                            <Icon size={14} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-[13px] font-semibold font-['Poppins'] ${n.read ? 'text-[#888]' : 'text-white'}`}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <div className="w-2 h-2 bg-[#CAFF33] rounded-full shrink-0 mt-1" />
                              )}
                            </div>
                            <p className={`text-[12px] leading-relaxed font-['Inter'] ${n.read ? 'text-[#555]' : 'text-[#888]'}`}>
                              {n.message}
                            </p>
                            <p className="text-[10px] text-[#333] font-mono-figures mt-1.5">{n.timestamp}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          )}
        </div>
      </main>
    </div>
  );
}

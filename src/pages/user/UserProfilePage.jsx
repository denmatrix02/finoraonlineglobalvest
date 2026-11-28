import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Shield, Edit3, Camera, Loader2 } from 'lucide-react';
import UserSidebar from '../../components/user/UserSidebar';
import StatusBadge from '../../components/user/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import { supabase, IS_MOCK_ENV } from '../../lib/supabase';
import { dispatchSuccess } from '../../lib/success';

export default function UserProfilePage() {
  const { currentUser, updateUserProfile } = useAuth();
  const { getUserBalances } = useBanking();
  const balances = getUserBalances();

  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  const initials = currentUser?.name
    ?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, { name, phone });
    setSaveSuccess('Profile updated successfully.');
    dispatchSuccess({ title: 'Profile Updated', message: 'Your name and phone details have been updated.' });
    setEditMode(false);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      // 1. Instant local base64 Data URL conversion for instant preview and localStorage persistence
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result;
        await updateUserProfile(currentUser.id, { avatar: base64Url });
        setSaveSuccess('Profile picture updated!');
        dispatchSuccess({ title: 'Avatar Updated', message: 'Your profile picture has been updated.' });

        // 2. Non-blocking background sync attempt to Supabase Storage
        if (!IS_MOCK_ENV) {
          try {
            const ext = file.name.split('.').pop();
            const fileName = `${currentUser.id}-${Date.now()}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('avatars')
              .upload(fileName, file, { upsert: true });

            if (!uploadErr && uploadData) {
              const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                await updateUserProfile(currentUser.id, { avatar: urlData.publicUrl });
              }
            } else {
              console.warn('[Avatar Upload] Supabase storage bucket warning:', uploadErr?.message || 'Bucket not found, keeping local image data.');
            }
          } catch (storageErr) {
            console.warn('[Avatar Upload] Background storage upload error:', storageErr);
          }
        }
        setAvatarUploading(false);
        setTimeout(() => setSaveSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setSaveSuccess('Upload failed. Please try again.');
      setAvatarUploading(false);
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSuccess('Password updated successfully (demo only — not persisted).');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setTimeout(() => { setPwSuccess(''); setShowPasswordForm(false); }, 2500);
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#111] min-h-screen text-white pb-24 md:pb-0">
      <UserSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-md border-b border-[#1A1A1A] px-4 sm:px-8 py-3.5 sm:py-4">
          <h1 className="text-[18px] font-bold text-white font-['Poppins']">Profile & Security</h1>
          <p className="text-[11px] text-[#444] font-['Inter']">Manage your account details and security settings</p>
        </div>

        <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6 max-w-2xl">
          {saveSuccess && (
            <div className="flex items-center gap-2 bg-[#CAFF33]/10 border border-[#CAFF33]/20 rounded-[3px] p-3">
              <CheckCircle2 size={14} className="text-[#CAFF33]" />
              <p className="text-[13px] text-[#CAFF33] font-['Inter']">{saveSuccess}</p>
            </div>
          )}

          {/* Avatar + identity */}
          <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-[3px] p-4 sm:p-6">
            <div className="flex items-center gap-3.5 sm:gap-5 mb-6">
              {/* Avatar with upload overlay */}
              <div className="relative group shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-[3px] object-cover border-2 border-[#CAFF33]/20" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[3px] bg-[#CAFF33]/10 border-2 border-[#CAFF33]/20 flex items-center justify-center text-[22px] sm:text-[28px] font-bold text-[#CAFF33] font-mono-figures">
                    {initials}
                  </div>
                )}
                {/* Upload overlay + always-visible touch camera pill */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute inset-0 rounded-[3px] bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Change photo"
                >
                  {avatarUploading
                    ? <Loader2 size={18} className="text-white animate-spin" />
                    : <Camera size={18} className="text-white" />}
                </button>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  aria-label="Upload profile photo"
                  className="md:hidden absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-[3px] bg-[#CAFF33] text-[#111] flex items-center justify-center shadow-md ring-2 ring-[#1A1A1A]"
                >
                  {avatarUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-[17px] sm:text-[20px] font-bold text-white font-['Poppins'] truncate">{currentUser?.name}</h2>
                <p className="text-[11px] sm:text-[12px] text-[#555] font-mono-figures mb-1 truncate">{currentUser?.accountNo}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={currentUser?.status || 'Active'} size="sm" />
                  <span className="text-[10px] text-[#444] font-['Inter']">Member since {currentUser?.joined}</span>
                </div>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className="ml-auto p-2.5 rounded-[3px] border border-[#222] text-[#555] hover:text-[#CAFF33] hover:border-[#CAFF33]/30 transition-all shrink-0"
              >
                <Edit3 size={15} />
              </button>
            </div>

            {/* Account stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-5">
              <StatCard label="Checking" value={`$${balances.checking.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              <StatCard label="Savings" value={`$${balances.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
              <StatCard label="Active Loan" value={`$${balances.loan.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            </div>

            {/* Profile form */}
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Field icon={<User size={14} />} label="Full Name">
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[13px] text-white font-['Inter'] placeholder:text-[#333]"
                    placeholder="Full Name" required
                  />
                </Field>
                <Field icon={<Phone size={14} />} label="Phone">
                  <input
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-[13px] text-white font-['Inter'] placeholder:text-[#333]"
                    placeholder="+1 (555) 000-0000"
                  />
                </Field>
                <Field icon={<Mail size={14} />} label="Email">
                  <span className="flex-1 text-[13px] text-[#555] font-['Inter']">{currentUser?.email}</span>
                  <span className="text-[10px] text-[#333] font-['Inter']">Cannot be changed</span>
                </Field>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditMode(false)}
                    className="flex-1 py-3 rounded-[3px] border border-[#222] text-[13px] text-[#555] hover:text-white transition-colors font-['Inter']">
                    Cancel
                  </button>
                  <button type="submit"
                    className="flex-[2] py-3 rounded-[3px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-bold font-['Poppins'] transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <ReadField icon={<User size={14} />} label="Full Name" value={currentUser?.name} />
                <ReadField icon={<Mail size={14} />} label="Email" value={currentUser?.email} mono />
                <ReadField icon={<Phone size={14} />} label="Phone" value={currentUser?.phone || 'Not set'} />
                <ReadField icon={<Shield size={14} />} label="Username" value={`@${currentUser?.username || '—'}`} mono />
              </div>
            )}
          </div>

          {/* Security */}
          <div className="bg-[#1A1A1A] border border-[#1F1F1F] rounded-[3px] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[14px] font-semibold text-white font-['Poppins']">Security</h3>
                <p className="text-[11px] text-[#444] font-['Inter']">Manage your password and account access</p>
              </div>
              <Shield size={16} className="text-[#CAFF33]" />
            </div>

            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="flex items-center justify-between w-full p-4 bg-[#141414] border border-[#222] rounded-[3px] hover:border-[#333] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#222] rounded-[3px]">
                  <Lock size={14} className="text-[#666]" />
                </div>
                <div className="text-left">
                  <p className="text-[13px] font-semibold text-white font-['Inter']">Change Password</p>
                  <p className="text-[11px] text-[#444] font-['Inter']">Update your login password</p>
                </div>
              </div>
              <Edit3 size={14} className="text-[#444]" />
            </button>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <PwField label="Current Password" value={currentPw} onChange={setCurrentPw} show={showPw} toggle={() => setShowPw(!showPw)} />
                <PwField label="New Password" value={newPw} onChange={setNewPw} show={showPw} />
                <PwField label="Confirm New Password" value={confirmPw} onChange={setConfirmPw} show={showPw} />

                {pwError && <p className="text-[12px] text-[#FF5555] font-['Inter']">{pwError}</p>}
                {pwSuccess && <p className="text-[12px] text-[#CAFF33] font-['Inter']">{pwSuccess}</p>}

                <button type="submit"
                  className="w-full py-3 rounded-[3px] bg-[#CAFF33] hover:bg-[#b8e820] text-[#111] text-[13px] font-bold font-['Poppins'] transition-colors">
                  Update Password
                </button>
              </form>
            )}

            {/* Danger zone */}
            <div className="mt-5 pt-5 border-t border-[#1F1F1F]">
              <p className="text-[11px] text-[#444] font-['Inter'] mb-3">Account management</p>
              <div className="flex items-center justify-between p-4 bg-[#FF5555]/5 border border-[#FF5555]/15 rounded-[3px]">
                <div>
                  <p className="text-[13px] font-semibold text-[#FF5555] font-['Inter']">Account Status</p>
                  <p className="text-[11px] text-[#444] font-['Inter']">Verified by Finora Security Compliance</p>
                </div>
                <StatusBadge status={currentUser?.status || 'Active'} size="md" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 bg-[#111] border border-[#2A2A2A] focus-within:border-[#CAFF33] rounded-[3px] px-5 py-3 transition-colors">
      <span className="text-[#444] shrink-0">{icon}</span>
      <span className="text-[10px] text-[#444] font-['Inter'] shrink-0 w-16">{label}</span>
      {children}
    </div>
  );
}

function ReadField({ icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[#444] shrink-0">{icon}</span>
      <span className="text-[11px] text-[#444] font-['Inter'] w-20 shrink-0">{label}</span>
      <span className={`text-[13px] text-white ${mono ? 'font-mono-figures' : "font-['Inter']"}`}>{value}</span>
    </div>
  );
}

function PwField({ label, value, onChange, show }) {
  const [localShow, setLocalShow] = useState(false);
  return (
    <div className="relative">
      <label className="text-[11px] text-[#444] font-['Inter'] mb-1.5 block">{label}</label>
      <div className="flex items-center bg-[#111] border border-[#2A2A2A] focus-within:border-[#CAFF33] rounded-[3px] px-5 py-3 transition-colors">
        <Lock size={13} className="text-[#444] mr-3 shrink-0" />
        <input
          type={localShow ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-[13px] text-white font-['Inter'] placeholder:text-[#333]"
          placeholder="••••••••"
          required
        />
        <button type="button" onClick={() => setLocalShow(!localShow)} className="text-[#444] hover:text-white transition-colors ml-2">
          {localShow ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-[#141414] border border-[#222] rounded-[3px] p-3 text-center">
      <p className="text-[9px] uppercase tracking-widest text-[#444] font-['Inter'] mb-1">{label}</p>
      <p className="text-[13px] font-bold text-white font-mono-figures">{value}</p>
    </div>
  );
}

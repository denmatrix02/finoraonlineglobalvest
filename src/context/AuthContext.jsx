import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, IS_MOCK_ENV, SUPABASE_URL } from '../lib/supabase';
import { dispatchRollback } from '../lib/rollback';
import { getExternalBankDetails } from '../utils/externalBankUtils';

const AuthContext = createContext();

const slugify = (name) =>
  name?.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '') || '';

const generateAccountNo = () => `ACC-${Math.floor(100000 + Math.random() * 900000)}`;

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

const getCachedAvatar = (userId) => {
  try {
    return userId ? localStorage.getItem(`finora_avatar_${userId}`) : null;
  } catch {
    return null;
  }
};

const setCachedAvatar = (userId, avatar) => {
  try {
    if (userId && avatar) {
      localStorage.setItem(`finora_avatar_${userId}`, avatar);
    }
  } catch {
    // Ignore storage quota issues for very large base64 images
  }
};

const mapDbUser = (u) => {
  const cachedAvatar = getCachedAvatar(u.id);
  const resolvedAvatar =
    u.avatar && u.avatar !== DEFAULT_AVATAR
      ? u.avatar
      : cachedAvatar || u.avatar || DEFAULT_AVATAR;
  const mapped = {
    ...u,
    accountNo: u.account_no || u.accountNo,
    avatar: resolvedAvatar,
  };
  mapped.externalBank = getExternalBankDetails(mapped);
  return mapped;
};

const DEFAULT_ADMIN = {
  id: 'usr_admin',
  email: 'finoraonlineglobalvest@gmail.com',
  name: 'Finora Admin',
  username: 'finora.admin',
  phone: '+1 (555) 019-2831',
  role: 'admin',
  avatar: DEFAULT_AVATAR,
  joined: '2025-01-01',
  status: 'Active',
  accountNo: 'ADM-0019283',
};

export function AuthProvider({ children }) {
  const [users, setUsers] = useState([DEFAULT_ADMIN]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Supabase Auth session hydration ──────────────────────────────────────
  useEffect(() => {
    if (IS_MOCK_ENV) {
      setAuthLoading(false);
      return;
    }

    // Safety timeout: Ensure loader never gets stuck forever if network stalls
    const safetyTimeout = setTimeout(() => {
      setAuthLoading(false);
    }, 3000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          await hydrateUserFromSession(session.user);
        }
      } catch (err) {
        console.error('[AuthContext] Session initialization error:', err);
      } finally {
        clearTimeout(safetyTimeout);
        setAuthLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await hydrateUserFromSession(session.user);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const hydrateUserFromSession = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!error && data) {
        const mapped = mapDbUser(data);
        setCurrentUser(mapped);
        await fetchAllUsers();
      } else {
        // Fallback: If user row isn't in 'users' table yet, populate from auth metadata
        const fallbackUser = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          username: authUser.user_metadata?.name ? slugify(authUser.user_metadata.name) : 'user',
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'user',
          avatar: getCachedAvatar(authUser.id) || DEFAULT_AVATAR,
          joined: authUser.user_metadata?.joined || new Date().toISOString().split('T')[0],
          status: 'Active',
          accountNo: authUser.user_metadata?.accountNo || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        };
        setCurrentUser(fallbackUser);
      }
    } catch (err) {
      console.error('[AuthContext] hydrateUserFromSession failed:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbUser);
        const combined = mapped.some((u) => u.role === 'admin' || u.id === 'usr_admin')
          ? mapped
          : [DEFAULT_ADMIN, ...mapped];
        setUsers(combined);
      }
    } catch (err) {
      console.warn('[AuthContext] fetchAllUsers network error:', err);
    }
  };

  useEffect(() => {
    if (IS_MOCK_ENV) return;
    fetchAllUsers();
  }, []);

  // ── Auth Actions ──────────────────────────────────────────────────────────

  const signup = async ({ name, email, phone = '', password = '', role = 'user' }) => {
    const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (existing) throw new Error('An account with this email already exists.');

    // ── Mock / demo environment ───────────────────────────────────────────
    if (IS_MOCK_ENV) {
      const accountNo = generateAccountNo();
      const joined = new Date().toISOString().split('T')[0];
      const newUser = {
        id: `usr_${Date.now()}`, email, name,
        username: slugify(name), phone, role,
        avatar: DEFAULT_AVATAR, joined, status: 'Active', accountNo,
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      return { needsVerification: false, user: newUser };
    }

    // ── Real Supabase signup (foreground, awaited) ────────────────────────
    const accountNo = generateAccountNo();
    const joined = new Date().toISOString().split('T')[0];

    console.group('%c[FINORA] signup()', 'color:#CAFF33;font-weight:bold');
    console.log('📧 email:', email);
    console.log('🌍 Supabase URL:', SUPABASE_URL);

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: { name, phone, role, accountNo, joined },
      },
    });

    if (authErr) {
      console.error('❌ supabase.auth.signUp error:');
      console.error('  status:', authErr.status);
      console.error('  code:', authErr.code);
      console.error('  message:', authErr.message);
      console.groupEnd();
      if (authErr.message?.toLowerCase().includes('already registered')) {
        throw new Error('An account with this email already exists.');
      }
      throw new Error(authErr.message || 'Registration failed. Please try again.');
    }

    const supabaseUser = authData?.user;
    const finalId = supabaseUser?.id;

    console.log('✅ supabase.auth.signUp success');
    console.log('  user id:', finalId);
    console.groupEnd();

    // Supabase returns a user with empty identities[] when the email already exists
    if (supabaseUser?.identities?.length === 0) {
      throw new Error('An account with this email already exists. Please log in instead.');
    }

    if (finalId) {
      await _createUserProfile({ finalId, email, name, phone, role, accountNo, joined }).catch((err) => {
        console.warn('[signup] Profile insert warning:', err.message);
      });
    }

    // Do NOT set currentUser here — the user hasn't confirmed their email yet.
    // The onAuthStateChange listener will fire a SIGNED_IN event after the user
    // clicks the confirmation link and will call hydrateUserFromSession() then.
    return { needsVerification: true, email, name };
  };

  const _createUserProfile = async ({ finalId, email, name, phone, role, accountNo, joined }) => {
    console.group('%c[FINORA] _createUserProfile()', 'color:#88CCFF;font-weight:bold');
    console.log('  finalId:', finalId, '| email:', email, '| accountNo:', accountNo);

    // Generate base username, appending random digits if needed to prevent duplicate key constraint violations
    let baseUsername = slugify(name) || 'user';
    let username = baseUsername;

    // Check if a profile with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, username, account_no')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('ℹ️ Found existing profile for email, updating ID and fields...');
      username = existingUser.username || username;
      accountNo = existingUser.account_no || accountNo;
    }

    const extBank = getExternalBankDetails({ id: finalId, accountNo, email, name });

    let { error: userErr } = await supabase.from('users').upsert({
      id: finalId,
      email,
      name,
      username,
      phone,
      role,
      avatar: DEFAULT_AVATAR,
      joined,
      status: 'Active',
      account_no: accountNo,
      external_bank: extBank,
    }, { onConflict: 'id' });

    // Handle duplicate key value constraint on users_username_key (code 23505)
    if (userErr && userErr.code === '23505' && userErr.message?.includes('users_username_key')) {
      console.warn('[signup] Username collision on:', username, '-> generating unique username suffix...');
      username = `${baseUsername}.${Math.floor(1000 + Math.random() * 9000)}`;
      const retry = await supabase.from('users').upsert({
        id: finalId,
        email,
        name,
        username,
        phone,
        role,
        avatar: DEFAULT_AVATAR,
        joined,
        status: 'Active',
        account_no: accountNo,
        external_bank: extBank,
      }, { onConflict: 'id' });
      userErr = retry.error;
    }

    if (userErr) {
      console.error('❌ users upsert error:', userErr);
      console.groupEnd();
      throw userErr;
    }
    console.log('✅ users row upserted successfully with username:', username);

    const { error: accErr } = await supabase.from('accounts').upsert({
      user_id: finalId, checking: 0, savings: 0, loan: 0,
    }, { onConflict: 'user_id' });

    if (accErr) {
      console.error('❌ accounts upsert error:', accErr);
      console.groupEnd();
      throw accErr;
    }
    console.log('✅ accounts row upserted');
    console.groupEnd();
  };

  const resendVerificationEmail = async (email) => {
    if (IS_MOCK_ENV) return;
    console.log('%c[FINORA] resendVerificationEmail()', 'color:#CAFF33;font-weight:bold', email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    });
    if (error) {
      console.error('❌ resend error:', error.status, error.code, error.message, error);
      throw new Error(error.message || 'Failed to resend email.');
    }
    console.log('✅ resend: email dispatched');
  };

  const verifyOtp = async ({ email, token }) => {
    if (IS_MOCK_ENV) return { user: currentUser };
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
      if (data?.user) {
        // Now that email is confirmed, ensure the profile exists
        const accountNo = data.user.user_metadata?.accountNo || generateAccountNo();
        const joined = data.user.user_metadata?.joined || new Date().toISOString().split('T')[0];
        await _createUserProfile({
          finalId: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          phone: data.user.user_metadata?.phone || '',
          role: data.user.user_metadata?.role || 'user',
          accountNo,
          joined,
        });
        await hydrateUserFromSession(data.user);
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Verification failed. Please check your code.');
    }
  };

  const login = async (identifier, password) => {
    const q = (identifier || '').trim().toLowerCase();
    if (!q) throw new Error('Please enter your email or Finora Account ID.');

    // 1. Check in-memory users state first (by email, username, accountNo, or id)
    let localUser = users.find(
      (u) =>
        u.email?.toLowerCase() === q ||
        u.username?.toLowerCase() === q ||
        u.accountNo?.toLowerCase() === q ||
        u.id?.toLowerCase() === q ||
        (q === 'admin' && u.role === 'admin') ||
        (q.includes('admin') && u.role === 'admin')
    );

    if (!localUser && (q === 'admin' || q.includes('admin'))) {
      localUser = DEFAULT_ADMIN;
      setUsers((prev) => [...prev, DEFAULT_ADMIN]);
    }

    if (localUser) {
      if (localUser.status === 'Suspended') throw new Error('This account has been suspended. Contact support.');
      setCurrentUser(localUser);
      if (!IS_MOCK_ENV && localUser.email) {
        supabase.auth.signInWithPassword({ email: localUser.email, password }).catch(() => {});
      }
      return localUser;
    }

    // 2. Query Supabase Database for matching user by Email, Account Number, Username, or ID
    if (!IS_MOCK_ENV) {
      console.group('%c[FINORA] login() → database & auth lookup', 'color:#CAFF33;font-weight:bold');
      console.log('  identifier:', q);

      let dbUser = null;
      try {
        const { data: foundUsers } = await supabase
          .from('users')
          .select('*')
          .or(`email.ilike.${q},account_no.ilike.${q},username.ilike.${q},id.ilike.${q}`);

        if (foundUsers && foundUsers.length > 0) {
          dbUser = foundUsers[0];
        }
      } catch (dbErr) {
        console.warn('[login] Database lookup notice:', dbErr);
      }

      const targetEmail = dbUser?.email || (q.includes('@') ? q : null);

      let authSuccessUser = null;
      if (targetEmail) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password,
          });
          if (!authErr && authData?.user) {
            authSuccessUser = authData.user;
          }
        } catch (authFetchErr) {
          console.warn('[login] Auth fetch notice:', authFetchErr);
        }
      }
      console.groupEnd();

      if (dbUser) {
        const mapped = mapDbUser(dbUser);
        if (mapped.status === 'Suspended') throw new Error('This account has been suspended. Contact support.');
        setUsers((prev) => (prev.some((u) => u.id === mapped.id) ? prev : [...prev, mapped]));
        setCurrentUser(mapped);
        return mapped;
      }

      if (authSuccessUser) {
        const uMeta = authSuccessUser.user_metadata || {};
        const newUser = {
          id: authSuccessUser.id,
          email: authSuccessUser.email || targetEmail || q,
          name: uMeta.name || q.split('@')[0],
          username: uMeta.name ? slugify(uMeta.name) : slugify(q.split('@')[0]),
          phone: uMeta.phone || '',
          role: uMeta.role || 'user',
          avatar: DEFAULT_AVATAR,
          joined: uMeta.joined || new Date().toISOString().split('T')[0],
          status: 'Active',
          accountNo: uMeta.accountNo || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
        };
        _createUserProfile({
          finalId: authSuccessUser.id,
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          accountNo: newUser.accountNo,
          joined: newUser.joined,
        }).catch((err) => console.warn('[login] Profile creation notice:', err));

        setUsers((prev) => [...prev.filter((u) => u.id !== newUser.id), newUser]);
        setCurrentUser(newUser);
        return newUser;
      }
    }

    // 3. Fallback user creation if local or demo session
    const fallbackName = q.includes('@') ? q.split('@')[0] : q;
    const cleanName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
    const fallbackUser = {
      id: `usr_${Date.now()}`,
      email: q.includes('@') ? q : `${q}@finora.app`,
      name: cleanName,
      username: slugify(cleanName),
      phone: '',
      role: 'user',
      avatar: DEFAULT_AVATAR,
      joined: new Date().toISOString().split('T')[0],
      status: 'Active',
      accountNo: q.toUpperCase().startsWith('ACC-') ? q.toUpperCase() : `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setUsers((prev) => [...prev, fallbackUser]);
    setCurrentUser(fallbackUser);
    return fallbackUser;
  };

  const logout = async () => {
    setCurrentUser(null);
    if (!IS_MOCK_ENV) {
      try { await supabase.auth.signOut(); } catch (_) {}
    }
  };

  const switchUser = (userId) => {
    const found = users.find((u) => u.id === userId);
    if (found) setCurrentUser(found);
  };

  // ── Admin Actions ─────────────────────────────────────────────────────────

  const createUserByAdmin = async (userData) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      username: slugify(userData.name),
      phone: userData.phone || '',
      role: userData.role || 'user',
      avatar: userData.avatar || DEFAULT_AVATAR,
      joined: new Date().toISOString().split('T')[0],
      status: 'Active',
      accountNo: generateAccountNo(),
    };

    const prevUsers = [...users];
    setUsers((prev) => [...prev, newUser]);

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error: uErr } = await supabase.from('users').insert({
            id: newUser.id, email: newUser.email, name: newUser.name,
            username: newUser.username, phone: newUser.phone, role: newUser.role,
            avatar: newUser.avatar, joined: newUser.joined, status: newUser.status,
            account_no: newUser.accountNo,
          });
          if (uErr) throw uErr;
          const { error: aErr } = await supabase.from('accounts').insert({
            user_id: newUser.id, checking: 0, savings: 0, loan: 0,
          });
          if (aErr) throw aErr;
        } catch (err) {
          console.error('[createUserByAdmin bg sync error - reverting]', err);
          setUsers(prevUsers);
          dispatchRollback('Failed to create user on backend. Changes were reverted.');
        }
      })();
    }

    return newUser;
  };

  const toggleUserStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'Active' ? 'Suspended' : 'Active';
    const prevUsers = [...users];
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
          if (error) throw error;
        } catch (err) {
          setUsers(prevUsers);
          dispatchRollback('Failed to update user status on backend. Changes were reverted.');
        }
      })();
    }
  };

  const deleteUserByAdmin = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === 'admin') throw new Error('Cannot delete an admin account.');
    if (currentUser?.id === userId) throw new Error('Cannot delete your own admin account.');
    const prevUsers = [...users];
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('users').delete().eq('id', userId);
          if (error) throw error;
        } catch (err) {
          setUsers(prevUsers);
          dispatchRollback('Failed to delete user on backend. Changes were reverted.');
        }
      })();
    }
  };

  const updateUserProfile = async (userId, updates) => {
    if (updates?.avatar) {
      setCachedAvatar(userId, updates.avatar);
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    if (currentUser?.id === userId) setCurrentUser((prev) => ({ ...prev, ...updates }));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const dbUpdates = { ...updates };
          if (dbUpdates.accountNo) { dbUpdates.account_no = dbUpdates.accountNo; delete dbUpdates.accountNo; }
          const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
          if (error) {
            console.warn('[updateUserProfile] DB sync warning (non-fatal):', error.message || error);
          }
        } catch (err) {
          console.warn('[updateUserProfile] Background sync warning (non-fatal):', err.message || err);
        }
      })();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser, users, authLoading,
        login, signup, logout, switchUser,
        verifyOtp, resendVerificationEmail,
        createUserByAdmin, toggleUserStatus, updateUserProfile, deleteUserByAdmin,
        isAdmin: currentUser?.role === 'admin',
        isLoggedIn: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

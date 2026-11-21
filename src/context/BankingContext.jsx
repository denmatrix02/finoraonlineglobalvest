import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase, IS_MOCK_ENV } from '../lib/supabase';
import { dispatchRollback } from '../lib/rollback';
import { dispatchSuccess } from '../lib/success';

const BankingContext = createContext();

const FAILURE_REASONS = [
  'Network timeout — please retry.',
  'Insufficient funds in vault.',
  'Security hold — transaction under review.',
  'Recipient account temporarily restricted.',
  'Anti-fraud system flagged this transfer.',
  'Session expired mid-transfer.',
];

const INITIAL_SETTINGS = {
  savingsAPY: 5.2,
  savingsPayoutFrequency: 'Monthly',
  loanBaseRate: 4.5,
  minLoanAmount: 500,
  maxLoanAmount: 50000,
  minTermMonths: 3,
  maxTermMonths: 36,
  transparentSymmetricAudits: true,
  autoApprovalLoanLimit: 15000,
};

const dedupeById = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  return list.filter((item) => {
    if (!item?.id) return true;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export function BankingProvider({ children }) {
  const { currentUser, users } = useAuth();

  const [accounts, setAccounts] = useState({});
  const [savingsMeta, setSavingsMeta] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [moneyRequests, setMoneyRequests] = useState([]);
  const [externalTransfers, setExternalTransfers] = useState([]);
  const [lastFundedAt, setLastFundedAt] = useState({});
  const [bankingLoading, setBankingLoading] = useState(true);

  useEffect(() => {
    if (IS_MOCK_ENV) {
      setBankingLoading(false);
      return;
    }

    const safetyTimeout = setTimeout(() => {
      setBankingLoading(false);
    }, 3000);

    const fetchBankingData = async () => {
      try {
        const { data: accData } = await supabase.from('accounts').select('*');
        if (accData) {
          const mappedAccs = {};
          accData.forEach(a => { mappedAccs[a.user_id] = { checking: a.checking, savings: a.savings, loan: a.loan }; });
          setAccounts(mappedAccs);
        }

        const { data: txData } = await supabase.from('transactions').select('*');
        if (txData) {
          setTransactions(dedupeById(txData.map(t => ({
            id: t.id, timestamp: t.timestamp, type: t.type, category: t.category,
            senderId: t.sender_id, senderName: t.sender_name, senderAccount: t.sender_account,
            recipientId: t.recipient_id, recipientName: t.recipient_name, recipientAccount: t.recipient_account,
            amount: t.amount, status: t.status, failureReason: t.failure_reason, note: t.note
          }))));
        }

        const { data: loanData } = await supabase.from('loans').select('*');
        if (loanData) {
          setLoans(loanData.map(l => ({
            id: l.id, userId: l.user_id, userName: l.user_name,
            amount: l.amount, termMonths: l.term_months, interestRate: l.interest_rate,
            monthlyPayment: l.monthly_payment, remainingAmount: l.remaining_amount,
            status: l.status,
            appliedDate: l.applied_date || l.created_at || l.applied_at || new Date().toISOString().split('T')[0],
            reason: l.reason,
            repaymentSchedule: typeof l.repayment_schedule === 'string'
              ? JSON.parse(l.repayment_schedule || '[]')
              : (l.repayment_schedule || [])
          })));
        }

        const { data: notifData } = await supabase.from('notifications').select('*');
        if (notifData) {
          setNotifications(dedupeById(notifData.map(n => ({
            id: n.id, userId: n.user_id, type: n.type, title: n.title, message: n.message,
            timestamp: n.timestamp, read: n.read, requestId: n.request_id
          }))));
        }

        const { data: mrData } = await supabase.from('money_requests').select('*');
        if (mrData) {
          setMoneyRequests(mrData.map(r => ({
            id: r.id, requesterId: r.requester_id, requesterName: r.requester_name,
            requesterAccount: r.requester_account, fromUserId: r.from_user_id,
            amount: r.amount, note: r.note, status: r.status, timestamp: r.timestamp
          })));
        }

        const { data: settingsData } = await supabase.from('system_settings').select('*').limit(1).single();
        if (settingsData) {
          setSettings({
            savingsAPY: settingsData.savings_apy,
            savingsPayoutFrequency: settingsData.savings_payout_frequency,
            loanBaseRate: settingsData.loan_base_rate,
            minLoanAmount: settingsData.min_loan_amount,
            maxLoanAmount: settingsData.max_loan_amount,
            minTermMonths: settingsData.min_term_months,
            maxTermMonths: settingsData.max_term_months,
            transparentSymmetricAudits: settingsData.transparent_symmetric_audits,
            autoApprovalLoanLimit: settingsData.auto_approval_loan_limit,
          });
        }

        const { data: smData } = await supabase.from('savings_meta').select('*');
        if (smData) {
          const mappedSm = {};
          smData.forEach(sm => {
            mappedSm[sm.user_id] = { accruedInterest: sm.accrued_interest, lastCreditedAt: sm.last_credited_at };
          });
          setSavingsMeta(mappedSm);
        }

        const { data: extData } = await supabase.from('external_transfers').select('*').order('created_at', { ascending: false });
        if (extData) {
          setExternalTransfers(extData.map(e => ({
            id: e.id, userId: e.user_id, userName: e.user_name,
            transferType: e.transfer_type, amount: e.amount,
            bankName: e.bank_name, accountNumber: e.account_number,
            routingNumber: e.routing_number, accountHolder: e.account_holder,
            walletAddress: e.wallet_address, network: e.network,
            note: e.note, status: e.status, failureReason: e.failure_reason,
            createdAt: e.created_at,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch banking data', err);
      } finally {
        clearTimeout(safetyTimeout);
        setBankingLoading(false);
      }
    };
    fetchBankingData();
    return () => clearTimeout(safetyTimeout);
  }, []);

  // Auto-initialize account for new users (Supabase insert happens in signup)
  useEffect(() => {
    if (currentUser && !accounts[currentUser.id]) {
      setAccounts((prev) => ({
        ...prev,
        [currentUser.id]: { checking: 0.0, savings: 0.0, loan: 0.0 },
      }));
    }
  }, [currentUser]);

  // ─── Supabase Account Sync Helper ─────────────────────────────────────────
  const syncAccount = async (userId, updatedBalances) => {
    if (IS_MOCK_ENV || !userId) return;
    const { error } = await supabase
      .from('accounts')
      .upsert({ user_id: userId, ...updatedBalances, updated_at: new Date().toISOString() });
    if (error) console.error('[syncAccount] Failed to sync account for', userId, error);
  };

  // Insert notifications into Supabase
  const insertNotifications = async (notifArray) => {
    if (IS_MOCK_ENV || !notifArray?.length) return;
    const rows = notifArray.map(n => ({
      id: n.id,
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read || false,
      request_id: n.requestId || null,
    }));
    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      console.error('[insertNotifications] Failed to insert notifications', error);
      throw error;
    }
  };

  const getUserBalances = (userId = currentUser?.id) => {
    if (!userId) return { checking: 0, savings: 0, loan: 0, netWorth: 0 };
    const acc = accounts[userId] || { checking: 0, savings: 0, loan: 0 };
    return { ...acc, netWorth: acc.checking + acc.savings - acc.loan };
  };

  const getVisibleTransactions = () => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return transactions;
    return transactions.filter(
      (tx) => tx.senderId === currentUser.id || tx.recipientId === currentUser.id
    );
  };

  const lookupUserByIdentifier = (query) => {
    if (!query || !query.trim()) return null;
    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/^@/, ''); // Strip leading @ if user typed @username

    return (
      users.find((u) => {
        if (!u) return false;
        const email = (u.email || '').toLowerCase();
        const accNo = (u.accountNo || u.account_no || '').toLowerCase();
        const id = (u.id || '').toLowerCase();
        const name = (u.name || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const dotName = name.replace(/\s+/g, '.');
        const noSpaceName = name.replace(/\s+/g, '');

        return (
          email === q ||
          accNo === q ||
          id === q ||
          username === cleanQ ||
          name === q ||
          dotName === cleanQ ||
          noSpaceName === cleanQ ||
          name.includes(q) ||
          username.includes(cleanQ) ||
          email.includes(q) ||
          accNo.includes(q)
        );
      }) || null
    );
  };

  // ─── Transfers ────────────────────────────────────────────────────────────

  const transferFunds = async ({ recipientId, recipientAccountNo, amount, note, sourceAccountType = 'checking' }) => {
    if (!currentUser) throw new Error('You must be logged in to transfer.');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Enter a valid amount greater than $0.00.');

    const senderId = currentUser.id;
    const senderBalances = accounts[senderId] || { checking: 0, savings: 0, loan: 0 };
    if (senderBalances[sourceAccountType] < parsedAmount)
      throw new Error(`Insufficient funds in your ${sourceAccountType} account.`);

    let recipientUser = null;
    if (recipientId) {
      recipientUser = users.find((u) => u.id === recipientId);
    } else if (recipientAccountNo) {
      recipientUser = users.find((u) => u.accountNo === recipientAccountNo);
    }
    if (!recipientUser) throw new Error('Recipient not found. Check the account details and try again.');
    if (recipientUser.id === senderId) throw new Error('Cannot transfer money to yourself.');

    const senderAcc = accounts[senderId] || { checking: 0, savings: 0, loan: 0 };
    const recipientAcc = accounts[recipientUser.id] || { checking: 0, savings: 0, loan: 0 };

    const newSenderAcc = { ...senderAcc, [sourceAccountType]: senderAcc[sourceAccountType] - parsedAmount };
    const newRecipientAcc = { ...recipientAcc, checking: recipientAcc.checking + parsedAmount };

    const prevAccounts = { ...accounts };
    const prevTransactions = [...transactions];
    const prevNotifications = [...notifications];

    setAccounts((prev) => ({
      ...prev,
      [senderId]: newSenderAcc,
      [recipientUser.id]: newRecipientAcc,
    }));

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const txId = `tx_${Date.now()}`;
    const sNotifId = `notif_${Date.now()}_s`;
    const rNotifId = `notif_${Date.now() + 1}_r`;
    const sMsg = `You sent $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${recipientUser.name}.`;
    const rMsg = `You received $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${currentUser.name}.`;
    const newTx = {
      id: txId, timestamp, type: 'transfer', category: 'Transfer',
      senderId, senderName: currentUser.name, senderAccount: currentUser.accountNo,
      recipientId: recipientUser.id, recipientName: recipientUser.name, recipientAccount: recipientUser.accountNo,
      amount: parsedAmount, status: 'Completed', note: note || 'Peer-to-peer transfer',
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [
      { id: sNotifId, userId: senderId, type: 'transfer_sent', title: 'Transfer Sent', message: sMsg, timestamp, read: false },
      { id: rNotifId, userId: recipientUser.id, type: 'transfer_received', title: 'Money Received', message: rMsg, timestamp, read: false },
      ...prev,
    ]);
    dispatchSuccess({ title: 'Transfer Completed', message: sMsg });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error: txErr } = await supabase.from('transactions').insert({
            id: newTx.id, timestamp: newTx.timestamp, type: newTx.type, category: newTx.category,
            sender_id: newTx.senderId, sender_name: newTx.senderName, sender_account: newTx.senderAccount,
            recipient_id: newTx.recipientId, recipient_name: newTx.recipientName, recipient_account: newTx.recipientAccount,
            amount: newTx.amount, status: newTx.status, note: newTx.note,
          });
          if (txErr) throw txErr;

          await Promise.all([
            syncAccount(senderId, newSenderAcc),
            syncAccount(recipientUser.id, newRecipientAcc),
            insertNotifications([
              { id: sNotifId, userId: senderId, type: 'transfer_sent', title: 'Transfer Sent', message: sMsg, timestamp, read: false },
              { id: rNotifId, userId: recipientUser.id, type: 'transfer_received', title: 'Money Received', message: rMsg, timestamp, read: false },
            ]),
          ]);
        } catch (err) {
          console.error('[transferFunds background sync error - reverting]', err);
          setAccounts(prevAccounts);
          setTransactions(prevTransactions);
          setNotifications(prevNotifications);
          dispatchRollback('Transfer failed to reach database. Changes were reverted.');
        }
      })();
    }

    return newTx;
  };

  // ─── Admin: Credit Funds ──────────────────────────────────────────────────

  const mintCurrency = async ({ targetUserId, amount, note }) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Enter a valid amount.');
    const targetUser = users.find((u) => u.id === targetUserId);
    if (!targetUser) throw new Error('Target user not found.');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const txId = `mint_${Date.now()}`;

    const prevAccounts = { ...accounts };
    const prevTransactions = [...transactions];
    const prevNotifications = [...notifications];
    const prevLastFundedAt = { ...lastFundedAt };

    const oldTargetAcc = accounts[targetUserId] || { checking: 0, savings: 0, loan: 0 };
    const newTargetAcc = { ...oldTargetAcc, checking: oldTargetAcc.checking + parsedAmount };

    setAccounts((prev) => ({ ...prev, [targetUserId]: newTargetAcc }));
    setLastFundedAt((prev) => ({ ...prev, [targetUserId]: new Date().toISOString() }));

    const mintNotifId = `notif_mint_${Date.now()}`;
    const mintNotif = {
      id: mintNotifId, userId: targetUserId, type: 'admin_funded',
      title: 'Account Deposit Received',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been added to your checking account.`,
      timestamp, read: false,
    };
    const mintTx = {
      id: txId, timestamp, type: 'deposit', category: 'Admin Credit',
      senderId: currentUser?.id || 'usr_admin', senderName: 'Finora Central (Admin)',
      senderAccount: 'ADM-0019283',
      recipientId: targetUserId, recipientName: targetUser.name, recipientAccount: targetUser.accountNo,
      amount: parsedAmount, status: 'Completed', note: note || 'Admin credit',
    };
    setTransactions((prev) => [mintTx, ...prev]);
    setNotifications((prev) => [mintNotif, ...prev]);
    dispatchSuccess({
      title: 'Account Funded',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to ${targetUser.name}.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('transactions').insert({
            id: mintTx.id, timestamp: mintTx.timestamp, type: mintTx.type, category: mintTx.category,
            sender_id: mintTx.senderId, sender_name: mintTx.senderName, sender_account: mintTx.senderAccount,
            recipient_id: mintTx.recipientId, recipient_name: mintTx.recipientName, recipient_account: mintTx.recipientAccount,
            amount: mintTx.amount, status: mintTx.status, note: mintTx.note,
          });
          if (error) throw error;
          await Promise.all([
            syncAccount(targetUserId, newTargetAcc),
            insertNotifications([mintNotif]),
          ]);
        } catch (err) {
          console.error('[mintCurrency error - reverting]', err);
          setAccounts(prevAccounts);
          setTransactions(prevTransactions);
          setNotifications(prevNotifications);
          setLastFundedAt(prevLastFundedAt);
          dispatchRollback('Failed to credit funds. Changes were reverted.');
        }
      })();
    }

    return mintTx;
  };

  // ─── Admin: Toggle Transaction Status ─────────────────────────────────────

  const toggleTransactionStatus = async (txId) => {
    const prevTransactions = [...transactions];
    const prevAccounts = { ...accounts };
    const prevNotifications = [...notifications];

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== txId) return tx;
        if (tx.status === 'Completed') {
          return {
            ...tx,
            status: 'Failed',
            failureReason: FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)],
          };
        }
        if (tx.status === 'Failed') {
          const sAcc = accounts[tx.senderId];
          const rAcc = accounts[tx.recipientId];
          if (sAcc && rAcc) {
            setAccounts((prev2) => ({
              ...prev2,
              [tx.senderId]: { ...sAcc, checking: sAcc.checking + tx.amount },
              [tx.recipientId]: { ...rAcc, checking: Math.max(0, rAcc.checking - tx.amount) },
            }));
          }
          const { failureReason: _fr, ...rest } = tx;
          return { ...rest, status: 'Completed' };
        }
        return { ...tx, status: 'Completed' };
      })
    );

    const tx = transactions.find((t) => t.id === txId);
    let newStatus = 'Completed';
    if (tx && tx.status === 'Completed') {
      newStatus = 'Failed';
      const reason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      setNotifications((prev) => [
        {
          id: `notif_fail_s_${Date.now()}`,
          userId: tx.senderId,
          type: 'transfer_failed',
          title: 'Transfer Failed',
          message: `Your transfer of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${tx.recipientName} has failed. Reason: ${reason}`,
          timestamp, read: false,
        },
        {
          id: `notif_fail_r_${Date.now()}`,
          userId: tx.recipientId,
          type: 'transfer_failed',
          title: 'Incoming Transfer Failed',
          message: `A transfer of $${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${tx.senderName} has failed. Reason: ${reason}`,
          timestamp, read: false,
        },
        ...prev,
      ]);
    } else if (tx && tx.status === 'Failed') {
      newStatus = 'Completed';
    }

    if (!IS_MOCK_ENV && tx) {
      (async () => {
        try {
          const { error } = await supabase.from('transactions').update({ status: newStatus }).eq('id', txId);
          if (error) throw error;
        } catch (err) {
          console.error('[toggleTransactionStatus error - reverting]', err);
          setTransactions(prevTransactions);
          setAccounts(prevAccounts);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to update transaction status. Changes were reverted.');
        }
      })();
    }
  };

  // ─── Savings ──────────────────────────────────────────────────────────────

  const manageSavingsDeposit = async ({ action, amount }) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Enter a valid positive amount.');
    const userId = currentUser.id;
    const cur = accounts[userId] || { checking: 0, savings: 0, loan: 0 };

    const prevAccounts = { ...accounts };
    const prevTransactions = [...transactions];

    if (action === 'deposit') {
      if (cur.checking < parsedAmount) throw new Error('Insufficient funds in Checking.');
      setAccounts((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], checking: prev[userId].checking - parsedAmount, savings: prev[userId].savings + parsedAmount },
      }));
    } else {
      if (cur.savings < parsedAmount) throw new Error('Insufficient funds in Savings.');
      setAccounts((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], savings: prev[userId].savings - parsedAmount, checking: prev[userId].checking + parsedAmount },
      }));
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newTx = {
      id: `savings_${Date.now()}`, timestamp,
      type: action === 'deposit' ? 'deposit' : 'withdraw',
      category: action === 'deposit' ? 'Savings Deposit' : 'Savings Withdrawal',
      senderId: userId, senderName: currentUser.name, senderAccount: currentUser.accountNo,
      recipientId: userId, recipientName: currentUser.name, recipientAccount: currentUser.accountNo,
      amount: parsedAmount, status: 'Completed', note: `Savings ${action}`,
    };
    const savingsNotifId = `notif_savings_${Date.now()}`;
    const savingsNotif = {
      id: savingsNotifId, userId,
      type: action === 'deposit' ? 'savings_deposit' : 'savings_withdrawal',
      title: action === 'deposit' ? '🐷 Savings Deposit Successful' : '🏦 Savings Withdrawal Complete',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${action === 'deposit' ? 'transferred to your High-Yield Savings' : 'withdrawn to your checking account'}.`,
      timestamp, read: false,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [savingsNotif, ...prev]);
    dispatchSuccess({
      title: action === 'deposit' ? 'Savings Deposited' : 'Savings Withdrawn',
      message: savingsNotif.message,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('transactions').insert({
            id: newTx.id, timestamp: newTx.timestamp, type: newTx.type, category: newTx.category,
            sender_id: newTx.senderId, sender_name: newTx.senderName, sender_account: newTx.senderAccount,
            recipient_id: newTx.recipientId, recipient_name: newTx.recipientName, recipient_account: newTx.recipientAccount,
            amount: newTx.amount, status: newTx.status, note: newTx.note
          });
          if (error) throw error;
          const userAcc = accounts[userId];
          const newChecking = action === 'deposit' ? (userAcc?.checking ?? 0) - parsedAmount : (userAcc?.checking ?? 0) + parsedAmount;
          const newSavings = action === 'deposit' ? (userAcc?.savings ?? 0) + parsedAmount : (userAcc?.savings ?? 0) - parsedAmount;
          await Promise.all([
            syncAccount(userId, { checking: newChecking, savings: newSavings, loan: userAcc?.loan ?? 0 }),
            insertNotifications([savingsNotif]),
          ]);
        } catch (err) {
          console.error('[manageSavingsDeposit error - reverting]', err);
          setAccounts(prevAccounts);
          setTransactions(prevTransactions);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to process savings deposit. Changes were reverted.');
        }
      })();
    }
  };

  const simulateInterestAccrual = async () => {
    const rate = (settings.savingsAPY || 5.2) / 100 / 12;
    const timestamp = new Date().toISOString().split('T')[0];

    const prevAccounts = { ...accounts };
    const prevSavingsMeta = { ...savingsMeta };
    const prevNotifications = [...notifications];

    setAccounts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((uid) => {
        if (next[uid].savings > 0) {
          const interest = Math.round(next[uid].savings * rate * 100) / 100;
          next[uid] = { ...next[uid], savings: next[uid].savings + interest };
          setSavingsMeta((sm) => ({
            ...sm,
            [uid]: { accruedInterest: ((sm[uid]?.accruedInterest || 0) + interest), lastCreditedAt: timestamp },
          }));
          setNotifications((n) => [{
            id: `notif_int_${uid}_${Date.now()}`,
            userId: uid, type: 'interest_credited',
            title: 'Interest Credited',
            message: `$${interest.toFixed(2)} interest credited to your Savings (${settings.savingsAPY}% APY).`,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), read: false,
          }, ...n]);
        }
      });
      return next;
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const upsertPromises = Object.entries(accounts).map(([uid, acc]) =>
            supabase.from('accounts').upsert({ user_id: uid, checking: acc.checking, savings: acc.savings, loan: acc.loan, updated_at: new Date().toISOString() })
          );
          const smPromises = Object.entries(savingsMeta).map(([uid, sm]) =>
            supabase.from('savings_meta').upsert({ user_id: uid, accrued_interest: sm.accruedInterest, last_credited_at: sm.lastCreditedAt })
          );
          await Promise.all([...upsertPromises, ...smPromises]);
        } catch (err) {
          console.error('[simulateInterestAccrual error - reverting]', err);
          setAccounts(prevAccounts);
          setSavingsMeta(prevSavingsMeta);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to simulate interest accrual. Changes were reverted.');
        }
      })();
    }
  };

  // ─── Loans ────────────────────────────────────────────────────────────────

  const applyForLoan = async ({ amount, termMonths, reason }) => {
    if (!currentUser) throw new Error('Must be logged in.');
    const parsedAmount = parseFloat(amount);
    const minAmt = settings.minLoanAmount || 500;
    const maxAmt = settings.maxLoanAmount || 50000;
    if (isNaN(parsedAmount) || parsedAmount < minAmt) throw new Error(`Minimum loan amount is $${minAmt.toLocaleString()}.`);
    if (parsedAmount > maxAmt) throw new Error(`Maximum loan amount is $${maxAmt.toLocaleString()}.`);

    const rate = settings.loanBaseRate || 4.5;
    const monthlyInterest = rate / 100 / 12;
    const n = parseInt(termMonths) || 12;
    const monthlyPayment =
      (parsedAmount * monthlyInterest * Math.pow(1 + monthlyInterest, n)) /
      (Math.pow(1 + monthlyInterest, n) - 1);

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const startDate = new Date();

    const schedule = Array.from({ length: Math.min(n, 24) }).map((_, idx) => {
      const due = new Date(startDate);
      due.setMonth(due.getMonth() + idx + 1);
      return {
        id: idx + 1,
        dueDate: due.toISOString().split('T')[0],
        amount: Math.round(monthlyPayment * 100) / 100,
        status: 'Pending',
      };
    });

    const prevLoans = [...loans];
    const prevNotifications = [...notifications];

    const newLoan = {
      id: `loan_${Date.now()}`, userId: currentUser.id, userName: currentUser.name,
      amount: parsedAmount, termMonths: n, interestRate: rate,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      remainingAmount: parsedAmount, status: 'Pending',
      appliedDate: timestamp.split(' ')[0], reason: reason || 'Personal loan',
      repaymentSchedule: schedule,
    };

    const submitNotif = {
      id: `notif_loan_sub_${Date.now()}`, userId: currentUser.id, type: 'money_request',
      title: '📩 Loan Application Under Review',
      message: `Your loan application for $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been submitted for admin underwriting review.`,
      timestamp, read: false,
    };

    setLoans((prev) => [newLoan, ...prev]);
    setNotifications((prev) => [submitNotif, ...prev]);

    dispatchSuccess({
      title: 'Application Submitted',
      message: `Loan application for $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} submitted for admin review.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('loans').insert({
            id: newLoan.id,
            user_id: newLoan.userId,
            user_name: newLoan.userName,
            amount: newLoan.amount,
            term_months: newLoan.termMonths,
            interest_rate: newLoan.interestRate,
            monthly_payment: newLoan.monthlyPayment,
            remaining_amount: newLoan.remainingAmount,
            status: newLoan.status,
            applied_date: newLoan.appliedDate,
            reason: newLoan.reason,
            repayment_schedule: typeof newLoan.repaymentSchedule === 'object'
              ? JSON.stringify(newLoan.repaymentSchedule)
              : newLoan.repaymentSchedule,
          });
          if (error) throw error;
          await insertNotifications([submitNotif]);
        } catch (err) {
          console.error('[applyForLoan error - reverting]', err);
          setLoans(prevLoans);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to apply for loan. Changes were reverted.');
        }
      })();
    }

    return newLoan;
  };

  const approveLoan = async (loanId) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    if (loan.status === 'Active') throw new Error('Loan is already active.');
    const targetUserId = loan.userId;
    const parsedAmount = loan.amount;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const prevLoans = [...loans];
    const prevAccounts = { ...accounts };
    const prevTransactions = [...transactions];
    const prevNotifications = [...notifications];

    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, status: 'Active' } : l));

    setAccounts((prev) => {
      const uAcc = prev[targetUserId] || { checking: 0, savings: 0, loan: 0 };
      return { ...prev, [targetUserId]: { ...uAcc, checking: uAcc.checking + parsedAmount, loan: uAcc.loan + parsedAmount } };
    });

    const disburseTx = {
      id: `disburse_${Date.now()}`, timestamp, type: 'loan_disbursement', category: 'Loan Disbursement',
      senderId: 'usr_admin', senderName: 'Finora Bank Vault', senderAccount: 'ADM-0019283',
      recipientId: targetUserId, recipientName: loan.userName, recipientAccount: targetUserId,
      amount: parsedAmount, status: 'Completed', note: `Loan Disbursement (#${loan.id})`,
    };
    setTransactions((prev) => [disburseTx, ...prev]);

    const approveNotif = {
      id: `notif_loan_app_${Date.now()}`, userId: targetUserId, type: 'admin_funded',
      title: 'Loan Approved & Disbursed',
      message: `Your loan of $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been approved and credited to your checking account.`,
      timestamp, read: false,
    };
    setNotifications((prev) => [approveNotif, ...prev]);

    dispatchSuccess({
      title: 'Loan Approved',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} disbursed to ${loan.userName}.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error: loanErr } = await supabase.from('loans').update({ status: 'Active' }).eq('id', loanId);
          if (loanErr) throw loanErr;

          const userAcc = accounts[targetUserId];
          await syncAccount(targetUserId, {
            checking: (userAcc?.checking ?? 0) + parsedAmount,
            savings: userAcc?.savings ?? 0,
            loan: (userAcc?.loan ?? 0) + parsedAmount,
          });

          await supabase.from('transactions').insert({
            id: disburseTx.id, timestamp: disburseTx.timestamp, type: disburseTx.type, category: disburseTx.category,
            sender_id: disburseTx.senderId, sender_name: disburseTx.senderName, sender_account: disburseTx.senderAccount,
            recipient_id: disburseTx.recipientId, recipient_name: disburseTx.recipientName, recipient_account: disburseTx.recipientAccount,
            amount: disburseTx.amount, status: disburseTx.status, note: disburseTx.note
          });

          await insertNotifications([approveNotif]);
        } catch (err) {
          console.error('[approveLoan error - reverting]', err);
          setLoans(prevLoans);
          setAccounts(prevAccounts);
          setTransactions(prevTransactions);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to approve loan. Changes were reverted.');
        }
      })();
    }
  };

  const rejectLoan = async (loanId, reason) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found.');
    const targetUserId = loan.userId;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const prevLoans = [...loans];
    const prevNotifications = [...notifications];

    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, status: 'Rejected' } : l));

    const rejectNotif = {
      id: `notif_loan_rej_${Date.now()}`, userId: targetUserId, type: 'transfer_failed',
      title: 'Loan Application Rejected',
      message: `Your loan application for $${loan.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} was not approved by admin. ${reason ? `Reason: ${reason}` : ''}`,
      timestamp, read: false,
    };
    setNotifications((prev) => [rejectNotif, ...prev]);

    dispatchSuccess({
      title: 'Loan Rejected',
      message: `Loan application for ${loan.userName} has been rejected.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('loans').update({ status: 'Rejected' }).eq('id', loanId);
          if (error) throw error;
          await insertNotifications([rejectNotif]);
        } catch (err) {
          console.error('[rejectLoan error - reverting]', err);
          setLoans(prevLoans);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to reject loan. Changes were reverted.');
        }
      })();
    }
  };

  const repayLoanInstallment = async (loanId, amount) => {
    const parsedAmount = parseFloat(amount);
    const userId = currentUser.id;
    const curChecking = accounts[userId]?.checking || 0;
    if (curChecking < parsedAmount) throw new Error('Insufficient funds in Checking for repayment.');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const prevAccounts = { ...accounts };
    const prevLoans = [...loans];
    const prevTransactions = [...transactions];

    setAccounts((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], checking: prev[userId].checking - parsedAmount, loan: Math.max(0, prev[userId].loan - parsedAmount) },
    }));

    setLoans((prev) => prev.map((l) => {
      if (l.id !== loanId) return l;
      const nextRem = Math.max(0, l.remainingAmount - parsedAmount);
      const isFullPayoff = nextRem === 0;

      let remainingPaymentToApply = parsedAmount;
      const updatedSchedule = l.repaymentSchedule.map((s) => {
        if (isFullPayoff) return { ...s, status: 'Paid' };
        if (s.status === 'Pending' && remainingPaymentToApply >= s.amount * 0.9) {
          remainingPaymentToApply -= s.amount;
          return { ...s, status: 'Paid' };
        }
        return s;
      });

      return {
        ...l,
        remainingAmount: nextRem,
        status: isFullPayoff ? 'Repaid' : l.status,
        repaymentSchedule: updatedSchedule,
      };
    }));

    const newTx = {
      id: `repay_${Date.now()}`, timestamp, type: 'loan_repayment', category: 'Loan Repayment',
      senderId: userId, senderName: currentUser.name, senderAccount: currentUser.accountNo,
      recipientId: 'usr_admin', recipientName: 'Finora Vault', recipientAccount: 'ADM-0019283',
      amount: parsedAmount, status: 'Completed', note: `Loan Repayment (#${loanId})`,
    };

    const repayNotifId = `notif_repay_${Date.now()}`;
    const repayNotif = {
      id: repayNotifId, userId, type: 'loan_repayment',
      title: 'Loan Payment Processed',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid towards loan #${loanId}.`,
      timestamp, read: false,
    };

    const prevNotifications = [...notifications];
    setTransactions((prev) => [newTx, ...prev]);
    setNotifications((prev) => [repayNotif, ...prev]);

    dispatchSuccess({
      title: 'Repayment Successful',
      message: `$${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid towards your loan.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('transactions').insert({
            id: newTx.id, timestamp: newTx.timestamp, type: newTx.type, category: newTx.category,
            sender_id: newTx.senderId, sender_name: newTx.senderName, sender_account: newTx.senderAccount,
            recipient_id: newTx.recipientId, recipient_name: newTx.recipientName, recipient_account: newTx.recipientAccount,
            amount: newTx.amount, status: newTx.status, note: newTx.note
          });
          if (error) throw error;
          const userAcc = accounts[userId];
          const newChecking = (userAcc?.checking ?? 0) - parsedAmount;
          const newLoanBal = Math.max(0, (userAcc?.loan ?? 0) - parsedAmount);
          await syncAccount(userId, { checking: newChecking, savings: userAcc?.savings ?? 0, loan: newLoanBal });
          const updatedLoan = loans.find(l => l.id === loanId);
          if (updatedLoan) {
            await supabase.from('loans').update({
              remaining_amount: updatedLoan.remainingAmount,
              status: updatedLoan.status,
              repayment_schedule: updatedLoan.repaymentSchedule,
            }).eq('id', loanId);
          }
        } catch (err) {
          console.error('[repayLoanInstallment error - reverting]', err);
          setAccounts(prevAccounts);
          setLoans(prevLoans);
          setTransactions(prevTransactions);
          dispatchRollback('Failed to repay loan installment. Changes were reverted.');
        }
      })();
    }
  };

  // ─── Request Money ─────────────────────────────────────────────────────────

  const createMoneyRequest = async ({ fromUserId, amount, note }) => {
    if (!currentUser) throw new Error('Must be logged in.');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Enter a valid amount.');
    const requestId = `req_${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const prevMoneyRequests = [...moneyRequests];
    const prevNotifications = [...notifications];

    const newReq = {
      id: requestId,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterAccount: currentUser.accountNo,
      fromUserId: fromUserId || null,
      amount: parsedAmount,
      note: note || 'Payment request',
      status: 'Pending',
      timestamp,
    };
    setMoneyRequests((prev) => [newReq, ...prev]);

    if (fromUserId) {
      setNotifications((prev) => [{
        id: `notif_req_${Date.now()}`,
        userId: fromUserId,
        type: 'money_request',
        title: 'Money Request',
        message: `${currentUser.name} is requesting $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}. ${note || ''}`,
        timestamp, read: false,
        requestId,
      }, ...prev]);
    }

    dispatchSuccess({
      title: 'Request Sent',
      message: `Payment request for $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been created and sent.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('money_requests').insert({
            id: newReq.id, requester_id: newReq.requesterId, requester_name: newReq.requesterName,
            requester_account: newReq.requesterAccount, from_user_id: newReq.fromUserId,
            amount: newReq.amount, note: newReq.note, status: newReq.status, timestamp: newReq.timestamp
          });
          if (error) throw error;
        } catch (err) {
          console.error('[createMoneyRequest error - reverting]', err);
          setMoneyRequests(prevMoneyRequests);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to create money request. Changes were reverted.');
        }
      })();
    }

    return newReq;
  };

  // ─── Notifications ─────────────────────────────────────────────────────────

  const markNotificationRead = async (notifId) => {
    const prevNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
          if (error) throw error;
        } catch (err) {
          console.error('[markNotificationRead error - reverting]', err);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to update notification. Changes were reverted.');
        }
      })();
    }
  };

  const markAllNotificationsRead = async (userId) => {
    const prevNotifications = [...notifications];
    setNotifications((prev) => prev.map((n) => (n.userId === userId ? { ...n, read: true } : n)));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
          if (error) throw error;
        } catch (err) {
          console.error('[markAllNotificationsRead error - reverting]', err);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to update notifications. Changes were reverted.');
        }
      })();
    }
  };

  // ─── Settings ──────────────────────────────────────────────────────────────

  const updateSettings = async (newSettings) => {
    const prevSettings = { ...settings };
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('system_settings').update(newSettings).eq('id', 1);
          if (error) throw error;
        } catch (err) {
          console.error('[updateSettings error - reverting]', err);
          setSettings(prevSettings);
          dispatchRollback('Failed to update system settings. Changes were reverted.');
        }
      })();
    }
  };

  // ─── External Transfers (Bank / Crypto) ───────────────────────────────────

  const submitExternalTransfer = async ({ transferType, amount, bankName, accountNumber, routingNumber, accountHolder, walletAddress, network, note }) => {
    if (!currentUser) throw new Error('Must be logged in.');
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error('Enter a valid amount.');

    const senderId = currentUser.id;
    const uAcc = accounts[senderId] || { checking: 0, savings: 0, loan: 0 };
    if (uAcc.checking < parsedAmount) throw new Error('Insufficient funds in your checking account.');

    const timestamp = new Date().toISOString();
    const id = `ext_${Date.now()}`;

    const newExt = {
      id, userId: senderId, userName: currentUser.name,
      transferType, amount: parsedAmount,
      bankName: bankName || null, accountNumber: accountNumber || null,
      routingNumber: routingNumber || null, accountHolder: accountHolder || null,
      walletAddress: walletAddress || null, network: network || null,
      note: note || null, status: 'Pending', failureReason: null, createdAt: timestamp,
    };

    const submitNotif = {
      id: `notif_ext_${Date.now()}`,
      userId: senderId,
      type: 'money_request',
      title: transferType === 'crypto' ? '₿ Crypto Transfer Submitted' : '🏦 Bank Transfer Submitted',
      message: `Your $${parsedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transferType === 'crypto' ? 'USDT' : 'bank'} transfer is under admin review and pending approval.`,
      timestamp: timestamp.replace('T', ' ').substring(0, 16),
      read: false,
    };

    const newSenderAcc = { ...uAcc, checking: uAcc.checking - parsedAmount };
    const prevAccounts = { ...accounts };
    const prevExternalTransfers = [...externalTransfers];
    const prevNotifications = [...notifications];

    setAccounts((prev) => ({ ...prev, [senderId]: newSenderAcc }));
    setExternalTransfers((prev) => [newExt, ...prev]);
    setNotifications((prev) => [submitNotif, ...prev]);

    dispatchSuccess({
      title: 'Transfer Submitted',
      message: submitNotif.message,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('external_transfers').insert({
            id: newExt.id, user_id: newExt.userId, user_name: newExt.userName,
            transfer_type: newExt.transferType, amount: newExt.amount,
            bank_name: newExt.bankName, account_number: newExt.accountNumber,
            routing_number: newExt.routingNumber, account_holder: newExt.accountHolder,
            wallet_address: newExt.walletAddress, network: newExt.network,
            note: newExt.note, status: 'Pending',
          });
          if (error) throw error;
          await Promise.all([
            syncAccount(senderId, newSenderAcc),
            insertNotifications([submitNotif]),
          ]);
        } catch (err) {
          console.error('[submitExternalTransfer error - reverting]', err);
          setAccounts(prevAccounts);
          setExternalTransfers(prevExternalTransfers);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to submit external transfer. Changes were reverted.');
        }
      })();
    }

    return newExt;
  };

  const resolveExternalTransfer = async (extId, { status, failureReason }) => {
    const ext = externalTransfers.find((e) => e.id === extId);
    if (!ext) throw new Error('Transfer not found.');

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const prevAccounts = { ...accounts };
    const prevExternalTransfers = [...externalTransfers];
    const prevNotifications = [...notifications];

    setExternalTransfers((prev) =>
      prev.map((e) => e.id === extId ? { ...e, status, failureReason: failureReason || null } : e)
    );

    // If failed/rejected by admin, refund money to user's checking account
    let updatedAcc = null;
    if (status === 'Failed' || status === 'Rejected') {
      const uAcc = accounts[ext.userId] || { checking: 0, savings: 0, loan: 0 };
      updatedAcc = { ...uAcc, checking: uAcc.checking + ext.amount };
      setAccounts((prev) => ({ ...prev, [ext.userId]: updatedAcc }));
    }

    const resolveNotif = {
      id: `notif_ext_res_${Date.now()}`,
      userId: ext.userId,
      type: status === 'Completed' ? 'transfer_sent' : 'transfer_failed',
      title: status === 'Completed'
        ? `${ext.transferType === 'crypto' ? 'Crypto' : 'Bank'} Transfer Approved`
        : `${ext.transferType === 'crypto' ? 'Crypto' : 'Bank'} Transfer Failed`,
      message: status === 'Completed'
        ? `Your $${ext.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${ext.transferType === 'crypto' ? 'USDT' : 'bank'} transfer has been approved and processed successfully.`
        : `Your $${ext.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${ext.transferType === 'crypto' ? 'USDT' : 'bank'} transfer was declined.${failureReason ? ` Reason: ${failureReason}` : ''}`,
      timestamp,
      read: false,
    };
    setNotifications((prev) => [resolveNotif, ...prev]);

    dispatchSuccess({
      title: status === 'Completed' ? 'Transfer Approved' : 'Transfer Rejected',
      message: `External transfer for ${ext.userName} marked as ${status}.`,
    });

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase
            .from('external_transfers')
            .update({ status, failure_reason: failureReason || null, updated_at: new Date().toISOString() })
            .eq('id', extId);
          if (error) throw error;
          const syncTasks = [insertNotifications([resolveNotif])];
          if (updatedAcc) syncTasks.push(syncAccount(ext.userId, updatedAcc));
          await Promise.all(syncTasks);
        } catch (err) {
          console.error('[resolveExternalTransfer error - reverting]', err);
          setAccounts(prevAccounts);
          setExternalTransfers(prevExternalTransfers);
          setNotifications(prevNotifications);
          dispatchRollback('Failed to resolve external transfer. Changes were reverted.');
        }
      })();
    }
  };

  return (
    <BankingContext.Provider
      value={{
        accounts, savingsMeta, transactions, loans, notifications, settings, moneyRequests, externalTransfers, lastFundedAt,
        bankingLoading,
        getUserBalances, getVisibleTransactions, lookupUserByIdentifier,
        transferFunds, mintCurrency, toggleTransactionStatus,
        manageSavingsDeposit, simulateInterestAccrual,
        applyForLoan, approveLoan, rejectLoan, repayLoanInstallment,
        createMoneyRequest,
        submitExternalTransfer, resolveExternalTransfer,
        markNotificationRead, markAllNotificationsRead,
        updateSettings,
      }}
    >
      {children}
    </BankingContext.Provider>
  );
}

export function useBanking() {
  return useContext(BankingContext);
}

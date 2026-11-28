/**
 * Finora User-Facing Transaction Display & Deposit Channel Utilities
 * Ensures customer-facing transaction feeds, statements, and modals display
 * authentic banking channels (Wire Transfer, ATM Deposit, SSA, Payroll, Bonuses)
 * instead of internal "Admin" terminology.
 */

export const FUNDING_SOURCES = [
  {
    id: 'wire_transfer',
    label: 'Wire Transfer',
    category: 'Wire Transfer',
    senderName: 'Fedwire Clearing Network',
    senderAccount: 'FW-02100021',
    defaultNote: 'Incoming Domestic Wire Transfer',
  },
  {
    id: 'atm_deposit',
    label: 'ATM Cash Deposit',
    category: 'ATM Deposit',
    senderName: 'Finora ATM Network',
    senderAccount: 'ATM-NYC-409',
    defaultNote: 'ATM Cash Top-Up',
  },
  {
    id: 'social_security',
    label: 'Social Security (SSA)',
    category: 'Social Security Benefit',
    senderName: 'U.S. Treasury · SSA',
    senderAccount: 'SSA-TREAS-310',
    defaultNote: 'Social Security Direct Deposit',
  },
  {
    id: 'direct_deposit',
    label: 'ACH Direct Deposit',
    category: 'Direct Deposit',
    senderName: 'ACH Clearing House',
    senderAccount: 'ACH-0260095',
    defaultNote: 'ACH Electronic Deposit',
  },
  {
    id: 'bonus',
    label: 'Account Bonus / Rewards',
    category: 'Account Bonus',
    senderName: 'Finora Rewards Program',
    senderAccount: 'FIN-REWARDS',
    defaultNote: 'Account Loyalty Bonus',
  },
  {
    id: 'payroll',
    label: 'Payroll Deposit',
    category: 'Payroll Deposit',
    senderName: 'Automated Payroll Clearing',
    senderAccount: 'PAY-884120',
    defaultNote: 'Direct Payroll Credit',
  },
];

export function getFundingSource(sourceId) {
  return FUNDING_SOURCES.find((s) => s.id === sourceId) || FUNDING_SOURCES[0];
}

function inferSourceFromText(text = '') {
  const q = text.toLowerCase();
  if (q.includes('atm') || q.includes('cash')) return getFundingSource('atm_deposit');
  if (q.includes('ssa') || q.includes('social') || q.includes('pension') || q.includes('treasury')) {
    return getFundingSource('social_security');
  }
  if (q.includes('bonus') || q.includes('reward') || q.includes('welcome') || q.includes('promo')) {
    return getFundingSource('bonus');
  }
  if (q.includes('payroll') || q.includes('salary') || q.includes('wage')) {
    return getFundingSource('payroll');
  }
  if (q.includes('ach') || q.includes('direct')) {
    return getFundingSource('direct_deposit');
  }
  return getFundingSource('wire_transfer');
}

function hasInternalAdminText(str = '') {
  return /\b(admin|adm-|finora central)\b/i.test(String(str));
}

/**
 * Normalizes any legacy/raw transaction record so user-facing UI never displays
 * internal "Admin", "Admin Credit", or "ADM-0019283" labels.
 */
export function sanitizeTxForUser(tx) {
  if (!tx) return tx;

  const combinedText = `${tx.category || ''} ${tx.note || ''} ${tx.senderName || ''}`;
  const isLegacyAdminDeposit =
    hasInternalAdminText(tx.category) ||
    hasInternalAdminText(tx.senderName) ||
    hasInternalAdminText(tx.note) ||
    String(tx.senderAccount || '').startsWith('ADM-');

  const inferred = inferSourceFromText(combinedText);

  const cleanCategory =
    !tx.category || tx.category.toLowerCase() === 'admin credit' || hasInternalAdminText(tx.category)
      ? inferred.category
      : tx.category;

  const cleanSenderName =
    hasInternalAdminText(tx.senderName) || tx.senderName === 'Finora Central (Admin)' || tx.senderName === 'Finora Admin (System)'
      ? inferred.senderName
      : tx.senderName;

  const cleanSenderAccount =
    String(tx.senderAccount || '').startsWith('ADM-')
      ? (tx.type === 'loan_disbursement' ? 'FIN-TREASURY-01' : inferred.senderAccount)
      : tx.senderAccount;

  const cleanRecipientAccount =
    String(tx.recipientAccount || '').startsWith('ADM-')
      ? 'FIN-TREASURY-01'
      : tx.recipientAccount;

  let cleanNote = tx.note || '';
  if (
    !cleanNote ||
    cleanNote.toLowerCase() === 'admin credit' ||
    cleanNote.toLowerCase().includes('admin direct account funding') ||
    cleanNote.toLowerCase().includes('admin dashboard funding') ||
    cleanNote.toLowerCase() === 'test grant' ||
    cleanNote.toLowerCase() === 'seed funding' ||
    hasInternalAdminText(cleanNote)
  ) {
    cleanNote = inferred.defaultNote;
  }

  if (!isLegacyAdminDeposit && !String(tx.recipientAccount || '').startsWith('ADM-')) {
    return tx;
  }

  const sanitized = {
    ...tx,
    category: cleanCategory,
    senderName: cleanSenderName,
    senderAccount: cleanSenderAccount,
    note: cleanNote,
  };
  if (cleanRecipientAccount !== undefined) {
    sanitized.recipientAccount = cleanRecipientAccount;
  }
  return sanitized;
}

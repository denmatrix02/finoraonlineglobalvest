const US_BANKS = [
  {
    bankName: 'JPMorgan Chase',
    routingNumber: '02100021',
    swiftCode: 'CHASUS33',
    bankAddress: '270 Park Avenue,\nNew York, NY 10017\nUnited States',
  },
  {
    bankName: 'Bank of America',
    routingNumber: '026009593',
    swiftCode: 'BOFAUS3N',
    bankAddress: '222 Broadway, New York, NY 10038\nUnited States',
  },
  {
    bankName: 'Wells Fargo Bank',
    routingNumber: '121000248',
    swiftCode: 'WFBIUS6S',
    bankAddress: '420 Montgomery Street, San Francisco, CA 94104\nUnited States',
  },
  {
    bankName: 'Citibank, N.A.',
    routingNumber: '021000089',
    swiftCode: 'CITIUS33',
    bankAddress: '388 Greenwich Street, New York, NY 10013\nUnited States',
  },
];

/**
 * Returns or generates external bank account details for external ACH/Wire deposits.
 */
export function getExternalBankDetails(user) {
  if (!user) return null;

  // Use stored external bank details if present
  if (user.externalBank && user.externalBank.accountNumber) {
    return user.externalBank;
  }

  // Generate deterministic 12-digit account number & bank details from user seed
  const seedString = (user.id || user.accountNo || user.email || user.name || 'finora').toString();
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed << 5) - seed + seedString.charCodeAt(i);
    seed |= 0;
  }
  const positiveSeed = Math.abs(seed);

  const bank = US_BANKS[positiveSeed % US_BANKS.length];

  // Generate 12-digit account number
  const numBase = Math.abs((positiveSeed * 1664525 + 1013904223) % 899999999999 + 100000000000);
  const accountNumber = numBase.toString().padStart(12, '9');

  return {
    bankName: bank.bankName,
    accountName: user.name || 'Account Holder',
    accountNumber: accountNumber,
    routingNumber: bank.routingNumber,
    swiftCode: bank.swiftCode,
    bankAddress: bank.bankAddress,
  };
}

/**
 * Formats external bank details into a clean shareable text block.
 */
export function formatExternalBankText(details) {
  if (!details) return '';
  return `Bank Name: ${details.bankName}
Account Name: ${details.accountName}
Account Number: ${details.accountNumber}
Routing Number (ABA): ${details.routingNumber}
SWIFT Code: ${details.swiftCode}
Bank Address:
${details.bankAddress}`;
}

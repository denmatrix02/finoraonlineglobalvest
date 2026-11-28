/**
 * Finora Virtual Card Utilities
 * Generates Luhn-valid Visa / Mastercard virtual card numbers, expiry dates,
 * CVV codes, and provides formatting + card theme definitions.
 */

export const CARD_THEMES = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Lime',
    bgClass: 'from-[#1B2B15] via-[#131814] to-[#0B0D0C]',
    borderClass: 'border-[#CAFF33]/35',
    glowClass: 'bg-[#CAFF33]/15',
    accentText: 'text-[#CAFF33]',
    chipGradient: 'from-[#CAFF33] via-[#9DC826] to-[#6E9214]',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Vault',
    bgClass: 'from-[#103329] via-[#0B201B] to-[#081110]',
    borderClass: 'border-emerald-400/30',
    glowClass: 'bg-emerald-400/15',
    accentText: 'text-emerald-300',
    chipGradient: 'from-emerald-200 via-emerald-400 to-teal-600',
  },
  titanium: {
    id: 'titanium',
    name: 'Stealth Titanium',
    bgClass: 'from-[#2A2D34] via-[#191B20] to-[#0F1013]',
    borderClass: 'border-white/20',
    glowClass: 'bg-white/10',
    accentText: 'text-amber-300',
    chipGradient: 'from-amber-200 via-amber-400 to-yellow-600',
  },
};

/**
 * Computes Luhn check digit for a partial card number string.
 */
function computeLuhnCheckDigit(partialDigits) {
  const digits = partialDigits.split('').map(Number).reverse();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let val = digits[i];
    if (i % 2 === 0) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    sum += val;
  }
  return ((10 - (sum % 10)) % 10).toString();
}

/**
 * Generates a Luhn-valid 16-digit card number.
 * VISA starts with 4532; MASTERCARD starts with 5412.
 */
export function generateLuhnCardNumber(brand = 'VISA') {
  const prefix = brand === 'MASTERCARD' ? '5412' : '4532';
  let body = prefix;
  for (let i = 0; i < 11; i++) {
    body += Math.floor(Math.random() * 10).toString();
  }
  return body + computeLuhnCheckDigit(body);
}

/**
 * Generates card expiration MM/YY 4 years in the future.
 */
export function generateCardExpiry() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String((now.getFullYear() + 4) % 100).padStart(2, '0');
  return `${month}/${year}`;
}

/**
 * Generates a random 3-digit CVV string.
 */
export function generateCardCvv() {
  return String(Math.floor(100 + Math.random() * 900));
}

/**
 * Formats a 16-digit PAN as groups of 4, masked or full.
 */
export function formatCardNumber(cardNumber = '', mask = true) {
  const clean = String(cardNumber).replace(/\D/g, '').padEnd(16, '0').slice(0, 16);
  const last4 = clean.slice(-4);
  if (mask) {
    return `••••  ••••  ••••  ${last4}`;
  }
  return clean.replace(/(.{4})/g, '$1  ').trim();
}

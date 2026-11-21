import React from 'react';

/**
 * MonoAmount — renders a monetary value in JetBrains Mono
 * Props:
 *   amount: number
 *   prefix: string (default '$')
 *   sign: boolean — show +/- sign
 *   direction: 'debit' | 'credit' | null
 *   size: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 */
export default function MonoAmount({
  amount = 0,
  prefix = '$',
  sign = false,
  direction = null,
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
  };

  const colorMap = {
    credit: 'text-[#CAFF33]',
    debit: 'text-[#FF5555]',
    neutral: 'text-white',
  };

  const color = direction ? colorMap[direction] : colorMap.neutral;
  const sizeClass = sizeMap[size] || sizeMap.md;

  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const signStr = sign ? (direction === 'debit' ? '-' : '+') : '';

  return (
    <span className={`font-mono-figures font-semibold ${sizeClass} ${color} ${className}`}>
      {signStr}{prefix}{formatted}
    </span>
  );
}

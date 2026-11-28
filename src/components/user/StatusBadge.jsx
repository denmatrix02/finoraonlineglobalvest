import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  Completed: {
    label: 'Completed',
    icon: CheckCircle2,
    bg: 'bg-[#CAFF33]/10',
    border: 'border-[#CAFF33]/30',
    text: 'text-[#CAFF33]',
  },
  Pending: {
    label: 'Pending',
    icon: Clock,
    bg: 'bg-[#F5A623]/10',
    border: 'border-[#F5A623]/30',
    text: 'text-[#F5A623]',
  },
  'Pending Review': {
    label: 'Pending Review',
    icon: Clock,
    bg: 'bg-[#F5A623]/10',
    border: 'border-[#F5A623]/30',
    text: 'text-[#F5A623]',
  },
  Failed: {
    label: 'Failed',
    icon: XCircle,
    bg: 'bg-[#FF5555]/10',
    border: 'border-[#FF5555]/30',
    text: 'text-[#FF5555]',
  },
  Active: {
    label: 'Active',
    icon: CheckCircle2,
    bg: 'bg-[#CAFF33]/10',
    border: 'border-[#CAFF33]/30',
    text: 'text-[#CAFF33]',
  },
  Repaid: {
    label: 'Repaid',
    icon: CheckCircle2,
    bg: 'bg-[#4ADE80]/10',
    border: 'border-[#4ADE80]/30',
    text: 'text-[#4ADE80]',
  },
  Paid: {
    label: 'Paid',
    icon: CheckCircle2,
    bg: 'bg-[#4ADE80]/10',
    border: 'border-[#4ADE80]/30',
    text: 'text-[#4ADE80]',
  },
  Suspended: {
    label: 'Suspended',
    icon: XCircle,
    bg: 'bg-[#FF5555]/10',
    border: 'border-[#FF5555]/30',
    text: 'text-[#FF5555]',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const Icon = cfg.icon;
  const iconSize = size === 'sm' ? 11 : 13;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] border font-semibold font-mono ${textSize} ${padding} ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <Icon size={iconSize} />
      {cfg.label}
    </span>
  );
}

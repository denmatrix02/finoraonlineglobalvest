import { useState } from 'react';

/**
 * UserAvatar — renders the user's profile avatar with graceful initials fallback
 * if no avatar URL is set or if the image fails to load.
 */
export default function UserAvatar({
  user,
  size = 'md',
  showStatus = false,
  className = '',
  ringClassName = 'border border-[#CAFF33]/35',
}) {
  const [failedSrc, setFailedSrc] = useState(null);

  const sizeMap = {
    xs: 'w-7 h-7 text-[10px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 sm:w-12 sm:h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
  };

  const dotSizeMap = {
    xs: 'w-2 h-2',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const hasValidAvatar = Boolean(user?.avatar) && failedSrc !== user?.avatar;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {hasValidAvatar ? (
        <img
          src={user.avatar}
          alt={user?.name || 'User Avatar'}
          onError={() => setFailedSrc(user?.avatar || 'error')}
          className={`${sizeMap[size] || sizeMap.md} rounded-full object-cover ${ringClassName}`}
        />
      ) : (
        <div
          className={`${sizeMap[size] || sizeMap.md} rounded-full bg-[#CAFF33]/15 ${ringClassName} flex items-center justify-center text-[#CAFF33] font-bold font-mono-figures select-none`}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${dotSizeMap[size] || dotSizeMap.md} rounded-full bg-[#CAFF33] ring-2 ring-[#111]`}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

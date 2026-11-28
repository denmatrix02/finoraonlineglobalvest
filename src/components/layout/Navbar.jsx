import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Bell, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../../assets/logo-30_3x.png';
import { useAuth } from '../../context/AuthContext';
import { useBanking } from '../../context/BankingContext';
import UserAvatar from '../user/UserAvatar';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, isLoggedIn, isAdmin } = useAuth();
  const { notifications } = useBanking();

  const unreadNotifs = isLoggedIn
    ? notifications.filter((n) => n.userId === currentUser?.id && !n.read).length
    : 0;

  const portalPath = isAdmin ? '/admin' : '/dashboard';
  const notifPath = isAdmin ? '/admin/inbox' : '/notifications';
  const profilePath = isAdmin ? '/admin' : '/profile';

  return (
    <header className="mx-auto mt-4 sm:mt-6 max-w-[1225px] w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] rounded-full fixed top-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-md border border-white/[0.06]">
      <div className="px-4 sm:px-8 flex items-center justify-between h-[60px] sm:h-[64px]">

        {/* Brand Logo — left */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoImg} alt="Finora Logo" width="26" height="26" className="object-contain" />
          <span className="text-[15px] font-semibold text-white tracking-tight">Finora</span>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {[
            { path: '/', label: 'Home', end: true },
            { path: '/about', label: 'About' },
            { path: '/security', label: 'Security' },
          ].map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.end}
              className={({ isActive }) =>
                `text-[14px] font-medium transition-colors duration-150 ${
                  isActive ? 'text-white' : 'text-[#7A8AAD] hover:text-[#cccccc]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to={portalPath}
                className="flex items-center gap-1.5 bg-[#CAFF33] hover:bg-[#b8e820] text-[#111111] text-[13px] font-semibold px-4 py-2 rounded-full transition-colors"
              >
                <LayoutDashboard size={14} />
                {isAdmin ? 'Admin Portal' : 'Dashboard'}
              </Link>
              <Link
                to={notifPath}
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#CAFF33]/40 flex items-center justify-center transition-colors"
              >
                <Bell size={16} className="text-[#BBB]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#FF5555] text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>
              <Link
                to={profilePath}
                aria-label="User Profile"
                title={currentUser?.name || 'Profile'}
                className="rounded-full hover:scale-105 transition-transform"
              >
                <UserAvatar
                  user={currentUser}
                  size="md"
                  showStatus
                  ringClassName="border-2 border-[#CAFF33]/45 hover:border-[#CAFF33]"
                />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="text-[14px] font-medium text-[#7A8AAD] hover:text-white transition-colors"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="bg-[#CAFF33] hover:bg-[#b8e820] text-[#111111] text-[14px] font-semibold px-5 py-2 rounded-full transition-colors"
              >
                Login
              </Link>
            </>
          )}
        </div>

        {/* Mobile Right Controls (Notification + Avatar when logged in + hamburger) */}
        <div className="md:hidden flex items-center gap-2">
          {isLoggedIn && (
            <>
              <Link
                to={notifPath}
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center"
              >
                <Bell size={16} className="text-[#BBB]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#FF5555] text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </Link>
              <Link to={profilePath} aria-label="User Profile">
                <UserAvatar
                  user={currentUser}
                  size="sm"
                  showStatus
                  ringClassName="border-2 border-[#CAFF33]/45"
                />
              </Link>
            </>
          )}

          <button
            className="text-white p-1.5"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0D0F14] border-t border-[#1E2840] rounded-b-3xl px-6 py-5 flex flex-col gap-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-[14px] font-medium ${isActive ? 'text-white' : 'text-[#7A8AAD]'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `text-[14px] font-medium ${isActive ? 'text-white' : 'text-[#7A8AAD]'}`
            }
            onClick={() => setIsOpen(false)}
          >
            About
          </NavLink>
          <NavLink
            to="/security"
            className={({ isActive }) =>
              `text-[14px] font-medium ${isActive ? 'text-white' : 'text-[#7A8AAD]'}`
            }
            onClick={() => setIsOpen(false)}
          >
            Security
          </NavLink>
          <div className="flex items-center gap-4 pt-4 border-t border-[#1E2840]">
            {isLoggedIn ? (
              <Link
                to={portalPath}
                className="w-full text-center bg-[#CAFF33] text-[#111111] text-[13px] font-semibold px-5 py-2.5 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                Open {isAdmin ? 'Admin Portal' : 'Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="text-[14px] text-[#7A8AAD]"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="bg-[#CAFF33] text-[#111111] text-[13px] font-semibold px-5 py-2 rounded-full"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

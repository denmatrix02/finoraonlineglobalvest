import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../../assets/logo-30_3x.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="mx-auto mt-6 max-w-[1225px] rounded-full fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-sm">
      <div className="m  px-8 flex items-center justify-between h-[64px]">

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

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-5">
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
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1.5"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0D0F14] border-t border-[#1E2840] px-6 py-5 flex flex-col gap-5">
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
          </div>
        </div>
      )}
    </header>
  );
}

import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

import logoImg from '../../assets/logo-30_3x.png';

const FinoraLogo = () => (
  <img src={logoImg} alt="Finora Logo" width="24" height="24" className="object-contain" />
);

const FacebookIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-bg border-t border-border mt-20">
      <div className="container py-16">
        {/* Logo + Nav (centered) */}
        <div className="flex flex-col items-center gap-6 mb-10">
          <Link to="/" className="flex items-center gap-2">
            <FinoraLogo />
            <span className="text-lg font-semibold text-text-main">Finora</span>
          </Link>
          <nav className="flex items-center gap-8">
            <Link to="/" className="text-sm text-text-muted hover:text-text-main transition-colors">Home</Link>
            <Link to="/about" className="text-sm text-text-muted hover:text-text-main transition-colors">About</Link>
            <Link to="/security" className="text-sm text-text-muted hover:text-text-main transition-colors">Security</Link>
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-8" />

        {/* Contact Info Row */}
        <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Mail size={15} className="text-primary" />
            <span>finoraonlineglobalvest@gmail.com</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Phone size={15} className="text-primary" />
            <span>+1 (914) 18 63 286</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <MapPin size={15} className="text-primary" />
            <span>New York</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-8" />

        {/* Bottom Row: Social | Copyright | Legal */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a href="#" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary-hover transition-colors">
              <FacebookIcon />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary-hover transition-colors">
              <TwitterIcon />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-black hover:bg-primary-hover transition-colors">
              <LinkedInIcon />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-text-muted">Finora All Rights Reserved</p>

          {/* Legal */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link to="/privacy" className="hover:text-text-main transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms" className="hover:text-text-main transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

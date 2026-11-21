import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import signUpPattern from '../assets/Sign Up.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message?.replace(/^EMAIL_NOT_CONFIRMED:\s*/, '') || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16 relative container mx-auto">
        <div className="w-full max-w-5xl">
          <div
            className="bg-[#151515] border border-border rounded-[2.5rem] px-8 py-16 md:px-16 md:py-24 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 z-0 opacity-[0.85] pointer-events-none"
              style={{
                backgroundImage: `url('${signUpPattern}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'top right'
              }}
              aria-hidden
            />

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-4">Login</h1>
                <p className="text-text-muted text-sm md:text-base max-w-xl mx-auto">
                  Welcome back! Please log in to access your Finora portal.
                </p>
              </div>

              {error && (
                <div className="max-w-xl mx-auto mb-6 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-4 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="max-w-4xl mx-auto space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                    placeholder="Email or Finora Account ID (e.g. ACC-XXXXXX)"
                    required
                  />
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 pr-12 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                      placeholder="Enter your Password"
                    />
                    <button
                      type="button"
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <a href="#" className="text-sm text-text-main hover:text-primary transition-colors underline decoration-border underline-offset-4">
                    Forgot Password?
                  </a>
                </div>

                <div className="max-w-[400px] mx-auto mt-10 space-y-5">
                  <button
                    id="login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-full bg-primary text-[#111111] font-semibold text-sm hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Logging in…</> : 'Login'}
                  </button>

                  <Link
                    to="/signup"
                    className="w-full py-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-text-main font-medium text-sm flex items-center justify-center hover:border-[#383838] transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import signUpPattern from '../assets/Sign Up.png';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !firstName) { setError('Please fill in all required fields.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      const result = await signup({
        name: `${firstName} ${lastName}`.trim(),
        email, phone, password, role: 'user',
      });
      // Always redirect to verify-email after registration.
      // VerifyEmailPage reads location.state.email / .name to display
      // the masked email and enable the resend button.
      navigate('/verify-email', {
        state: { email: result.email ?? email, name: result.name ?? `${firstName} ${lastName}`.trim() },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-bg flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16 relative container mx-auto">
        <div className="w-full max-w-5xl">
          <div className="bg-[#151515] border border-border rounded-[2.5rem] px-8 py-16 md:px-16 md:py-24 relative overflow-hidden">
            <div
              className="absolute inset-0 z-0 opacity-[0.85] pointer-events-none"
              style={{ backgroundImage: `url('${signUpPattern}')`, backgroundSize: 'cover', backgroundPosition: 'top right' }}
              aria-hidden
            />
            <div className="relative z-10">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-4">Sign Up</h1>
                <p className="text-text-muted text-sm md:text-base max-w-xl mx-auto">
                  Join Finora today — unlock modern banking, peer-to-peer transfers, savings, and instant loans.
                </p>
              </div>

              {error && (
                <div className="max-w-xl mx-auto mb-6 bg-[#FF5555]/10 border border-[#FF5555]/30 text-[#FF5555] p-4 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <form onSubmit={handleSignUp} className="max-w-4xl mx-auto space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    id="signup-firstname" type="text" value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                    placeholder="Enter First Name" required
                  />
                  <input
                    id="signup-lastname" type="text" value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                    placeholder="Enter Last Name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    id="signup-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                    placeholder="Enter your Email" required
                  />
                  <input
                    id="signup-phone" type="tel" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                    placeholder="Phone Number (optional)"
                  />
                </div>
                <div className="md:w-1/2">
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111111] border border-border rounded-full px-6 py-4 pr-12 text-sm text-text-main focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/60"
                      placeholder="Create a Password (min. 8 chars)" required
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
                <div className="max-w-[400px] mx-auto mt-10 space-y-5">
                  <button
                    id="signup-submit" type="submit" disabled={loading}
                    className="w-full py-4 rounded-full bg-primary text-[#111111] font-semibold text-sm hover:bg-primary-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Creating Account…</> : 'Create Account'}
                  </button>
                  <Link
                    to="/login"
                    className="w-full py-4 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-text-main font-medium text-sm flex items-center justify-center hover:border-[#383838] transition-all"
                  >
                    Already have an account? Login
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

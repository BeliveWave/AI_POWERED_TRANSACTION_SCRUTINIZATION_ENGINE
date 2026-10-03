import React, { useState } from 'react';
import { Mail, Shield, Sun, Moon, ArrowLeft, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { toast } from '../components/ui/toast.jsx';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { forgotPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setSubmitted(true);
      toast.success(result.message || "Password recovery instructions sent to your email.");
    } else {
      toast.error(result.error || "Failed to dispatch recovery instructions.");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground antialiased">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* Left Column: Institutional Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 text-zinc-100 flex-col justify-between p-12 border-r border-zinc-800 selection:bg-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Shield className="h-5 w-5 text-zinc-100" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wider uppercase text-zinc-100">Sentinel</span>
            <span className="block text-[10px] text-zinc-500 font-mono">Fraud Intelligence Middleware</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Security & Identity Recovery
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 leading-snug">
            Cryptographically secured account recovery protocols.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Password reset tokens are time-delimited (15 minutes), hashed with SHA-256 before storage, and single-use to defend against replay vectors.
          </p>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Zero plain-text token persistence</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Timing-attack and enumeration resistant</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Audit logging of recovery workflows</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Identity Gateway v2.4</span>
          <span>FIPS 140-2 Compliant</span>
        </div>
      </div>

      {/* Right Column: Recovery Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-8">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">Sentinel</span>
              <span className="block text-[10px] text-muted-foreground font-mono">Fraud Scrutinization</span>
            </div>
          </div>

          {!submitted ? (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">Forgot password?</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your registered institutional email to receive recovery instructions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Institutional Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      placeholder="analyst@bank.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-9 text-xs font-medium"
                >
                  {loading ? 'Dispatching recovery email...' : 'Send reset instructions'}
                </Button>
              </form>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to sign in</span>
                </Link>

                <Link
                  to="/reset-password"
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  Have a code?
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Check your inbox</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If an account exists for <span className="font-semibold text-foreground">{email}</span>, we have sent a secure password reset link along with a 6-digit verification code.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs text-left text-muted-foreground space-y-1.5">
                <div className="font-medium text-foreground">Next steps:</div>
                <div>1. Click the link in your email, or</div>
                <div>2. Enter the 6-digit code on the reset page</div>
                <div className="text-[11px] text-muted-foreground/80 mt-1">Codes expire in 15 minutes.</div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
                  className="w-full h-9 text-xs font-medium inline-flex items-center justify-center gap-2"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Enter 6-Digit Code</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setSubmitted(false)}
                  className="w-full h-8 text-xs text-muted-foreground"
                >
                  Send to a different email
                </Button>
              </div>

              <div className="pt-2 border-t border-border">
                <Link
                  to="/login"
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to sign in</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

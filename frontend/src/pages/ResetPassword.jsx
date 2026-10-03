import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, Mail, KeyRound, Shield, CheckCircle2, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { toast } from '../components/ui/toast.jsx';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = not checked, true = valid, false = invalid
  const [verificationError, setVerificationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  const { verifyResetToken, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Validate URL token on mount if provided
  useEffect(() => {
    if (tokenFromUrl && emailFromUrl) {
      setVerifying(true);
      verifyResetToken(emailFromUrl, tokenFromUrl).then((res) => {
        setVerifying(false);
        if (res.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setVerificationError(res.error || 'Password reset token is invalid or expired.');
        }
      });
    }
  }, [tokenFromUrl, emailFromUrl, verifyResetToken]);

  // Password requirement checks
  const checks = {
    length: newPassword.length >= 12,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>\-_=+\\/[\]]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !token) {
      toast.error('Email and reset token/code are required.');
      return;
    }

    if (!allValid) {
      toast.error('Password does not satisfy institutional security requirements.');
      return;
    }

    setSubmitting(true);
    const result = await resetPassword(email, token, newPassword, confirmPassword);
    setSubmitting(false);

    if (result.success) {
      setResetCompleted(true);
      toast.success('Your password has been successfully reset.');
    } else {
      toast.error(result.error || 'Failed to reset password.');
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

      {/* Left Column: Brand Showcase */}
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
            Zero-Trust Credential Reset
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 leading-snug">
            Establish new analyst access credentials.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Choose a compliant passphrase of 12+ characters incorporating cryptographic entropy. 
            Once updated, all prior session tokens and recovery links are invalidated immediately.
          </p>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Bcrypt work factor 12 hashing</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Immediate session revocation on credential update</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Immutable audit event logged in PostgreSQL</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Enterprise Credential Policy</span>
          <span>Entropy: High</span>
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm my-auto">
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

          {verifying ? (
            <div className="text-center py-12 space-y-3">
              <div className="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Verifying password reset credentials...</p>
            </div>
          ) : tokenValid === false ? (
            /* Expired / Invalid token error view */
            <div className="space-y-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Invalid or Expired Link</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {verificationError || 'This password reset link has expired or has already been used.'}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className="w-full h-9 text-xs font-medium"
                >
                  Request a new reset link
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => { setTokenValid(null); setToken(''); }}
                  className="w-full h-8 text-xs text-muted-foreground"
                >
                  Enter a code manually
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
          ) : resetCompleted ? (
            /* Success confirmation */
            <div className="space-y-6 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Password Reset Complete</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your credentials have been securely updated. You can now access the Sentinel console with your new password.
                </p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full h-9 text-xs font-medium"
              >
                Sign in with new password
              </Button>
            </div>
          ) : (
            /* Reset password input form */
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">Set new password</h2>
                <p className="text-xs text-muted-foreground">
                  Provide your recovery token and select a new secure password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
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
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Reset Token or 6-Digit Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="pl-9 h-9 text-xs font-mono"
                      placeholder="Token or 6-digit code"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-xs font-mono"
                      placeholder="••••••••••••"
                      required
                      minLength={12}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-xs font-mono"
                      placeholder="••••••••••••"
                      required
                      minLength={12}
                    />
                  </div>
                </div>

                {/* Password strength visual breakdown */}
                <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1.5 text-[11px]">
                  <div className="font-medium text-foreground mb-1">Security Requirements:</div>
                  <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>Minimum 12 characters ({newPassword.length}/12)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.upper && checks.lower ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>Uppercase and lowercase letters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>At least one number</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.special ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>At least one special character (!@#$%^&*)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${checks.match ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span>Passwords match</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !allValid || !email || !token}
                  className="w-full h-9 text-xs font-medium mt-2"
                >
                  {submitting ? 'Updating credentials...' : 'Reset password'}
                </Button>
              </form>

              <div className="pt-2 border-t border-border text-center">
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

export default ResetPassword;

import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, Shield, Sun, Moon, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { toast } from '../components/ui/toast.jsx';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Password requirements
  const checks = {
    length: password.length >= 12,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>\-_=+\\/[\]]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };
  const allValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allValid) {
      toast.error("Please satisfy all password security requirements before proceeding.");
      return;
    }

    setLoading(true);
    const result = await register(email, username, fullName, password);

    if (result.success) {
      toast.success("Account created successfully. Authenticating session...");
      const loginResult = await login(username, password);
      setLoading(false);

      if (loginResult.success) {
        navigate('/dashboard');
      } else {
        toast.info("Account established. Please sign in with your credentials.");
        navigate('/login');
      }
    } else {
      setLoading(false);
      toast.error(result.error || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground antialiased">
      {/* Top right theme toggle */}
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

        {/* Brand header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="h-9 w-9 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Shield className="h-5 w-5 text-zinc-100" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-wider uppercase text-zinc-100">Sentinel</span>
            <span className="block text-[10px] text-zinc-500 font-mono">Fraud Intelligence Middleware</span>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Developer & Compliance Ready
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 leading-snug">
            Equip your fraud operations team with explainable intelligence.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Create an institutional analyst profile to monitor transactions, configure algorithmic risk thresholds, inspect SHAP features, and export compliance audits.
          </p>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Dedicated analyst workspace with role-based policies</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Full cryptographic audit logs & two-factor security</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Instant webhook notifications for critical policy declines</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Enterprise Edition</span>
          <span>Zero third-party trackers</span>
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-sm my-auto">
          {/* Mobile branding header */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-8">
            <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight">Sentinel</span>
              <span className="block text-[10px] text-muted-foreground font-mono">Fraud Scrutinization</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">Create analyst account</h2>
              <p className="text-xs text-muted-foreground">
                Enter your details to register for the scrutinization console.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    placeholder="Jane Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 h-9 text-xs font-mono"
                    placeholder="jdoe_analyst"
                    required
                  />
                </div>
              </div>

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
                <label className="text-xs font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Confirm Password</label>
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

              {/* Real-time policy requirements breakdown */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1 text-[11px]">
                <div className="font-medium text-foreground mb-1">Password Requirements:</div>
                <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>At least 12 characters ({password.length}/12)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.upper && checks.lower ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>Uppercase and lowercase letters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${checks.number ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  <span>At least one number (0-9)</span>
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
                disabled={loading || !allValid}
                className="w-full h-9 text-xs font-medium mt-2"
              >
                {loading ? 'Creating analyst account...' : 'Create account'}
              </Button>
            </form>

            <div className="pt-2 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-medium text-foreground hover:underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

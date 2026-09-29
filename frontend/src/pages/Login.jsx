import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowRight, Sun, Moon, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States for flows
  const [requires2FA, setRequires2FA] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // OTP Reset States
  const [otpStep, setOtpStep] = useState(1);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password, otpCode || null);
    setLoading(false);

    if (result.success) {
      toast.success("Authentication successful");
      navigate('/dashboard');
    } else if (result.requires2FA) {
      setRequires2FA(true);
      toast.info("Please enter your two-factor authentication code.");
    } else {
      toast.error(result.error || "Invalid credentials");
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      toast.success("Verification code sent to your email");
      setOtpStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to dispatch recovery code");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        otp: resetOtp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      toast.success("Password reset successfully. Please sign in.");
      setShowForgotPassword(false);
      setOtpStep(1);
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reset password");
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
        {/* Subtle grid pattern background */}
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

        {/* Core Value Proposition */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SOC 2 Type II Certified Engine
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 leading-snug">
            Autonomous transaction scrutinization for modern banking infrastructure.
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed">
            Real-time fraud scoring, explainable SHAP diagnostics, and automated risk decisioning engineered to protect financial institutions at enterprise scale.
          </p>

          <div className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Sub-200ms real-time inference latency</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Full audit logging and decision trace capture</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <CheckCircle2 className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>Integrated investigator workflow & SHAP delta bars</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Engine v2.4.0</span>
          <span>Inference nodes: 12/12 online</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
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

          {!requires2FA ? (
            /* Primary Sign-in form */
            <div className="space-y-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your credentials to access the scrutinization console.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs"
                      placeholder="analyst@bank.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-xs font-mono"
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-9 text-xs font-medium"
                >
                  {loading ? 'Authenticating...' : 'Sign in to console'}
                </Button>
              </form>

              <div className="pt-2 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Need access to Sentinel?{' '}
                  <Link
                    to="/register"
                    className="font-medium text-foreground hover:underline underline-offset-4"
                  >
                    Create account
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            /* 2FA Verification Form */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <KeyRound className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Two-Factor Authentication</h2>
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="h-12 text-center text-xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full h-9 text-xs font-medium"
                >
                  {loading ? 'Verifying...' : 'Verify code'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRequires2FA(false)}
                  className="w-full h-8 text-xs text-muted-foreground"
                >
                  Back to login
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent onClose={() => { setShowForgotPassword(false); setOtpStep(1); }}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {otpStep === 1
                ? 'Enter your institutional email to receive a password reset token.'
                : `Enter the code sent to ${resetEmail} and choose a strong password.`}
            </DialogDescription>
          </DialogHeader>

          {otpStep === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Email Address</label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="analyst@bank.com"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Send Recovery Code
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">6-Digit Code</label>
                <Input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  className="text-center font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 12 characters"
                  minLength={12}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  minLength={12}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOtpStep(1)}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowForgotPassword(false); setOtpStep(1); }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Update Password
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
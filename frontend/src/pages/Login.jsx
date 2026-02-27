import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, ArrowRight, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Button from '../components/Common/Button';

// Graphical/Abstract AI Tech Image
const SIDE_IMAGE = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop";

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
  const [otpStep, setOtpStep] = useState(1); // 1 = Email, 2 = Verify & Reset
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password, otpCode || null);
    setLoading(false);

    if (result.success) {
      toast.success("Login successful!");
      navigate('/dashboard');
    } else if (result.requires2FA) {
        setRequires2FA(true);
        toast.info("Please enter your 2FA code.");
    } else {
      toast.error(result.error || "Invalid email or password");
    }
  };

  const handleSendOtp = async (e) => {
      e.preventDefault();
      try {
          await api.post('/auth/forgot-password', { email: resetEmail });
          toast.success("OTP sent to your email (check console/spam)");
          setOtpStep(2);
      } catch (err) {
          toast.error(err.response?.data?.detail || "Failed to send OTP");
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
          toast.success("Password reset successfully! Please login.");
          setShowForgotPassword(false);
          setOtpStep(1);
          // Optional: clear fields
          setResetOtp('');
          setNewPassword('');
          setConfirmPassword('');
      } catch (err) {
          toast.error(err.response?.data?.detail || "Failed to reset password");
      }
  };

  return (
    <div className="min-h-screen flex w-full bg-white relative">
      {/* Left Side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-900">
        <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900 via-transparent to-transparent z-10" />
        <img 
          src={SIDE_IMAGE} 
          alt="Login Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        
        <div className="relative z-20 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20">
              <Lock size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wider">AMU</span>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Secure Transaction<br/>Scrutinization
            </h1>
            <p className="text-blue-100 text-lg">
              AI-powered fraud detection and risk management for modern banking.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-500">
              Please enter your details to sign in.
            </p>
          </div>

          {!requires2FA ? (
              <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition duration-200 ease-in-out sm:text-sm"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Password</label>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition duration-200 ease-in-out sm:text-sm"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button type="button" onClick={() => setShowForgotPassword(true)} className="font-medium text-blue-600 hover:text-blue-500">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                  
                  <div className="text-center">
                     <p className="text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-500 transition-colors font-semibold">
                            Sign up now
                        </Link>
                    </p>
                  </div>
                </div>
              </form>
          ) : (
             /* 2FA Form */
             <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                 <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                        <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 mt-2">Enter the 6-digit code from your authenticator app.</p>
                 </div>

                 <div>
                    <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="block w-full text-center text-2xl tracking-widest py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition duration-200 ease-in-out"
                        placeholder="000000"
                        maxLength={6}
                        required
                        autoFocus
                    />
                 </div>

                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setRequires2FA(false)}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                  >
                      Back to Login
                  </button>
             </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-fade-in-up">
                  <button 
                    onClick={() => { setShowForgotPassword(false); setOtpStep(1); }}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  >
                      <X size={20} />
                  </button>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
                  
                  {otpStep === 1 ? (
                      /* Step 1: Email Input */
                      <form onSubmit={handleSendOtp} className="space-y-4">
                          <p className="text-gray-500 text-sm mb-4">Enter your email address to receive a 6-digit verification code.</p>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                            <input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your email"
                                required
                            />
                          </div>
                          <Button type="submit" className="w-full">Send OTP</Button>
                      </form>
                  ) : (
                      /* Step 2: OTP & New Password */
                      <form onSubmit={handleResetPassword} className="space-y-4">
                           <p className="text-gray-500 text-sm mb-4">Enter the code sent to {resetEmail} and your new password.</p>
                           
                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                                <input
                                    type="text"
                                    value={resetOtp}
                                    onChange={(e) => setResetOtp(e.target.value)}
                                    className="block w-full text-center text-xl tracking-widest py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                           </div>

                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={12}
                                />
                           </div>

                           <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    minLength={12}
                                />
                           </div>

                           <Button type="submit" className="w-full">Reset Password</Button>
                           <button 
                                type="button"
                                onClick={() => setOtpStep(1)}
                                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2"
                            >
                                Back
                            </button>
                      </form>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Login;
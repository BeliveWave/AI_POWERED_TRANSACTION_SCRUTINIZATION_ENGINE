import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ShieldCheck, ShieldAlert, KeyRound, Bell, Moon, Sun, Upload } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useTheme } from '../hooks/useTheme';

const ProfileSettings = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2FA State
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Notifications State
  const [notifyEmailHighRisk, setNotifyEmailHighRisk] = useState(false);

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      if (res.data.notification_preferences) {
        const prefs = JSON.parse(res.data.notification_preferences);
        setNotifyEmailHighRisk(prefs.email_high_risk || false);
      }
      setAvatarUrl(localStorage.getItem(`avatar_${res.data.username}`) || res.data.avatar || '');
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/generate');
      setQrCodeUrl(res.data.uri);
      setTwoFaSecret(res.data.secret);
      setShow2FASetup(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate 2FA token");
    }
  };

  const handleEnable2FA = async () => {
    if (!otpCode) return toast.warning("Enter the 6-digit TOTP code from your authenticator");
    try {
      await api.post('/auth/2fa/enable', { code: otpCode });
      toast.success("Two-Factor Authentication enabled");
      setShow2FASetup(false);
      setOtpCode('');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid TOTP verification code");
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable Two-Factor Authentication?")) return;
    try {
      await api.post('/auth/2fa/disable');
      toast.info("Two-Factor Authentication disabled");
      fetchProfile();
    } catch (err) {
      toast.error("Failed to disable 2FA");
    }
  };

  const savePreferences = async () => {
    try {
      const prefs = JSON.stringify({ email_high_risk: notifyEmailHighRisk });
      await api.put('/auth/me', { notification_preferences: prefs });
      toast.success("Security preferences saved");
    } catch (err) {
      toast.error("Failed to save preferences");
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String);
        if (profile?.username) {
          try {
            localStorage.setItem(`avatar_${profile.username}`, base64String);
            window.dispatchEvent(new Event('avatarUpdated'));
            toast.success("Profile photo updated");
          } catch (err) {
            toast.error("Image file is too large for local caching");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs text-muted-foreground">
        Loading user account profile...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Account & Security</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage session credentials, authenticator settings, and interface preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base">Profile Details</CardTitle>
          <CardDescription>Your personal identity and credentials.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold uppercase text-foreground">
                    {profile?.full_name ? profile.full_name.charAt(0) : (profile?.username ? profile.username.charAt(0) : 'U')}
                  </span>
                )}
              </div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer text-xs font-medium text-foreground hover:underline"
              >
                Change Avatar
              </label>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Full Name</span>
                <Input value={profile?.full_name || ''} readOnly className="bg-muted/40 cursor-default" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                <Input value={profile?.email || ''} readOnly className="bg-muted/40 cursor-default" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">System Username</span>
                <Input value={profile?.username || ''} readOnly className="bg-muted/40 cursor-default" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">Interface Theme</span>
                <Button variant="outline" size="sm" onClick={toggleTheme} className="w-full justify-start text-xs h-9">
                  {theme === 'dark' ? <Sun className="mr-2 h-3.5 w-3.5" /> : <Moon className="mr-2 h-3.5 w-3.5" />}
                  {theme === 'dark' ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Two-Factor Authentication (TOTP)</CardTitle>
              <CardDescription>Secure logins with Google Authenticator or an RFC 6238 TOTP application.</CardDescription>
            </div>
            <Badge variant={profile?.is_2fa_enabled ? 'outline' : 'secondary'}>
              {profile?.is_2fa_enabled ? '2FA Enabled' : '2FA Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {!profile?.is_2fa_enabled ? (
            <div>
              {!show2FASetup ? (
                <Button size="sm" onClick={handleGenerate2FA}>
                  <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                  Configure Two-Factor Auth
                </Button>
              ) : (
                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-6 items-center">
                    <div className="bg-white p-2.5 rounded-lg border border-border shadow-xs">
                      {qrCodeUrl && <QRCodeCanvas value={qrCodeUrl} size={130} />}
                    </div>
                    <div className="space-y-3 flex-1 text-xs">
                      <p className="text-muted-foreground leading-relaxed">
                        1. Open your authenticator app (Google Authenticator, 1Password, etc.).<br/>
                        2. Scan the barcode above.<br/>
                        3. Enter the generated 6-digit confirmation code below.
                      </p>
                      <Input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="max-w-xs font-mono text-center tracking-widest text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEnable2FA}>
                          Verify & Activate
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setShow2FASetup(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <Button variant="destructive" size="sm" onClick={handleDisable2FA}>
                Disable Two-Factor Auth
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notification Preferences Card */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm">Security Alerts & Dispatch</CardTitle>
          <CardDescription>Automated email triggers for critical engine events.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <label className="flex items-center gap-3 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              id="email_high_risk"
              className="h-4 w-4 rounded border-input text-foreground focus:ring-1 focus:ring-ring"
              checked={notifyEmailHighRisk}
              onChange={(e) => setNotifyEmailHighRisk(e.target.checked)}
            />
            <span>Dispatch high-priority email alerts when a transaction scores above 90% risk</span>
          </label>

          <Button size="sm" variant="outline" onClick={savePreferences}>
            Save Preferences
          </Button>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProfileSettings;

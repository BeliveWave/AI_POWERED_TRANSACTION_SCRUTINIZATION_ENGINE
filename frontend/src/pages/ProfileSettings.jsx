import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api'; // Assuming api instance exists
import { toast } from 'react-toastify';
import { useTheme } from '../hooks/useTheme';

const ProfileSettings = () => {
    const { user, login } = useAuth(); // Repurpose login to update user state if needed, or fetch fresh
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
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate2FA = async () => {
        try {
            const res = await api.post('/auth/2fa/generate');
            setQrCodeUrl(res.data.uri);
            setTwoFaSecret(res.data.secret); // Optional to show
            setShow2FASetup(true);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to generate 2FA");
        }
    };

    const handleEnable2FA = async () => {
        if (!otpCode) return toast.warning("Please enter the code from your app");
        try {
            await api.post('/auth/2fa/enable', { code: otpCode });
            toast.success("2FA Enabled Successfully!");
            setShow2FASetup(false);
            setOtpCode('');
            fetchProfile(); // Refresh
        } catch (err) {
            toast.error(err.response?.data?.detail || "Invalid Code");
        }
    };

    const handleDisable2FA = async () => {
        if (!window.confirm("Are you sure you want to disable 2FA?")) return;
        try {
            await api.post('/auth/2fa/disable');
            toast.success("2FA Disabled");
            fetchProfile();
        } catch (err) {
            toast.error("Failed to disable 2FA");
        }
    };

    const savePreferences = async () => {
        try {
            const prefs = JSON.stringify({ email_high_risk: notifyEmailHighRisk });
            await api.put('/auth/me', { notification_preferences: prefs });
            toast.success("Preferences Saved");
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
                        toast.success("Profile picture updated");
                    } catch (err) {
                        toast.error("Image too large to save locally");
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">Manage your account security and preferences.</p>
            </div>

            {/* Appearance Settings */}
            <Card className="p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Appearance</h2>
                        <p className="text-gray-600 dark:text-slate-400">Toggle between Light and Dark mode.</p>
                    </div>
                    <Button 
                        onClick={toggleTheme} 
                        className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 transition-colors shadow-lg shadow-amber-500/20"
                    >
                        {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    </Button>
                </div>
            </Card>

            {/* Profile Info */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">User Information</h2>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-slate-600">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-500 dark:text-slate-400 text-3xl font-bold uppercase">
                                    {profile?.full_name ? profile.full_name.charAt(0) : (profile?.username ? profile.username.charAt(0) : 'U')}
                                </span>
                            )}
                        </div>
                        <div>
                            <input
                                type="file"
                                id="avatar-upload"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="cursor-pointer text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                            >
                                Change Picture
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Full Name</label>
                            <p className="mt-1 p-2 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 rounded border border-gray-200">{profile?.full_name}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email</label>
                            <p className="mt-1 p-2 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 rounded border border-gray-200">{profile?.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Username</label>
                            <p className="mt-1 p-2 bg-gray-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 rounded border border-gray-200">{profile?.username}</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* 2FA Section */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Two-Factor Authentication (2FA)</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.is_2fa_enabled ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {profile?.is_2fa_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
                
                <p className="text-gray-600 dark:text-slate-400 mb-4">
                    Add an extra layer of security to your account using Google Authenticator or similar apps.
                </p>

                {!profile?.is_2fa_enabled ? (
                    <div>
                        {!show2FASetup ? (
                            <Button onClick={handleGenerate2FA} className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 shadow-lg shadow-amber-500/20">Setup 2FA</Button>
                        ) : (
                            <div className="bg-gray-50 dark:bg-slate-700/50 p-6 rounded-lg border border-gray-200 dark:border-slate-600">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Scan QR Code</h3>
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        {qrCodeUrl && <QRCodeCanvas value={qrCodeUrl} size={150} />}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <p className="text-sm text-gray-600 dark:text-slate-300">
                                            1. Open Google Authenticator (or any TOTP app).<br/>
                                            2. Scan the QR code.<br/>
                                            3. Enter the 6-digit code below to confirm.
                                        </p>
                                        <div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter 6-digit code"
                                                className="w-full max-w-xs p-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-amber-500 outline-none transition-colors"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleEnable2FA} className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600 dark:text-slate-900">Verify & Enable</Button>
                                            <Button onClick={() => setShow2FASetup(false)} className="bg-gray-500 hover:bg-gray-600 text-white dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <Button onClick={handleDisable2FA} className="bg-red-600 hover:bg-red-700 text-white">Disable 2FA</Button>
                    </div>
                )}
            </Card>

            {/* Notification Preferences */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="email_high_risk"
                            className="w-5 h-5 text-amber-500 rounded focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-600"
                            checked={notifyEmailHighRisk}
                            onChange={(e) => setNotifyEmailHighRisk(e.target.checked)}
                        />
                        <label htmlFor="email_high_risk" className="text-gray-700 dark:text-slate-300 font-medium cursor-pointer">
                            Email Alerts for High Security Risks (Fraud Score {'>'} 90%)
                        </label>
                    </div>
                    {/* Add more preferences here if needed */}
                </div>
                <div className="mt-6">
                    <Button onClick={savePreferences} className="bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-900 shadow-lg shadow-amber-500/20">Save Preferences</Button>
                </div>
            </Card>
        </div>
    );
};

export default ProfileSettings;

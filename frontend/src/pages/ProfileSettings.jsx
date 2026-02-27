import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api'; // Assuming api instance exists
import { toast } from 'react-toastify';

const ProfileSettings = () => {
    const { user, login } = useAuth(); // Repurpose login to update user state if needed, or fetch fresh
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2FA State
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFaSecret, setTwoFaSecret] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [show2FASetup, setShow2FASetup] = useState(false);

    // Notifications State
    const [notifyEmailHighRisk, setNotifyEmailHighRisk] = useState(false);

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

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account security and preferences.</p>
            </div>

            {/* Profile Info */}
            <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">User Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{profile?.full_name}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{profile?.email}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <p className="mt-1 p-2 bg-gray-50 rounded border border-gray-200">{profile?.username}</p>
                    </div>
                </div>
            </Card>

            {/* 2FA Section */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Two-Factor Authentication (2FA)</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${profile?.is_2fa_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {profile?.is_2fa_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                </div>
                
                <p className="text-gray-600 mb-4">
                    Add an extra layer of security to your account using Google Authenticator or similar apps.
                </p>

                {!profile?.is_2fa_enabled ? (
                    <div>
                        {!show2FASetup ? (
                            <Button onClick={handleGenerate2FA}>Setup 2FA</Button>
                        ) : (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                <h3 className="text-lg font-medium mb-4">Scan QR Code</h3>
                                <div className="flex flex-col md:flex-row gap-8 items-center">
                                    <div className="bg-white p-2 rounded shadow-sm">
                                        {qrCodeUrl && <QRCodeCanvas value={qrCodeUrl} size={150} />}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <p className="text-sm text-gray-600">
                                            1. Open Google Authenticator (or any TOTP app).<br/>
                                            2. Scan the QR code.<br/>
                                            3. Enter the 6-digit code below to confirm.
                                        </p>
                                        <div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter 6-digit code"
                                                className="w-full max-w-xs p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                maxLength={6}
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleEnable2FA} className="bg-green-600 hover:bg-green-700 text-white">Verify & Enable</Button>
                                            <Button onClick={() => setShow2FASetup(false)} className="bg-gray-500 hover:bg-gray-600 text-white">Cancel</Button>
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="email_high_risk"
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            checked={notifyEmailHighRisk}
                            onChange={(e) => setNotifyEmailHighRisk(e.target.checked)}
                        />
                        <label htmlFor="email_high_risk" className="text-gray-700 font-medium cursor-pointer">
                            Email Alerts for High Security Risks (Fraud Score {'>'} 90%)
                        </label>
                    </div>
                    {/* Add more preferences here if needed */}
                </div>
                <div className="mt-6">
                    <Button onClick={savePreferences}>Save Preferences</Button>
                </div>
            </Card>
        </div>
    );
};

export default ProfileSettings;

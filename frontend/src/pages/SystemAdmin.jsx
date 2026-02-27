import React, { useState, useEffect } from 'react';
import { Server, Check, AlertTriangle, Save } from 'lucide-react';
import Card from '../components/Common/Card';
import Badge from '../components/Common/Badge';
import Button from '../components/Common/Button';
import api from '../services/api';
import { toast } from 'react-toastify';

const SystemAdmin = () => {
    // System Health (Mock for now, can be real later)
    const systemHealth = [
        { name: 'API Server', status: 'healthy', uptime: '99.98%', latency: '45ms', cpu: '32%' },
        { name: 'ML Model', status: 'healthy', uptime: '99.95%', latency: '120ms', cpu: '68%' },
        { name: 'Database', status: 'healthy', uptime: '99.99%', latency: '8ms', cpu: '45%' },
        { name: 'Queue Service', status: 'warning', uptime: '99.87%', latency: '250ms', cpu: '78%' },
    ];

    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);

    // Form States
    const [declineThreshold, setDeclineThreshold] = useState(0.70);
    const [reviewThreshold, setReviewThreshold] = useState(0.50);
    const [slackWebhook, setSlackWebhook] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/api/admin/config');
            const data = res.data; // List of {key, value}
            
            const configMap = {};
            data.forEach(c => configMap[c.key] = c.value);
            setConfigs(configMap);

            if (configMap['fraud_threshold_decline']) setDeclineThreshold(parseFloat(configMap['fraud_threshold_decline']));
            if (configMap['fraud_threshold_review']) setReviewThreshold(parseFloat(configMap['fraud_threshold_review']));
            if (configMap['slack_webhook_url']) setSlackWebhook(configMap['slack_webhook_url']);

        } catch (err) {
            console.error(err);
            // toast.error("Failed to fetch system configs"); 
            // Suppress error on first load if empty
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (key, value) => {
        try {
            await api.post('/api/admin/config', { key, value: String(value) });
            toast.success(`Updated ${key}`);
        } catch (err) {
            toast.error(`Failed to update ${key}`);
        }
    };

    const handleSaveThresholds = async () => {
        await saveConfig('fraud_threshold_decline', declineThreshold);
        await saveConfig('fraud_threshold_review', reviewThreshold);
    };

    const handleSaveWebhook = async () => {
        await saveConfig('slack_webhook_url', slackWebhook);
    };

    const getStatusIcon = (status) => {
        if (status === 'healthy') return <Check size={20} className="text-green-600" />;
        return <AlertTriangle size={20} className="text-yellow-600" />;
    };

    const getStatusVariant = (status) => {
        return status === 'healthy' ? 'success' : 'warning';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
                <p className="text-gray-600 mt-1">Monitor system health and manage global infrastructure.</p>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {systemHealth.map((service, idx) => (
                    <Card key={idx} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                <Badge variant={getStatusVariant(service.status)} className="mt-2">
                                    {service.status === 'healthy' ? '✓ Healthy' : '⚠ Warning'}
                                </Badge>
                            </div>
                            {getStatusIcon(service.status)}
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Uptime</span>
                                <span className="font-medium text-gray-900">{service.uptime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Latency</span>
                                <span className="font-medium text-gray-900">{service.latency}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Global Fraud Thresholds */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Global Fraud Thresholds</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Auto-Decline Threshold: {(declineThreshold * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={declineThreshold}
                            onChange={(e) => setDeclineThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer"
                        />
                         <p className="text-sm text-gray-500 mt-1">Score &gt; {declineThreshold} = Auto Decline</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Manual Review Threshold: {(reviewThreshold * 100).toFixed(0)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={reviewThreshold}
                            onChange={(e) => setReviewThreshold(parseFloat(e.target.value))}
                            className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-sm text-gray-500 mt-1">Score &gt; {reviewThreshold} = Manual Review</p>
                    </div>

                    <Button onClick={handleSaveThresholds} icon={Save}>Update Global Thresholds</Button>
                </div>
            </Card>

            {/* Slack Webhook Integration */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Slack Webhook Integration</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Send real-time alerts to a Slack channel when high-risk transactions occur.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                        <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://hooks.slack.com/services/..."
                            value={slackWebhook}
                            onChange={(e) => setSlackWebhook(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSaveWebhook} icon={Save}>Save Webhook</Button>
                </div>
            </Card>
        </div>
    );
};

export default SystemAdmin;
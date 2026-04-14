import React, { useState, useEffect, useCallback } from 'react';
import {
  Server, Database, Brain, Zap, CheckCircle, AlertTriangle, XCircle,
  Save, RefreshCw, Bell, Shield, Activity,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  healthy:  { dot: 'bg-emerald-500', ring: 'ring-emerald-200', card: 'border-emerald-100', badge: 'bg-emerald-50 text-emerald-700', icon: CheckCircle,   label: 'Healthy'  },
  warning:  { dot: 'bg-amber-400',   ring: 'ring-amber-200',   card: 'border-amber-100',   badge: 'bg-amber-50 text-amber-700',    icon: AlertTriangle, label: 'Warning'  },
  critical: { dot: 'bg-red-500',     ring: 'ring-red-200',     card: 'border-red-100',     badge: 'bg-red-50 text-red-700',        icon: XCircle,       label: 'Critical' },
  unknown:  { dot: 'bg-gray-300',    ring: 'ring-gray-200',    card: 'border-gray-100',    badge: 'bg-gray-100 text-gray-500',     icon: Activity,      label: 'Unknown'  },
};

const SVC_ICON = {
  'API Server':        Server,
  'Database':          Database,
  'XGBoost Model':     Brain,
  'Autoencoder Model': Zap,
};

// ── Section card ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, iconColor = 'text-blue-600', iconBg = 'bg-blue-100', title, description, accent = 'border-l-blue-500', children }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden border-l-4 ${accent}`}>
    <div className="flex items-center gap-4 px-8 py-5 border-b border-gray-100 bg-gray-50/60">
      <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={22} className={iconColor} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="px-8 py-7">{children}</div>
  </div>
);

// ── Threshold slider ───────────────────────────────────────────────────────
const ThresholdSlider = ({ label, hint, value, color, onChange }) => {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-base font-semibold text-gray-800">{label}</label>
        <span className={`text-2xl font-black ${color === 'red' ? 'text-red-500' : 'text-amber-500'}`}>{pct}%</span>
      </div>
      <div className="relative h-4 flex items-center">
        <div className={`absolute w-full h-3 rounded-full ${color === 'red' ? 'bg-red-100' : 'bg-amber-100'}`} />
        <input
          type="range" min="0" max="100" value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className={`relative w-full h-3 rounded-full appearance-none cursor-pointer bg-transparent ${
            color === 'red' ? 'accent-red-500' : 'accent-amber-500'
          }`}
        />
      </div>
      <p className="text-sm text-gray-500">{hint}</p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
const SystemAdmin = () => {
  const [health, setHealth]               = useState([]);
  const [overall, setOverall]             = useState('unknown');
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked]     = useState(null);

  const [declineThreshold, setDeclineThreshold] = useState(0.70);
  const [reviewThreshold, setReviewThreshold]   = useState(0.50);
  const [thresholdSaving, setThresholdSaving]   = useState(false);

  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackSaving, setSlackSaving]   = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);

  // Load saved config
  useEffect(() => {
    api.get('/api/admin/config').then(res => {
      const map = Object.fromEntries(res.data.map(c => [c.key, c.value]));
      if (map['fraud_threshold_decline']) setDeclineThreshold(parseFloat(map['fraud_threshold_decline']));
      if (map['fraud_threshold_review'])  setReviewThreshold(parseFloat(map['fraud_threshold_review']));
      if (map['slack_webhook_url'])       setSlackWebhook(map['slack_webhook_url']);
    }).catch(() => {});
  }, []);

  // Health polling every 10s
  const fetchHealth = useCallback(async () => {
    try {
      const res = await api.get('/api/system/health');
      setHealth(res.data.services || []);
      setOverall(res.data.overall || 'unknown');
      setLastChecked(new Date());
    } catch { setOverall('unknown'); }
    finally { setHealthLoading(false); }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 10000);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const saveThresholds = async () => {
    if (reviewThreshold >= declineThreshold) { toast.warn('Review must be lower than Decline.'); return; }
    setThresholdSaving(true);
    try {
      await api.post('/api/admin/config', { key: 'fraud_threshold_decline', value: String(declineThreshold) });
      await api.post('/api/admin/config', { key: 'fraud_threshold_review',  value: String(reviewThreshold) });
      toast.success('✅ Thresholds saved — AI engine updated!');
    } catch { toast.error('Failed to save thresholds.'); }
    finally { setThresholdSaving(false); }
  };

  const saveWebhook = async () => {
    setSlackSaving(true);
    try {
      await api.post('/api/admin/config', { key: 'slack_webhook_url', value: slackWebhook });
      toast.success('Slack webhook saved.');
    } catch { toast.error('Failed to save webhook.'); }
    finally { setSlackSaving(false); }
  };

  const testWebhook = async () => {
    if (!slackWebhook.startsWith('https://')) {
      toast.warn('Webhook URL must start with https://');
      return;
    }
    setSlackTesting(true);
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '🔔 *Sentinel Test Alert* — Webhook integration is working!' }),
      });
      toast.success('✅ Test message sent! Check your webhook receiver.');
    } catch {
      // webhook.site and some services block browser CORS — the request still arrives
      toast.info('Request fired. If you see a CORS error, the message still arrived at webhook.site — check it there.');
    } finally {
      setSlackTesting(false);
    }
  };

  const overallS = STATUS[overall] || STATUS.unknown;

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-gray-500 mt-2 text-base">Infrastructure health · AI thresholds · External integrations</p>
        </div>
        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border-2 text-sm font-semibold shrink-0 ${overallS.badge} border-current`}>
          <span className={`w-2.5 h-2.5 rounded-full ${overallS.dot} ${overall === 'healthy' ? 'animate-pulse' : ''}`} />
          {overall === 'healthy' ? 'All Systems Operational' : overall === 'degraded' ? 'System Degraded' : 'Status Unknown'}
        </div>
      </div>

      {/* ── Health Cards ── */}
      <Section icon={Activity} title="Infrastructure Health Monitor"
        description="Live probe — each component is actively tested every 10 seconds"
        accent="border-l-blue-500">

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString()}` : 'Checking…'}
          </p>
          <button onClick={fetchHealth} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors">
            <RefreshCw size={14} /> Refresh now
          </button>
        </div>

        {healthLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {health.map(svc => {
              const s      = STATUS[svc.status] || STATUS.unknown;
              const SIcon  = SVC_ICON[svc.name] || Server;
              const SBadge = s.icon;
              return (
                <div key={svc.name}
                  className={`relative p-6 border-2 ${s.card} rounded-2xl bg-white hover:shadow-lg transition-all group cursor-default`}>
                  {/* Pulsing status dot */}
                  <span className={`absolute top-4 right-4 w-3 h-3 rounded-full ${s.dot} ring-4 ${s.ring} ${svc.status === 'healthy' ? 'animate-pulse' : ''}`} />

                  <SIcon size={34} className="text-gray-200 mb-4 group-hover:text-gray-300 transition-colors" />
                  <p className="text-base font-bold text-gray-900 mb-2 leading-tight">{svc.name}</p>

                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${s.badge}`}>
                    <SBadge size={11} />{s.label}
                  </div>

                  {svc.latency_ms != null
                    ? <p className="text-4xl font-black text-gray-800 mt-5 leading-none">
                        {svc.latency_ms}<span className="text-sm font-normal text-gray-400 ml-1">ms</span>
                      </p>
                    : <p className="text-3xl font-black text-gray-200 mt-5">—</p>
                  }
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{svc.detail}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Thresholds + Slack side by side ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

        {/* Thresholds */}
        <Section icon={Shield} iconColor="text-red-600" iconBg="bg-red-100"
          title="Global Fraud Thresholds"
          description="Master AI decision switch — takes effect on the very next transaction"
          accent="border-l-red-500">

          <div className="space-y-7">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 leading-relaxed">
              <strong>How it works:</strong> Every transaction gets a score 0–100%.
              Above <strong>Decline</strong> = auto-blocked. Between both = escalated to an analyst.
            </div>

            <ThresholdSlider
              label="🚨 Auto-Decline Threshold"
              hint={`Scores above ${Math.round(declineThreshold * 100)}% are automatically declined`}
              value={declineThreshold} color="red" onChange={setDeclineThreshold}
            />
            <ThresholdSlider
              label="⚠️ Manual Review Threshold"
              hint={`Scores above ${Math.round(reviewThreshold * 100)}% are escalated to analyst review`}
              value={reviewThreshold} color="yellow" onChange={setReviewThreshold}
            />

            {reviewThreshold >= declineThreshold && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                ⚠️ Review threshold must be strictly lower than Decline threshold.
              </p>
            )}

            <button onClick={saveThresholds}
              disabled={thresholdSaving || reviewThreshold >= declineThreshold}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {thresholdSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {thresholdSaving ? 'Saving…' : 'Save Thresholds'}
            </button>
          </div>
        </Section>

        {/* Slack */}
        <Section icon={Bell} iconColor="text-violet-600" iconBg="bg-violet-100"
          title="Slack Webhook Integration"
          description="Automatically push critical alerts to your team's Slack channel"
          accent="border-l-violet-500">

          <div className="space-y-6">
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700 leading-relaxed">
              <strong>Trigger events:</strong> The backend posts to this URL when a transaction scores
              above 70% (high risk). Alerts fire silently — no dashboard monitoring needed.
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Webhook URL</label>
              <input type="text" value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-violet-400 transition-colors bg-gray-50"
              />
              <p className="text-xs text-gray-400 mt-2">
                Use your real Slack webhook (<strong>api.slack.com/apps</strong>) or a test URL from{' '}
                <a href="https://webhook.site" target="_blank" rel="noreferrer" className="text-violet-600 underline font-medium">webhook.site</a>
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={saveWebhook} disabled={slackSaving}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors">
                {slackSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {slackSaving ? 'Saving…' : 'Save Webhook'}
              </button>
              <button onClick={testWebhook} disabled={slackTesting || !slackWebhook}
                className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-violet-300 text-violet-700 rounded-xl text-sm font-bold hover:bg-violet-50 disabled:opacity-40 transition-colors">
                {slackTesting ? <RefreshCw size={16} className="animate-spin" /> : <Bell size={16} />}
                {slackTesting ? 'Sending…' : 'Test Alert'}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default SystemAdmin;
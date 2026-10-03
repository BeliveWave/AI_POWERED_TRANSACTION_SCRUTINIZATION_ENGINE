import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '../components/ui/toast.jsx';
import {
  Shield, ShoppingBag, Globe, Plus, X, Save, RefreshCw,
  Server, Database, Brain, Zap, CheckCircle, AlertTriangle, XCircle, Activity, Bell
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs.jsx';
import { API_BASE_URL } from '../services/api.js';

const API = API_BASE_URL;
const getToken = () => localStorage.getItem('token') || localStorage.getItem('access_token') || '';

const SVC_ICON = {
  'API Server': Server,
  'Database': Database,
  'XGBoost Model': Brain,
  'Autoencoder Model': Zap,
};

const STATUS_MAP = {
  healthy: { badge: 'success', label: 'Operational' },
  warning: { badge: 'warning', label: 'Degraded' },
  critical: { badge: 'destructive', label: 'Offline' },
  unknown: { badge: 'outline', label: 'Unknown' },
};

const Configuration = () => {
  const [activeTab, setActiveTab] = useState('thresholds');

  // ── Thresholds State ──────────────────────────────────────────────────
  const [declineThreshold, setDeclineThreshold] = useState(0.70);
  const [reviewThreshold, setReviewThreshold] = useState(0.50);
  const [thresholdSaving, setThresholdSaving] = useState(false);

  // ── Merchant Whitelist State ──────────────────────────────────────────
  const [whitelist, setWhitelist] = useState([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [merchantLoading, setMerchantLoading] = useState(false);

  // ── Country Blacklist State ───────────────────────────────────────────
  const [blacklist, setBlacklist] = useState([]);
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [countryLoading, setCountryLoading] = useState(false);

  // ── Infrastructure Health State ───────────────────────────────────────
  const [health, setHealth] = useState([]);
  const [overall, setOverall] = useState('unknown');
  const [healthLoading, setHealthLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  // ── Webhook State ─────────────────────────────────────────────────────
  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);

  const getHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  });

  // ── Loaders ───────────────────────────────────────────────────────────
  const loadThresholds = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/thresholds`);
      if (res.ok) {
        const data = await res.json();
        setDeclineThreshold(data.decline_threshold);
        setReviewThreshold(data.review_threshold);
      }
    } catch {
      // silent
    }
  }, []);

  const loadWhitelist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/merchant-whitelist`, { headers: getHeaders() });
      if (res.ok) setWhitelist(await res.json());
    } catch {
      // silent
    }
  }, []);

  const loadBlacklist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/country-blacklist`, { headers: getHeaders() });
      if (res.ok) setBlacklist(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/system/health`);
      if (res.ok) {
        const data = await res.json();
        setHealth(data.services || []);
        setOverall(data.overall || 'unknown');
        setLastChecked(new Date());
      }
    } catch {
      setOverall('unknown');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/config`);
      if (res.ok) {
        const configs = await res.json();
        const slack = configs.find(c => c.key === 'slack_webhook_url');
        if (slack) setSlackWebhook(slack.value);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadThresholds();
    loadWhitelist();
    loadBlacklist();
    fetchHealth();
    loadConfig();

    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [loadThresholds, loadWhitelist, loadBlacklist, fetchHealth, loadConfig]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const saveThresholds = async () => {
    if (reviewThreshold >= declineThreshold) {
      toast.warn('Review threshold must be strictly lower than Decline cutoff.');
      return;
    }
    setThresholdSaving(true);
    try {
      const res = await fetch(`${API}/api/config/thresholds`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          decline_threshold: declineThreshold,
          review_threshold: reviewThreshold,
        }),
      });
      if (res.ok) {
        toast.success('Risk thresholds updated across inference pipelines');
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Failed to save thresholds.');
    } finally {
      setThresholdSaving(false);
    }
  };

  const addMerchant = async () => {
    const name = newMerchant.trim();
    if (!name) return;
    setMerchantLoading(true);
    try {
      const res = await fetch(`${API}/api/config/merchant-whitelist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ merchant_name: name }),
      });
      if (res.ok) {
        toast.success(`'${name}' added to trusted merchants`);
        setNewMerchant('');
        loadWhitelist();
      }
    } catch {
      toast.error('Failed to add merchant.');
    } finally {
      setMerchantLoading(false);
    }
  };

  const removeMerchant = async (id, name) => {
    try {
      await fetch(`${API}/api/config/merchant-whitelist/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      toast.info(`'${name}' removed from whitelist`);
      setWhitelist(prev => prev.filter(m => m.id !== id));
    } catch {
      toast.error('Failed to remove merchant.');
    }
  };

  const addCountry = async () => {
    const code = newCountryCode.trim().toUpperCase();
    const name = newCountryName.trim();
    if (!code || !name) {
      toast.warn('Provide both 2-letter ISO code and country name.');
      return;
    }
    setCountryLoading(true);
    try {
      const res = await fetch(`${API}/api/config/country-blacklist`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ country_code: code, country_name: name }),
      });
      if (res.ok) {
        toast.success(`'${name}' added to high-risk blacklist`);
        setNewCountryCode('');
        setNewCountryName('');
        loadBlacklist();
      }
    } catch {
      toast.error('Failed to add country.');
    } finally {
      setCountryLoading(false);
    }
  };

  const removeCountry = async (id, name) => {
    try {
      await fetch(`${API}/api/config/country-blacklist/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      toast.info(`'${name}' removed from blacklist`);
      setBlacklist(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to remove country.');
    }
  };

  const saveWebhook = async () => {
    setSlackSaving(true);
    try {
      await fetch(`${API}/api/admin/config`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ key: 'slack_webhook_url', value: slackWebhook }),
      });
      toast.success('Slack webhook saved');
    } catch {
      toast.error('Failed to save webhook.');
    } finally {
      setSlackSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!slackWebhook.startsWith('https://')) {
      toast.warn('Webhook URL must begin with https://');
      return;
    }
    setSlackTesting(true);
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '🔔 *Sentinel Health Alert* — Webhook integration verified!' }),
      });
      toast.success('Test alert payload dispatched');
    } catch {
      toast.info('Test request sent.');
    } finally {
      setSlackTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Engine Settings & Administration</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure risk thresholds, operational heartbeats, whitelists, and notification pipelines.
          </p>
        </div>
        <Badge variant={overall === 'healthy' ? 'success' : 'warning'} className="self-start sm:self-auto">
          {overall === 'healthy' ? 'All Engines Operational' : 'Engine Warning'}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="thresholds">Risk Rules & Lists</TabsTrigger>
          <TabsTrigger value="health">Infrastructure Health</TabsTrigger>
          <TabsTrigger value="integrations">Slack Alerts</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: THRESHOLDS & LISTS ── */}
        <TabsContent value="thresholds" className="space-y-6">
          
          {/* Threshold Sliders Card */}
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base">Global Risk Threshold Bands</CardTitle>
              <CardDescription>
                Calibrate sensitivity cutoffs. Any transaction exceeding these thresholds will be automatically escalated or blocked.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              
              {/* Decline Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-foreground">Policy Decline Cutoff (Critical)</span>
                  <span className="font-mono text-base font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {Math.round(declineThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(declineThreshold * 100)}
                  onChange={(e) => setDeclineThreshold(Number(e.target.value) / 100)}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-muted accent-foreground"
                />
                <p className="text-xs text-muted-foreground">Transactions scoring above this confidence are immediately declined.</p>
              </div>

              {/* Review Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-foreground">Escalate to Review Cutoff</span>
                  <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {Math.round(reviewThreshold * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(reviewThreshold * 100)}
                  onChange={(e) => setReviewThreshold(Number(e.target.value) / 100)}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-muted accent-foreground"
                />
                <p className="text-xs text-muted-foreground">Transactions between this score and the decline cutoff require manual review.</p>
              </div>

              <div className="pt-2">
                <Button size="sm" onClick={saveThresholds} disabled={thresholdSaving}>
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                  {thresholdSaving ? 'Updating...' : 'Save Thresholds'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Whitelist & Blacklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Merchant Whitelist */}
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm">Trusted Merchant Whitelist</CardTitle>
                <CardDescription>Bypasses automated strict declines for verified partners.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Merchant name (e.g. Apple Store)"
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value)}
                  />
                  <Button size="sm" onClick={addMerchant} disabled={merchantLoading}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 rounded-lg border border-border bg-muted/20">
                  {whitelist.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No whitelisted merchants.</span>
                  ) : (
                    whitelist.map((m) => (
                      <span key={m.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-card text-foreground">
                        {m.merchant_name}
                        <button onClick={() => removeMerchant(m.id, m.merchant_name)} className="text-muted-foreground hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Country Blacklist */}
            <Card>
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm">High-Risk Regional Blacklist</CardTitle>
                <CardDescription>Automatically escalates card transactions originating from specified jurisdictions.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="ISO (e.g. RU)"
                    value={newCountryCode}
                    maxLength={2}
                    onChange={(e) => setNewCountryCode(e.target.value)}
                    className="w-20 font-mono uppercase"
                  />
                  <Input
                    placeholder="Country Name"
                    value={newCountryName}
                    onChange={(e) => setNewCountryName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addCountry} disabled={countryLoading}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 rounded-lg border border-border bg-muted/20">
                  {blacklist.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No blacklisted regions.</span>
                  ) : (
                    blacklist.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border bg-card text-foreground">
                        <span className="font-mono text-[10px] text-muted-foreground">{c.country_code}</span>
                        {c.country_name}
                        <button onClick={() => removeCountry(c.id, c.country_name)} className="text-muted-foreground hover:text-red-500">
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ── TAB 2: INFRASTRUCTURE HEALTH ── */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Service Health & Latency Probes</CardTitle>
                <CardDescription>Live health checks dispatched every 15 seconds.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchHealth} disabled={healthLoading}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
                Probe Now
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {health.map((svc) => {
                  const SIcon = SVC_ICON[svc.name] || Server;
                  const statusInfo = STATUS_MAP[svc.status] || STATUS_MAP.unknown;

                  return (
                    <div key={svc.name} className="p-4 rounded-lg border border-border bg-card space-y-3">
                      <div className="flex items-center justify-between">
                        <SIcon className="h-5 w-5 text-muted-foreground" />
                        <Badge variant={statusInfo.badge}>{statusInfo.label}</Badge>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{svc.name}</p>
                        <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                          {svc.latency_ms != null ? `${svc.latency_ms}ms` : '—'}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{svc.detail || 'Normal operation'}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: SLACK WEBHOOK ── */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm">Slack Webhook Dispatcher</CardTitle>
              <CardDescription>Receive immediate real-time Slack notifications when high-severity anomalies are detected.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5 max-w-xl">
                <label className="text-xs font-medium text-foreground">Incoming Webhook URL</label>
                <Input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={saveWebhook} disabled={slackSaving}>
                  {slackSaving ? 'Saving...' : 'Save Webhook'}
                </Button>
                <Button variant="outline" size="sm" onClick={testWebhook} disabled={slackTesting || !slackWebhook}>
                  {slackTesting ? 'Dispatching...' : 'Send Test Notification'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default Configuration;
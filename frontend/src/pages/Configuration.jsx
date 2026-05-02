import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Shield, ShoppingBag, Globe, Plus, X, Save, RefreshCw } from 'lucide-react';

const API = 'http://localhost:8000';

// ── Helper: get auth token ─────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token') || '';

// ── Reusable Tag chip ──────────────────────────────────────────────────────
const Tag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-slate-700/50 text-blue-700 dark:text-amber-500 border border-blue-200 dark:border-slate-600 rounded-full text-sm font-medium transition-colors">
    {label}
    <button
      onClick={onRemove}
      className="text-blue-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      title="Remove"
    >
      <X size={15} />
    </button>
  </span>
);

// ── Section card wrapper ───────────────────────────────────────────────────
const Section = ({ icon: Icon, title, description, children }) => (
  <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden border-l-4 border-l-amber-500 transition-colors backdrop-blur-sm">
    <div className="flex items-center gap-4 px-8 py-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60">
      <div className="w-11 h-11 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
        <Icon size={22} className="text-amber-600 dark:text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
    <div className="px-8 py-7">{children}</div>
  </div>
);

// ── Threshold Slider ───────────────────────────────────────────────────────
const ThresholdSlider = ({ label, value, color, onChange }) => {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-gray-800 dark:text-slate-200">{label}</span>
        <span className={`text-2xl font-black ${
            color === 'red' ? 'text-red-500 dark:text-red-400' : 'text-amber-500'
          }`}>
          {pct}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-slate-700 ${
          color === 'red' ? 'accent-red-500' : 'accent-amber-500'
        }`}
      />
      <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════
const Configuration = () => {
  // ── Thresholds ────────────────────────────────────────────────────────
  const [declineThreshold, setDeclineThreshold] = useState(0.70);
  const [reviewThreshold, setReviewThreshold] = useState(0.50);
  const [thresholdSaving, setThresholdSaving] = useState(false);

  // ── Merchant Whitelist ────────────────────────────────────────────────
  const [whitelist, setWhitelist] = useState([]);
  const [newMerchant, setNewMerchant] = useState('');
  const [merchantLoading, setMerchantLoading] = useState(false);

  // ── Country Blacklist ─────────────────────────────────────────────────
  const [blacklist, setBlacklist] = useState([]);
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [countryLoading, setCountryLoading] = useState(false);

  const headers = { Authorization: `Bearer ${getToken()}` };

  // ── Load all config on mount ──────────────────────────────────────────
  const loadThresholds = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/thresholds`);
      if (!res.ok) return;
      const data = await res.json();
      setDeclineThreshold(data.decline_threshold);
      setReviewThreshold(data.review_threshold);
    } catch {
      toast.error('Failed to load thresholds.');
    }
  }, []);

  const loadWhitelist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/merchant-whitelist`, { headers });
      if (!res.ok) return;
      setWhitelist(await res.json());
    } catch {
      toast.error('Failed to load merchant whitelist.');
    }
  }, []);

  const loadBlacklist = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/config/country-blacklist`, { headers });
      if (!res.ok) return;
      setBlacklist(await res.json());
    } catch {
      toast.error('Failed to load country blacklist.');
    }
  }, []);

  useEffect(() => {
    loadThresholds();
    loadWhitelist();
    loadBlacklist();
  }, [loadThresholds, loadWhitelist, loadBlacklist]);

  // ── Save thresholds ───────────────────────────────────────────────────
  const saveThresholds = async () => {
    if (reviewThreshold >= declineThreshold) {
      toast.warn('Review threshold must be lower than Decline threshold.');
      return;
    }
    setThresholdSaving(true);
    try {
      const res = await fetch(`${API}/api/config/thresholds`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decline_threshold: declineThreshold,
          review_threshold: reviewThreshold,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('✅ Thresholds saved — AI engine updated immediately!');
    } catch {
      toast.error('Failed to save thresholds.');
    } finally {
      setThresholdSaving(false);
    }
  };

  // ── Merchant whitelist actions ────────────────────────────────────────
  const addMerchant = async () => {
    const name = newMerchant.trim();
    if (!name) return;
    setMerchantLoading(true);
    try {
      const res = await fetch(`${API}/api/config/merchant-whitelist`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_name: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || 'Failed to add merchant.');
        return;
      }
      toast.success(`'${name}' added to whitelist.`);
      setNewMerchant('');
      loadWhitelist();
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
        headers,
      });
      toast.info(`'${name}' removed from whitelist.`);
      setWhitelist((prev) => prev.filter((m) => m.id !== id));
    } catch {
      toast.error('Failed to remove merchant.');
    }
  };

  // ── Country blacklist actions ──────────────────────────────────────────
  const addCountry = async () => {
    const code = newCountryCode.trim().toUpperCase();
    const name = newCountryName.trim();
    if (!code || !name) {
      toast.warn('Please enter both country code and name.');
      return;
    }
    setCountryLoading(true);
    try {
      const res = await fetch(`${API}/api/config/country-blacklist`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ country_code: code, country_name: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || 'Failed to add country.');
        return;
      }
      toast.success(`'${name}' added to blacklist.`);
      setNewCountryCode('');
      setNewCountryName('');
      loadBlacklist();
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
        headers,
      });
      toast.info(`'${name}' removed from blacklist.`);
      setBlacklist((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to remove country.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configuration</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-2 text-base">
          Manage global fraud thresholds, trusted merchants, and blocked regions.
        </p>
      </div>

      {/* ─── SECTION 1: Thresholds ─────────────────────────────────────── */}
      <Section
        icon={Shield}
        title="Fraud Decision Thresholds"
        description="Controls when the AI engine flags a transaction. Changes take effect immediately on the live engine."
      >
        <div className="space-y-6">
          {/* Visual legend */}
          <div className="flex gap-4 text-xs dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              Decline (Critical Risk)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Escalate (Manual Review)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              Approve (Low Risk)
            </span>
          </div>

          <ThresholdSlider
            label="Decline Threshold (Auto-Block)"
            value={declineThreshold}
            color="red"
            onChange={setDeclineThreshold}
          />
          <ThresholdSlider
            label="Review Threshold (Escalate for Manual Check)"
            value={reviewThreshold}
            color="yellow"
            onChange={setReviewThreshold}
          />

          {/* Warning when values are invalid */}
          {reviewThreshold >= declineThreshold && (
            <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              ⚠️ Review threshold must be lower than Decline threshold.
            </p>
          )}

          {/* Save button */}
          <button
            onClick={saveThresholds}
            disabled={thresholdSaving || reviewThreshold >= declineThreshold}
            className="flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-gray-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {thresholdSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {thresholdSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Section>

      {/* ─── SECTION 2: Merchant Whitelist ─────────────────────────────── */}
      <Section
        icon={ShoppingBag}
        title="Merchant Whitelist"
        description="Transactions from these merchants bypass the AI engine and are automatically approved."
      >
        {/* Add new */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newMerchant}
            onChange={(e) => setNewMerchant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMerchant()}
            placeholder='e.g. "Amazon"'
            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 bg-gray-50 dark:bg-slate-700 dark:text-white transition-colors"
          />
          <button
            onClick={addMerchant}
            disabled={merchantLoading || !newMerchant.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 dark:hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={17} />
            Add
          </button>
        </div>

        {/* List */}
        {whitelist.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 italic">No merchants whitelisted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {whitelist.map((m) => (
              <Tag
                key={m.id}
                label={m.merchant_name}
                onRemove={() => removeMerchant(m.id, m.merchant_name)}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ─── SECTION 3: Country Blacklist ──────────────────────────────── */}
      <Section
        icon={Globe}
        title="Country Blacklist"
        description="Transactions from these countries are automatically declined regardless of AI score."
      >
        {/* Add new */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newCountryCode}
            onChange={(e) => setNewCountryCode(e.target.value.slice(0, 3))}
            placeholder="Code (e.g. KP)"
            className="w-28 px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm uppercase focus:outline-none focus:border-red-400 dark:focus:border-red-500 bg-gray-50 dark:bg-slate-700 dark:text-white transition-colors"
          />
          <input
            type="text"
            value={newCountryName}
            onChange={(e) => setNewCountryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCountry()}
            placeholder="Country name (e.g. North Korea)"
            className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-red-400 dark:focus:border-red-500 bg-gray-50 dark:bg-slate-700 dark:text-white transition-colors"
          />
          <button
            onClick={addCountry}
            disabled={countryLoading || !newCountryCode.trim() || !newCountryName.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Plus size={17} />
            Block
          </button>
        </div>

        {/* List */}
        {blacklist.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 italic">No countries blacklisted yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {blacklist.map((c) => (
              <Tag
                key={c.id}
                label={`${c.country_code} — ${c.country_name}`}
                onRemove={() => removeCountry(c.id, c.country_name)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default Configuration;
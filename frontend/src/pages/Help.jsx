import React, { useState, useEffect } from 'react';
import {
  BookOpen, Lock, AlertTriangle, Wrench, ChevronDown, ChevronUp,
  Search, Mail, Clock, Cpu, CheckCircle, XCircle, Send,
  ArrowRight, Terminal, Zap, Activity, Shield
} from 'lucide-react';

// ─── System Status ────────────────────────────────────────────────────────────
const statusData = {
  api: { label: 'API Gateway', status: 'operational' },
  ml: { label: 'ML Scoring Engine', status: 'operational' },
  db: { label: 'Database', status: 'operational' },
  redis: { label: 'Redis Cache', status: 'operational' },
  responseTime: '183ms',
  modelVersion: 'v1.3.2',
  lastUpdated: new Date().toLocaleString(),
};

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'How does the AI fraud scoring work?',
    a: 'TSE uses an ensemble of XGBoost classifiers and an autoencoder-based anomaly detector. Each transaction is scored using 30+ behavioral features including amount deviation, velocity, location, device fingerprint, and merchant category. The final fraud score (0.0–1.0) is a weighted combination of both models.'
  },
  {
    q: 'Why was my transaction flagged?',
    a: 'A transaction is flagged when its fraud score exceeds the configured threshold (default: 0.7). Common triggers include geographic anomalies (sudden country change), velocity violations (>5 txns in 10 min), amount outliers (>3σ from baseline), and device mismatches.'
  },
  {
    q: 'How fast is the API response time?',
    a: 'The median end-to-end scoring latency is under 200ms. The scoring pipeline (feature extraction + inference) averages 120ms. Network overhead is excluded. For high-throughput scenarios, use the batch endpoint POST /api/transactions/batch.'
  },
  {
    q: 'Can I adjust fraud sensitivity?',
    a: 'Yes. Navigate to Configuration → Risk Thresholds. Set the score cutoff for Approve (<threshold), Escalate (±band), and Decline (>threshold). Lowering the threshold increases sensitivity (more flags, higher false positive rate). Changes take effect immediately.'
  },
  {
    q: 'What does a score of 0.8 mean?',
    a: 'A score of 0.8 indicates an 80% model confidence that the transaction is fraudulent. At default thresholds: 0.0–0.5 = Approve, 0.5–0.7 = Escalate for review, 0.7–1.0 = Decline. Score alone does not block — the configured decision rule does.'
  },
  {
    q: 'How do I integrate TSE into my system?',
    a: 'Send a POST request to /api/transactions with required fields: amount, merchant, card_number, customer_id, and transaction_metadata. Include Authorization: Bearer <token> header. The response includes fraud_score, decision, and explanation fields. See API docs for the full schema.'
  },
  {
    q: 'Does the system learn over time?',
    a: 'Yes. TSE supports continuous learning via feedback loops. When analysts override decisions (approve/decline), those labels are queued for retraining. The model is retrained weekly on the combined original + feedback dataset. Model version increments on each retrain cycle.'
  },
];

// ─── Error Troubleshooting Data ──────────────────────────────────────────────
const errors = [
  {
    code: '401 Unauthorized',
    color: 'red',
    cause: 'Missing, expired, or malformed JWT token in the Authorization header.',
    fix: 'Re-authenticate via POST /auth/login to obtain a fresh access_token. Ensure the header format is: Authorization: Bearer <token>.',
  },
  {
    code: '500 Internal Server Error',
    color: 'red',
    cause: 'Unhandled backend exception — typically a failed ML model inference or database write.',
    fix: 'Check /api/system/health for component status. Review backend logs at uvicorn stdout. If the ML model is unloaded, restart the FastAPI worker.',
  },
  {
    code: 'Timeout (>200ms)',
    color: 'yellow',
    cause: 'ML model is cold-starting, Redis cache miss, or database query plan degradation.',
    fix: 'Warm the model with a synthetic request on startup. Verify Redis connectivity. Run ANALYZE on PostgreSQL tables. For persistent latency, scale the uvicorn worker pool.',
  },
  {
    code: 'Database Connection Failure',
    color: 'red',
    cause: 'PostgreSQL is unreachable, connection pool exhausted, or invalid DATABASE_URL in .env.',
    fix: 'Verify DATABASE_URL in backend/.env. Check pg_stat_activity for pool saturation. Increase max_connections in postgresql.conf if needed.',
  },
  {
    code: 'Redis Cache Miss',
    color: 'yellow',
    cause: 'Cache key expired or Redis instance not running. Falls back to DB query automatically.',
    fix: 'Verify REDIS_URL in .env. Run redis-cli ping to check connectivity. If cache-miss rate is consistently high, review TTL configuration in config.py.',
  },
];

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickCard = ({ icon: Icon, title, subtitle, color, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left p-6 rounded-2xl bg-[#121217] border border-[#ffffff0f] hover:border-[#D4AF37]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,175,55,0.1)]"
  >
    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
    <p className="text-[#A8A8B3] text-sm">{subtitle}</p>
    <div className="mt-4 flex items-center text-[#D4AF37] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
      Go to section <ArrowRight className="w-4 h-4 ml-1" />
    </div>
  </button>
);

// ─── FAQ Accordion Item ───────────────────────────────────────────────────────
const FAQItem = ({ q, a, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-[#ffffff0f] rounded-xl overflow-hidden transition-all duration-300 ${open ? 'border-[#D4AF37]/30' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-5 text-left bg-[#121217] hover:bg-[#1a1a24] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-[#D4AF37]/50 text-sm font-mono">{String(index + 1).padStart(2, '0')}</span>
          <span className="text-white font-medium text-sm">{q}</span>
        </div>
        {open
          ? <ChevronUp className="w-5 h-5 text-[#D4AF37] shrink-0" />
          : <ChevronDown className="w-5 h-5 text-[#A8A8B3] shrink-0" />
        }
      </button>
      {open && (
        <div className="px-6 pb-5 bg-[#0f0f16] border-t border-[#ffffff0a]">
          <p className="text-[#A8A8B3] text-sm leading-relaxed pt-4 font-mono">{a}</p>
        </div>
      )}
    </div>
  );
};

// ─── Error Card ───────────────────────────────────────────────────────────────
const ErrorCard = ({ code, cause, fix, color }) => {
  const borderMap = { red: 'border-red-500/30', yellow: 'border-yellow-500/30' };
  const badgeMap = { red: 'bg-red-500/10 text-red-400 border border-red-500/20', yellow: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
  return (
    <div className={`p-6 rounded-2xl bg-[#121217] border ${borderMap[color]}`}>
      <span className={`inline-block text-xs font-mono font-bold px-2.5 py-1 rounded mb-4 ${badgeMap[color]}`}>{code}</span>
      <div className="space-y-3">
        <div>
          <p className="text-[#A8A8B3] text-xs uppercase tracking-widest mb-1 font-semibold">Cause</p>
          <p className="text-white text-sm">{cause}</p>
        </div>
        <div className="border-t border-[#ffffff0a] pt-3">
          <p className="text-[#A8A8B3] text-xs uppercase tracking-widest mb-1 font-semibold">Fix</p>
          <p className="text-[#A8A8B3] text-sm font-mono">{fix}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Status Indicator ─────────────────────────────────────────────────────────
const StatusDot = ({ status }) => (
  <span className={`inline-flex items-center space-x-1.5 text-xs font-medium ${status === 'operational' ? 'text-green-400' : 'text-red-400'}`}>
    <span className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
    <span>{status === 'operational' ? 'Operational' : 'Degraded'}</span>
  </span>
);

// ─── Main Help Page ───────────────────────────────────────────────────────────
const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', type: 'Integration', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = faqs.filter(f =>
    searchQuery === '' || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollTo = (id) => {
    setActiveSection(id);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', email: '', type: 'Integration', message: '' });
  };

  return (
    <div className="min-h-screen text-white space-y-12">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121217] via-[#0f1420] to-[#0B0B0F] border border-[#ffffff0f] p-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-[200px] opacity-5 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-xs font-medium text-[#D4AF37]">TSE v1.3.2 — Enterprise Support</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Help & Support Center</h1>
          <p className="text-[#A8A8B3] text-lg mb-8">
            Get assistance with integration, API usage, and fraud detection system behavior.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A8A8B3]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation, errors, or guides…"
              className="w-full pl-12 pr-4 py-3.5 bg-[#0B0B0F]/80 border border-[#ffffff14] rounded-xl text-white placeholder-[#A8A8B3] focus:outline-none focus:border-[#D4AF37]/50 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard icon={BookOpen} title="API Documentation" subtitle="Endpoints, schemas, and authentication guides" color="bg-blue-600" onClick={() => scrollTo('api-docs')} />
          <QuickCard icon={Lock} title="Authentication Issues" subtitle="JWT tokens, 401 errors, and session problems" color="bg-purple-600" onClick={() => scrollTo('errors')} />
          <QuickCard icon={AlertTriangle} title="Fraud Score Explained" subtitle="Understand scoring ranges and decision logic" color="bg-amber-600" onClick={() => scrollTo('faq')} />
          <QuickCard icon={Wrench} title="Integration Guide" subtitle="Step-by-step setup for middleware integration" color="bg-cyan-600" onClick={() => scrollTo('errors')} />
        </div>
      </div>

      {/* ── System Status ── */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {Object.entries(statusData).filter(([k]) => !['responseTime', 'modelVersion', 'lastUpdated'].includes(k)).map(([key, val]) => (
            <div key={key} className="p-5 rounded-2xl bg-[#121217] border border-[#ffffff0f]">
              <p className="text-[#A8A8B3] text-xs mb-2">{val.label}</p>
              <StatusDot status={val.status} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, label: 'Avg Response Time', value: statusData.responseTime },
            { icon: Cpu, label: 'Model Version', value: statusData.modelVersion },
            { icon: Clock, label: 'Status Last Updated', value: statusData.lastUpdated },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-5 rounded-2xl bg-[#121217] border border-[#ffffff0f] flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[#A8A8B3] text-xs">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── API Docs Quick Reference ── */}
      <div id="api-docs">
        <h2 className="text-xl font-bold text-white mb-6">API Reference</h2>
        <div className="rounded-2xl bg-[#121217] border border-[#ffffff0f] overflow-hidden">
          <div className="p-4 bg-[#0f0f16] border-b border-[#ffffff0a] flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#A8A8B3] text-xs font-mono">Base URL: http://localhost:8000</span>
          </div>
          <div className="divide-y divide-[#ffffff0a]">
            {[
              { method: 'POST', path: '/api/transactions', desc: 'Submit a transaction for fraud scoring' },
              { method: 'GET',  path: '/api/transactions', desc: 'Retrieve transaction list with filters' },
              { method: 'POST', path: '/api/transactions/{id}/decide', desc: 'Override a fraud decision (Approve/Decline)' },
              { method: 'POST', path: '/auth/login', desc: 'Authenticate and receive a JWT access token' },
              { method: 'GET',  path: '/auth/me', desc: 'Return the currently authenticated user profile' },
              { method: 'GET',  path: '/api/system/health', desc: 'Check API, DB, Redis, and ML model status' },
            ].map(({ method, path, desc }) => (
              <div key={path} className="px-6 py-4 flex items-center space-x-4">
                <span className={`text-xs font-bold font-mono w-12 shrink-0 ${method === 'POST' ? 'text-green-400' : 'text-blue-400'}`}>{method}</span>
                <span className="text-white font-mono text-sm flex-1">{path}</span>
                <span className="text-[#A8A8B3] text-sm hidden md:block">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq">
        <h2 className="text-xl font-bold text-white mb-2">Frequently Asked Questions</h2>
        <p className="text-[#A8A8B3] text-sm mb-6">
          {searchQuery ? `${filteredFaqs.length} result(s) for "${searchQuery}"` : `${faqs.length} questions`}
        </p>
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-[#A8A8B3]">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          ) : (
            filteredFaqs.map((faq, i) => <FAQItem key={i} index={i} {...faq} />)
          )}
        </div>
      </div>

      {/* ── Error Troubleshooting ── */}
      <div id="errors">
        <h2 className="text-xl font-bold text-white mb-2">Error Troubleshooting</h2>
        <p className="text-[#A8A8B3] text-sm mb-6">Common integration and runtime errors with root cause analysis.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {errors.map((err, i) => <ErrorCard key={i} {...err} />)}
        </div>
      </div>

      {/* ── Contact Support ── */}
      <div id="contact">
        <h2 className="text-xl font-bold text-white mb-6">Contact Support</h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-[#121217] border border-[#ffffff0f]">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs text-[#A8A8B3]">Direct Email</p>
                  <p className="text-white font-medium text-sm">support@tse.ai</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs text-[#A8A8B3]">Response Time</p>
                  <p className="text-white font-medium text-sm">Within 24 hours (business days)</p>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-[#121217] border border-[#ffffff0f]">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-white text-sm font-semibold">Priority SLA</span>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { tier: 'Critical (P1)', sla: '< 2 hours' },
                  { tier: 'High (P2)', sla: '< 8 hours' },
                  { tier: 'Medium (P3)', sla: '< 24 hours' },
                  { tier: 'Low (P4)', sla: '< 72 hours' },
                ].map(({ tier, sla }) => (
                  <div key={tier} className="flex justify-between">
                    <span className="text-[#A8A8B3]">{tier}</span>
                    <span className="text-white font-mono">{sla}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-[#121217] border border-[#ffffff0f] space-y-5">
              <h3 className="text-white font-semibold">Submit a Support Ticket</h3>
              {submitted && (
                <div className="flex items-center space-x-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Ticket submitted. Our team will respond within 24 hours.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#A8A8B3] mb-1.5 uppercase tracking-wider">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="John Smith"
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#ffffff0f] rounded-xl text-white placeholder-[#A8A8B3]/50 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#A8A8B3] mb-1.5 uppercase tracking-wider">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#ffffff0f] rounded-xl text-white placeholder-[#A8A8B3]/50 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#A8A8B3] mb-1.5 uppercase tracking-wider">Issue Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#ffffff0f] rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none"
                >
                  <option>Integration</option>
                  <option>API Authentication</option>
                  <option>Fraud Score Behavior</option>
                  <option>Performance / Latency</option>
                  <option>Database / Redis</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#A8A8B3] mb-1.5 uppercase tracking-wider">Message</label>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe the issue, include transaction IDs, error codes, and steps to reproduce…"
                  className="w-full px-4 py-3 bg-[#0B0B0F] border border-[#ffffff0f] rounded-xl text-white placeholder-[#A8A8B3]/50 text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(212,175,55,0.3)]"
              >
                <Send className="w-4 h-4" />
                <span>Submit Ticket</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

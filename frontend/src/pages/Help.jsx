import React, { useState } from 'react';
import {
  BookOpen, Lock, AlertTriangle, Wrench, ChevronDown, ChevronUp,
  Search, Mail, Clock, Cpu, CheckCircle, XCircle, Send, Terminal, Zap, Shield
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';

const faqs = [
  {
    q: 'How does the fraud scoring engine operate?',
    a: 'Sentinel combines an XGBoost supervised model with an unsupervised Autoencoder reconstruction pipeline. Every transaction is evaluated against 30+ behavioral features including velocity spikes, geographic deviation, device fingerprinting, and merchant category heuristics to yield a composite 0.0–1.0 risk score.'
  },
  {
    q: 'What triggers an automated decline versus manual escalation?',
    a: 'Scores above the configured Decline Cutoff (default: 70%) trigger automated policy declines. Ambiguous transactions falling within the Review Band (default: 50%–70%) are routed to the Investigation Queue for human analyst triage.'
  },
  {
    q: 'What is the standard latency SLA for real-time scoring?',
    a: 'Median end-to-end scoring pipeline latency is sub-150ms. Feature extraction and model inference complete in under 80ms under typical load.'
  },
  {
    q: 'How do threshold adjustments take effect?',
    a: 'Thresholds saved in the Configuration dashboard take effect immediately in the live scoring pipeline with zero service restarts required.'
  },
  {
    q: 'How does continuous retraining work?',
    a: 'Analyst overrides (approving an escalated transaction or manually flagging an anomaly) generate verified feedback labels that are incorporated into the scheduled model retraining runbook.'
  },
];

const errorGuides = [
  {
    code: '401 Unauthorized',
    cause: 'Missing or expired JWT session token in the request header.',
    fix: 'Re-authenticate to generate a fresh bearer token in localStorage.',
  },
  {
    code: '500 Internal Inference Error',
    cause: 'Unhandled exception during ML feature pipeline execution or database write.',
    fix: 'Verify backend logs at uvicorn stdout and verify database connection pool status.',
  },
  {
    code: 'Scoring Latency Timeout (>200ms)',
    cause: 'Cold-start inference latency or database lock contention.',
    fix: 'Check CPU/memory allocation and verify database indexes on customer history.',
  },
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = faqs.filter(f =>
    searchQuery === '' || f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="space-y-3 pb-2">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Help & Technical Reference</h1>
        <p className="text-xs text-muted-foreground">
          System architecture, API integration specs, scoring explanations, and troubleshooting procedures.
        </p>

        <div className="relative max-w-md pt-2">
          <Search className="absolute left-2.5 top-4 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search FAQs, error codes, or integration guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* System Status Row */}
      <Card>
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm">Engine Operational Status</CardTitle>
          <CardDescription>Core subsystem availability</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'API Gateway', status: 'Operational' },
              { label: 'ML Scoring Service', status: 'Operational' },
              { label: 'Database Cluster', status: 'Operational' },
              { label: 'Anomaly Detector', status: 'Operational' },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-lg border border-border bg-muted/20">
                <span className="text-[11px] text-muted-foreground block">{s.label}</span>
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Frequently Asked Questions
        </h2>

        <div className="space-y-2">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <Card key={idx} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full text-left p-4 text-xs font-semibold text-foreground flex justify-between items-center hover:bg-muted/40 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Troubleshooting Guides */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Common Error Codes & Resolutions
        </h2>

        <div className="space-y-3">
          {errorGuides.map((err) => (
            <Card key={err.code}>
              <CardContent className="p-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[11px]">{err.code}</Badge>
                  <span className="font-medium text-foreground">{err.cause}</span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  <strong>Resolution:</strong> {err.fix}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* API Reference Snippet */}
      <Card>
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-sm">API Integration Endpoint</CardTitle>
          <CardDescription>Scrutinize an inbound transaction via JSON payload.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <pre className="p-3 rounded-lg bg-muted/60 border border-border text-[11px] font-mono overflow-x-auto text-foreground">
{`POST /api/transactions
Headers:
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Content-Type: application/json

Payload:
{
  "customer_id": 1042,
  "merchant": "Electronics Hub",
  "amount": 125000.00,
  "currency": "LKR",
  "card_type": "Visa",
  "card_last_four": "4291"
}`}
          </pre>
        </CardContent>
      </Card>

    </div>
  );
};

export default Help;

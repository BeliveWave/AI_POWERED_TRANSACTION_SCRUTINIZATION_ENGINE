import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Clock, 
  Lock, 
  Server, 
  TrendingUp, 
  Terminal, 
  AlertTriangle, 
  Layers, 
  Sun, 
  Moon, 
  Check, 
  X,
  Menu,
  ChevronRight,
  Database
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { API_BASE_URL } from '../services/api';

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    setSubscribing(true);
    setSubscribeStatus(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setSubscribeStatus({ success: true, message: `Subscribed! A confirmation email has been dispatched to ${email}` });
        setEmail('');
      } else {
        setSubscribeStatus({ success: false, message: 'Subscription request could not be completed.' });
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubscribeStatus({ success: false, message: 'Connection to notification service failed.' });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-muted selection:text-foreground">
      {/* 1. Header / Navbar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-background/85 backdrop-blur-md border-b border-border'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm font-semibold tracking-tight">Sentinel</span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider hidden sm:inline-block">TSE</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs text-muted-foreground">
            <a href="#capabilities" className="hover:text-foreground transition-colors">Capabilities</a>
            <a href="#comparison" className="hover:text-foreground transition-colors">Comparison</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <a href="#specifications" className="hover:text-foreground transition-colors">Specifications</a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Link to="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                Sign in
              </Button>
            </Link>

            <Link to="/register">
              <Button size="sm" className="h-8 text-xs font-medium">
                Open Console
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden h-8 w-8 text-muted-foreground"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-3 space-y-2 text-xs">
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-muted-foreground hover:text-foreground"
            >
              Capabilities
            </a>
            <a
              href="#comparison"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-muted-foreground hover:text-foreground"
            >
              Comparison
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-muted-foreground hover:text-foreground"
            >
              Architecture
            </a>
            <a
              href="#specifications"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-muted-foreground hover:text-foreground"
            >
              Specifications
            </a>
            <div className="pt-2 border-t border-border flex gap-2">
              <Link to="/login" className="w-1/2">
                <Button variant="outline" size="sm" className="w-full text-xs">Sign In</Button>
              </Link>
              <Link to="/register" className="w-1/2">
                <Button size="sm" className="w-full text-xs">Register</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-xs text-foreground font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v2.4 Production Engine • Sub-200ms Decisioning</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.15]">
              Real-time fraud intelligence for institutional transaction networks.
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Sentinel intercepts payment streams in-flight, evaluates risk using explainable machine learning, and executes automated decline policies before settlement.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto h-10 px-5 text-xs font-medium gap-2">
                  <span>Get Started with Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-10 px-5 text-xs font-medium">
                  View Live Dashboard
                </Button>
              </Link>
            </div>

            {/* Micro Specs */}
            <div className="pt-6 border-t border-border grid grid-cols-3 gap-4 text-xs font-mono text-muted-foreground">
              <div>
                <span className="block text-foreground font-semibold text-sm font-sans">142ms</span>
                <span>Median Latency</span>
              </div>
              <div>
                <span className="block text-foreground font-semibold text-sm font-sans">99.2%</span>
                <span>ROC-AUC Score</span>
              </div>
              <div>
                <span className="block text-foreground font-semibold text-sm font-sans">0ms</span>
                <span>Gateway Drift</span>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Scrutinization Console Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
              {/* Window Header */}
              <div className="px-4 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="h-2 w-2 rounded-full bg-border" />
                  <span className="text-[11px] text-muted-foreground ml-2">scrutinize_stream.log</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">LIVE</Badge>
              </div>

              {/* Transaction Inspection Card Content */}
              <div className="p-4 space-y-4 font-mono text-xs">
                {/* Header Info */}
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div>
                    <span className="text-[11px] text-muted-foreground">TXN-90284129</span>
                    <div className="text-sm font-semibold font-sans text-foreground">USD $14,250.00</div>
                    <span className="text-[11px] text-muted-foreground font-sans">International Wire Transfer</span>
                  </div>
                  <Badge variant="destructive" className="uppercase font-mono text-[10px]">
                    POLICY DECLINE
                  </Badge>
                </div>

                {/* Score Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Risk Assessment Score</span>
                    <span className="font-semibold text-destructive">0.94 / 1.00</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                {/* SHAP Factor Attribution */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-sans text-muted-foreground">Top SHAP Delta Factors</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-[11px]">
                      <span className="font-sans text-foreground">IP Geolocation Mismatch</span>
                      <span className="text-destructive font-mono">+0.38</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-[11px]">
                      <span className="font-sans text-foreground">Rolling Velocity Spike (&gt;3σ)</span>
                      <span className="text-destructive font-mono">+0.29</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-muted/50 text-[11px]">
                      <span className="font-sans text-foreground">Device Fingerprint Drift</span>
                      <span className="text-destructive font-mono">+0.18</span>
                    </div>
                  </div>
                </div>

                {/* Execution Trace */}
                <div className="pt-2 border-t border-border text-[10px] text-muted-foreground space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>INFERENCE_LATENCY</span>
                    <span className="text-foreground">84ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>POLICY_TRIGGER</span>
                    <span className="text-foreground">RULE_VELOCITY_GEO_COMBINED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MIDDLEWARE_ACTION</span>
                    <span className="text-foreground">TERMINATE_WITH_REASON</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities Section */}
      <section id="capabilities" className="py-16 sm:py-20 border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Engine Architecture</h2>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              Engineered for low latency and zero black-box obscurity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mb-3">
                  <Clock className="h-4 w-4 text-foreground" />
                </div>
                <CardTitle className="text-sm font-semibold">Sub-200ms Decisioning</CardTitle>
                <CardDescription className="text-xs">
                  Inline transaction scoring pipeline designed to run directly between merchant gateways and ledger settlement.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mb-3">
                  <Activity className="h-4 w-4 text-foreground" />
                </div>
                <CardTitle className="text-sm font-semibold">Explainable SHAP Values</CardTitle>
                <CardDescription className="text-xs">
                  Every prediction generates positive and mitigating feature contribution scores to satisfy regulatory compliance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mb-3">
                  <TrendingUp className="h-4 w-4 text-foreground" />
                </div>
                <CardTitle className="text-sm font-semibold">Behavioral Velocity Profiling</CardTitle>
                <CardDescription className="text-xs">
                  Real-time Redis state calculation detects sudden volume surges and frequency anomalies across rolling windows.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card">
              <CardHeader className="p-4 pb-2">
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center mb-3">
                  <Lock className="h-4 w-4 text-foreground" />
                </div>
                <CardTitle className="text-sm font-semibold">Complete Audit Trail</CardTitle>
                <CardDescription className="text-xs">
                  Cryptographically verified transaction logs and threshold change events preserved for internal and external audits.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Comparison Section */}
      <section id="comparison" className="py-16 sm:py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Technical Paradigm</h2>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              Legacy rule engines vs. Sentinel intelligence middleware.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Legacy Rules Card */}
            <Card className="bg-card border-border">
              <CardHeader className="p-6 pb-4 border-b border-border">
                <span className="text-xs font-mono text-muted-foreground">LEGACY ARCHITECTURE</span>
                <CardTitle className="text-base font-semibold text-foreground">Static Rule Engines</CardTitle>
                <CardDescription className="text-xs">
                  Fragile if-else rule trees that fail against modern adversarial techniques.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>High false-positive rate causing friction for legitimate customers.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Requires manual rule maintenance with each emerging fraud vector.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>No behavioral context or cross-transaction velocity memory.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>Opaque declines with zero explainability for compliance reviews.</span>
                </div>
              </CardContent>
            </Card>

            {/* Sentinel Card */}
            <Card className="bg-card border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
              <CardHeader className="p-6 pb-4 border-b border-border">
                <span className="text-xs font-mono text-foreground font-semibold">SENTINEL MIDDLEWARE</span>
                <CardTitle className="text-base font-semibold text-foreground">Continuous Risk Modeling</CardTitle>
                <CardDescription className="text-xs">
                  Supervised ensemble scoring with dynamic customer velocity indexing.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-3 text-xs text-foreground">
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Substantially lowered false-positives via multivariate anomaly scoring.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Adaptive model updates that generalize against novel attack patterns.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>In-memory sliding velocity profiles computed across 1h, 24h, and 7d.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>Granular SHAP attribution factors attached directly to each payload.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 5. Architecture & Flow Section */}
      <section id="architecture" className="py-16 sm:py-20 border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Ingestion Pipeline</h2>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              How Sentinel evaluates every payment in flight.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '01',
                title: 'Gateway Ingest',
                desc: 'Payment gateway dispatches JSON transaction payload to Sentinel via secure REST or gRPC middleware.',
              },
              {
                step: '02',
                title: 'Velocity Profiling',
                desc: 'Redis cache compiles instantaneous account metrics: rolling velocity, location jump, and card token drift.',
              },
              {
                step: '03',
                title: 'Ensemble Inference',
                desc: 'Trained model calculates a calibrated risk probability score (0.00 – 1.00) and SHAP delta vector.',
              },
              {
                step: '04',
                title: 'Policy Execution',
                desc: 'Rule thresholds enforce automated approval, analyst flagged hold, or immediate decline with error payload.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-lg border border-border bg-card space-y-2">
                <span className="text-xs font-mono text-muted-foreground font-semibold">{item.step}</span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Technical Specifications Section */}
      <section id="specifications" className="py-16 sm:py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Core Specifications</h2>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              Built on production-grade infrastructure.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">API Framework</span>
              <div className="text-sm font-semibold text-foreground mt-1">Python FastAPI & Pydantic</div>
              <p className="text-xs text-muted-foreground mt-1">Strict type checking and asynchronous I/O execution.</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">Inference Engine</span>
              <div className="text-sm font-semibold text-foreground mt-1">Scikit-learn & SHAP</div>
              <p className="text-xs text-muted-foreground mt-1">Calibrated ensembles with deterministic tree explainability.</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">State Storage</span>
              <div className="text-sm font-semibold text-foreground mt-1">PostgreSQL & Redis</div>
              <p className="text-xs text-muted-foreground mt-1">ACID transactional logs with microsecond memory lookups.</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <span className="text-[11px] font-mono text-muted-foreground uppercase">Analyst Console</span>
              <div className="text-sm font-semibold text-foreground mt-1">React & Shadcn UI</div>
              <p className="text-xs text-muted-foreground mt-1">Accessible, keyboard-friendly console with zero visual noise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Newsletter & Updates */}
      <section className="py-16 sm:py-20 border-t border-border bg-muted/20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Stay informed on security advisories & release notes.
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Subscribe to the Sentinel engineering dispatch for fraud vector reports, model update advisories, and API changes.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
            <Input
              type="email"
              placeholder="analyst@bank.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9 text-xs"
            />
            <Button type="submit" disabled={subscribing} className="h-9 px-4 text-xs font-medium shrink-0">
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>

          {subscribeStatus && (
            <p className={`text-xs ${subscribeStatus.success ? 'text-emerald-500' : 'text-destructive'}`}>
              {subscribeStatus.message}
            </p>
          )}
        </div>
      </section>

      {/* 8. Institutional Footer */}
      <footer className="border-t border-border py-12 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-foreground text-sm tracking-tight">Sentinel</span>
              </div>
              <p className="text-xs leading-relaxed max-w-sm">
                Autonomous transaction scrutinization middleware and fraud intelligence console for institutional financial systems.
              </p>
              <div className="text-[11px] font-mono text-muted-foreground">
                Contact: info@sentinel.com • 0760355773
              </div>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-3">Console</span>
              <ul className="space-y-2">
                <li><Link to="/login" className="hover:text-foreground">Analyst Login</Link></li>
                <li><Link to="/register" className="hover:text-foreground">Register Account</Link></li>
                <li><a href="#capabilities" className="hover:text-foreground">Inference Pipeline</a></li>
                <li><a href="#specifications" className="hover:text-foreground">API Specifications</a></li>
              </ul>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-3">Compliance</span>
              <ul className="space-y-2">
                <li><span className="text-foreground">SOC 2 Type II</span></li>
                <li><span className="text-foreground">PCI-DSS Level 1</span></li>
                <li><span className="text-foreground">ISO 27001</span></li>
                <li><span className="text-foreground">Audit Readiness</span></li>
              </ul>
            </div>

            <div>
              <span className="font-medium text-foreground block mb-3">External</span>
              <ul className="space-y-2">
                <li><a href="https://share.google/2M7iiyiEMwq8kwPJ7" target="_blank" rel="noreferrer" className="hover:text-foreground">Location Map</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Security Disclosure</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px]">
            <div>© {new Date().getFullYear()} Sentinel Fraud Intelligence Engine. All rights reserved.</div>
            <div className="font-mono text-muted-foreground">Engine Release: v2.4.0 • Production Ready</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

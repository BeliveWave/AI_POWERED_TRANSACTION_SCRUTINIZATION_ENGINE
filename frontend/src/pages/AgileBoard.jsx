import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  User,
  Filter,
  ExternalLink,
  ShieldCheck,
  Tag,
  Kanban,
  CheckSquare,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

export default function AgileBoard() {
  const [selectedSprint, setSelectedSprint] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState('ALL');
  const [activeStory, setActiveStory] = useState(null);

  const teamMembers = [
    { id: 'suwaathmi', name: 'Suwaathmi R.', reg: 'EG/2022/5361', role: 'Project Manager & Frontend', color: 'bg-sky-500' },
    { id: 'rajaaei', name: 'Rajaaei M.N.I.', reg: 'EG/2022/5261', role: 'AI/ML Researcher & Backend', color: 'bg-emerald-500' },
    { id: 'nusair', name: 'Nusair M.N.M.', reg: 'EG/2022/5226', role: 'Full-Stack Developer', color: 'bg-amber-500' },
    { id: 'tharukshan', name: 'Tharukshan G.', reg: 'EG/2022/5367', role: 'Backend Developer & AI/ML', color: 'bg-purple-500' }
  ];

  const stories = [
    // SPRINT 1
    {
      id: 'TSE-101',
      sprint: 'Sprint 1',
      sprintDates: 'Oct 2025',
      epic: 'Architecture & Foundation',
      epicColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Project Architecture & Clean Layered Design',
      points: 5,
      priority: 'High',
      assignee: 'Nusair M.N.M.',
      reg: 'EG/2022/5226',
      userStory: 'As a system architect, I want a clean layered architecture (API, Service, Repository, Model) so that the codebase is scalable, secure, and maintainable.',
      acceptanceCriteria: [
        'Separation of concerns between Routers, Services, and Repositories',
        'Database engine singleton with connection pooling',
        'Environment variable configuration via Pydantic settings'
      ],
      deliverables: 'FastAPI core setup, modular routers structure, Base repository pattern.'
    },
    {
      id: 'TSE-102',
      sprint: 'Sprint 1',
      sprintDates: 'Oct 2025',
      epic: 'Database Engineering',
      epicColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'PostgreSQL Relational Schema & Models',
      points: 5,
      priority: 'High',
      assignee: 'Nusair M.N.M.',
      reg: 'EG/2022/5226',
      userStory: 'As a backend developer, I want relational database schemas for Users, Customers, and Transactions so that all transaction events are recorded immutably.',
      acceptanceCriteria: [
        'Users table with bcrypt password hash and role flags',
        'Transactions table matching core ISO 8583 field specifications',
        'Customers table with card metadata and frozen status flags'
      ],
      deliverables: 'SQLAlchemy models in backend/app/models/, migration scripts.'
    },
    {
      id: 'TSE-103',
      sprint: 'Sprint 1',
      sprintDates: 'Oct 2025',
      epic: 'Banking Protocols',
      epicColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      title: 'ISO 8583 Banking Payload Ingestion Specification',
      points: 5,
      priority: 'Highest',
      assignee: 'Tharukshan G.',
      reg: 'EG/2022/5367',
      userStory: 'As a financial engineer, I want the system to parse standard ISO 8583 credit card fields so that it complies with international banking standards.',
      acceptanceCriteria: [
        'Extraction of DE2 (PAN), DE4 (Amount), DE18 (MCC), DE22 (POS Mode), DE49 (Currency)',
        '3D-Secure and MOTO/ECI indicator normalization',
        'Terminal capability and geolocation mapping'
      ],
      deliverables: 'ISO 8583 data dictionary mapping and validation schemas.'
    },
    {
      id: 'TSE-104',
      sprint: 'Sprint 1',
      sprintDates: 'Oct 2025',
      epic: 'Architecture & Foundation',
      epicColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'FastAPI Scaffolding & Dynamic Health Monitoring',
      points: 3,
      priority: 'Medium',
      assignee: 'Tharukshan G.',
      reg: 'EG/2022/5367',
      userStory: 'As an operations engineer, I want an automated health check endpoint to monitor database, ML models, and service latencies in real time.',
      acceptanceCriteria: [
        '/api/system/health returning latency and operational state for all sub-services',
        'Graceful degradation when non-critical components are offline',
        'CORS middleware configuration for institutional frontend access'
      ],
      deliverables: 'Health check probe in main.py, automated service monitors.'
    },

    // SPRINT 2
    {
      id: 'TSE-105',
      sprint: 'Sprint 2',
      sprintDates: 'Nov 2025',
      epic: 'Security & Auth',
      epicColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'JWT Authentication & Cryptographic Session Security',
      points: 5,
      priority: 'High',
      assignee: 'Tharukshan G.',
      reg: 'EG/2022/5367',
      userStory: 'As a security officer, I want encrypted JWT session tokens and bcrypt password hashing to secure institutional analyst access.',
      acceptanceCriteria: [
        'HS256 JWT generation with 60-minute token expiration',
        'Bcrypt hashing with salt rounds compliant with PCI standards',
        'Axios interceptors in frontend attaching Bearer authorization headers'
      ],
      deliverables: 'Auth service, token verification middleware, useAuth React hook.'
    },
    {
      id: 'TSE-106',
      sprint: 'Sprint 2',
      sprintDates: 'Nov 2025',
      epic: 'Admin Console & UI',
      epicColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'React + Vite Enterprise Design System',
      points: 5,
      priority: 'Medium',
      assignee: 'Suwaathmi R.',
      reg: 'EG/2022/5361',
      userStory: 'As an analyst, I want a modern responsive design system with dark/light themes so that monitoring high-velocity transactions is intuitive and clear.',
      acceptanceCriteria: [
        'TailwindCSS design tokens with Radix UI accessible primitives',
        'Theme provider supporting instant Dark/Light mode toggle',
        'Responsive mobile and desktop app layout'
      ],
      deliverables: 'Vite build pipeline, ThemeProvider, AppLayout, Sidebar navigation.'
    },
    {
      id: 'TSE-107',
      sprint: 'Sprint 2',
      sprintDates: 'Nov 2025',
      epic: 'Admin Console & UI',
      epicColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Executive Real-Time Risk Analytics Dashboard',
      points: 8,
      priority: 'Highest',
      assignee: 'Suwaathmi R.',
      reg: 'EG/2022/5361',
      userStory: 'As a risk executive, I want a live dashboard polling transaction stats every 2 seconds so that emerging fraud waves are spotted immediately.',
      acceptanceCriteria: [
        'Real-time KPI cards: Total Transactions, Blocked Frauds, Active Risk Index',
        'Live streaming transaction feed with color-coded risk badges',
        'Interactive trends charts with time-window filtering'
      ],
      deliverables: 'Dashboard.jsx, 2000ms polling worker, KPI aggregation endpoints.'
    },
    {
      id: 'TSE-108',
      sprint: 'Sprint 2',
      sprintDates: 'Nov 2025',
      epic: 'Admin Console & UI',
      epicColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Customer Directory & Historical Spend Profiling',
      points: 5,
      priority: 'Medium',
      assignee: 'Suwaathmi R.',
      reg: 'EG/2022/5361',
      userStory: 'As an investigator, I want to view customer profiles, past transaction counts, and card freeze statuses in a searchable directory.',
      acceptanceCriteria: [
        'Searchable customer table with card type and masked last 4 digits',
        'Risk score indicators per customer profile',
        'Direct customer card freeze toggle action'
      ],
      deliverables: 'Customers.jsx, customer detail drawer, freeze API integration.'
    },

    // SPRINT 3
    {
      id: 'TSE-109',
      sprint: 'Sprint 3',
      sprintDates: 'Jan 2026',
      epic: 'Hybrid Machine Learning',
      epicColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Supervised XGBoost Known Fraud Pattern Classifier',
      points: 8,
      priority: 'Highest',
      assignee: 'Rajaaei M.N.I.',
      reg: 'EG/2022/5261',
      userStory: 'As an AI researcher, I want a supervised gradient boosting model trained on credit card datasets to accurately predict known fraud signatures.',
      acceptanceCriteria: [
        'Model training on historical credit card transaction records',
        'Cross-validation achieving high ROC-AUC and low false-positive rate',
        'Sub-5ms evaluation latency on 9 engineered banking features'
      ],
      deliverables: 'fraud_model.pkl, feature_encoders.pkl, evaluation report.'
    },
    {
      id: 'TSE-110',
      sprint: 'Sprint 3',
      sprintDates: 'Jan 2026',
      epic: 'Hybrid Machine Learning',
      epicColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Deep Autoencoder Neural Network for Zero-Day Anomalies',
      points: 8,
      priority: 'Highest',
      assignee: 'Rajaaei M.N.I.',
      reg: 'EG/2022/5261',
      userStory: 'As an AI researcher, I want an unsupervised Deep Autoencoder to catch novel, zero-day fraud attempts that have never been seen in past training data.',
      acceptanceCriteria: [
        '5-layer symmetrical architecture (9 -> 8 -> 4 -> 8 -> 9 neurons)',
        'Trained exclusively on legitimate customer spend patterns',
        'Reconstruction Error (MSE) thresholding flagging abnormal vector shifts'
      ],
      deliverables: 'autoencoder_metadata.pkl, autoencoder_scaler.pkl, threshold config.'
    },
    {
      id: 'TSE-111',
      sprint: 'Sprint 3',
      sprintDates: 'Jan 2026',
      epic: 'Feature Engineering',
      epicColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Real-Time Redis Sliding-Window Velocity Tracking',
      points: 5,
      priority: 'High',
      assignee: 'Tharukshan G.',
      reg: 'EG/2022/5367',
      userStory: 'As a risk engineer, I want in-memory sliding-window velocity checks so that automated card testing bursts are throttled in real time.',
      acceptanceCriteria: [
        'Redis 1-hour window transaction count per cardholder',
        'Sub-1ms key lookup without hitting relational database',
        'Non-fatal fallback mechanism if Redis cache degrades'
      ],
      deliverables: 'cache.py Redis client, sliding-window velocity pipeline.'
    },
    {
      id: 'TSE-112',
      sprint: 'Sprint 3',
      sprintDates: 'Jan 2026',
      epic: 'Security & Rules',
      epicColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'Deterministic Safety Tier & Mobile Cardholder Freeze',
      points: 5,
      priority: 'Highest',
      assignee: 'Nusair M.N.M.',
      reg: 'EG/2022/5226',
      userStory: 'As a bank customer, I want to instantly freeze my card via my mobile banking app so that unauthorized charges are declined with zero delay.',
      acceptanceCriteria: [
        'Deterministic Tier 1 check preceding all ML evaluations',
        'Immediate FROZEN_CARD decline without compute overhead',
        'Database synchronization of frozen state across sessions'
      ],
      deliverables: 'Rule engine implementation, /freeze endpoint, card state sync.'
    },

    // SPRINT 4
    {
      id: 'TSE-113',
      sprint: 'Sprint 4',
      sprintDates: 'Feb-Mar 2026',
      epic: 'Hybrid Machine Learning',
      epicColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'SHAP Explainable AI (XAI) & Regulatory Reason Codes',
      points: 5,
      priority: 'Highest',
      assignee: 'Rajaaei M.N.I.',
      reg: 'EG/2022/5261',
      userStory: 'As a compliance officer, I want explainable AI reason codes for every flagged transaction so that decisions meet regulatory audit standards.',
      acceptanceCriteria: [
        'SHAP TreeExplainer integration computing local feature attributions in real time',
        'Dynamic reason code mapping (HIGH_VELOCITY, FOREIGN_TRANSACTION, UNUSUAL_MCC)',
        'Reason code logging in database and receipt generation'
      ],
      deliverables: 'SHAP pipeline in main.py, explainability drawer in dashboard.'
    },
    {
      id: 'TSE-114',
      sprint: 'Sprint 4',
      sprintDates: 'Feb-Mar 2026',
      epic: 'DevOps & Cloud',
      epicColor: 'bg-teal-50 text-teal-700 border-teal-200',
      title: 'Pure-NumPy Neural Inference (<170MB RAM Cloud Engine)',
      points: 5,
      priority: 'High',
      assignee: 'Rajaaei M.N.I.',
      reg: 'EG/2022/5261',
      userStory: 'As a cloud engineer, I want to eliminate the heavy 600MB+ TensorFlow dependency so the backend runs on lightweight 512MB free-tier cloud containers.',
      acceptanceCriteria: [
        'Extraction of Keras weights and biases into autoencoder_weights.pkl',
        'Pure NumPy matrix multiplication reproducing exact neural outputs',
        'Memory footprint reduced from 650MB to <170MB with 0ms cold starts'
      ],
      deliverables: 'autoencoder_numpy.py, TF-free requirements.txt, memory benchmarks.'
    },
    {
      id: 'TSE-115',
      sprint: 'Sprint 4',
      sprintDates: 'Feb-Mar 2026',
      epic: 'Admin Console & UI',
      epicColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Interactive E-Commerce Checkout Simulator (/demo)',
      points: 5,
      priority: 'Highest',
      assignee: 'Suwaathmi R.',
      reg: 'EG/2022/5361',
      userStory: 'As an evaluator, I want an interactive e-commerce store (/demo) to simulate realistic customer card purchases and test fraud scenarios live.',
      acceptanceCriteria: [
        'Light-theme TechMart Store checkout without technical jargon',
        'Cardholder profile selector (Inshaf Rajaei •••• 6969, Nusair •••• 5226)',
        'Live cardholder lock simulator checkbox testing security rules',
        'Dynamic receipt showing authorization status (Approved, Declined, Reason)'
      ],
      deliverables: 'CheckoutPage.jsx, CustomerReceipt.jsx, SimulatorService.js.'
    },
    {
      id: 'TSE-116',
      sprint: 'Sprint 4',
      sprintDates: 'Feb-Mar 2026',
      epic: 'DevOps & Cloud',
      epicColor: 'bg-teal-50 text-teal-700 border-teal-200',
      title: 'Automated Gmail SMTP Alerts & Production Cloud Deployment',
      points: 5,
      priority: 'High',
      assignee: 'Nusair M.N.M.',
      reg: 'EG/2022/5226',
      userStory: 'As a system administrator, I want automated email notifications on high-risk events and production deployment on Vercel and Supabase.',
      acceptanceCriteria: [
        'Background task sending institutional email alert in <2s via Gmail SMTP',
        'Vercel frontend deployment with sanitized API base URL',
        'Supabase PostgreSQL cloud synchronization with zero downtime'
      ],
      deliverables: 'email_utils.py, render.yaml, Vercel build configuration.'
    }
  ];

  // Filtering Logic
  const filteredStories = stories.filter((s) => {
    const matchSprint = selectedSprint === 'ALL' || s.sprint === selectedSprint;
    const matchMember = selectedMember === 'ALL' || s.assignee.toLowerCase().includes(selectedMember.toLowerCase());
    return matchSprint && matchMember;
  });

  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* 1. Header Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  EC5406: Agile Sprint Management
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Epic FraudGuard Project</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <Kanban className="size-6 text-primary" />
                <span>Agile Project Management Board</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Faculty of Engineering, University of Ruhuna & Epic Lanka Pvt Ltd  |  Project Manager: <strong className="text-slate-700 dark:text-slate-300">Suwaathmi R. (EG/2022/5361)</strong>
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total Points</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{totalPoints} Pts</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] font-semibold text-emerald-600 block uppercase">Sprints Done</span>
                <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">4 / 4</span>
              </div>
              <div className="bg-primary/10 px-4 py-2.5 rounded-xl border border-primary/20 text-center">
                <span className="text-[10px] font-semibold text-primary block uppercase">Completion</span>
                <span className="text-lg font-bold text-primary">100%</span>
              </div>
            </div>
          </div>

          {/* 2. Team Member Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            {teamMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMember(selectedMember === m.id ? 'ALL' : m.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedMember === m.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`size-2.5 rounded-full ${m.color}`} />
                  <span className="text-xs font-semibold truncate">{m.name}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{m.reg}</div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="size-3.5" />
            <span>Sprint Filter:</span>
          </span>
          {['ALL', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSprint(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedSprint === s
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-900 dark:text-white">{filteredStories.length}</strong> of {stories.length} User Stories
        </div>
      </div>

      {/* 4. Kanban Columns */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        {/* Column 1: Backlog */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Sprint Backlog
            </span>
            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800">0</Badge>
          </div>
          <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs">
            All backlog items delivered across Sprints 1-4
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              In Progress
            </span>
            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800">0</Badge>
          </div>
          <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs">
            Sprint iteration complete
          </div>
        </div>

        {/* Column 3: Quality Review */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Review & QA
            </span>
            <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800">0</Badge>
          </div>
          <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-xs">
            All test suites verified & passing
          </div>
        </div>

        {/* Column 4: Delivered / Completed Stories */}
        <div className="bg-slate-100/70 dark:bg-slate-900/60 rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/40 md:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>Done ({filteredStories.length})</span>
            </span>
            <Badge className="text-[10px] bg-emerald-600 text-white font-mono">100%</Badge>
          </div>

          <div className="space-y-3">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => setActiveStory(story)}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              >
                {/* Top Meta: Key & Points */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-bold text-primary group-hover:underline">
                      {story.id}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] font-medium text-slate-500">{story.sprint}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {story.points} Pts
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {story.title}
                </h3>

                {/* Epic Tag */}
                <div className="mt-2.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${story.epicColor}`}>
                    {story.epic}
                  </span>
                </div>

                {/* Bottom Card Footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500 font-medium truncate max-w-[150px]">
                    <User className="size-3 text-slate-400 shrink-0" />
                    <span>{story.assignee.split(' ')[0]}</span>
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>Delivered</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Jira-Style Issue Detail Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-primary">{activeStory.id}</span>
                  <span className="text-slate-400">•</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${activeStory.epicColor}`}>
                    {activeStory.epic}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{activeStory.sprint}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeStory.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* User Story */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">User Story</span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                "{activeStory.userStory}"
              </p>
            </div>

            {/* Acceptance Criteria */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Acceptance Criteria</span>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {activeStory.acceptanceCriteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deliverables & Assignee */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Assignee</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeStory.assignee}</span>
                <span className="text-[11px] text-slate-500 block">{activeStory.reg}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-semibold">Story Points & Status</span>
                <span className="font-semibold text-slate-900 dark:text-white">{activeStory.points} Points</span>
                <span className="text-emerald-600 font-medium block">Verified & Merged in Git</span>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <Button
                onClick={() => setActiveStory(null)}
                className="w-full h-10 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90"
              >
                Close Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


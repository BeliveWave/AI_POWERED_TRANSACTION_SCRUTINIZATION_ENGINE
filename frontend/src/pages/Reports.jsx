import React, { useState } from 'react';
import { TrendingUp, AlertCircle, BarChart3, Globe, Download, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const API = 'http://localhost:8000';
const getToken = () => localStorage.getItem('token') || '';

const REPORTS = [
  {
    id: 'daily-fraud-summary',
    title: 'Daily Fraud Summary',
    description: "All transactions declined by the AI today — export for end-of-day review.",
    icon: TrendingUp,
    color: 'red',
    filename: 'daily-fraud-summary',
  },
  {
    id: 'false-positives',
    title: 'False Positives Analysis',
    description: 'Escalated (manual review) transactions from the last 7 days.',
    icon: AlertCircle,
    color: 'yellow',
    filename: 'false-positives',
  },
  {
    id: 'model-performance',
    title: 'Model Performance',
    description: 'All transactions with individual XGBoost + Autoencoder scores for analysis.',
    icon: BarChart3,
    color: 'blue',
    filename: 'model-performance',
  },
  {
    id: 'geographic',
    title: 'Geographic / Merchant Heatmap',
    description: 'Fraud rate grouped by merchant — identify high-risk partners.',
    icon: Globe,
    color: 'purple',
    filename: 'geographic-heatmap',
  },
];

const colorMap = {
  red:    { bg: 'bg-red-50 dark:bg-red-900/30',    icon: 'text-red-500 dark:text-red-400',    badge: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' },
  yellow: { bg: 'bg-yellow-50 dark:bg-amber-900/30', icon: 'text-yellow-500 dark:text-amber-500', badge: 'bg-yellow-100 dark:bg-amber-900/50 text-yellow-600 dark:text-amber-400' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/30',   icon: 'text-blue-500 dark:text-blue-400',   badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-500 dark:text-purple-400', badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400' },
};

const Reports = () => {
  const [loadingId, setLoadingId] = useState(null);
  const [doneIds, setDoneIds] = useState(new Set());

  const handleDownload = async (report) => {
    setLoadingId(report.id);
    try {
      const res = await fetch(`${API}/api/reports/${report.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to generate report.');
      }

      // Force browser to download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`✅ ${report.title} downloaded!`);
      setDoneIds((prev) => new Set([...prev, report.id]));

      // Reset done checkmark after 4s
      setTimeout(() => {
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.delete(report.id);
          return next;
        });
      }, 4000);
    } catch (err) {
      toast.error(err.message || 'Download failed.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">
          Generate and download fraud detection reports as CSV files.
        </p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          const c = colorMap[report.color];
          const isLoading = loadingId === report.id;
          const isDone = doneIds.has(report.id);

          return (
            <div
              key={report.id}
              className="bg-white dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between hover:shadow-md dark:hover:shadow-slate-900 transition-shadow backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{report.description}</p>
                </div>
                <div className={`ml-4 p-3 rounded-xl ${c.bg} shrink-0`}>
                  <Icon size={22} className={c.icon} />
                </div>
              </div>

              {/* Format badge */}
              <div className="mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${c.badge}`}>
                  CSV Export
                </span>
              </div>

              {/* Download button */}
              <button
                onClick={() => handleDownload(report)}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  isDone
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400'
                    : 'bg-gray-900 dark:bg-slate-700 border-gray-900 dark:border-slate-600 text-white hover:bg-gray-700 dark:hover:bg-slate-600'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating…
                  </>
                ) : isDone ? (
                  <>
                    <CheckCircle size={16} />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-400 transition-colors">
        <BarChart3 size={18} className="shrink-0 mt-0.5" />
        <p>
          Reports are generated live from the database at the moment of download.
          Open the CSV in Excel, Google Sheets, or any spreadsheet tool for analysis.
        </p>
      </div>
    </div>
  );
};

export default Reports;
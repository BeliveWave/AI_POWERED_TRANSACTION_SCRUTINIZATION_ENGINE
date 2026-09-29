import React, { useState } from 'react';
import { Download, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';

const API = 'http://localhost:8000';
const getToken = () => localStorage.getItem('token') || '';

const REPORTS = [
  {
    id: 'daily-fraud-summary',
    title: 'Daily Fraud Interceptions',
    description: "Transactions declined by engine policies today. Includes scores, timestamps, and customer identifiers.",
    filename: 'daily-fraud-summary',
    badge: 'Daily Audit',
  },
  {
    id: 'false-positives',
    title: 'Escalation & False Positive Review',
    description: 'Transactions routed to analyst manual review over the past 7 days.',
    filename: 'false-positives',
    badge: 'Weekly Triage',
  },
  {
    id: 'model-performance',
    title: 'Dual-Engine Model Telemetry',
    description: 'Full dataset with standalone XGBoost and Autoencoder anomaly scores for model calibration.',
    filename: 'model-performance',
    badge: 'Diagnostics',
  },
  {
    id: 'geographic',
    title: 'Merchant & Geographic Heatmap',
    description: 'Aggregate fraud occurrence grouped by merchant category and processing region.',
    filename: 'geographic-heatmap',
    badge: 'Risk Distribution',
  },
];

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

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.filename}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${report.title} exported`);
      setDoneIds((prev) => new Set([...prev, report.id]));

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
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics & Report Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate verified CSV exports for compliance, regulatory reporting, and forensic review.
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((report) => {
          const isLoading = loadingId === report.id;
          const isDone = doneIds.has(report.id);

          return (
            <Card key={report.id} className="flex flex-col justify-between hover:border-foreground/20 transition-colors">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium">
                    {report.badge}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">.CSV</span>
                </div>
                <CardTitle className="text-base pt-2">{report.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {report.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 pt-2">
                <Button
                  onClick={() => handleDownload(report)}
                  disabled={isLoading}
                  variant={isDone ? "outline" : "default"}
                  className="w-full"
                  size="sm"
                >
                  {isLoading ? (
                    "Generating Export..."
                  ) : isDone ? (
                    <>
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                      Export Complete
                    </>
                  ) : (
                    <>
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Export Dataset
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Compliance Note */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-center gap-3 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 shrink-0 text-foreground" />
          <span>
            All report data is generated in real-time directly from encrypted database audit logs.
          </span>
        </CardContent>
      </Card>

    </div>
  );
};

export default Reports;
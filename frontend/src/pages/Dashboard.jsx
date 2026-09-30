import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ShieldAlert, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    total_transactions: 0,
    fraud_detected: 0,
    under_review: 0,
    avg_response_ms: 0
  });
  const [graphData, setGraphData] = useState([]);
  const [riskyMerchants, setRiskyMerchants] = useState([]);

  // Fetch recent transactions (Polling)
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/transactions/recent');
        if (response.ok) {
          const data = await response.json();
          const mappedTxns = data.map(txn => ({
            id: txn.id,
            time: new Date(txn.timestamp).toLocaleTimeString(),
            amount: `LKR ${txn.amount.toFixed(2)}`,
            merchant: txn.merchant,
            customer_name: txn.customer_name,
            card_info: `${txn.card_type} •••• ${txn.card_last_four}`,
            score: txn.fraud_score,
            decision: txn.status,
            variant: txn.status === 'Decline' ? 'destructive' : (txn.status === 'Escalate' ? 'warning' : 'outline')
          }));
          setTransactions(mappedTxns);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch('http://localhost:8000/api/dashboard/stats');
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson);
        }

        const trendsRes = await fetch('http://localhost:8000/api/dashboard/trends');
        if (trendsRes.ok) {
          const trendsJson = await trendsRes.json();
          setGraphData(trendsJson);
        }

        const riskRes = await fetch('http://localhost:8000/api/dashboard/risky-merchants');
        if (riskRes.ok) {
          const riskJson = await riskRes.json();
          setRiskyMerchants(riskJson);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchTransactions();
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchTransactions();
      fetchDashboardData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Scrutinization Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time throughput, model inference telemetry, and active anomaly queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/transactions')}>
            View Ledger
          </Button>
          <Button size="sm" onClick={() => navigate('/investigator')}>
            Open Queue
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Transactions */}
        <Card className="hover:border-foreground/20 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Transactions Today</span>
              <span className="text-xs font-medium">Throughput</span>
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {stats.total_transactions.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Evaluated in real-time
            </div>
          </CardContent>
        </Card>

        {/* Fraud Detected */}
        <Card className="hover:border-foreground/20 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Flagged & Declined</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> Policy Block
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {stats.fraud_detected.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Critical anomalies intercepted
            </div>
          </CardContent>
        </Card>

        {/* Under Review */}
        <Card className="hover:border-foreground/20 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Under Review</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Escalated
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {stats.under_review.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Awaiting analyst triage
            </div>
          </CardContent>
        </Card>

        {/* Avg Response */}
        <Card className="hover:border-foreground/20 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Inference Latency</span>
              <span className="text-xs font-mono">p99</span>
            </div>
            <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {stats.avg_response_ms}<span className="text-base font-normal text-muted-foreground">ms</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Target SLA &lt; 200ms
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fraud Trends Line Chart */}
      <Card>
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Risk Trends (Last 7 Days)</CardTitle>
              <CardDescription>Daily volume breakdown across approved, escalated, and declined outcomes.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                <XAxis dataKey="name" stroke="currentColor" className="text-xs opacity-60" />
                <YAxis stroke="currentColor" className="text-xs opacity-60" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--popover)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--popover-foreground)',
                    fontSize: '13px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="fraud" name="Declined" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="approved" name="Approved" stroke="#71717a" strokeWidth={1.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="review" name="Escalated" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2, fill: '#f59e0b' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Live Feed & Risky Merchants Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Feed (Takes 2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Real-Time Event Feed</CardTitle>
              <CardDescription>Incoming transactions evaluated by the scoring pipeline.</CardDescription>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Streaming
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                Awaiting incoming simulator traffic...
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.slice(0, 8).map((txn) => (
                      <TableRow
                        key={txn.id}
                        onClick={() => setSelectedTransaction(txn)}
                        className="cursor-pointer"
                      >
                        <TableCell className="tabular-nums text-muted-foreground">{txn.time}</TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{txn.merchant}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{txn.customer_name} • {txn.card_info}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-foreground">{txn.amount}</TableCell>
                        <TableCell className="text-center tabular-nums font-semibold">
                          <span className={txn.score > 0.7 ? 'text-red-600 dark:text-red-400' : (txn.score > 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                            {(txn.score * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={txn.variant}>{txn.decision}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risky Merchants (Takes 1 col) */}
        <Card>
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base">High-Risk Merchants</CardTitle>
            <CardDescription>Merchants with elevated anomaly frequency.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="space-y-3">
              {riskyMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No merchant anomalies detected.</p>
              ) : (
                riskyMerchants.slice(0, 5).map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-card">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground tabular-nums mt-0.5">{m.txns} transactions</p>
                    </div>
                    <Badge variant="outline" className="tabular-nums font-semibold">
                      {(m.risk * 100).toFixed(0)}% risk
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent onClose={() => setSelectedTransaction(null)} className="max-w-md">
          {selectedTransaction && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle>Transaction #{selectedTransaction.id}</DialogTitle>
                  <Badge variant={selectedTransaction.variant}>{selectedTransaction.decision}</Badge>
                </div>
                <DialogDescription>Telemetry & risk inference details</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-md bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground block">Customer</span>
                  <span className="font-semibold text-foreground">{selectedTransaction.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Amount</span>
                  <span className="font-semibold text-foreground tabular-nums">{selectedTransaction.amount}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Merchant</span>
                  <span className="font-semibold text-foreground">{selectedTransaction.merchant}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Payment Method</span>
                  <span className="font-semibold text-foreground tabular-nums">{selectedTransaction.card_info}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Calculated Fraud Score</span>
                  <span className="font-bold tabular-nums text-foreground">{(selectedTransaction.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Confidence Metric</span>
                  <span className="font-bold tabular-nums text-foreground">{(Math.abs(selectedTransaction.score - 0.5) * 200).toFixed(1)}%</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="default" className="flex-1" size="sm">
                  Confirm Approve
                </Button>
                <Button variant="destructive" className="flex-1" size="sm">
                  Decline
                </Button>
                <Button variant="secondary" className="flex-1" size="sm" onClick={() => { setSelectedTransaction(null); navigate('/investigator'); }}>
                  Investigate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
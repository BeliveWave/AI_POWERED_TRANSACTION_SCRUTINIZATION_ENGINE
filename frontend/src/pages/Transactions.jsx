import React, { useState, useEffect } from 'react';
import { Filter, Download, RefreshCw, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../components/ui/table.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog.jsx';
import { API_BASE_URL } from '../services/api.js';

const Transactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ minAmt: '', maxAmt: '', status: 'All', date: 'today' });
  
  const [declineThreshold, setDeclineThreshold] = useState(0.70);
  const [reviewThreshold, setReviewThreshold] = useState(0.50);

  // Fetch transactions with filters
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filters.minAmt) queryParams.append('min_amt', filters.minAmt);
      if (filters.maxAmt) queryParams.append('max_amt', filters.maxAmt);
      if (filters.status !== 'All') queryParams.append('decision', filters.status);
      queryParams.append('date_filter', filters.date);

      const response = await fetch(`${API_BASE_URL}/api/transactions?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dynamic config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('${API_BASE_URL}/api/admin/config');
        if (response.ok) {
          const configs = await response.json();
          const declineConfig = configs.find(c => c.key === 'fraud_threshold_decline');
          const reviewConfig = configs.find(c => c.key === 'fraud_threshold_review');
          if (declineConfig) setDeclineThreshold(parseFloat(declineConfig.value));
          if (reviewConfig) setReviewThreshold(parseFloat(reviewConfig.value));
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const handleDecision = async (decision) => {
    if (!selectedTransaction) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/transactions/${selectedTransaction.id}/decide?decision=${decision}`,
        { method: 'POST' }
      );
      if (response.ok) {
        setSelectedTransaction(null);
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
    }
  };

  const getStatusBadge = (status, score) => {
    if (status === 'Decline' || score > declineThreshold) {
      return <Badge variant="destructive">Decline</Badge>;
    }
    if (status === 'Escalate' || score > reviewThreshold) {
      return <Badge variant="warning">Escalate</Badge>;
    }
    return <Badge variant="outline">Approve</Badge>;
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Transaction ID', 'Customer', 'Time', 'Amount', 'Merchant', 'Score', 'Status'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach(txn => {
      const row = [
        `TXN-${txn.id}`,
        `"${txn.customer_name}"`,
        `"${new Date(txn.timestamp).toLocaleString()}"`,
        txn.amount.toFixed(2),
        `"${txn.merchant}"`,
        `${(txn.fraud_score * 100).toFixed(0)}%`,
        txn.status
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transaction Ledger</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Filter, audit, and intervene on real-time and historical transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={exportCSV} disabled={transactions.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search ID, Merchant, Customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min LKR"
                value={filters.minAmt}
                onChange={(e) => setFilters({...filters, minAmt: e.target.value})}
                className="w-1/2"
              />
              <Input
                type="number"
                placeholder="Max LKR"
                value={filters.maxAmt}
                onChange={(e) => setFilters({...filters, maxAmt: e.target.value})}
                className="w-1/2"
              />
            </div>

            <div>
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              >
                <option value="All">All Decisions</option>
                <option value="Approve">Approved Only</option>
                <option value="Escalate">Escalated Only</option>
                <option value="Decline">Declined Only</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={filters.date === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, date: 'today' })}
                className="w-1/2"
              >
                Today Only
              </Button>
              <Button
                variant={filters.date === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters({ ...filters, date: 'all' })}
                className="w-1/2"
              >
                All History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Risk Score</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {loading ? "Loading transactions..." : "No transactions found matching your criteria."}
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="tabular-nums font-semibold text-foreground">
                    #{txn.id}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{txn.customer_name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{txn.card_type} •••• {txn.card_last_four}</div>
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-foreground">{txn.merchant}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-foreground">
                    LKR {txn.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center tabular-nums font-medium">
                    <span className={txn.fraud_score > declineThreshold ? 'text-red-600 dark:text-red-400 font-semibold' : (txn.fraud_score > reviewThreshold ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground')}>
                      {(txn.fraud_score * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(txn.status, txn.fraud_score)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(txn)}
                      className="h-7 px-2 text-xs"
                    >
                      Audit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent onClose={() => setSelectedTransaction(null)} className="max-w-md">
          {selectedTransaction && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle>Audit Transaction #{selectedTransaction.id}</DialogTitle>
                  {getStatusBadge(selectedTransaction.status, selectedTransaction.fraud_score)}
                </div>
                <DialogDescription>
                  Recorded on {new Date(selectedTransaction.timestamp).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/40 text-xs">
                <div>
                  <span className="text-muted-foreground block">Customer</span>
                  <span className="font-semibold text-foreground">{selectedTransaction.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Amount</span>
                  <span className="font-semibold text-foreground tabular-nums">LKR {selectedTransaction.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Merchant</span>
                  <span className="font-semibold text-foreground">{selectedTransaction.merchant}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Card Instrument</span>
                  <span className="font-semibold text-foreground tabular-nums">{selectedTransaction.card_type} •••• {selectedTransaction.card_last_four}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Fraud Confidence Score</span>
                  <span className="font-bold tabular-nums text-foreground">{(selectedTransaction.fraud_score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Configured Threshold Band</span>
                  <span className="text-muted-foreground tabular-nums">Review &gt; {(reviewThreshold * 100).toFixed(0)}% | Decline &gt; {(declineThreshold * 100).toFixed(0)}%</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {selectedTransaction.status === 'Escalate' ? (
                  <>
                    <Button variant="default" className="flex-1" size="sm" onClick={() => handleDecision('Approve')}>
                      Approve
                    </Button>
                    <Button variant="destructive" className="flex-1" size="sm" onClick={() => handleDecision('Decline')}>
                      Decline
                    </Button>
                  </>
                ) : selectedTransaction.status === 'Decline' ? (
                  <Button variant="outline" className="w-full" size="sm" onClick={() => handleDecision('Approve')}>
                    Override Policy & Force Approve
                  </Button>
                ) : (
                  <Button variant="destructive" className="w-full" size="sm" onClick={() => handleDecision('Decline')}>
                    Retroactively Decline & Flag
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Transactions;
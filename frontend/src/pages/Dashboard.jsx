import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CreditCard, AlertTriangle, Clock, Zap } from 'lucide-react';
import Card from '../components/Common/Card.jsx';
import Badge from '../components/Common/Badge.jsx';
import Modal from '../components/Common/Modal.jsx';
import Button from '../components/Common/Button.jsx';

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
                // Map backend data to UI format
                // Backend returns: id, customer_id, merchant, amount, timestamp, fraud_score, status, customer_name, card_type, card_last_four
                const mappedTxns = data.map(txn => ({
                    id: txn.id,
                    time: new Date(txn.timestamp).toLocaleTimeString(),
                    amount: `LKR ${txn.amount.toFixed(2)}`,
                    merchant: txn.merchant,
                    // customer info for display
                    description: `Transaction by ${txn.customer_name} (${txn.card_type} ...${txn.card_last_four})`,
                    score: txn.fraud_score,
                    decision: txn.status, 
                    status: txn.status === 'Decline' ? 'danger' : (txn.status === 'Escalate' ? 'warning' : 'success')
                }));
                setTransactions(mappedTxns);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Fetch Stats
            const statsRes = await fetch('http://localhost:8000/api/dashboard/stats');
            if (statsRes.ok) {
                const statsJson = await statsRes.json();
                setStats(statsJson);
            }

            // Fetch Graph Trends
            const trendsRes = await fetch('http://localhost:8000/api/dashboard/trends');
            if (trendsRes.ok) {
                const trendsJson = await trendsRes.json();
                setGraphData(trendsJson);
            }

            // Fetch Risky Merchants
            const riskRes = await fetch('http://localhost:8000/api/dashboard/risky-merchants');
            if (riskRes.ok) {
                const riskJson = await riskRes.json();
                setRiskyMerchants(riskJson);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    // Initial fetch
    fetchTransactions();
    fetchDashboardData();

    // Poll every 2 seconds
    const interval = setInterval(() => {
        fetchTransactions();
        fetchDashboardData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const dashboardKPIs = [
    { label: 'Transactions Today', value: stats.total_transactions.toLocaleString(), icon: CreditCard, color: 'blue' },
    { label: 'Fraud Detected', value: stats.fraud_detected, icon: AlertTriangle, color: 'red' },
    { label: 'Under Review', value: stats.under_review, icon: Clock, color: 'amber' },
    { label: 'Avg Response', value: `${stats.avg_response_ms}ms`, icon: Zap, color: 'green' },
  ];

  const fraudTrendsData = [
    { date: 'Mon', fraud: 12, approved: 145, review: 8 },
    { date: 'Tue', fraud: 19, approved: 168, review: 12 },
    { date: 'Wed', fraud: 8, approved: 132, review: 5 },
    { date: 'Thu', fraud: 24, approved: 189, review: 18 },
    { date: 'Fri', fraud: 15, approved: 156, review: 10 },
    { date: 'Sat', fraud: 10, approved: 98, review: 6 },
    { date: 'Sun', fraud: 14, approved: 112, review: 9 },
  ];

  // const riskyMerchants = []; // Now fetched from API

  const KPICard = ({ label, value, icon: Icon, color }) => {
    const colorMap = {
      blue: { backgroundColor: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
      red: { backgroundColor: 'bg-red-50 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400' },
      amber: { backgroundColor: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
      green: { backgroundColor: 'bg-green-50 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' }
    };

    return (
      <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow dark:hover:shadow-slate-900/50" onClick={() => navigate('/transactions')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">{label}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorMap[color].backgroundColor}`}>
            <Icon size={24} className={colorMap[color].color} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Welcome back! Here's your fraud detection overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Fraud Trends Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fraud Trends (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.2} />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#f8fafc' }} />
            <Legend />
            <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
            <Line type="monotone" dataKey="approved" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
            <Line type="monotone" dataKey="review" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Live Feed & Risky Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Feed */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Feed (Real-Time)</h2>
          <div className="space-y-3">
            {transactions.length === 0 ? (
                <p className="text-gray-500 dark:text-slate-400 text-center py-4">Waiting for simulator traffic...</p>
            ) : (
                transactions.map((txn) => (
                <div 
                    key={txn.id} 
                    onClick={() => setSelectedTransaction(txn)} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                    <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{txn.merchant}</p>
                  <p className="text-xs text-blue-600 dark:text-amber-500 font-semibold">{txn.description}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{txn.time}</p>
                </div>
                    <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{txn.amount}</p>
                    <Badge variant={txn.status}>{txn.decision}</Badge>
                    </div>
                </div>
                ))
            )}
          </div>
        </Card>

        {/* Risky Merchants */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risky Merchants</h2>
          <div className="space-y-3">
            {riskyMerchants.map((merchant, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{merchant.name}</p>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{merchant.txns} transactions</p>
                </div>
                <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-sm">{(merchant.risk * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transaction Detail Modal */}
      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Transaction Details" size="lg">
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Transaction ID</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Amount</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Merchant</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.merchant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Country</p>
                <p className="font-medium text-gray-900 dark:text-white">US</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Fraud Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Fraud Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">{(selectedTransaction.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Decision</span>
                  <Badge variant={selectedTransaction.status}>{selectedTransaction.decision}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Confidence</span>
                  <span className="font-medium text-gray-900 dark:text-white">{(Math.abs(selectedTransaction.score - 0.5) * 200).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="success" className="flex-1">Approve</Button>
              <Button variant="danger" className="flex-1">Decline</Button>
              <Button variant="secondary" className="flex-1">Review</Button>
            </div>
            <button 
              onClick={() => { setSelectedTransaction(null); navigate('/customers'); }} 
              className="w-full text-center text-blue-600 hover:text-blue-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium text-sm transition-colors"
            >
              View Customer Profile →
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
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

  const dashboardKPIs = [
    { label: 'Transactions Today', value: '1,247', icon: CreditCard, color: 'blue' },
    { label: 'Fraud Detected', value: '15', icon: AlertTriangle, color: 'red' },
    { label: 'Under Review', value: '42', icon: Clock, color: 'amber' },
    { label: 'Avg Response', value: '145ms', icon: Zap, color: 'green' },
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

  const transactions = [
    { id: 'TXN-001', time: '2 min ago', amount: '$2,450.00', merchant: 'Amazon', score: 0.92, decision: 'Fraud', status: 'danger' },
    { id: 'TXN-002', time: '5 min ago', amount: '$89.99', merchant: 'Spotify', score: 0.15, decision: 'Approved', status: 'success' },
    { id: 'TXN-003', time: '12 min ago', amount: '$1,200.00', merchant: 'Unknown Merchant', score: 0.68, decision: 'Review', status: 'warning' },
  ];

  const riskyMerchants = [
    { name: 'Unknown Merchant XYZ', risk: 0.92, txns: 47 },
    { name: 'Crypto Exchange ABC', risk: 0.85, txns: 23 },
    { name: 'Wire Transfer Service', risk: 0.78, txns: 15 },
  ];

  const KPICard = ({ label, value, icon: Icon, color }) => {
    const colorMap = {
      blue: { backgroundColor: 'bg-blue-50', color: 'text-blue-600' },
      red: { backgroundColor: 'bg-red-50', color: 'text-red-600' },
      amber: { backgroundColor: 'bg-amber-50', color: 'text-amber-600' },
      green: { backgroundColor: 'bg-green-50', color: 'text-green-600' }
    };

    return (
      <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/transactions')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your fraud detection overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardKPIs.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      {/* Fraud Trends Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fraud Trends (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={fraudTrendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="fraud" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626' }} />
            <Line type="monotone" dataKey="approved" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
            <Line type="monotone" dataKey="review" stroke="#d97706" strokeWidth={2} dot={{ fill: '#d97706' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Live Feed & Risky Merchants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Feed */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Live Feed</h2>
          <div className="space-y-3">
            {transactions.slice(0, 3).map((txn) => (
              <div 
                key={txn.id} 
                onClick={() => setSelectedTransaction(txn)} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{txn.merchant}</p>
                  <p className="text-sm text-gray-500">{txn.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{txn.amount}</p>
                  <Badge variant={txn.status}>{txn.decision}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Risky Merchants */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risky Merchants</h2>
          <div className="space-y-3">
            {riskyMerchants.map((merchant, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{merchant.name}</p>
                  <p className="text-sm text-gray-500">{merchant.txns} transactions</p>
                </div>
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">{(merchant.risk * 100).toFixed(0)}%</span>
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
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium text-gray-900">{selectedTransaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-gray-900">{selectedTransaction.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Merchant</p>
                <p className="font-medium text-gray-900">{selectedTransaction.merchant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-medium text-gray-900">US</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Fraud Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fraud Score</span>
                  <span className="font-medium text-gray-900">{(selectedTransaction.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Decision</span>
                  <Badge variant={selectedTransaction.status}>{selectedTransaction.decision}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium text-gray-900">94%</span>
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
              className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
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
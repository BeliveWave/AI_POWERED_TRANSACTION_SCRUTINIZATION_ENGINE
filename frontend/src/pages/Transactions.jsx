import React, { useState } from 'react';
import { Filter, Download } from 'lucide-react';
import Card from '../components/Common/Card.jsx';
import Button from '../components/Common/Button.jsx';
import Badge from '../components/Common/Badge.jsx';
import Modal from '../components/Common/Modal.jsx';

const Transactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const transactions = [
    { id: 'TXN-001', time: '2 min ago', amount: '$2,450.00', merchant: 'Amazon', country: 'US', score: 0.92, decision: 'Fraud', status: 'danger' },
    { id: 'TXN-002', time: '5 min ago', amount: '$89.99', merchant: 'Spotify', country: 'US', score: 0.15, decision: 'Approved', status: 'success' },
    { id: 'TXN-003', time: '12 min ago', amount: '$1,200.00', merchant: 'Unknown Merchant', country: 'NG', score: 0.68, decision: 'Review', status: 'warning' },
    { id: 'TXN-004', time: '18 min ago', amount: '$45.50', merchant: 'Starbucks', country: 'US', score: 0.08, decision: 'Approved', status: 'success' },
    { id: 'TXN-005', time: '25 min ago', amount: '$5,600.00', merchant: 'Wire Transfer', country: 'CN', score: 0.85, decision: 'Fraud', status: 'danger' },
  ];

  const getScoreColor = (score) => {
    if (score > 0.7) return 'bg-red-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">Monitor and manage all transactions in real-time.</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search merchant, card..."
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>All Decisions</option>
            <option>Approved</option>
            <option>Fraud</option>
            <option>Review</option>
          </select>
          <div className="flex space-x-2">
            <Button variant="secondary" icon={Filter} onClick={() => setFilterModalOpen(true)}>
              Filter
            </Button>
            <Button variant="secondary" icon={Download}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Decision</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{txn.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.merchant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{txn.country}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getScoreColor(txn.score)}`}></div>
                      <span className="font-medium">{(txn.score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Badge variant={txn.status}>{txn.decision}</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedTransaction(txn)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium">{selectedTransaction.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{selectedTransaction.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Merchant</p>
                <p className="font-medium">{selectedTransaction.merchant}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="font-medium">{selectedTransaction.country}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Fraud Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fraud Score</span>
                  <span className="font-medium">{(selectedTransaction.score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Decision</span>
                  <Badge variant={selectedTransaction.status}>{selectedTransaction.decision}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence</span>
                  <span className="font-medium">94%</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button variant="success" className="flex-1">Approve</Button>
              <Button variant="danger" className="flex-1">Decline</Button>
              <Button variant="secondary" className="flex-1">Review</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Filter Modal */}
      <Modal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Advanced Filters"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                type="number" 
                placeholder="Max" 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fraud Score Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                type="number" 
                placeholder="Max" 
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input 
              type="text" 
              placeholder="e.g., US, UK, NG" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" className="flex-1">Clear</Button>
            <Button className="flex-1">Apply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;
import React, { useState } from 'react';
import { Filter, Download, RefreshCw } from 'lucide-react';
import Card from '../components/Common/Card.jsx';
import Button from '../components/Common/Button.jsx';
import Badge from '../components/Common/Badge.jsx';
import Modal from '../components/Common/Modal.jsx';

const Transactions = () => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ minAmt: '', maxAmt: '', status: 'All', date: 'today' });
  
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

        const response = await fetch(`http://localhost:8000/api/transactions?${queryParams}`);
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

  React.useEffect(() => {
      // Debounce search
      const timer = setTimeout(() => {
          fetchTransactions();
      }, 500);
      return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const handleDecision = async (decision) => {
      if (!selectedTransaction) return;
      try {
          const response = await fetch(`http://localhost:8000/api/transactions/${selectedTransaction.id}/decide?decision=${decision}`, {
              method: 'POST'
          });
          if (response.ok) {
              setFilterModalOpen(false); // Reuse this state? No, modal state is 'selectedTransaction'
              setSelectedTransaction(null);
              fetchTransactions(); // Refresh list
          }
      } catch (error) {
          console.error("Error updating transaction:", error);
      }
  };

  const getScoreColor = (score) => {
    if (score > 0.7) return 'bg-red-500';
    if (score > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ['Transaction ID', 'Customer', 'Time', 'Amount', 'Merchant', 'Score', 'Status'];
    const csvRows = [];
    csvRows.push(headers.join(','));
    
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
    link.setAttribute("download", `transactions_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <p className="text-gray-600 dark:text-slate-400 mt-1">Monitor and manage all transactions in real-time.</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search ID, Merchant, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
          <div className="flex space-x-2">
            <input
                type="number"
                placeholder="Min Amt"
                value={filters.minAmt}
                onChange={(e) => setFilters({...filters, minAmt: e.target.value})}
                className="w-1/2 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            />
            <input
                type="number"
                placeholder="Max Amt"
                value={filters.maxAmt}
                onChange={(e) => setFilters({...filters, maxAmt: e.target.value})}
                className="w-1/2 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            />
          </div>
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          >
            <option value="All">All Decisions</option>
            <option value="Approve">Approved</option>
            <option value="Decline">Fraud (Decline)</option>
            <option value="Escalate">Review (Escalate)</option>
          </select>
          <div className="flex space-x-2">
            <Button variant="secondary" icon={RefreshCw} onClick={fetchTransactions}>
              Refresh
            </Button>
            <Button variant="secondary" icon={Download} onClick={exportCSV}>
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Merchant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {transactions.length === 0 ? (
                  <tr><td colSpan="8" className="p-4 text-center text-gray-500 dark:text-slate-400">No transactions found</td></tr>
              ) : (
                transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">TXN-{txn.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{txn.customer_name}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{txn.card_type} ...{txn.card_last_four}</p>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(txn.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">LKR {txn.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{txn.merchant}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white">
                        <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getScoreColor(txn.fraud_score)}`}></div>
                        <span className="font-medium">{(txn.fraud_score * 100).toFixed(0)}%</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant={txn.status === 'Decline' ? 'danger' : (txn.status === 'Escalate' ? 'warning' : 'success')}>
                            {txn.status}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                        onClick={() => setSelectedTransaction(txn)}
                        className="text-blue-600 hover:text-blue-900 dark:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors"
                        >
                        View
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View All / Today Toggle (Bottom of page as requested) */}
      <div className="flex justify-center pb-8">
          {filters.date === 'today' ? (
              <Button onClick={() => setFilters({ ...filters, date: 'all' })} variant="secondary">
                  View All History (Slow)
              </Button>
          ) : (
              <Button onClick={() => setFilters({ ...filters, date: 'today' })}>
                  Show Today Only
              </Button>
          )}
      </div>

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
                 <p className="text-sm text-gray-500 dark:text-slate-400">Card</p>
                 <p className="font-medium text-gray-900 dark:text-white">{selectedTransaction.card_type} ...{selectedTransaction.card_last_four}</p>
               </div>

            </div>

            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Fraud Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Fraud Score</span>
                  <span className="font-medium text-gray-900 dark:text-white">{(selectedTransaction.fraud_score * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Decision</span>
                  <Badge variant={selectedTransaction.status === 'Decline' ? 'danger' : (selectedTransaction.status === 'Escalate' ? 'warning' : 'success')}>
                      {selectedTransaction.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-slate-400">Confidence</span>
                  <span className="font-medium text-gray-900 dark:text-white">{(Math.abs(selectedTransaction.fraud_score - 0.5) * 200).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              {/* STATUS: REVIEW (Escalate) - Show Approve & Decline */}
              {selectedTransaction.status === 'Escalate' && (
                  <>
                    <Button variant="success" className="flex-1" onClick={() => handleDecision('Approve')}>Approve</Button>
                    <Button variant="danger" className="flex-1" onClick={() => handleDecision('Decline')}>Decline</Button>
                  </>
              )}

              {/* STATUS: FRAUD (Decline) - Show Override */}
              {selectedTransaction.status === 'Decline' && (
                  <Button variant="secondary" className="flex-1" onClick={() => handleDecision('Approve')}>
                      Override Approve (Force)
                  </Button>
              )}

              {/* STATUS: APPROVED - Show Report Fraud */}
              {selectedTransaction.status === 'Approve' && (
                  <Button variant="danger" className="flex-1" onClick={() => handleDecision('Decline')}>
                      Report Fraud (Decline)
                  </Button>
              )}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Amount Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
              <input 
                type="number" 
                placeholder="Max" 
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Fraud Score Range</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="Min" 
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
              <input 
                type="number" 
                placeholder="Max" 
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Country</label>
            <input 
              type="text" 
              placeholder="e.g., US, UK, NG" 
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
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
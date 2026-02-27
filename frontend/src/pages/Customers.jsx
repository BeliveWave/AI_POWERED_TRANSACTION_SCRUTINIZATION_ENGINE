import React, { useState, useEffect } from 'react';
import { Filter, Search, Plus, X } from 'lucide-react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Badge from '../components/Common/Badge';

const Customers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerStr, setNewCustomerStr] = useState({ name: '', email: '', cardType: 'Visa', cardLastFour: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch customers from backend
  const fetchCustomers = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filterType !== 'all') queryParams.append('risk_filter', filterType);

      const response = await fetch(`http://localhost:8000/api/customers?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        // Backend now returns dynamic stats: 
        // { id, full_name, email, card_type, card_last_four, risk_score, last_activity, transaction_count, is_frozen }
        const mappedCustomers = data.map(c => ({
            id: c.id,
            name: c.full_name,
            email: c.email,
            card: `${c.card_type} ...${c.card_last_four}`,
            riskScore: c.risk_score || 0.0,
            lastActivity: c.last_activity === 'Never' ? 'Never' : new Date(c.last_activity).toLocaleString(),
            txnCount: c.transaction_count,
            status: c.risk_score > 0.5 ? 'High' : 'Low',
            isFrozen: c.is_frozen,
            isActive: c.is_active
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
        fetchCustomers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, filterType]);

  const handleFreeze = async (customer) => {
    try {
        const response = await fetch(`http://localhost:8000/api/customers/${customer.id}/freeze`, {
            method: 'POST'
        });
        if (response.ok) {
            // Optimistic update
            setCustomers(customers.map(c => 
                c.id === customer.id ? { ...c, isFrozen: !c.isFrozen } : c
            ));
        }
    } catch (error) {
        console.error("Error freezing customer:", error);
    }
  };

  const handleDeactivate = async (customer) => {
    if (!window.confirm(`Are you sure you want to deactivate ${customer.name}? They will no longer appear in the simulator.`)) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/customers/${customer.id}/deactivate`, {
            method: 'POST'
        });
        if (response.ok) {
             setCustomers(customers.map(c => 
                c.id === customer.id ? { ...c, isActive: false } : c
            ));
        }
    } catch (error) {
         console.error("Error deactivating customer:", error);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const queryParams = new URLSearchParams({
            name: newCustomerStr.name,
            email: newCustomerStr.email,
            card_type: newCustomerStr.cardType,
            card_last_four: newCustomerStr.cardLastFour
        });
        const response = await fetch(`http://localhost:8000/api/customers?${queryParams}`, {
            method: 'POST'
        });
        if (response.ok) {
            setShowAddModal(false);
            setNewCustomerStr({ name: '', email: '', cardType: 'Visa', cardLastFour: '' });
            fetchCustomers(); // Refresh list
        }
    } catch (error) {
        console.error("Error creating customer:", error);
    } finally {
        setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score > 0.6) return 'bg-red-500';
    if (score > 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage and analyze customer profiles and risk assessments.</p>
        </div>
        <Button icon={Plus} onClick={() => setShowAddModal(true)}>
            Add Customer
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
              <option value="all">Show All</option>
              <option value="high">High Risk (&gt;50%)</option>
              <option value="safe">Safe Customers</option>
          </select>
          <Button variant="secondary" icon={Filter} onClick={fetchCustomers}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                  <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No customers found. Click "Add Customer" to start.
                      </td>
                  </tr>
              ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className={`hover:bg-gray-50 ${!customer.isActive ? 'bg-gray-100 opacity-60' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                        <p className="text-sm font-medium text-gray-900">
                            {customer.name} {!customer.isActive && <span className="text-xs text-red-600 font-bold ml-2">(Deactivated)</span>}
                        </p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.card}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(customer.riskScore)}`}></div>
                        <span className="font-medium">{(customer.riskScore * 100).toFixed(0)}%</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.lastActivity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.txnCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {customer.isActive && (
                            <div className="flex space-x-2">
                                <button
                                onClick={() => handleFreeze(customer)}
                                className={`font-medium px-3 py-1 rounded-full text-xs ${
                                    customer.isFrozen 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                >
                                {customer.isFrozen ? "Unfreeze" : "Freeze"}
                                </button>
                                <button
                                onClick={() => handleDeactivate(customer)}
                                className="font-medium px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
                                >
                                Deactivate
                                </button>
                            </div>
                        )}
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Add New Customer</h2>
                      <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                          <X size={24} />
                      </button>
                  </div>
                  <form onSubmit={handleCreateCustomer}>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                              <input 
                                type="text" 
                                required
                                value={newCustomerStr.name}
                                onChange={e => setNewCustomerStr({...newCustomerStr, name: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Inshaf Rajayee"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input 
                                type="email" 
                                required
                                value={newCustomerStr.email}
                                onChange={e => setNewCustomerStr({...newCustomerStr, email: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. inshaf@example.com"
                              />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                                  <select
                                      value={newCustomerStr.cardType}
                                      onChange={e => setNewCustomerStr({...newCustomerStr, cardType: e.target.value})}
                                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                  >
                                      <option value="Visa">Visa</option>
                                      <option value="Mastercard">Mastercard</option>
                                      <option value="Amex">Amex</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Last 4 Digits</label>
                                  <input 
                                    type="text" 
                                    required
                                    maxLength="4"
                                    pattern="\d{4}"
                                    value={newCustomerStr.cardLastFour}
                                    onChange={e => setNewCustomerStr({...newCustomerStr, cardLastFour: e.target.value})}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. 9010"
                                  />
                              </div>
                          </div>
                          <div className="flex space-x-3 mt-6">
                              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowAddModal(false)}>
                                  Cancel
                              </Button>
                              <Button type="submit" className="flex-1" disabled={loading}>
                                  {loading ? 'Creating...' : 'Create Customer'}
                              </Button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Customers;
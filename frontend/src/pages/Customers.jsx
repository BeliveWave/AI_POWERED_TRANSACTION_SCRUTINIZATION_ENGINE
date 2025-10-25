import React, { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import Badge from '../components/Common/Badge';

const Customers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customers = [
    { id: 'CUST-001', name: 'John Doe', email: 'john@example.com', card: '****1234', riskScore: 0.25, lastActivity: '2 min ago', txnCount: 47, status: 'Low' },
    { id: 'CUST-002', name: 'Jane Smith', email: 'jane@example.com', card: '****5678', riskScore: 0.72, lastActivity: '15 min ago', txnCount: 12, status: 'High' },
    { id: 'CUST-003', name: 'Bob Johnson', email: 'bob@example.com', card: '****9012', riskScore: 0.45, lastActivity: '1 hour ago', txnCount: 89, status: 'Medium' },
  ];

  const getRiskColor = (score) => {
    if (score > 0.6) return 'bg-red-500';
    if (score > 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskStatus = (score) => {
    if (score > 0.6) return 'danger';
    if (score > 0.3) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600 mt-1">Manage and analyze customer profiles and risk assessments.</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search by name, email..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button variant="secondary" icon={Filter}>
            Filter
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
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
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
                    <button
                      onClick={() => setSelectedCustomer(customer)}
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
    </div>
  );
};

export default Customers;
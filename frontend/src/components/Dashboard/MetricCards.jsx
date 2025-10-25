import React from 'react';
import { CreditCard, AlertTriangle, Clock, Zap } from 'lucide-react';
import Card from '../Common/Card.jsx';

const KPICard = ({ label, value, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <Card onClick={onClick} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};

const MetricCards = ({ onTransactionClick }) => {
  const dashboardKPIs = [
    { label: 'Transactions Today', value: '1,247', icon: CreditCard, color: 'blue' },
    { label: 'Fraud Detected', value: '15', icon: AlertTriangle, color: 'red' },
    { label: 'Under Review', value: '42', icon: Clock, color: 'amber' },
    { label: 'Avg Response', value: '145ms', icon: Zap, color: 'green' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {dashboardKPIs.map((kpi, idx) => (
        <KPICard key={idx} {...kpi} onClick={onTransactionClick} />
      ))}
    </div>
  );
};

export default MetricCards;
import React from 'react';
import { Server, Check, AlertTriangle } from 'lucide-react';
import Card from '../components/Common/Card';
import Badge from '../components/Common/Badge';

const SystemAdmin = () => {
  const systemHealth = [
    { name: 'API Server', status: 'healthy', uptime: '99.98%', latency: '45ms', cpu: '32%' },
    { name: 'ML Model', status: 'healthy', uptime: '99.95%', latency: '120ms', cpu: '68%' },
    { name: 'Database', status: 'healthy', uptime: '99.99%', latency: '8ms', cpu: '45%' },
    { name: 'Queue Service', status: 'warning', uptime: '99.87%', latency: '250ms', cpu: '78%' },
  ];

  const getStatusIcon = (status) => {
    if (status === 'healthy') return <Check size={20} className="text-green-600" />;
    return <AlertTriangle size={20} className="text-yellow-600" />;
  };

  const getStatusVariant = (status) => {
    return status === 'healthy' ? 'success' : 'warning';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-1">Monitor system health and manage infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {systemHealth.map((service, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                <Badge variant={getStatusVariant(service.status)} className="mt-2">
                  {service.status === 'healthy' ? '✓ Healthy' : '⚠ Warning'}
                </Badge>
              </div>
              {getStatusIcon(service.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-gray-900">{service.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Latency</span>
                <span className="font-medium text-gray-900">{service.latency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CPU Usage</span>
                <span className="font-medium text-gray-900">{service.cpu}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SystemAdmin;
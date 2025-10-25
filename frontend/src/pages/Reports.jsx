import React from 'react';
import { TrendingUp, AlertCircle, BarChart3, Globe } from 'lucide-react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';

const Reports = () => {
  const reports = [
    { id: 'RPT-001', title: 'Daily Fraud Summary', description: 'Today\'s fraud metrics', icon: TrendingUp },
    { id: 'RPT-002', title: 'False Positives Analysis', description: 'Incorrectly flagged transactions', icon: AlertCircle },
    { id: 'RPT-003', title: 'Model Performance', description: 'Precision, recall, F1 score', icon: BarChart3 },
    { id: 'RPT-004', title: 'Geographic Heatmap', description: 'Fraud by region', icon: Globe },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">Generate and analyze fraud detection reports.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{report.description}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon size={24} className="text-blue-600" />
                </div>
              </div>
              <Button variant="secondary" className="w-full">
                Generate Report
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
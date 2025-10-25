import React from 'react';
import Card from '../Common/Card.jsx';
import Badge from '../Common/Badge.jsx';

const LiveFeed = ({ transactions, onTransactionClick }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Feed</h3>
      <div className="space-y-3">
        {transactions.map((txn) => (
          <div
            key={txn.id}
            onClick={() => onTransactionClick(txn)}
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
  );
};

export default LiveFeed;
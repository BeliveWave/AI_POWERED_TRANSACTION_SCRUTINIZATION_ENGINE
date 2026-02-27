import React, { useState } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';

const Configuration = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
        <p className="text-gray-600 mt-1">Manage business rules, whitelists, and blocked regions.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Country Rules</h2>
        <div className="space-y-4">
            <p className="text-sm text-gray-600">
                Configure allowed and blocked countries for transactions.
            </p>
            {/* Placeholder for future implementation */}
            <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center text-gray-500">
                Country Whitelist/Blacklist UI coming soon.
            </div>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Merchant Whitelist</h2>
        <div className="space-y-4">
             <p className="text-sm text-gray-600">
                Trusted merchants that bypass strict fraud checks.
            </p>
             <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center text-gray-500">
                Merchant Allow-list UI coming soon.
            </div>
        </div>
      </Card>
    </div>
  );
};

export default Configuration;
import React, { useState } from 'react';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';

const Configuration = () => {
  const [fraudThreshold, setFraudThreshold] = useState(0.7);
  const [reviewThreshold, setReviewThreshold] = useState(0.4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
        <p className="text-gray-600 mt-1">Manage fraud detection settings and rules.</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fraud Detection Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fraud Threshold: {(fraudThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={fraudThreshold}
              onChange={(e) => setFraudThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Transactions with fraud scores above this threshold will be automatically flagged as fraud.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Threshold: {(reviewThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={reviewThreshold}
              onChange={(e) => setReviewThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-sm text-gray-500 mt-1">
              Transactions with fraud scores between review and fraud thresholds will be marked for manual review.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Current Thresholds</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded">
                  <p className="font-medium">Approved</p>
                  <p>0 - {(reviewThreshold * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded">
                  <p className="font-medium">Review</p>
                  <p>{(reviewThreshold * 100).toFixed(0)}% - {(fraudThreshold * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-red-100 text-red-800 px-3 py-2 rounded">
                  <p className="font-medium">Fraud</p>
                  <p>{(fraudThreshold * 100).toFixed(0)}% - 100%</p>
                </div>
              </div>
            </div>
          </div>

          <Button>Save Settings</Button>
        </div>
      </Card>
    </div>
  );
};

export default Configuration;
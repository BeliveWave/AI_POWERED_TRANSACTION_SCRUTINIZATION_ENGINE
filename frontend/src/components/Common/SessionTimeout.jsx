import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before timeout

const SessionTimeout = ({ isLoggedIn, onLogout }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarning(false);
      return;
    }

    const checkTimeout = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (!lastActivity) return;

      const lastActivityTime = Number.parseInt(lastActivity, 10);
      const now = Date.now();
      const timeSinceActivity = now - lastActivityTime;
      const timeUntilTimeout = SESSION_TIMEOUT - timeSinceActivity;

      // Show warning if less than WARNING_TIME remaining
      if (timeUntilTimeout <= WARNING_TIME && timeUntilTimeout > 0) {
        setShowWarning(true);
        setRemainingTime(Math.floor(timeUntilTimeout / 1000)); // in seconds
      } else {
        setShowWarning(false);
      }

      // Auto logout if timeout exceeded
      if (timeUntilTimeout <= 0) {
        setShowWarning(false);
        onLogout();
      }
    }, 1000); // Check every second

    return () => clearInterval(checkTimeout);
  }, [isLoggedIn, onLogout]);

  const handleContinue = () => {
    // Update activity to reset timer
    const now = Date.now();
    localStorage.setItem('lastActivity', now.toString());
    localStorage.setItem('sessionExpiry', (now + SESSION_TIMEOUT).toString());
    setShowWarning(false);
  };

  if (!showWarning) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <Modal isOpen={showWarning} onClose={() => {}} title="" showCloseButton={false}>
      <div className="text-center py-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Session Timeout Warning
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          Your session will expire due to inactivity in:
        </p>
        
        <div className="text-3xl font-bold text-red-600 mb-6">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Click "Continue" to stay logged in, or you will be automatically logged out.
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Logout Now
          </button>
          <button
            onClick={handleContinue}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Continue Session
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionTimeout;

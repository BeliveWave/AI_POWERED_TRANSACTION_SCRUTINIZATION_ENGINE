import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const SessionTimeout = () => {
  const { isLoggedIn, logout, updateActivity, isSessionValid, SESSION_TIMEOUT } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarning(false);
      return;
    }

    // Check session expiry every second to show warning
    const warningInterval = setInterval(() => {
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (!sessionExpiry) {
        setShowWarning(false);
        return;
      }

      const now = Date.now();
      const expiryTime = parseInt(sessionExpiry);
      const remaining = expiryTime - now;

      // Show warning 2 minutes before expiry
      const WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes

      if (remaining <= WARNING_THRESHOLD && remaining > 0) {
        setShowWarning(true);
        setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
      } else {
        setShowWarning(false);
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(warningInterval);
    };
  }, [isLoggedIn]);

  const handleContinueSession = () => {
    updateActivity();
    setShowWarning(false);
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    logout();
  };

  if (!showWarning) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Modal 
      isOpen={showWarning} 
      onClose={handleContinueSession}
      title="Session Expiring"
      size="md"
      showCloseButton={false}
    >
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your session is about to expire
        </h3>
        
        <p className="text-gray-600 mb-4">
          You will be automatically logged out in{' '}
          <span className="font-bold text-red-600">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Click "Continue Session" to stay logged in, or you will be logged out due to inactivity.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleContinueSession}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue Session
          </button>
          <button
            onClick={handleLogoutNow}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Logout Now
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SessionTimeout;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog.jsx';
import { Button } from '../ui/button.jsx';
import { AlertTriangle, Clock } from 'lucide-react';

const SessionTimeout = () => {
  const { isLoggedIn, logout, updateActivity } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      setShowWarning(false);
      return;
    }

    const checkInterval = setInterval(() => {
      const sessionExpiry = localStorage.getItem('sessionExpiry');
      if (!sessionExpiry) {
        setShowWarning(false);
        return;
      }

      const now = Date.now();
      const expiryTime = parseInt(sessionExpiry, 10);
      const remaining = expiryTime - now;

      // Warn 2 minutes before expiry
      const WARNING_WINDOW_MS = 2 * 60 * 1000;

      if (remaining <= 0) {
        setShowWarning(false);
        logout();
      } else if (remaining <= WARNING_WINDOW_MS) {
        setShowWarning(true);
        setTimeRemaining(Math.ceil(remaining / 1000));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isLoggedIn, logout]);

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
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Session Expiring
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Your analyst session will terminate automatically due to inactivity in:
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border">
            <Clock className="h-4 w-4 text-destructive animate-pulse" />
            <span className="font-mono text-2xl font-bold text-destructive tabular-nums">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Click &ldquo;Continue Session&rdquo; to refresh your authentication token and stay active in the console.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogoutNow}
            className="w-full sm:w-auto text-xs"
          >
            Sign Out Now
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleContinueSession}
            className="w-full sm:w-auto text-xs"
          >
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionTimeout;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  Shield,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  PanelLeft,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useTheme } from '../../hooks/useTheme.jsx';
import { Badge } from '../ui/badge.jsx';
import { Button } from '../ui/button.jsx';
import { API_BASE_URL } from '../../services/api.js';

const API = API_BASE_URL;
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TopBar = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ transactions: [], customers: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem(`avatar_${user?.username}`) || user?.avatar);

  useEffect(() => {
    setAvatarUrl(localStorage.getItem(`avatar_${user?.username}`) || user?.avatar);
    const handleAvatarUpdate = () => {
      setAvatarUrl(localStorage.getItem(`avatar_${user?.username}`) || user?.avatar);
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user]);

  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Current page title mapping
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path.startsWith('/transactions')) return 'Transactions';
    if (path.startsWith('/investigator')) return 'Investigations';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/reports')) return 'Reports';
    if (path.startsWith('/configuration') || path.startsWith('/system-admin')) return 'Configuration';
    if (path.startsWith('/profile')) return 'Profile Settings';
    if (path.startsWith('/help')) return 'Help & Specifications';
    return 'Console';
  };

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut Ctrl/Cmd + K & Esc
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults({ transactions: [], customers: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/api/search?q=${encodeURIComponent(searchQuery.trim())}`,
          { headers: getAuthHeaders() }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults({ transactions: [], customers: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults({ transactions: [], customers: [] });
  };

  // Unread count polling
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications/unread-count`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications`, { headers: getAuthHeaders() });
      if (res.ok) setNotifications(await res.json());
    } catch {
      // ignore
    }
  }, []);

  const handleBellClick = async () => {
    setNotificationsOpen(true);
    await fetchNotifications();
    if (unreadCount > 0) {
      try {
        await fetch(`${API}/api/notifications/mark-all-read`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        setUnreadCount(0);
      } catch {
        // ignore
      }
    }
  };

  const hasResults = searchResults.transactions.length > 0 || searchResults.customers.length > 0;

  return (
    <>
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors duration-200">
        {/* Left Side: Mobile Menu Trigger + Breadcrumb + Status */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Desktop Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={setCollapsed}
            className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>

          {/* Breadcrumb / Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground hidden sm:inline-block">Console</span>
            <span className="text-sm text-muted-foreground hidden sm:inline-block">/</span>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              {getPageTitle()}
            </span>
          </div>

          {/* Live Ingestion Indicator Pill */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground font-mono ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Stream</span>
          </div>
        </div>

        {/* Right Side: Search, Notifications, Settings, Theme, User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Global Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 h-9 px-3 bg-muted/40 hover:bg-muted/70 border border-border rounded-md text-sm text-muted-foreground transition-colors"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell */}
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </button>

          {/* Settings Quick Access */}
          <button
            onClick={() => navigate('/configuration')}
            className={`p-2 rounded-md hover:bg-muted transition-colors ${
              location.pathname.startsWith('/configuration')
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Configuration"
            aria-label="Configuration settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Menu Avatar */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center p-0.5 rounded-full ring-1 ring-border hover:ring-foreground transition"
              aria-label="User menu"
            >
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-sm font-semibold text-foreground">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.full_name ? user.full_name.charAt(0) : (user?.username ? user.username.charAt(0).toUpperCase() : 'A')}</span>
                )}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-popover text-popover-foreground rounded-lg border border-border shadow-md py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-border">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || user?.full_name || 'Admin User'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || 'admin@sentinel.io'}</p>
                </div>
                
                <div className="py-1 text-sm">
                  <button
                    onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-muted flex items-center gap-2.5 text-foreground"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Profile & Security</span>
                  </button>
                  <button
                    onClick={() => { navigate('/configuration'); setUserMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-muted flex items-center gap-2.5 text-foreground"
                  >
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Risk Configuration</span>
                  </button>
                  <button
                    onClick={() => { navigate('/help'); setUserMenuOpen(false); }}
                    className="w-full text-left px-3.5 py-2 hover:bg-muted flex items-center gap-2.5 text-foreground"
                  >
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Help & Documentation</span>
                  </button>
                </div>

                <div className="border-t border-border my-1" />

                <button
                  onClick={() => { logout(); setUserMenuOpen(false); }}
                  className="w-full text-left px-3.5 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════ GLOBAL SEARCH MODAL (SHADCN STYLE) ═══════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={closeSearch} />
          
          <div className="relative w-full max-w-xl rounded-lg border border-border bg-card text-card-foreground shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions, customers, or merchants..."
                autoFocus
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Results container */}
            <div className="max-h-80 overflow-y-auto p-2">
              {searchQuery.trim().length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Type at least 2 characters to search across transactions and customers...
                </p>
              ) : searchLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Searching records...
                </div>
              ) : !hasResults ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No matching records found for "{searchQuery}"
                </p>
              ) : (
                <div className="space-y-3">
                  {searchResults.transactions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        Transactions
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.transactions.map((txn) => (
                          <div
                            key={txn.id}
                            onClick={() => { closeSearch(); navigate('/transactions'); }}
                            className="px-3 py-2 rounded-md hover:bg-muted cursor-pointer flex items-center justify-between text-sm transition-colors"
                          >
                            <div>
                              <span className="font-semibold tabular-nums text-foreground">#{txn.id}</span>
                              <span className="text-muted-foreground ml-2">{txn.merchant}</span>
                              <div className="text-xs text-muted-foreground">{txn.customer_name} • LKR {txn.amount.toLocaleString()}</div>
                            </div>
                            <Badge variant={txn.status === 'Decline' ? 'destructive' : 'outline'}>
                              {txn.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.customers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        Customers
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.customers.map((cust) => (
                          <div
                            key={cust.id}
                            onClick={() => { closeSearch(); navigate('/customers'); }}
                            className="px-3 py-2 rounded-md hover:bg-muted cursor-pointer flex items-center justify-between text-sm transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-foreground">{cust.full_name}</div>
                              <div className="text-xs text-muted-foreground">{cust.email} • {cust.card_type} •••• {cust.card_last_four}</div>
                            </div>
                            {cust.is_frozen && (
                              <Badge variant="destructive">Frozen</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border bg-muted/40 text-xs text-muted-foreground flex justify-between">
              <span>Press ESC to exit</span>
              <span>Direct keyboard navigation available</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ NOTIFICATIONS SLIDE-OVER DRAWER ═══════════════ */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setNotificationsOpen(false)} />
          
          <div className="relative w-full max-w-sm h-full bg-card border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-base font-semibold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Recent engine alerts</p>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                  <Bell className="h-6 w-6 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No alerts at this moment</p>
                  <p className="text-xs opacity-70">New fraud alerts will appear here in real time</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border text-sm transition-colors ${
                      !n.is_read ? 'bg-muted/40 border-border' : 'border-transparent bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-foreground">{n.title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;

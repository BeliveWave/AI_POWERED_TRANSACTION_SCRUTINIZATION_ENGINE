import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, LogOut, Settings, HelpCircle, Shield, Menu, X,
  Home, CreditCard, Users, FileText, Server, AlertTriangle, Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

const API = 'http://localhost:8000';
const getToken = () => localStorage.getItem('access_token') || '';

// ── Relative time helper ───────────────────────────────────────────────────
function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

// ── Severity border color ──────────────────────────────────────────────────
const severityBorder = {
  critical: 'border-red-500',
  warning: 'border-yellow-500',
  info: 'border-blue-400',
};
const severityIcon = {
  critical: <AlertTriangle size={15} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={15} className="text-yellow-500 shrink-0" />,
  info: <Info size={15} className="text-blue-400 shrink-0" />,
};

// ── Status badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    Approve: 'bg-green-100 text-green-700',
    Decline: 'bg-red-100 text-red-700',
    Escalate: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// TOP NAV
// ══════════════════════════════════════════════════════════════════════════
const TopNav = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ transactions: [], customers: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
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

  // ── Navigation items ─────────────────────────────────────────────────
  const navItems = [
    { id: 'dashboard',    label: 'Dashboard',    path: '/dashboard',    icon: Home },
    { id: 'transactions', label: 'Transactions', path: '/transactions', icon: CreditCard },
    { id: 'customers',    label: 'Customers',    path: '/customers',    icon: Users },
    { id: 'configuration',label: 'Configuration',path: '/configuration',icon: Settings },
    { id: 'reports',      label: 'Reports',      path: '/reports',      icon: FileText },
    { id: 'system-admin', label: 'System Admin', path: '/system-admin', icon: Server },
  ];

  // ── Close user menu on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard shortcut Ctrl/Cmd + K ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Debounced global search ──────────────────────────────────────────
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
          `${API}/api/search?q=${encodeURIComponent(searchQuery.trim())}`
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

  // Reset search when modal closes
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults({ transactions: [], customers: [] });
  };

  // ── Unread count polling (every 15 s) ────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // silently ignore — network blip
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ── Fetch notification list ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/notifications`);
      if (res.ok) setNotifications(await res.json());
    } catch { /* ignore */ }
  }, []);

  // ── Open bell: fetch list + mark all read ───────────────────────────
  const handleBellClick = async () => {
    setNotificationsOpen(true);
    await fetchNotifications();
    if (unreadCount > 0) {
      try {
        await fetch(`${API}/api/notifications/mark-all-read`, { method: 'POST' });
        setUnreadCount(0);
      } catch { /* ignore */ }
    }
  };

  const isActive = (path) => location.pathname === path;

  // ── Helpers ──────────────────────────────────────────────────────────
  const hasResults =
    searchResults.transactions.length > 0 || searchResults.customers.length > 0;

  return (
    <>
      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="bg-white dark:bg-slate-800/90 dark:border-slate-700 shadow-sm border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md transition-colors duration-300">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-3 cursor-pointer hover:opacity-75 transition-opacity"
            >
              <div className="w-8 h-8 bg-blue-600 dark:bg-amber-500 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-white dark:text-slate-900" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sentinel</h1>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => navigate(nav.path)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(nav.path)
                        ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-amber-400'
                        : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center space-x-3">
              {/* Search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                <Search size={16} className="text-gray-500 dark:text-slate-400" />
                <span className="text-gray-600 dark:text-slate-300 text-sm hidden sm:block">Search…</span>
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs font-sans bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400">
                  ⌘K
                </kbd>
              </button>

              {/* Bell */}
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Notifications"
              >
                <Bell size={20} className="text-gray-500 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 dark:bg-amber-500 rounded-full flex items-center justify-center text-white dark:text-slate-900 text-[10px] font-bold px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User avatar */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 dark:bg-slate-700 rounded-full flex items-center justify-center border border-transparent dark:border-slate-600 overflow-hidden">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-amber-400 font-semibold text-sm uppercase">
                        {user?.full_name ? user.full_name.charAt(0) : (user?.username ? user.username.charAt(0) : 'U')}
                      </span>
                    )}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg dark:shadow-slate-900/50 border border-gray-200 dark:border-slate-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <Settings size={15} /><span>Profile Settings</span>
                    </button>
                    <button
                      onClick={() => { handleBellClick(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <Bell size={15} /><span>Notifications</span>
                    </button>
                    <button
                      onClick={() => { navigate('/help'); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <HelpCircle size={15} /><span>Help & Support</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-slate-700 my-1" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center space-x-2"
                    >
                      <LogOut size={15} /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="px-6 py-2 space-y-1">
              {navItems.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => { navigate(nav.path); setMobileMenuOpen(false); }}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(nav.path)
                        ? 'bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-amber-400'
                        : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={18} /><span>{nav.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════ GLOBAL SEARCH OVERLAY ═══════════════ */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 transition-opacity"
          onClick={closeSearch}
        />
      )}
      {searchOpen && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl dark:shadow-slate-900/80 z-50 overflow-hidden border border-gray-200 dark:border-slate-700">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <Search size={18} className="text-gray-400 dark:text-amber-500 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions, customers…"
              autoFocus
              className="flex-1 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none bg-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[24rem] overflow-y-auto">
            {searchQuery.trim().length < 2 ? (
              <p className="text-xs text-gray-400 text-center py-8">
                Type at least 2 characters to search…
              </p>
            ) : searchLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Searching…
              </div>
            ) : !hasResults ? (
              <p className="text-xs text-gray-400 text-center py-8">
                No results found for "{searchQuery}"
              </p>
            ) : (
              <div className="p-3 space-y-4">
                {/* Transactions */}
                {searchResults.transactions.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                      Transactions
                    </p>
                    <div className="space-y-0.5">
                      {searchResults.transactions.map((txn) => (
                        <button
                          key={txn.id}
                          onClick={() => { closeSearch(); navigate('/transactions'); }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              #{txn.id} — {txn.merchant}
                            </p>
                            <p className="text-xs text-gray-400">
                              {txn.customer_name} · ${txn.amount.toLocaleString()}
                            </p>
                          </div>
                          <StatusBadge status={txn.status} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customers */}
                {searchResults.customers.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                      Customers
                    </p>
                    <div className="space-y-0.5">
                      {searchResults.customers.map((cust) => (
                        <button
                          key={cust.id}
                          onClick={() => { closeSearch(); navigate('/customers'); }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 flex items-center justify-between group transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cust.full_name}</p>
                            <p className="text-xs text-gray-400">
                              {cust.email} · {cust.card_type} ····{cust.card_last_four}
                            </p>
                          </div>
                          {cust.is_frozen && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                              Frozen
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-400 dark:text-slate-500 flex justify-between">
            <span>↵ to select</span>
            <span>ESC to close</span>
          </div>
        </div>
      )}

      {/* ═══════════════ NOTIFICATIONS DRAWER ═══════════════ */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setNotificationsOpen(false)}
        />
      )}
      {notificationsOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-slate-800 shadow-2xl dark:shadow-slate-900 border-l border-gray-200 dark:border-slate-700 z-50 flex flex-col">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">AI engine alerts</p>
            </div>
            <button
              onClick={() => setNotificationsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500">
                <Bell size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No notifications yet.</p>
                <p className="text-xs mt-1 text-gray-300 dark:text-slate-600">Alerts appear here when fraud is detected.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border-l-4 ${
                    severityBorder[n.severity] || 'border-blue-400'
                  } ${!n.is_read ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
                >
                  {severityIcon[n.severity] || <Info size={15} className="text-blue-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!n.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 break-words">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
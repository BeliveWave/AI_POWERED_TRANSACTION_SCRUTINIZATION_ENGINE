import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Bell, LogOut, Settings, HelpCircle, Shield, Menu, X,
  Home, CreditCard, Users, FileText, Server
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

const TopNav = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: Home },
    { id: 'transactions', label: 'Transactions', path: '/transactions', icon: CreditCard },
    { id: 'customers', label: 'Customers', path: '/customers', icon: Users },
    { id: 'configuration', label: 'Configuration', path: '/configuration', icon: Settings },
    { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
    { id: 'system-admin', label: 'System Admin', path: '/system-admin', icon: Server },
  ];

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        {/* Main Header */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Sentinel</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              {navItems.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => navigate(nav.path)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(nav.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSearchOpen(true)} 
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Search size={18} className="text-gray-500" />
                <span className="text-gray-600 text-sm hidden sm:block">Search...</span>
                <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-sans bg-white border border-gray-300 rounded text-gray-500">
                  ⌘K
                </kbd>
              </button>

              <button 
                onClick={() => setNotificationsOpen(true)} 
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell size={20} className="text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)} 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{user?.avatar}</span>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button 
                      onClick={() => { navigate('/profile'); setUserMenuOpen(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Settings size={16} />
                      <span>Profile Settings</span>
                    </button>
                    <button 
                      onClick={() => { setNotificationsOpen(true); setUserMenuOpen(false); }} 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Bell size={16} />
                      <span>Notifications</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                      <HelpCircle size={16} />
                      <span>Help & Support</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu button - only show on small screens */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-6 py-2 space-y-1">
              {navItems.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.id}
                    onClick={() => { navigate(nav.path); setMobileMenuOpen(false); }}
                    className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(nav.path)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{nav.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Global Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSearchOpen(false)} />
      )}
      {searchOpen && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions, customers, reports..."
                autoFocus
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Transactions</p>
              <div className="space-y-2">
                {[
                  { id: 'TXN-001', merchant: 'Amazon', amount: '$2,450.00' },
                  { id: 'TXN-002', merchant: 'Spotify', amount: '$89.99' },
                ].map((txn) => (
                  <div 
                    key={txn.id}
                    onClick={() => { setSearchOpen(false); navigate('/transactions'); }}
                    className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900">{txn.id}</p>
                    <p className="text-xs text-gray-500">{txn.merchant} • {txn.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-3 border-t border-gray-200 text-xs text-gray-500">
            Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300">ESC</kbd> to close
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setNotificationsOpen(false)} />
      )}
      {notificationsOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            <button onClick={() => setNotificationsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            {[
              { type: 'alert', title: 'High Fraud Detected', message: 'Transaction TXN-001 flagged as fraud', time: '2 min ago' },
              { type: 'approval', title: 'Review Required', message: 'Transaction TXN-003 needs manual review', time: '12 min ago' },
              { type: 'system', title: 'Model Retrain Complete', message: 'Model v2.1.3 retrained successfully', time: '1 hour ago' },
            ].map((notif, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="font-medium text-gray-900">{notif.title}</p>
                <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-500 mt-2">{notif.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default TopNav;
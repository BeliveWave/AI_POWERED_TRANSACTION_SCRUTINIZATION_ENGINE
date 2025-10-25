import React, { useState } from 'react';
import { Search, Bell, LogOut, Settings, HelpCircle, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Sentinel</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <Search size={18} className="text-gray-500" />
              <span className="text-gray-600 text-sm">Search...</span>
            </button>

            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell size={20} className="text-gray-500" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
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
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                    <Settings size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
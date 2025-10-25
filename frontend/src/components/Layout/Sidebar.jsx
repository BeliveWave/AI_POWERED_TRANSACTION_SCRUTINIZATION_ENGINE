import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Users,
  Settings,
  FileText,
  Server,
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, path: '/transactions' },
    { id: 'customers', label: 'Customers', icon: Users, path: '/customers' },
    { id: 'configuration', label: 'Configuration', icon: Settings, path: '/configuration' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'system-admin', label: 'System Admin', icon: Server, path: '/system-admin' },
  ];

  if (!open) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
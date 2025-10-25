import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import Dashboard from '../../pages/Dashboard.jsx';
import Transactions from '../../pages/Transactions.jsx';
import Customers from '../../pages/Customers.jsx';
import Configuration from '../../pages/Configuration.jsx';
import Reports from '../../pages/Reports.jsx';
import SystemAdmin from '../../pages/SystemAdmin.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/system-admin" element={<SystemAdmin />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Layout;
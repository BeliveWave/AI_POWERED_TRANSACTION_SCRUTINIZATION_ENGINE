import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Customers from "./pages/Customers.jsx";
import Configuration from "./pages/Configuration.jsx";
import Reports from "./pages/Reports.jsx";
import SystemAdmin from "./pages/SystemAdmin.jsx";
import Login from "./pages/Login.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import TopNav from "./components/Layout/TopNav.jsx";

const AppContent = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="p-6">
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
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Customers from "./pages/Customers.jsx";
import Configuration from "./pages/Configuration.jsx";
import Reports from "./pages/Reports.jsx";
import SystemAdmin from "./pages/SystemAdmin.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import TopNav from "./components/Layout/TopNav.jsx";
import SessionTimeout from "./components/Common/SessionTimeout.jsx";

const AppContent = () => {
  const { isLoggedIn, logout } = useAuth();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <>
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
            <Route path="/profile" element={<ProfileSettings />} />
          </Routes>
        </main>
      </div>
      <SessionTimeout isLoggedIn={isLoggedIn} onLogout={logout} />
    </>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
};

export default App;
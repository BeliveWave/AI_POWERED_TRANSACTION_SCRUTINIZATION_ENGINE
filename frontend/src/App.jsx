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
import Help from "./pages/Help.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import TopNav from "./components/Layout/TopNav.jsx";
import SessionTimeout from "./components/Common/SessionTimeout.jsx";
import { ThemeProvider, useTheme } from "./hooks/useTheme.jsx";

const AppContent = () => {
  const { isLoggedIn, logout } = useAuth();
  const { theme } = useTheme();

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] transition-colors duration-300">
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
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
      <SessionTimeout isLoggedIn={isLoggedIn} onLogout={logout} />
      <ToastContainer position="top-right" autoClose={3000} theme={theme === 'dark' ? 'dark' : 'colored'} />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
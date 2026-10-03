import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transactions.jsx";
import Customers from "./pages/Customers.jsx";
import Configuration from "./pages/Configuration.jsx";
import Reports from "./pages/Reports.jsx";
import SystemAdmin from "./pages/SystemAdmin.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";
import Help from "./pages/Help.jsx";
import Login from "./pages/Login.jsx";
import Investigator from "./pages/Investigator.jsx";
import Register from "./pages/Register.jsx";
import Landing from "./pages/Landing.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import CheckoutPage from "./simulator/CheckoutPage.jsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import AppLayout from "./components/Layout/AppLayout.jsx";
import SessionTimeout from "./components/Common/SessionTimeout.jsx";
import { ThemeProvider } from "./hooks/useTheme.jsx";
import { Toaster } from "./components/ui/toaster.jsx";

const AppContent = () => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  // 1. Standalone Customer Checkout / Demo page — completely independent of the admin console
  const isSimulator = location.pathname.startsWith('/demo') || location.pathname.startsWith('/checkout');
  if (isSimulator) {
    return (
      <>
        <Routes>
          <Route path="/demo" element={<CheckoutPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="*" element={<CheckoutPage />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  // 2. Authentication Recovery & Public Security Pages (always accessible)
  if (['/reset-password', '/forgot-password'].includes(location.pathname)) {
    return (
      <>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  // 3. Unauthenticated Institutional Portal
  if (!isLoggedIn) {
    return (
      <>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Landing />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  // 4. Authenticated Analyst Dashboard
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/investigator" element={<Investigator />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/system-admin" element={<SystemAdmin />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </AppLayout>
      <SessionTimeout />
      <Toaster />
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
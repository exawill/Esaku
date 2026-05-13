import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RequireAuth } from '@/components/RequireAuth';
import AppShell from '@/components/AppShell';

import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import GenerateQrisPage from '@/pages/GenerateQrisPage';
import WithdrawalPage from '@/pages/WithdrawalPage';
import TransactionsPage from '@/pages/TransactionsPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import LandingPage from '@/pages/LandingPage';
import DemoPage from '@/pages/DemoPage';

function ProtectedLayout({ children, adminOnly = false }) {
  return (
    <RequireAuth adminOnly={adminOnly}>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
          <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/generate-qris" element={<ProtectedLayout><GenerateQrisPage /></ProtectedLayout>} />
          <Route path="/withdrawal" element={<ProtectedLayout><WithdrawalPage /></ProtectedLayout>} />
          <Route path="/transactions" element={<ProtectedLayout><TransactionsPage /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />

          {/* Admin only */}
          <Route path="/admin" element={<ProtectedLayout adminOnly><AdminPage /></ProtectedLayout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

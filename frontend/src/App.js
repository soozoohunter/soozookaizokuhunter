// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { AuthProvider } from './AuthContext';

// --- Layouts ---
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

// --- Pages ---
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import BlogPostPage from './pages/BlogPostPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import FileDetailPage from './pages/FileDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotFoundPage from './pages/NotFoundPage';

// --- Components ---
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './ErrorBoundary';

// --- Styles ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Manrope', 'Roboto', sans-serif;
    font-weight: 400;
    color: #0A0101;
    background-color: #fff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalStyle />
        <ErrorBoundary>
          <Routes>
            {/* ===== 1. Public-Facing Routes (New Design) ===== */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blog/:postId" element={<BlogPostPage />} />
              {/* Placeholder routes for new nav links */}
              <Route path="/solutions" element={<HomePage />} />
              <Route path="/resources" element={<HomePage />} />
              <Route path="/about" element={<HomePage />} />
            </Route>

            {/* ===== 2. Standalone Auth Routes (No Layout) ===== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* ===== 3. Protected User & Admin Routes (App Design) ===== */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/file/:fileId" element={<FileDetailPage />} />
                <Route path="/protect/step1" element={<ProtectStep1 />} />
                <Route path="/protect/step2" element={<ProtectStep2 />} />
                <Route path="/protect/step3" element={<ProtectStep3 />} />
                <Route path="/protect/step4" element={<ProtectStep4 />} />
              </Route>
            </Route>

            {/* ===== 4. Protected ADMIN-ONLY Routes (App Design) ===== */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AppLayout />}>
                <Route path="/settings/api-keys" element={<SettingsPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
            </Route>

            {/* ===== 5. Fallback Route for Not Found Pages ===== */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

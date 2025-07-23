import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { AuthProvider } from './AuthContext';
import { theme } from './theme';

import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout'; // 確保您已建立此檔案

import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import FreeTrialLandingPage from './pages/FreeTrialLandingPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PaymentPage from './pages/PaymentPage';
import ResolutionPage from './pages/ResolutionPage';
import DashboardPage from './pages/DashboardPage';
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PaymentApprovalPage from './pages/PaymentApprovalPage';
import NotFoundPage from './pages/NotFoundPage';

import ErrorBoundary from './ErrorBoundary';

const GlobalStyle = createGlobalStyle`/* ... Global Styles ... */`;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ErrorBoundary>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/resolve/:uniqueCaseId" element={<ResolutionPage />} />
                <Route path="/free-trial" element={<FreeTrialLandingPage />} />
                <Route path="/protect/step1" element={<ProtectStep1 />} />
                <Route path="/protect/step2" element={<ProtectStep2 />} />
                <Route path="/protect/step3" element={<ProtectStep3 />} />
                <Route path="/protect/step4" element={<ProtectStep4 />} />
              </Route>

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  {/* ... 其他需要登入的會員路由 ... */}
              </Route>
              
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/payments" element={<PaymentApprovalPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

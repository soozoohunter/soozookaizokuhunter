import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { AuthProvider } from './AuthContext';
import { theme } from './theme';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
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
import SettingsPage from './pages/SettingsPage';
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import FileDetailPage from './pages/FileDetailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PaymentApprovalPage from './pages/PaymentApprovalPage';
import AiDetectionPage from './pages/solutions/AiDetectionPage';
import BlockchainPage from './pages/solutions/BlockchainPage';
import DmcaPage from './pages/solutions/DmcaPage';
// 新增三大功能詳情頁面
import BlockchainDeedPage from './pages/solutions/BlockchainDeedPage';
import AiSentinelPage from './pages/solutions/AiSentinelPage';
import P2pEnginePage from './pages/solutions/P2pEnginePage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './ErrorBoundary';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.main};
    font-weight: 400;
    color: ${({ theme }) => theme.colors.light.text};
    background-color: ${({ theme }) => theme.colors.light.background};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  *, *::before, *::after { box-sizing: border-box; }
  a { text-decoration: none; color: inherit; }
`;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ErrorBoundary>
            <Routes>
              {/* --- 公開路由 --- */}
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
                <Route path="/solutions/ai-detection" element={<AiDetectionPage />} />
                <Route path="/solutions/blockchain" element={<BlockchainPage />} />
                <Route path="/solutions/dmca-takedown" element={<DmcaPage />} />
                {/* 新增三大功能詳情頁路由 */}
                <Route path="/solutions/blockchain-deed" element={<BlockchainDeedPage />} />
                <Route path="/solutions/ai-sentinel" element={<AiSentinelPage />} />
                <Route path="/solutions/p2p-engine" element={<P2pEnginePage />} />
              </Route>

              {/* --- 獨立登入/註冊路由 --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* --- 會員路由 (受登入保護) --- */}
              <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/file/:fileId" element={<FileDetailPage />} />
                  <Route path="/settings/api-keys" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* --- 管理員路由 (僅限 admin 角色) --- */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/payments" element={<PaymentApprovalPage />} />
                </Route>
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

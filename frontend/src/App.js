import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { AuthProvider, AuthContext } from './AuthContext';
import { theme } from './theme';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// --- 所有頁面組件導入 ---
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
import FileDetailPage from './pages/FileDetailPage'; // 確保此頁面存在
import SettingsPage from './pages/SettingsPage';   // 確保此頁面存在
import ProtectStep1 from './pages/ProtectStep1';
import ProtectStep2 from './pages/ProtectStep2';
import ProtectStep3 from './pages/ProtectStep3';
import ProtectStep4 from './pages/ProtectStep4';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import PaymentApprovalPage from './pages/PaymentApprovalPage';
import AiDetectionPage from './pages/solutions/AiDetectionPage'; // 確保此頁面存在
import BlockchainPage from './pages/solutions/BlockchainPage'; // 確保此頁面存在
import DmcaPage from './pages/solutions/DmcaPage';       // 確保此頁面存在
import NotFoundPage from './pages/NotFoundPage';

import ErrorBoundary from './ErrorBoundary';

const GlobalStyle = createGlobalStyle`
  body { margin: 0; font-family: ${({ theme }) => theme.fonts.main}; /* ... */ }
  *, *::before, *::after { box-sizing: border-box; }
  a { text-decoration: none; color: inherit; }
`;

// ★★★ 建立一個統一的會員保護路由 ★★★
const ProtectedMemberRoutes = () => {
    const { user, isLoading } = useContext(AuthContext);
    const location = useLocation();

    if (isLoading) {
        return <div>載入中...</div>; // 或是一個載入動畫
    }

    // 如果未登入，導向登入頁面，並記錄從哪個頁面來的
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 如果已登入，則顯示對應的會員頁面
    return <AppLayout><Outlet /></AppLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ErrorBoundary>
            <Routes>
              {/* --- 區域一：公開路由 (任何人皆可訪問) --- */}
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
              </Route>

              {/* --- 區域二：獨立的登入/註冊路由 --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* --- 區域三：會員路由 (需要登入，包含 user 和 admin 角色) --- */}
              <Route element={<ProtectedMemberRoutes />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/file/:fileId" element={<FileDetailPage />} />
                <Route path="/settings/api-keys" element={<SettingsPage />} />
                {/* 未來所有會員功能頁面都放在這裡 */}
              </Route>
              
              {/* --- 區域四：管理員路由 (僅限 admin 角色) --- */}
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/payments" element={<PaymentApprovalPage />} />
                {/* 未來所有管理員功能頁面都放在這裡 */}
              </Route>

              {/* --- 區域五：404 頁面 --- */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

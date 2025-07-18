import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import { AuthProvider } from './AuthContext';
import { theme } from './theme';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AppLayout from './layouts/AppLayout';

// Pages
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
  *, *::before, *::after {
    box-sizing: border-box;
  }
  a {
    text-decoration: none;
    color: inherit;
  }
`;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <ErrorBoundary>
            <Routes>
              {/* ===== 1. 公開頁面 & 核心體驗流程 (亮色主題) ===== */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog/post-1" element={<BlogPostPage />} />
                {/* [★★ 關鍵修正 ★★] 保護流程改為公開可訪問 */}
                <Route path="/protect/step1" element={<ProtectStep1 />} />
                <Route path="/protect/step2" element={<ProtectStep2 />} />
                <Route path="/protect/step3" element={<ProtectStep3 />} />
                <Route path="/protect/step4" element={<ProtectStep4 />} />
              </Route>

              {/* ===== 2. 獨立驗證頁面 (暗色主題) ===== */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* ===== 3. 受保護的使用者後台 (暗色主題) ===== */}
              <Route element={<ProtectedRoute allowedRoles={['user', 'admin']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/file/:fileId" element={<FileDetailPage />} />
                  <Route path="/settings/api-keys" element={<SettingsPage />} />
                </Route>
              </Route>
              
              {/* ===== 4. 受保護的管理員後台 (暗色主題) ===== */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>

              {/* ===== 5. 404 頁面 ===== */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

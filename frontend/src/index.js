// frontend/src/index.js (修正版)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './AuthContext';
import './index.css';
import './App.css';

// 註：您原有的 installXhrOpenValidation() 已被移除，因为它可能是為特定環境的臨時解決方案，
// 在標準的 React 開發中通常不需要。如果您的專案有特殊需求，可以將其加回。

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 確保整個 App 都被 AuthProvider 包裹，且只渲染一次 */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

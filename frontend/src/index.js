import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/index.js'; // 初始化多語系

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

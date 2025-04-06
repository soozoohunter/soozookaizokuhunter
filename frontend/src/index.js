import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 建立 React root，並將 App 元件渲染到 id="root" 的 DOM 元素上
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

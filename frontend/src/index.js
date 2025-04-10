import React from 'react';
import ReactDOM from 'react-dom/client';
import MyRoutes from './MyRoutes';
import './index.css'; // 若有全域CSS，可引用；沒有可省略

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MyRoutes />
  </React.StrictMode>
);

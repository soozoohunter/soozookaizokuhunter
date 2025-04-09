// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 匯入您剛剛修正的路由組態
import MyRoutes from './MyRoutes';

// 全域樣式 (若有)
import './index.css';
import './App.css';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <MyRoutes />
  </BrowserRouter>
);

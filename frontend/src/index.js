// frontend/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// 引入我們的路由設定檔
import MyRoutes from './MyRoutes';

import './index.css';
import './App.css';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <MyRoutes />
  </BrowserRouter>
);

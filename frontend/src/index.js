// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import MyRoutes from './MyRoutes';   // <-- 引入路由配置
import './index.css';               // 全域樣式 (若有)

const root = createRoot(document.getElementById('root'));
root.render(<MyRoutes />);

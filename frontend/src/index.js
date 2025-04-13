// frontend/src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import MyRoutes from './MyRoutes';
import './index.css'; // 若有自訂 CSS

// 取得掛載點
const rootElement = document.getElementById('root');

// 建立 React Root 並渲染
const root = createRoot(rootElement);
root.render(<MyRoutes />);

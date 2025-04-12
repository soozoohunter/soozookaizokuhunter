import React from 'react';
import { createRoot } from 'react-dom/client';
import MyRoutes from './MyRoutes';
import './index.css'; // 若有自訂CSS

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<MyRoutes />);

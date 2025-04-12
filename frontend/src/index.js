import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // 若有自訂CSS
import MyRoutes from './MyRoutes';

const root = createRoot(document.getElementById('root'));
root.render(<MyRoutes />);

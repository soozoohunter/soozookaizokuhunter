import React from 'react';
import { createRoot } from 'react-dom/client';
import MyRoutes from './MyRoutes';
import './index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(<MyRoutes />);

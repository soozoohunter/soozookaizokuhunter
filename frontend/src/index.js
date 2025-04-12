import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // 若您有自訂CSS
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

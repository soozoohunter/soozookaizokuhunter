import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';  // 匯入您在同層級（src/）或對應路徑下的 CSS 檔

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

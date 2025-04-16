// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import MyRoutes from './MyRoutes';  // or './routes/MyRoutes' if that’s your real path

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <MyRoutes />
);

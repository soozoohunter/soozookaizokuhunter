import React from 'react';
import ReactDOM from 'react-dom/client';
- import { BrowserRouter } from 'react-router-dom';
- import App from './App';
+ import MyRoutes from './MyRoutes';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
-  <BrowserRouter>
-    <App />
-  </BrowserRouter>
+  // 原本的程式碼註解保留
+  /*
+  <BrowserRouter>
+    <App />
+  </BrowserRouter>
+  */

+  <MyRoutes />
);

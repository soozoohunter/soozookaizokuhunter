import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installXhrOpenValidation } from './setupXhrValidation';

// Install global validation for XMLHttpRequest.open calls.
installXhrOpenValidation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

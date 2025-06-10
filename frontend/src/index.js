import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { installXhrOpenValidation } from './setupXhrValidation';

// Ensure any XHR usage in our app only targets well-formed URLs
// to avoid jsdom errors like "The string did not match the expected pattern".
installXhrOpenValidation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    window.memoryNewUserPass = '';
    <App />
  </React.StrictMode>

  
);
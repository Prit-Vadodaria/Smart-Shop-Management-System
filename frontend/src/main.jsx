import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './shared/context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { RealtimeProvider } from './shared/realtime/RealtimeProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

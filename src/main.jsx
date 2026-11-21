import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BankingProvider } from './context/BankingContext.jsx';
import { MessagingProvider } from './context/MessagingContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BankingProvider>
        <MessagingProvider>
          <App />
        </MessagingProvider>
      </BankingProvider>
    </AuthProvider>
  </StrictMode>
);

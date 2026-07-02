import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './stores/authStore';
import { getAccessToken } from './services/api-client';

function AppInit() {
  const { loadUser, isLoading, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (getAccessToken() && !isAuthenticated && isLoading) {
      loadUser();
    }
  }, []);

  return <App />;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppInit />
    </ErrorBoundary>
  </React.StrictMode>
);

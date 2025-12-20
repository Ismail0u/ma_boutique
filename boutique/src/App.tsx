/**
 * App.tsx - Point d'entrée principal
 * Configuration du router, routes et PWA
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePWA, useServiceWorker } from './hooks/usePWA';
import { InstallPrompt, UpdatePrompt, OfflineIndicator } from './components/IntallPrompt';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Fournisseurs } from './pages/Fournisseurs';
import { PartnerDetailPage } from './pages/PartnerDetailPage';
import { Transactions } from './pages/Transactions';
import { NewTransaction } from './pages/NewTransaction';
import { Payments } from './pages/Payments';

function App() {
  const { isInstallable, isOffline, promptInstall, cancelInstall } = usePWA();
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorker();
  
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Show install prompt after 30 seconds if installable
  useEffect(() => {
    if (isInstallable) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  // Show update prompt when available
  useEffect(() => {
    if (isUpdateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [isUpdateAvailable]);

  const handleInstall = async () => {
    await promptInstall();
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    cancelInstall();
  };

  const handleUpdate = () => {
    updateServiceWorker();
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Offline indicator */}
      {isOffline && <OfflineIndicator />}

      {/* Install prompt */}
      {showInstallPrompt && isInstallable && (
        <InstallPrompt
          onInstall={handleInstall}
          onDismiss={handleDismissInstall}
        />
      )}

      {/* Update prompt */}
      {showUpdatePrompt && (
        <UpdatePrompt
          onUpdate={handleUpdate}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}

      {/* Routes */}
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Clients */}
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<PartnerDetailPage />} />

        {/* Fournisseurs */}
        <Route path="/fournisseurs" element={<Fournisseurs />} />
        <Route path="/fournisseurs/:id" element={<PartnerDetailPage />} />

        {/* Transactions */}
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/new" element={<NewTransaction />} />
        <Route path="/transactions/:id" element={<NewTransaction />} />

        {/* Payments */}
        <Route path="/payments" element={<Payments />} />

        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
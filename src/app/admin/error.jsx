"use client";

import { AdminPageError } from '@/components/admin/AdminPageStatus';
import { useEffect, useState } from 'react';

export default function AdminError({ error, reset }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const syncConnection = () => setIsOffline(!navigator.onLine);
    syncConnection();
    window.addEventListener('online', syncConnection);
    window.addEventListener('offline', syncConnection);
    return () => {
      window.removeEventListener('online', syncConnection);
      window.removeEventListener('offline', syncConnection);
    };
  }, []);

  return (
    <AdminPageError
      message={isOffline
        ? 'You are offline. Reconnect to the internet, then retry loading this admin page.'
        : 'The admin page could not be loaded. Please try again.'}
      onRetry={reset}
    />
  );
}

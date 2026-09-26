"use client";

import { AdminPageError } from '@/components/admin/AdminPageStatus';

export default function AdminError({ error, reset }) {
  return (
    <AdminPageError
      message={error?.message || 'The admin page could not be opened.'}
      onRetry={reset}
    />
  );
}

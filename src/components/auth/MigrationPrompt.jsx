"use client";

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { migrationService } from '@/lib/supabase/services/migration.service';
import { supabase } from '@/lib/supabase/client';
import { flushReadingAttemptOutbox } from '@/lib/reading/reading-attempt-outbox.mjs';
import { collectLegacyAttempts, LEGACY_ATTEMPT_CONSENT_PREFIX, queueLegacyAttempts, rememberLegacyAttemptChoice } from '@/lib/reading/legacy-attempt-import.mjs';
import { OPEN_MIGRATION_PROMPT_EVENT } from '@/lib/reading/migration-prompt-events.mjs';

export default function MigrationPrompt() {
  const { user, hasLocalStorageData, migrateLocalStorage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [legacyAttempts, setLegacyAttempts] = useState({ importable: [], notImportable: 0 });
  const [attemptImportMessage, setAttemptImportMessage] = useState('');
  const [isImportingAttempts, setIsImportingAttempts] = useState(false);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    setLegacyAttempts(collectLegacyAttempts(window.localStorage));
  }, [user?.id]);

  const handleShowPrompt = useCallback(() => {
    const data = migrationService.extractLocalStorageData();
    setMigrationSummary(migrationService.getMigrationSummary(data));
    setIsDismissed(false);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener(OPEN_MIGRATION_PROMPT_EVENT, handleShowPrompt);
    return () => window.removeEventListener(OPEN_MIGRATION_PROMPT_EVENT, handleShowPrompt);
  }, [handleShowPrompt]);

  if (!user || !hasLocalStorageData || isDismissed) {
    return null;
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const data = migrationService.extractLocalStorageData();
      const result = await migrateLocalStorage();
      if (result?.success) {
        setIsOpen(false);
      } else {
        setMigrationMessage(`Imported supported data. Kept local data for: ${(result?.failedDatasets || []).join(', ') || 'items that could not be imported'}.`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationMessage('Import failed. Your local data was kept. Check your connection and try again.');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpen(false);
  };

  const handleAttemptConsent = async (consent) => {
    if (!user?.id || typeof window === 'undefined') return;
    if (!consent) {
      rememberLegacyAttemptChoice(window.localStorage, user.id, 'no');
      setAttemptImportMessage('No older attempts were imported. You can continue using your local data.');
      return;
    }
    setIsImportingAttempts(true);
    try {
      const current = collectLegacyAttempts(window.localStorage);
      const queued = queueLegacyAttempts(window.localStorage, user.id, current.importable);
      if (queued !== current.importable.length) throw new Error('Could not save every attempt to the local retry queue');
      rememberLegacyAttemptChoice(window.localStorage, user.id, 'yes');
      const result = await flushReadingAttemptOutbox(window.localStorage, user.id, supabase);
      setAttemptImportMessage(`${result.confirmed} of ${queued} older attempts are saved to your account.${current.notImportable ? ` ${current.notImportable} older records could not be imported because per-question details are missing or invalid.` : ''}${result.pending ? ' The rest remain queued and will retry when connected.' : ''}`);
    } catch {
      setAttemptImportMessage('The import could not reach the server. Your local attempts were kept and will retry when possible.');
    } finally {
      setIsImportingAttempts(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="z-50 mx-auto flex max-w-7xl justify-end px-4 py-2 sm:px-6">
        <button
          onClick={handleShowPrompt}
          className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <AlertTriangle size={18} />
          <span className="font-medium">Import Local Data</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="migration-title" className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Close data import"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <AlertTriangle className="text-brand-400" size={24} />
            </div>
            <div>
              <h2 id="migration-title" className="text-xl font-bold text-slate-200">Import Local Data</h2>
              <p className="text-slate-400 text-sm">Sync your existing progress to the cloud</p>
            </div>
          </div>

          {migrationMessage && <p role="status" className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">{migrationMessage}</p>}

          {legacyAttempts.importable.length > 0 && user?.id && typeof window !== 'undefined' && !window.localStorage.getItem(`${LEGACY_ATTEMPT_CONSENT_PREFIX}${user.id}`) && (
            <section className="mb-4 rounded-lg border border-brand-400/20 bg-brand-400/5 p-4" aria-labelledby="legacy-attempt-import-title">
              <h3 id="legacy-attempt-import-title" className="font-semibold text-slate-100">Save older practice results?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{legacyAttempts.importable.length} older practice results will be saved to your account. Your answers and results will be available across your devices.</p>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => handleAttemptConsent(false)} disabled={isImportingAttempts} className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200">No thanks</button>
                <button type="button" onClick={() => handleAttemptConsent(true)} disabled={isImportingAttempts} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{isImportingAttempts ? 'Saving…' : 'Save older results'}</button>
              </div>
            </section>
          )}
          {attemptImportMessage && <p role="status" className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">{attemptImportMessage}</p>}

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
            <p className="text-slate-300 text-sm mb-2">
              We detected the following data in your browser:
            </p>
            <p className="text-brand-300 text-sm font-medium">
              {migrationSummary}
            </p>
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            <p className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <span>Your data will be securely uploaded to your cloud account</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <span>Data will be available across all your devices</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="text-emerald-400 shrink-0 mt-0.5" size={16} />
              <span>Local data will be removed after successful import</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            disabled={isMigrating}
            className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for Now
          </button>
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? 'Importing...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

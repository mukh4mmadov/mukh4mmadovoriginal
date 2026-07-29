"use client";

import { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { migrationService } from '@/lib/supabase/services/migration.service';

export default function MigrationPrompt() {
  const { user, hasLocalStorageData, migrateLocalStorage } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || !hasLocalStorageData || isDismissed) {
    return null;
  }

  const handleShowPrompt = () => {
    const data = migrationService.extractLocalStorageData();
    setMigrationSummary(migrationService.getMigrationSummary(data));
    setIsOpen(true);
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const data = migrationService.extractLocalStorageData();
      await migrateLocalStorage();
      setIsOpen(false);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
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
      <div className="bg-surface border border-white/10 rounded-2xl w-full max-w-md p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <AlertTriangle className="text-brand-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200">Import Local Data</h2>
              <p className="text-slate-400 text-sm">Sync your existing progress to the cloud</p>
            </div>
          </div>

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

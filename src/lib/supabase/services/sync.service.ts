import { supabase } from '../client';
import { authService } from '../auth';
import * as repositories from '../repositories';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
}

export class SyncService {
  private syncQueue: Array<() => Promise<void>> = [];
  private isSyncing = false;
  private isOnline = navigator.onLine;
  private lastSyncTime: Date | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.processSyncQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.syncQueue.length,
    };
  }

  /**
   * Add operation to sync queue
   */
  queueOperation(operation: () => Promise<void>) {
    this.syncQueue.push(operation);
    
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;

    try {
      while (this.syncQueue.length > 0 && this.isOnline) {
        const operation = this.syncQueue.shift();
        if (operation) {
          await operation();
        }
      }

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync reading progress
   */
  async syncReadingProgress(userId: string) {
    try {
      const localProgress = this.getLocalData('reading-progress');
      if (!localProgress) return;

      for (const progress of localProgress) {
        await repositories.readingProgressRepository.upsertProgress(
          userId,
          progress.passageId,
          {
            current_question_index: progress.currentQuestionIndex,
            answers: progress.answers,
            time_spent_seconds: progress.timeSpentSeconds,
            is_completed: progress.isCompleted,
          }
        );
      }

      this.removeLocalData('reading-progress');
    } catch (error) {
      console.error('Error syncing reading progress:', error);
      throw error;
    }
  }

  /**
   * Sync reading history
   */
  async syncReadingHistory(userId: string) {
    try {
      const localHistory = this.getLocalData('reading-history');
      if (!localHistory) return;

      const historyToInsert = localHistory.map((h: any) => ({
        user_id: userId,
        passage_id: h.passageId,
        score: h.score,
        band_score: h.bandScore,
        time_spent_seconds: h.timeSpentSeconds,
        completed_at: h.completedAt,
        question_breakdown: h.questionBreakdown,
      }));

      await repositories.readingHistoryRepository.batchCreateHistory(historyToInsert);
      this.removeLocalData('reading-history');
    } catch (error) {
      console.error('Error syncing reading history:', error);
      throw error;
    }
  }

  /**
   * Sync highlights
   */
  async syncHighlights(userId: string) {
    try {
      const localHighlights = this.getLocalData('highlights');
      if (!localHighlights) return;

      const highlightsToInsert = localHighlights.map((h: any) => ({
        user_id: userId,
        passage_id: h.passageId,
        text: h.text,
        start_index: h.startIndex,
        end_index: h.endIndex,
        color: h.color,
        note: h.note,
      }));

      await repositories.highlightsRepository.batchCreateHighlights(highlightsToInsert);
      this.removeLocalData('highlights');
    } catch (error) {
      console.error('Error syncing highlights:', error);
      throw error;
    }
  }

  /**
   * Sync AI conversations
   */
  async syncAIConversations(userId: string) {
    try {
      const localConversations = this.getLocalData('ai-conversations');
      if (!localConversations) return;

      for (const conversation of localConversations) {
        await repositories.aiConversationsRepository.createConversation({
          user_id: userId,
          title: conversation.title,
          messages: conversation.messages,
        });
      }

      this.removeLocalData('ai-conversations');
    } catch (error) {
      console.error('Error syncing AI conversations:', error);
      throw error;
    }
  }

  /**
   * Sync saved quotes
   */
  async syncSavedQuotes(userId: string) {
    try {
      const localQuotes = this.getLocalData('saved-quotes');
      if (!localQuotes) return;

      const quotesToInsert = localQuotes.map((q: any) => ({
        user_id: userId,
        quote_id: q.quoteId,
        quote: q.quote,
        author: q.author,
        role: q.role,
        category: q.category,
        reflection: q.reflection,
      }));

      await repositories.savedQuotesRepository.batchSaveQuotes(quotesToInsert);
      this.removeLocalData('saved-quotes');
    } catch (error) {
      console.error('Error syncing saved quotes:', error);
      throw error;
    }
  }

  /**
   * Sync daily missions
   */
  async syncDailyMissions(userId: string) {
    try {
      const localMissions = this.getLocalData('daily-missions');
      if (!localMissions) return;

      for (const mission of localMissions) {
        await repositories.dailyMissionsRepository.createDailyMissions({
          user_id: userId,
          date: mission.date,
          missions: mission.missions,
          completed_missions: mission.completedMissions,
        });
      }

      this.removeLocalData('daily-missions');
    } catch (error) {
      console.error('Error syncing daily missions:', error);
      throw error;
    }
  }

  /**
   * Full sync all data
   */
  async fullSync(userId: string) {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    this.isSyncing = true;

    try {
      await Promise.all([
        this.syncReadingProgress(userId),
        this.syncReadingHistory(userId),
        this.syncHighlights(userId),
        this.syncAIConversations(userId),
        this.syncSavedQuotes(userId),
        this.syncDailyMissions(userId),
      ]);

      this.lastSyncTime = new Date();
    } catch (error) {
      console.error('Full sync error:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get local data
   */
  private getLocalData(key: string): any[] | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = localStorage.getItem(`sync-${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Failed to read local sync data "sync-${key}":`, error);
      return null;
    }
  }

  /**
   * Remove local data
   */
  private removeLocalData(key: string) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`sync-${key}`);
    } catch (error) {
      console.warn(`Failed to remove local sync data "sync-${key}":`, error);
    }
  }

  /**
   * Save data locally for later sync
   */
  saveLocalData(key: string, data: any[]) {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`sync-${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to persist local sync data "sync-${key}":`, error);
    }
  }
}

export const syncService = new SyncService();

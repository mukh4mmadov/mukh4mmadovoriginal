import { authService } from '../auth';
import * as repositories from '../repositories';

export interface LocalStorageData {
  readingProgress?: any[];
  readingHistory?: any[];
  highlights?: any[];
  aiConversations?: any[];
  savedQuotes?: string[];
  dailyMissions?: { missions: any[]; completed: string[]; date?: string };
  xp?: { total: number; level: number };
  streak?: { current: number; longest: number; lastDate: string | null };
  settings?: { theme: string; language: string; notifications: boolean; reminderTime: string | null; autoSave: boolean; fontSize: number };
}

export interface MigrationResult {
  success: boolean;
  failedDatasets: string[];
  errors: Error[];
}

export class MigrationService {
  /**
   * Check if user has localStorage data
   */
  hasLocalStorageData(): boolean {
    if (typeof window === 'undefined') return false;

    const keys = [
      'reading-progress',
      'reading-history',
      'highlights',
      'ai-conversation',
      'saved-quote-ids',
      'daily-missions-completed',
      'user-xp',
      'user-streak',
      'user-settings',
    ];

    return keys.some(key => localStorage.getItem(key) !== null);
  }

  /**
    * Extract all localStorage data
    */
  extractLocalStorageData(): LocalStorageData {
    if (typeof window === 'undefined') return {};

    const data: LocalStorageData = {};

    // Reading progress
    const progress = localStorage.getItem('reading-progress');
    if (progress) {
      try {
        const parsed = JSON.parse(progress);
        if (Array.isArray(parsed)) {
          data.readingProgress = parsed;
        } else {
          console.error('Migration: "reading-progress" is not a valid array');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "reading-progress":', error);
      }
    }

    // Reading history
    const history = localStorage.getItem('reading-history');
    if (history) {
      try {
        const parsed = JSON.parse(history);
        if (Array.isArray(parsed)) {
          data.readingHistory = parsed;
        } else {
          console.error('Migration: "reading-history" is not a valid array');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "reading-history":', error);
      }
    }

    // Highlights
    const highlights = localStorage.getItem('highlights');
    if (highlights) {
      try {
        const parsed = JSON.parse(highlights);
        if (Array.isArray(parsed)) {
          data.highlights = parsed;
        } else {
          console.error('Migration: "highlights" is not a valid array');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "highlights":', error);
      }
    }

    // AI conversations
    const conversations = localStorage.getItem('ai-conversation');
    if (conversations) {
      try {
        const parsed = JSON.parse(conversations);
        if (Array.isArray(parsed)) {
          data.aiConversations = parsed;
        } else {
          console.error('Migration: "ai-conversation" is not a valid array');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "ai-conversation":', error);
      }
    }

    // Saved quotes
    const savedQuotes = localStorage.getItem('saved-quote-ids');
    if (savedQuotes) {
      try {
        const quoteIds = JSON.parse(savedQuotes);
        if (Array.isArray(quoteIds)) {
          data.savedQuotes = quoteIds;
        } else {
          console.error('Migration: "saved-quote-ids" is not a valid array');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "saved-quote-ids":', error);
      }
    }

    // Daily missions
    const missions = localStorage.getItem('daily-missions-completed');
    if (missions) {
      try {
        const parsed = JSON.parse(missions);
        if (parsed && typeof parsed === 'object') {
          data.dailyMissions = parsed;
        } else {
          console.error('Migration: "daily-missions-completed" is not a valid object');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "daily-missions-completed":', error);
      }
    }

    // XP
    const xp = localStorage.getItem('user-xp');
    if (xp) {
      try {
        const parsed = JSON.parse(xp);
        if (parsed && typeof parsed === 'object') {
          data.xp = parsed;
        } else {
          console.error('Migration: "user-xp" is not a valid object');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "user-xp":', error);
      }
    }

    // Streak
    const streak = localStorage.getItem('user-streak');
    if (streak) {
      try {
        const parsed = JSON.parse(streak);
        if (parsed && typeof parsed === 'object') {
          data.streak = parsed;
        } else {
          console.error('Migration: "user-streak" is not a valid object');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "user-streak":', error);
      }
    }

    // Settings
    const settings = localStorage.getItem('user-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        if (parsed && typeof parsed === 'object') {
          data.settings = parsed;
        } else {
          console.error('Migration: "user-settings" is not a valid object');
        }
      } catch (error) {
        console.error('Migration: Failed to parse "user-settings":', error);
      }
    }

    return data;
  }

  /**
    * Migrate localStorage data to Supabase
    */
  async migrateToSupabase(userId: string, data: LocalStorageData): Promise<MigrationResult> {
    const failedDatasets: string[] = [];
    const errors: Error[] = [];

    // Migrate reading progress
    if (data.readingProgress && data.readingProgress.length > 0) {
      try {
        for (const progress of data.readingProgress) {
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
      } catch (error) {
        console.error('Migration: Failed to migrate reading progress:', error);
        failedDatasets.push('readingProgress');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate reading history
    if (data.readingHistory && data.readingHistory.length > 0) {
      try {
        const historyToInsert = data.readingHistory.map((h: any) => ({
          user_id: userId,
          passage_id: h.passageId,
          score: h.score,
          band_score: h.bandScore,
          time_spent_seconds: h.timeSpentSeconds,
          completed_at: h.completedAt,
          question_breakdown: h.questionBreakdown,
        }));
        await repositories.readingHistoryRepository.batchCreateHistory(historyToInsert);
      } catch (error) {
        console.error('Migration: Failed to migrate reading history:', error);
        failedDatasets.push('readingHistory');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate highlights
    if (data.highlights && data.highlights.length > 0) {
      try {
        const highlightsToInsert = data.highlights.map((h: any) => ({
          user_id: userId,
          passage_id: h.passageId,
          text: h.text,
          start_index: h.startIndex,
          end_index: h.endIndex,
          color: h.color,
          note: h.note,
        }));
        await repositories.highlightsRepository.batchCreateHighlights(highlightsToInsert);
      } catch (error) {
        console.error('Migration: Failed to migrate highlights:', error);
        failedDatasets.push('highlights');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate AI conversations
    if (data.aiConversations && data.aiConversations.length > 0) {
      try {
        for (const conversation of data.aiConversations) {
          await repositories.aiConversationsRepository.createConversation({
            user_id: userId,
            title: conversation.title,
            messages: conversation.messages,
          });
        }
      } catch (error) {
        console.error('Migration: Failed to migrate AI conversations:', error);
        failedDatasets.push('aiConversations');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate saved quotes (would need to fetch actual quote data)
    if (data.savedQuotes && data.savedQuotes.length > 0) {
      // This would need to be implemented with actual quote data
      // For now, we'll skip this as it requires the quote database
    }

    // Migrate daily missions
    if (data.dailyMissions) {
      try {
        const today = new Date().toISOString().split('T')[0];
        await repositories.dailyMissionsRepository.createDailyMissions({
          user_id: userId,
          date: today,
          missions: data.dailyMissions.missions || [],
          completed_missions: data.dailyMissions.completed || [],
        });
      } catch (error) {
        console.error('Migration: Failed to migrate daily missions:', error);
        failedDatasets.push('dailyMissions');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate XP
    if (data.xp) {
      try {
        await repositories.xpRepository.createXP({
          user_id: userId,
          total_xp: data.xp.total || 0,
          level: data.xp.level || 1,
        });
      } catch (error) {
        console.error('Migration: Failed to migrate XP:', error);
        failedDatasets.push('xp');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate streak
    if (data.streak) {
      try {
        await repositories.streaksRepository.createStreak({
          user_id: userId,
          current_streak: data.streak.current || 0,
          longest_streak: data.streak.longest || 0,
          last_activity_date: data.streak.lastDate || null,
        });
      } catch (error) {
        console.error('Migration: Failed to migrate streak:', error);
        failedDatasets.push('streak');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Migrate settings
    if (data.settings) {
      try {
        await repositories.userSettingsRepository.createSettings({
          user_id: userId,
          theme: data.settings.theme || 'dark',
          language: data.settings.language || 'en',
          notifications_enabled: data.settings.notifications ?? true,
          daily_reminder_time: data.settings.reminderTime || null,
          auto_save_enabled: data.settings.autoSave ?? true,
          reading_font_size: data.settings.fontSize || 16,
        });
      } catch (error) {
        console.error('Migration: Failed to migrate settings:', error);
        failedDatasets.push('settings');
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    return {
      success: failedDatasets.length === 0,
      failedDatasets,
      errors,
    };
  }

  /**
   * Clear localStorage after successful migration
   */
  clearLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const keys = [
      'reading-progress',
      'reading-history',
      'highlights',
      'ai-conversation',
      'saved-quote-ids',
      'daily-missions-completed',
      'user-xp',
      'user-streak',
      'user-settings',
    ];

    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore errors
      }
    });
  }

  /**
   * Get migration summary
   */
  getMigrationSummary(data: LocalStorageData): string {
    const items: string[] = [];

    if (data.readingProgress && data.readingProgress.length > 0) {
      items.push(`${data.readingProgress.length} reading progress entries`);
    }
    if (data.readingHistory && data.readingHistory.length > 0) {
      items.push(`${data.readingHistory.length} reading history entries`);
    }
    if (data.highlights && data.highlights.length > 0) {
      items.push(`${data.highlights.length} highlights`);
    }
    if (data.aiConversations && data.aiConversations.length > 0) {
      items.push(`${data.aiConversations.length} AI conversations`);
    }
    if (data.savedQuotes && data.savedQuotes.length > 0) {
      items.push(`${data.savedQuotes.length} saved quotes`);
    }
    if (data.dailyMissions) {
      items.push('daily missions');
    }
    if (data.xp) {
      items.push('XP data');
    }
    if (data.streak) {
      items.push('streak data');
    }
    if (data.settings) {
      items.push('user settings');
    }

    return items.length > 0 ? items.join(', ') : 'No data to migrate';
  }
}

export const migrationService = new MigrationService();

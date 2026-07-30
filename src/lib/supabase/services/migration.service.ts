import { authService } from '../auth';
import * as repositories from '../repositories';
import { hasKey, readJSON, removeKey } from '@/lib/storage';
import { todayISODate } from '@/lib/date';

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

const LEGACY_KEYS = {
  readingProgress: 'reading-progress',
  readingHistory: 'reading-history',
  highlights: 'highlights',
  aiConversations: 'ai-conversation',
  savedQuotes: 'saved-quote-ids',
  dailyMissions: 'daily-missions-completed',
  xp: 'user-xp',
  streak: 'user-streak',
  settings: 'user-settings',
} as const;

export class MigrationService {
  /**
   * Check if user has localStorage data
   */
  hasLocalStorageData(): boolean {
    return Object.values(LEGACY_KEYS).some(hasKey);
  }

  /**
   * Extract all localStorage data
   */
  extractLocalStorageData(): LocalStorageData {
    const data: LocalStorageData = {};

    const readingProgress = readJSON<any[]>(LEGACY_KEYS.readingProgress);
    if (readingProgress) data.readingProgress = readingProgress;

    const readingHistory = readJSON<any[]>(LEGACY_KEYS.readingHistory);
    if (readingHistory) data.readingHistory = readingHistory;

    const highlights = readJSON<any[]>(LEGACY_KEYS.highlights);
    if (highlights) data.highlights = highlights;

    const aiConversations = readJSON<any[]>(LEGACY_KEYS.aiConversations);
    if (aiConversations) data.aiConversations = aiConversations;

    const savedQuotes = readJSON<string[]>(LEGACY_KEYS.savedQuotes);
    if (savedQuotes) data.savedQuotes = savedQuotes;

    const dailyMissions = readJSON<LocalStorageData['dailyMissions']>(LEGACY_KEYS.dailyMissions);
    if (dailyMissions) data.dailyMissions = dailyMissions;

    const xp = readJSON<LocalStorageData['xp']>(LEGACY_KEYS.xp);
    if (xp) data.xp = xp;

    const streak = readJSON<LocalStorageData['streak']>(LEGACY_KEYS.streak);
    if (streak) data.streak = streak;

    const settings = readJSON<LocalStorageData['settings']>(LEGACY_KEYS.settings);
    if (settings) data.settings = settings;

    return data;
  }

  /**
   * Migrate localStorage data to Supabase
   */
  async migrateToSupabase(userId: string, data: LocalStorageData): Promise<void> {
    try {
      // Migrate reading progress
      if (data.readingProgress && data.readingProgress.length > 0) {
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
      }

      // Migrate reading history
      if (data.readingHistory && data.readingHistory.length > 0) {
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
      }

      // Migrate highlights
      if (data.highlights && data.highlights.length > 0) {
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
      }

      // Migrate AI conversations
      if (data.aiConversations && data.aiConversations.length > 0) {
        for (const conversation of data.aiConversations) {
          await repositories.aiConversationsRepository.createConversation({
            user_id: userId,
            title: conversation.title,
            messages: conversation.messages,
          });
        }
      }

      // Migrate saved quotes (would need to fetch actual quote data)
      if (data.savedQuotes && data.savedQuotes.length > 0) {
        // This would need to be implemented with actual quote data
        // For now, we'll skip this as it requires the quote database
      }

      // Migrate daily missions
      if (data.dailyMissions) {
        const today = todayISODate();
        await repositories.dailyMissionsRepository.createDailyMissions({
          user_id: userId,
          date: today,
          missions: data.dailyMissions.missions || [],
          completed_missions: data.dailyMissions.completed || [],
        });
      }

      // Migrate XP
      if (data.xp) {
        await repositories.xpRepository.createXP({
          user_id: userId,
          total_xp: data.xp.total || 0,
          level: data.xp.level || 1,
        });
      }

      // Migrate streak
      if (data.streak) {
        await repositories.streaksRepository.createStreak({
          user_id: userId,
          current_streak: data.streak.current || 0,
          longest_streak: data.streak.longest || 0,
          last_activity_date: data.streak.lastDate || null,
        });
      }

      // Migrate settings
      if (data.settings) {
        await repositories.userSettingsRepository.createSettings({
          user_id: userId,
          theme: data.settings.theme || 'dark',
          language: data.settings.language || 'en',
          notifications_enabled: data.settings.notifications ?? true,
          daily_reminder_time: data.settings.reminderTime || null,
          auto_save_enabled: data.settings.autoSave ?? true,
          reading_font_size: data.settings.fontSize || 16,
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }

  /**
   * Clear localStorage after successful migration
   */
  clearLocalStorage(): void {
    Object.values(LEGACY_KEYS).forEach(removeKey);
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

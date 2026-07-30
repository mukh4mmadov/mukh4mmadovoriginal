import { supabase } from '../client';
import { requireRow, requireRows, rowExists } from '../queryHelpers';
import {
  Achievement,
  AchievementInsert,
} from '../models';

export class AchievementsRepository {
  /**
   * Get achievements for a user
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    return requireRows(
      supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
    );
  }

  /**
   * Check if user has an achievement
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    return rowExists(
      supabase
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single()
    );
  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(achievement: AchievementInsert): Promise<Achievement> {
    return requireRow(
      supabase
        .from('achievements')
        .insert(achievement)
        .select()
        .single()
    );
  }

  /**
   * Batch unlock achievements
   */
  async batchUnlockAchievements(achievements: AchievementInsert[]): Promise<Achievement[]> {
    return requireRows(
      supabase
        .from('achievements')
        .insert(achievements)
        .select()
    );
  }
}

export const achievementsRepository = new AchievementsRepository();

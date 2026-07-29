import { supabase } from '../client';
import {
  Achievement,
  AchievementInsert,
} from '../models';

export class AchievementsRepository {
  /**
   * Get achievements for a user
   */
  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check if user has an achievement
   */
  async hasAchievement(userId: string, achievementId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(achievement: AchievementInsert): Promise<Achievement> {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Batch unlock achievements
   */
  async batchUnlockAchievements(achievements: AchievementInsert[]): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievements)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const achievementsRepository = new AchievementsRepository();

import { supabase } from '../client';

export class AchievementsRepository {
  /**
   * Get achievements for a user
   */
  async getAchievements(userId) {
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
  async hasAchievement(userId, achievementId) {
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
  async unlockAchievement(achievement) {
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
  async batchUnlockAchievements(achievements) {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievements)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const achievementsRepository = new AchievementsRepository();

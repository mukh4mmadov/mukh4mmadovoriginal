import { supabase } from '../client';
import {
  Streak,
  StreakInsert,
  StreakUpdate,
} from '../models';

export class StreaksRepository {
  /**
   * Get streak for a user
   */
  async getStreak(userId: string): Promise<Streak | null> {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  /**
   * Create streak record
   */
  async createStreak(streak: StreakInsert): Promise<Streak> {
    const { data, error } = await supabase
      .from('streaks')
      .insert(streak)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, updates: StreakUpdate): Promise<Streak> {
    const { data, error } = await supabase
      .from('streaks')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Increment streak
   */
  async incrementStreak(userId: string): Promise<Streak> {
    const streak = await this.getStreak(userId);
    if (!streak) {
      return this.createStreak({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: new Date().toISOString().split('T')[0],
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = streak.last_activity_date ? new Date(streak.last_activity_date).toISOString().split('T')[0] : null;

    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;

    if (lastActivity === today) {
      // Already logged today, no change
      return streak;
    } else if (lastActivity === this.getYesterdayDate()) {
      // Consecutive day
      newCurrentStreak = streak.current_streak + 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else {
      // Streak broken or first activity
      newCurrentStreak = 1;
    }

    return this.updateStreak(userId, {
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today,
    });
  }

  /**
   * Reset streak
   */
  async resetStreak(userId: string): Promise<Streak> {
    return this.updateStreak(userId, {
      current_streak: 0,
      last_activity_date: null,
    });
  }

  private getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}

export const streaksRepository = new StreaksRepository();

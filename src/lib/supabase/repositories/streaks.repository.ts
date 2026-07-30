import { supabase } from '../client';
import { maybeRow, requireRow } from '../queryHelpers';
import { toISODate, todayISODate, yesterdayISODate } from '@/lib/date';
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
    return maybeRow(
      supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Create streak record
   */
  async createStreak(streak: StreakInsert): Promise<Streak> {
    return requireRow(
      supabase
        .from('streaks')
        .insert(streak)
        .select()
        .single()
    );
  }

  /**
   * Update streak
   */
  async updateStreak(userId: string, updates: StreakUpdate): Promise<Streak> {
    return requireRow(
      supabase
        .from('streaks')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
    );
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
        last_activity_date: todayISODate(),
      });
    }

    const today = todayISODate();
    const lastActivity = streak.last_activity_date ? toISODate(new Date(streak.last_activity_date)) : null;

    let newCurrentStreak = streak.current_streak;
    let newLongestStreak = streak.longest_streak;

    if (lastActivity === today) {
      // Already logged today, no change
      return streak;
    } else if (lastActivity === yesterdayISODate()) {
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
}

export const streaksRepository = new StreaksRepository();

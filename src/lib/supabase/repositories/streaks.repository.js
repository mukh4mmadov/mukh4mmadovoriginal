import { supabase } from '../client';
import {
  Streak,
  StreakInsert,
  StreakUpdate,
} from '../models';

export class StreaksRepository {
  async getStreak(userId) {
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

  async createStreak(streak) {
    const { data, error } = await supabase
      .from('streaks')
      .insert(streak)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStreak(userId, updates) {
    const { data, error } = await supabase
      .from('streaks')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async incrementStreak(userId) {
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
      return streak;
    } else if (lastActivity === this.#getYesterdayDate()) {
      newCurrentStreak = streak.current_streak + 1;
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }
    } else {
      newCurrentStreak = 1;
    }

    return this.updateStreak(userId, {
      current_streak: newCurrentStreak,
      longest_streak: newLongestStreak,
      last_activity_date: today,
    });
  }

  async resetStreak(userId) {
    return this.updateStreak(userId, {
      current_streak: 0,
      last_activity_date: null,
    });
  }

  #getYesterdayDate() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}

export const streaksRepository = new StreaksRepository();

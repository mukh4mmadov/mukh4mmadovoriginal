import { supabase } from '../client';
import {
  XP,
  XPInsert,
  XPUpdate,
} from '../models';

export class XPRepository {
  async getXP(userId) {
    const { data, error } = await supabase
      .from('xp')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async createXP(xp) {
    const { data, error } = await supabase
      .from('xp')
      .insert(xp)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateXP(userId, updates) {
    const { data, error } = await supabase
      .from('xp')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addXP(userId, amount) {
    const xp = await this.getXP(userId);
    if (!xp) {
      return this.createXP({
        user_id: userId,
        total_xp: amount,
        level: this.#calculateLevel(amount),
      });
    }

    const newTotalXP = xp.total_xp + amount;
    return this.updateXP(userId, {
      total_xp: newTotalXP,
      level: this.#calculateLevel(newTotalXP),
    });
  }

  #calculateLevel(totalXP) {
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  getXPForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
  }

  async getLevelProgress(userId) {
    const xp = await this.getXP(userId);
    if (!xp) {
      return { current: 0, needed: 100, percentage: 0 };
    }

    const currentLevel = xp.level;
    const currentLevelXP = this.getXPForLevel(currentLevel);
    const nextLevelXP = this.getXPForLevel(currentLevel + 1);
    const currentXP = xp.total_xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const percentage = (currentXP / neededXP) * 100;

    return {
      current: currentXP,
      needed: neededXP,
      percentage: Math.min(percentage, 100),
    };
  }
}

export const xpRepository = new XPRepository();

import { supabase } from '../client';
import {
  XP,
  XPInsert,
  XPUpdate,
} from '../models';

export class XPRepository {
  /**
   * Get XP for a user
   */
  async getXP(userId: string): Promise<XP | null> {
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

  /**
   * Create XP record
   */
  async createXP(xp: XPInsert): Promise<XP> {
    const { data, error } = await supabase
      .from('xp')
      .insert(xp)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update XP
   */
  async updateXP(userId: string, updates: XPUpdate): Promise<XP> {
    const { data, error } = await supabase
      .from('xp')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add XP to user
   */
  async addXP(userId: string, amount: number): Promise<XP> {
    const xp = await this.getXP(userId);
    if (!xp) {
      return this.createXP({
        user_id: userId,
        total_xp: amount,
        level: this.calculateLevel(amount),
      });
    }

    const newTotalXP = xp.total_xp + amount;
    return this.updateXP(userId, {
      total_xp: newTotalXP,
      level: this.calculateLevel(newTotalXP),
    });
  }

  /**
   * Calculate level from XP
   */
  private calculateLevel(totalXP: number): number {
    // Simple level formula: level = sqrt(xp / 100)
    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  }

  /**
   * Get XP needed for next level
   */
  getXPForLevel(level: number): number {
    return Math.pow(level - 1, 2) * 100;
  }

  /**
   * Get progress to next level
   */
  async getLevelProgress(userId: string): Promise<{ current: number; needed: number; percentage: number }> {
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

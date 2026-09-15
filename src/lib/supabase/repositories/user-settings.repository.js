import { supabase } from '../client';
import {
  UserSettings,
  UserSettingsInsert,
  UserSettingsUpdate,
} from '../models';

export class UserSettingsRepository {
  /**
   * Get user settings
   */
  async getSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
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
   * Create settings record
   */
  async createSettings(settings) {
    const { data, error } = await supabase
      .from('user_settings')
      .insert(settings)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update settings
   */
  async updateSettings(userId, updates) {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update specific setting
   */
  async updateSetting(
    userId,
    key,
    value
  ) {
    const updates = {};
    updates[key] = value;
    return this.updateSettings(userId, updates);
  }
}

export const userSettingsRepository = new UserSettingsRepository();

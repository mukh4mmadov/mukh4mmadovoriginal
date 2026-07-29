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
  async getSettings(userId: string): Promise<UserSettings | null> {
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
  async createSettings(settings: UserSettingsInsert): Promise<UserSettings> {
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
  async updateSettings(userId: string, updates: UserSettingsUpdate): Promise<UserSettings> {
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
  async updateSetting<K extends keyof UserSettingsUpdate>(
    userId: string,
    key: K,
    value: UserSettingsUpdate[K]
  ): Promise<UserSettings> {
    return this.updateSettings(userId, { [key]: value });
  }
}

export const userSettingsRepository = new UserSettingsRepository();

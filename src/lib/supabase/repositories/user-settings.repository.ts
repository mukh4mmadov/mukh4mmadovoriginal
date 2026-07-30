import { supabase } from '../client';
import { maybeRow, requireRow } from '../queryHelpers';
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
    return maybeRow(
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
    );
  }

  /**
   * Create settings record
   */
  async createSettings(settings: UserSettingsInsert): Promise<UserSettings> {
    return requireRow(
      supabase
        .from('user_settings')
        .insert(settings)
        .select()
        .single()
    );
  }

  /**
   * Update settings
   */
  async updateSettings(userId: string, updates: UserSettingsUpdate): Promise<UserSettings> {
    return requireRow(
      supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
    );
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

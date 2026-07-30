import { supabase } from '../client';
import { maybeRow, requireRow, requireRows } from '../queryHelpers';
import {
  DailyMission,
  DailyMissionInsert,
  DailyMissionUpdate,
} from '../models';

export class DailyMissionsRepository {
  /**
   * Get daily missions for a user and date
   */
  async getDailyMissions(userId: string, date: string): Promise<DailyMission | null> {
    return maybeRow(
      supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()
    );
  }

  /**
   * Create daily missions record
   */
  async createDailyMissions(missions: DailyMissionInsert): Promise<DailyMission> {
    return requireRow(
      supabase
        .from('daily_missions')
        .insert(missions)
        .select()
        .single()
    );
  }

  /**
   * Update daily missions
   */
  async updateDailyMissions(userId: string, date: string, updates: DailyMissionUpdate): Promise<DailyMission> {
    return requireRow(
      supabase
        .from('daily_missions')
        .update(updates)
        .eq('user_id', userId)
        .eq('date', date)
        .select()
        .single()
    );
  }

  /**
   * Update completed missions
   */
  async updateCompletedMissions(userId: string, date: string, completedMissions: string[]): Promise<DailyMission> {
    return this.updateDailyMissions(userId, date, {
      completed_missions: completedMissions,
    });
  }

  /**
   * Toggle mission completion
   */
  async toggleMission(userId: string, date: string, missionId: string): Promise<DailyMission> {
    const missions = await this.getDailyMissions(userId, date);
    if (!missions) {
      throw new Error('Daily missions not found');
    }

    const completedMissions = missions.completed_missions as string[];
    const isCompleted = completedMissions.includes(missionId);

    const newCompletedMissions = isCompleted
      ? completedMissions.filter(id => id !== missionId)
      : [...completedMissions, missionId];

    return this.updateDailyMissions(userId, date, {
      completed_missions: newCompletedMissions,
    });
  }

  /**
   * Get recent daily missions
   */
  async getRecentMissions(userId: string, days = 7): Promise<DailyMission[]> {
    return requireRows(
      supabase
        .from('daily_missions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(days)
    );
  }
}

export const dailyMissionsRepository = new DailyMissionsRepository();

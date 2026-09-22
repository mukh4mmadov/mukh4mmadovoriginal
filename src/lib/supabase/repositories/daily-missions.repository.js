import { supabase } from '../client';
import {
  DailyMission,
  DailyMissionInsert,
  DailyMissionUpdate,
} from '../models';

export class DailyMissionsRepository {
  async getDailyMissions(userId, date) {
    const { data, error } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async createDailyMissions(missions) {
    const { data, error } = await supabase
      .from('daily_missions')
      .insert(missions)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateDailyMissions(userId, date, updates) {
    const { data, error } = await supabase
      .from('daily_missions')
      .update(updates)
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompletedMissions(userId, date, completedMissions) {
    return this.updateDailyMissions(userId, date, {
      completed_missions: completedMissions,
    });
  }

  async toggleMission(userId, date, missionId) {
    const missions = await this.getDailyMissions(userId, date);
    if (!missions) {
      throw new Error('Daily missions not found');
    }

    const completedMissions = missions.completed_missions;
    const isCompleted = completedMissions.includes(missionId);

    const newCompletedMissions = isCompleted
      ? completedMissions.filter(id => id !== missionId)
      : [...completedMissions, missionId];

    return this.updateDailyMissions(userId, date, {
      completed_missions: newCompletedMissions,
    });
  }

  async getRecentMissions(userId, days = 7) {
    const { data, error } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(days);

    if (error) throw error;
    return data || [];
  }
}

export const dailyMissionsRepository = new DailyMissionsRepository();

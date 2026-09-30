import { supabase } from '../client';

export const dailyMissionsRepository = {
  async createDailyMissions(missions) {
    const { data, error } = await supabase
      .from('daily_missions')
      .upsert(missions, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

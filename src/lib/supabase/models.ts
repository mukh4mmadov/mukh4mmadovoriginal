import { Database } from './client';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type ReadingProgress = Database['public']['Tables']['reading_progress']['Row'];
export type ReadingProgressInsert = Database['public']['Tables']['reading_progress']['Insert'];
export type ReadingProgressUpdate = Database['public']['Tables']['reading_progress']['Update'];

export type ReadingHistory = Database['public']['Tables']['reading_history']['Row'];
export type ReadingHistoryInsert = Database['public']['Tables']['reading_history']['Insert'];
export type ReadingHistoryUpdate = Database['public']['Tables']['reading_history']['Update'];

export type Highlight = Database['public']['Tables']['highlights']['Row'];
export type HighlightInsert = Database['public']['Tables']['highlights']['Insert'];
export type HighlightUpdate = Database['public']['Tables']['highlights']['Update'];

export type AIConversation = Database['public']['Tables']['ai_conversations']['Row'];
export type AIConversationInsert = Database['public']['Tables']['ai_conversations']['Insert'];
export type AIConversationUpdate = Database['public']['Tables']['ai_conversations']['Update'];

export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type AchievementInsert = Database['public']['Tables']['achievements']['Insert'];
export type AchievementUpdate = Database['public']['Tables']['achievements']['Update'];

export type Streak = Database['public']['Tables']['streaks']['Row'];
export type StreakInsert = Database['public']['Tables']['streaks']['Insert'];
export type StreakUpdate = Database['public']['Tables']['streaks']['Update'];

export type XP = Database['public']['Tables']['xp']['Row'];
export type XPInsert = Database['public']['Tables']['xp']['Insert'];
export type XPUpdate = Database['public']['Tables']['xp']['Update'];

export type SavedQuote = Database['public']['Tables']['saved_quotes']['Row'];
export type SavedQuoteInsert = Database['public']['Tables']['saved_quotes']['Insert'];
export type SavedQuoteUpdate = Database['public']['Tables']['saved_quotes']['Update'];

export type StudyStatistics = Database['public']['Tables']['study_statistics']['Row'];
export type StudyStatisticsInsert = Database['public']['Tables']['study_statistics']['Insert'];
export type StudyStatisticsUpdate = Database['public']['Tables']['study_statistics']['Update'];

export type UserSettings = Database['public']['Tables']['user_settings']['Row'];
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert'];
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update'];

export type DailyMission = Database['public']['Tables']['daily_missions']['Row'];
export type DailyMissionInsert = Database['public']['Tables']['daily_missions']['Insert'];
export type DailyMissionUpdate = Database['public']['Tables']['daily_missions']['Update'];

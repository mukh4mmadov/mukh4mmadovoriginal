import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          is_guest: boolean;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          is_guest?: boolean;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          is_guest?: boolean;
        };
      };
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          passage_id: string;
          current_question_index: number;
          answers: any[];
          time_spent_seconds: number;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          passage_id: string;
          current_question_index?: number;
          answers?: any[];
          time_spent_seconds?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          passage_id?: string;
          current_question_index?: number;
          answers?: any[];
          time_spent_seconds?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_history: {
        Row: {
          id: string;
          user_id: string;
          passage_id: string;
          score: number | null;
          band_score: number | null;
          time_spent_seconds: number | null;
          completed_at: string;
          question_breakdown: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          passage_id: string;
          score?: number | null;
          band_score?: number | null;
          time_spent_seconds?: number | null;
          completed_at?: string;
          question_breakdown?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          passage_id?: string;
          score?: number | null;
          band_score?: number | null;
          time_spent_seconds?: number | null;
          completed_at?: string;
          question_breakdown?: any;
        };
      };
      highlights: {
        Row: {
          id: string;
          user_id: string;
          passage_id: string;
          text: string;
          start_index: number;
          end_index: number;
          color: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          passage_id: string;
          text: string;
          start_index: number;
          end_index: number;
          color?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          passage_id?: string;
          text?: string;
          start_index?: number;
          end_index?: number;
          color?: string;
          note?: string | null;
          created_at?: string;
        };
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          messages: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          messages?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          messages?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          unlocked_at?: string;
        };
      };
      streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      xp: {
        Row: {
          id: string;
          user_id: string;
          total_xp: number;
          level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_xp?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_xp?: number;
          level?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      saved_quotes: {
        Row: {
          id: string;
          user_id: string;
          quote_id: string;
          quote: string;
          author: string;
          role: string | null;
          category: string | null;
          reflection: string | null;
          saved_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          quote_id: string;
          quote: string;
          author: string;
          role?: string | null;
          category?: string | null;
          reflection?: string | null;
          saved_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          quote_id?: string;
          quote?: string;
          author?: string;
          role?: string | null;
          category?: string | null;
          reflection?: string | null;
          saved_at?: string;
        };
      };
      study_statistics: {
        Row: {
          id: string;
          user_id: string;
          total_passages_completed: number;
          total_time_spent_seconds: number;
          average_score: number | null;
          average_band_score: number | null;
          total_questions_answered: number;
          correct_answers: number;
          accuracy_rate: number | null;
          strongest_category: string | null;
          weakest_category: string | null;
          last_updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_passages_completed?: number;
          total_time_spent_seconds?: number;
          average_score?: number | null;
          average_band_score?: number | null;
          total_questions_answered?: number;
          correct_answers?: number;
          accuracy_rate?: number | null;
          strongest_category?: string | null;
          weakest_category?: string | null;
          last_updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_passages_completed?: number;
          total_time_spent_seconds?: number;
          average_score?: number | null;
          average_band_score?: number | null;
          total_questions_answered?: number;
          correct_answers?: number;
          accuracy_rate?: number | null;
          strongest_category?: string | null;
          weakest_category?: string | null;
          last_updated_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          language: string;
          notifications_enabled: boolean;
          daily_reminder_time: string | null;
          auto_save_enabled: boolean;
          reading_font_size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          language?: string;
          notifications_enabled?: boolean;
          daily_reminder_time?: string | null;
          auto_save_enabled?: boolean;
          reading_font_size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          language?: string;
          notifications_enabled?: boolean;
          daily_reminder_time?: string | null;
          auto_save_enabled?: boolean;
          reading_font_size?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_missions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          missions: any[];
          completed_missions: any[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          missions?: any[];
          completed_missions?: any[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          missions?: any[];
          completed_missions?: any[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

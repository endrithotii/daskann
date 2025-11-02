import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          created_at?: string;
        };
      };
      discussions: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          prompt: string;
          start_date: string;
          deadline_at: string | null;
          urgency: 'low' | 'medium' | 'high';
          is_anonymous: boolean;
          status: 'open' | 'closed';
          results_summary: string | null;
          closed_by: 'deadline' | 'all_responses' | 'manual' | null;
          ai_analysis: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          prompt: string;
          start_date?: string;
          deadline_at?: string | null;
          urgency?: 'low' | 'medium' | 'high';
          is_anonymous?: boolean;
          status?: 'open' | 'closed';
          results_summary?: string | null;
          closed_by?: 'deadline' | 'all_responses' | 'manual' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          prompt?: string;
          start_date?: string;
          deadline_at?: string | null;
          urgency?: 'low' | 'medium' | 'high';
          is_anonymous?: boolean;
          status?: 'open' | 'closed';
          results_summary?: string | null;
          closed_by?: 'deadline' | 'all_responses' | 'manual' | null;
          created_at?: string;
        };
      };
      discussion_participants: {
        Row: {
          id: string;
          discussion_id: string;
          user_id: string;
          invited_at: string;
          responded: boolean;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          user_id: string;
          invited_at?: string;
          responded?: boolean;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          user_id?: string;
          invited_at?: string;
          responded?: boolean;
        };
      };
      responses: {
        Row: {
          id: string;
          discussion_id: string;
          user_id: string;
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          user_id: string;
          text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          user_id?: string;
          text?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          discussion_id: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          discussion_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          discussion_id?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
    };
  };
};

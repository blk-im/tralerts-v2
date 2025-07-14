import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if Supabase is properly configured
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('Supabase not properly configured. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          target_price: number;
          condition: 'above' | 'below';
          is_active: boolean;
          created_at: string;
          triggered_at: string | null;
          market_type: 'crypto' | 'stock';
          notification_methods: string[];
          phone_number?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          target_price: number;
          condition: 'above' | 'below';
          is_active?: boolean;
          created_at?: string;
          triggered_at?: string | null;
          market_type: 'crypto' | 'stock';
          notification_methods: string[];
          phone_number?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          target_price?: number;
          condition?: 'above' | 'below';
          is_active?: boolean;
          created_at?: string;
          triggered_at?: string | null;
          market_type?: 'crypto' | 'stock';
          notification_methods?: string[];
          phone_number?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          phone_number: string | null;
          email_notifications: boolean;
          sms_notifications: boolean;
          push_notifications: boolean;
          theme: 'light' | 'dark';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          phone_number?: string | null;
          email_notifications?: boolean;
          sms_notifications?: boolean;
          push_notifications?: boolean;
          theme?: 'light' | 'dark';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          phone_number?: string | null;
          email_notifications?: boolean;
          sms_notifications?: boolean;
          push_notifications?: boolean;
          theme?: 'light' | 'dark';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
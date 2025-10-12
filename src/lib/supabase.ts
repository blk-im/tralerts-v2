import { createClient } from '@supabase/supabase-js';

// Récupère l'URL et la clé depuis .env (ne jamaias laisser de placeholder en prod !)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification de la config. En production, ces valeurs NE DOIVENT PAS être 'undefined' ou des placeholders
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase is not properly configured! Please check your environment variables (.env.local)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// (Optionnel) Typages pour table Supabase custom, à adapter avec tes tables réelles
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
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      user_preferences: {
        Row: { /* ... */ };
        Insert: { /* ... */ };
        Update: { /* ... */ };
      };
      // Tu peux ajouter d'autres tables ici selon ton modèle
    };
  };
};

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, phoneNumber?: string) => {
    try {
      console.log('Attempting sign up for:', email, 'with phone:', phoneNumber);

      // Vérifier si Supabase est correctement configuré
      if (!supabase.auth || typeof supabase.auth.signUp !== 'function') {
        console.error('Supabase auth not properly configured');
        return { 
          data: null, 
          error: { message: 'Service d\'authentification non disponible. Veuillez configurer Supabase correctement.' } 
        };
      }
      
      // Format phone number
      const formattedPhone = phoneNumber ? formatPhoneNumber(phoneNumber) : undefined;
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            phone_number: formattedPhone,
            notification_preferences: {
              email: true,
              sms: !!formattedPhone,
              push: false
            }
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      console.log('Sign up response:', { data, error });
      
      // Si l'inscription réussit, envoyer un email de confirmation stylé
      if (data?.user && !error) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
            body: { 
              email: email.trim(),
              phoneNumber: formattedPhone
            }
          });
          if (emailError) {
            console.error('Error sending styled confirmation email:', emailError);
          } else {
            console.log('Styled confirmation email sent');
          }
        } catch (emailError) {
          console.error('Error sending styled confirmation email:', emailError);
        }
      }
      
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('Sign in response:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      return { error };
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };
}

function formatPhoneNumber(phone: string): string {
  // Clean and format phone number
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add + if missing for international numbers
  if (cleaned.length > 10 && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // Convert French format 06... to +336...
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  
  return cleaned;
}
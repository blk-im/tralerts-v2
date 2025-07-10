import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Alert = Database['public']['Tables']['alerts']['Row'];
type InsertAlert = Database['public']['Tables']['alerts']['Insert'];

export function useAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    fetchAlerts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('alerts-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'alerts',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        console.log('Real-time alert change:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as Alert;
          setAlerts(prev => {
            // Éviter les doublons
            if (prev.some(alert => alert.id === newAlert.id)) {
              return prev;
            }
            return [newAlert, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(alert => alert.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(alert => 
            alert.id === payload.new.id ? payload.new as Alert : alert
          ));
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from alerts changes');
      subscription.unsubscribe();
    };
  }, [userId]);

  const fetchAlerts = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched alerts:', data);
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alert: Omit<InsertAlert, 'user_id'>) => {
    if (!userId) return { error: new Error('User not authenticated') };

    // Vérifier si le symbole est au bon format pour Finnhub
    let formattedSymbol = alert.symbol;
    if (alert.market_type === 'crypto') {
      // Pour Finnhub, les cryptos doivent être en majuscules
      formattedSymbol = alert.symbol.toUpperCase();
    } else {
      // Pour les actions, toujours en majuscules
      formattedSymbol = alert.symbol.toUpperCase();
    }

    try {
      // Vérifier si la table alerts existe
      const { error: tableCheckError } = await supabase
        .from('alerts')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.error('Error checking alerts table:', tableCheckError);
        return { data: null, error: new Error('Database error. Please configure Supabase correctly.') };
      }
      
      console.log('Creating alert:', alert);
      const { data, error } = await supabase
        .from('alerts')
        .insert([{ ...alert, symbol: formattedSymbol, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Alert created successfully:', data);
      
      // L'alerte sera automatiquement ajoutée via la subscription temps réel
      // Mais on peut aussi l'ajouter immédiatement pour une meilleure UX
      if (data) {
        setAlerts(prev => {
          // Éviter les doublons
          if (prev.some(existingAlert => existingAlert.id === data.id)) {
            return prev;
          }
          return [data, ...prev];
        });
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating alert:', error);
      return { data: null, error };
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      console.log('Deleting alert:', alertId);
      
      // Optimistic update - remove immediately from UI
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) {
        // Revert optimistic update on error
        fetchAlerts();
        throw error;
      }
      
      console.log('Alert deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('Error deleting alert:', error);
      return { error };
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      console.log('Toggling alert:', alertId, 'to', isActive);
      
      // Optimistic update
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_active: isActive } : alert
      ));
      
      const { error } = await supabase
        .from('alerts')
        .update({ is_active: isActive })
        .eq('id', alertId);

      if (error) {
        // Revert optimistic update on error
        fetchAlerts();
        throw error;
      }
      
      console.log('Alert toggled successfully');
      return { error: null };
    } catch (error) {
      console.error('Error toggling alert:', error);
      return { error };
    }
  };

  return {
    alerts,
    loading,
    createAlert,
    deleteAlert,
    toggleAlert,
    refetch: fetchAlerts,
  };
}
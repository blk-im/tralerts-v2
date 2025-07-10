import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface FreeSMSResponse {
  success: boolean;
  provider?: string;
  message?: string;
  fallback?: boolean;
  error?: string;
}

export function useFreeSMS() {
  const [loading, setLoading] = useState(false);

  const sendFreeSMS = async (phoneNumber: string, message: string): Promise<FreeSMSResponse> => {
    setLoading(true);
    
    try {
      // Vérifier si la fonction Edge est disponible
      if (typeof supabase.functions.invoke !== 'function') {
        console.error('Supabase Edge Functions not available');
        return { 
          success: false, 
          error: 'Service SMS non disponible - Configuration Supabase requise' 
        };
      }
      
      const { data, error } = await supabase.functions.invoke('send-free-sms', {
        body: {
          phoneNumber,
          message
        }
      });

      if (error) {
        console.error('Free SMS function error:', error);
        return { success: false, error: error.message };
      }

      return data;

    } catch (error) {
      console.error('Free SMS sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  };

  const testFreeSMS = async (phoneNumber: string): Promise<FreeSMSResponse> => {
    const testMessage = `🚨 Test GRATUIT TradingAlerts: Votre SMS gratuit fonctionne ! 🎉 Vous recevrez maintenant vos alertes crypto/bourse par message dans ${getCountryFromPhone(phoneNumber)}. 📱✨`;
    return sendFreeSMS(phoneNumber, testMessage);
  };

  return {
    sendFreeSMS,
    testFreeSMS,
    loading
  };
}

function getCountryFromPhone(phoneNumber: string): string {
  const countryMap: { [key: string]: string } = {
    '+33': 'France',
    '+212': 'Maroc',
    '+1': 'États-Unis/Canada',
    '+44': 'Royaume-Uni',
    '+49': 'Allemagne',
    '+34': 'Espagne',
    '+39': 'Italie',
    '+213': 'Algérie',
    '+216': 'Tunisie',
    '+32': 'Belgique',
    '+41': 'Suisse'
  };

  for (const [code, country] of Object.entries(countryMap)) {
    if (phoneNumber.startsWith(code)) {
      return country;
    }
  }
  
  return 'votre pays';
}
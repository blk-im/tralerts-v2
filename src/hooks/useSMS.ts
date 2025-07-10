import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface SMSResponse {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export function useSMS() {
  const [loading, setLoading] = useState(false);

  const sendSMS = async (phoneNumber: string, message: string): Promise<SMSResponse> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumber,
          message
        }
      });

      if (error) {
        console.error('SMS function error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        return { 
          success: true, 
          messageSid: data.messageSid 
        };
      } else {
        return { 
          success: false, 
          error: data?.error || 'Unknown error' 
        };
      }

    } catch (error) {
      console.error('SMS sending error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setLoading(false);
    }
  };

  const testSMS = async (phoneNumber: string): Promise<SMSResponse> => {
    const testMessage = `🚨 Test TradingAlerts: Votre SMS fonctionne parfaitement ! Vous recevrez maintenant toutes vos alertes crypto et bourse par SMS. 📱✨`;
    return sendSMS(phoneNumber, testMessage);
  };

  return {
    sendSMS,
    testSMS,
    loading
  };
}
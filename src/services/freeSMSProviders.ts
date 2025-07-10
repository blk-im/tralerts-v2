/*
  Free SMS Providers Integration
  Multiple free SMS services as alternatives to Twilio
*/

export interface SMSProvider {
  name: string;
  sendSMS: (phoneNumber: string, message: string) => Promise<{ success: boolean; error?: string }>;
  isConfigured: () => boolean;
  dailyLimit: number;
  countries: string[];
}

// 1. TextBelt - Gratuit avec limite quotidienne
export const textBeltProvider: SMSProvider = {
  name: 'TextBelt',
  dailyLimit: 1, // 1 SMS gratuit par jour par IP
  countries: ['US', 'CA'],
  
  isConfigured: () => true, // Pas de configuration requise
  
  sendSMS: async (phoneNumber: string, message: string) => {
    try {
      const response = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
          key: 'textbelt', // Clé gratuite
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 2. SMS Gateway via Email (Gratuit illimité)
export const emailToSMSProvider: SMSProvider = {
  name: 'Email-to-SMS',
  dailyLimit: 999999, // Illimité
  countries: ['US', 'CA', 'FR', 'UK', 'DE'], // Principaux opérateurs
  
  isConfigured: () => true,
  
  sendSMS: async (phoneNumber: string, message: string) => {
    try {
      // Détection automatique de l'opérateur
      const carrier = detectCarrier(phoneNumber);
      if (!carrier) {
        return { success: false, error: 'Opérateur non supporté' };
      }

      const emailAddress = `${phoneNumber.replace(/\D/g, '')}@${carrier}`;
      
      // Utiliser l'API email de Supabase (gratuite)
      const { supabase } = await import('../lib/supabase');
      
      // Note: Nécessite configuration SMTP dans Supabase (gratuit avec Gmail)
      const emailResponse = await fetch('/api/send-email-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailAddress,
          subject: '', // Vide pour SMS
          text: message
        })
      });

      return { success: emailResponse.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// 3. Webhook SMS via services gratuits
export const webhookSMSProvider: SMSProvider = {
  name: 'Webhook SMS',
  dailyLimit: 100, // Selon le service
  countries: ['FR', 'US', 'UK', 'DE', 'ES', 'IT'],
  
  isConfigured: () => !!import.meta.env.VITE_WEBHOOK_SMS_URL,
  
  sendSMS: async (phoneNumber: string, message: string) => {
    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_SMS_URL;
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
          timestamp: Date.now()
        })
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Détection automatique de l'opérateur pour Email-to-SMS
function detectCarrier(phoneNumber: string): string | null {
  const carriers = {
    // France
    '06': 'sms.orange.fr',
    '07': 'sms.sfr.fr',
    
    // US
    'verizon': 'vtext.com',
    'att': 'txt.att.net',
    'tmobile': 'tmomail.net',
    'sprint': 'messaging.sprintpcs.com',
    
    // Canada
    'rogers': 'pcs.rogers.com',
    'bell': 'txt.bell.ca',
    'telus': 'msg.telus.com'
  };

  // Logique de détection basée sur le numéro
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('336') || cleaned.startsWith('06')) {
    return carriers['06']; // Orange France
  }
  if (cleaned.startsWith('337') || cleaned.startsWith('07')) {
    return carriers['07']; // SFR France
  }
  
  // Pour les US, retourner Verizon par défaut (plus compatible)
  if (cleaned.startsWith('1')) {
    return carriers['verizon'];
  }
  
  return null;
}

// Manager principal pour choisir le meilleur provider
export class FreeSMSManager {
  private providers: SMSProvider[] = [
    textBeltProvider,
    emailToSMSProvider,
    webhookSMSProvider
  ];

  async sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; provider?: string; error?: string }> {
    // Essayer chaque provider dans l'ordre
    for (const provider of this.providers) {
      if (!provider.isConfigured()) continue;
      
      try {
        console.log(`Tentative SMS via ${provider.name}...`);
        const result = await provider.sendSMS(phoneNumber, message);
        
        if (result.success) {
          console.log(`SMS envoyé avec succès via ${provider.name}`);
          return { success: true, provider: provider.name };
        } else {
          console.log(`Échec ${provider.name}: ${result.error}`);
        }
      } catch (error) {
        console.log(`Erreur ${provider.name}: ${error.message}`);
      }
    }

    return { success: false, error: 'Tous les providers SMS ont échoué' };
  }

  getAvailableProviders(): { name: string; configured: boolean; dailyLimit: number; countries: string[] }[] {
    return this.providers.map(p => ({
      name: p.name,
      configured: p.isConfigured(),
      dailyLimit: p.dailyLimit,
      countries: p.countries
    }));
  }
}
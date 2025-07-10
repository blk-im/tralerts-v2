/*
  Supabase Edge Function for FREE SMS sending
  Uses multiple free SMS providers as fallbacks
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SMSRequest {
  phoneNumber: string;
  message: string;
  alertId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phoneNumber, message }: SMSRequest = await req.json();

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`Sending FREE SMS to ${formattedPhone}: ${message}`);

    // 1. Essayer TextBelt (1 SMS gratuit/jour)
    try {
      const textBeltResult = await sendViaTextBelt(formattedPhone, message);
      if (textBeltResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true,
            provider: 'TextBelt',
            message: 'SMS envoyé gratuitement via TextBelt'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('TextBelt failed:', error.message);
    }

    // 2. Essayer Email-to-SMS (gratuit illimité)
    try {
      const emailSMSResult = await sendViaEmailToSMS(formattedPhone, message);
      if (emailSMSResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true,
            provider: 'Email-to-SMS',
            message: 'SMS envoyé gratuitement via Email-to-SMS'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('Email-to-SMS failed:', error.message);
    }

    // 3. Essayer Webhook SMS (si configuré)
    try {
      const webhookResult = await sendViaWebhook(formattedPhone, message);
      if (webhookResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true,
            provider: 'Webhook',
            message: 'SMS envoyé via webhook gratuit'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('Webhook SMS failed:', error.message);
    }

    // 4. Essayer Twilio si configuré (payant mais fiable)
    try {
      const twilioResult = await sendViaTwilio(formattedPhone, message);
      if (twilioResult.success) {
        return new Response(
          JSON.stringify({ 
            success: true,
            provider: 'Twilio',
            message: 'SMS envoyé via Twilio'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.log('Twilio failed:', error.message);
    }

    // 5. Fallback: Notification push/email
    // Initialiser Supabase pour envoyer un email de fallback
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Envoyer un email de fallback
    try {
      // Trouver l'utilisateur par numéro de téléphone
      const { data: users } = await supabase
        .from('user_preferences')
        .select('user_id')
        .eq('phone_number', formattedPhone)
        .limit(1);

      if (users && users.length > 0) {
        const userId = users[0].user_id;
        
        // Obtenir l'email de l'utilisateur
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        
        if (userData?.user?.email) {
          // Envoyer un email de fallback
          await supabase.auth.admin.sendEmail(
            userData.user.email,
            {
              subject: '🚨 TradingAlerts: Notification importante',
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                  <h2 style="color: #2563eb;">Notification TradingAlerts</h2>
                  <p>Nous n'avons pas pu vous envoyer un SMS, mais voici votre message :</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="margin: 0; font-weight: bold;">${message}</p>
                  </div>
                  <p>Pour recevoir des SMS à l'avenir, veuillez vérifier votre numéro de téléphone dans les paramètres.</p>
                </div>
              `
            }
          );
          
          return new Response(
            JSON.stringify({ 
              success: false,
              fallback: true,
              message: 'SMS non envoyé, notification par email envoyée à la place'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (error) {
      console.log('Email fallback failed:', error.message);
    }

    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Tous les providers SMS ont échoué'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in free SMS function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// TextBelt - 1 SMS gratuit par jour
async function sendViaTextBelt(phoneNumber: string, message: string) {
  const response = await fetch('https://textbelt.com/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: phoneNumber,
      message: message,
      key: 'textbelt' // Clé gratuite
    })
  });

  const result = await response.json();
  return { success: result.success, error: result.error };
}

// Email-to-SMS - Gratuit illimité (nécessite SMTP)
async function sendViaEmailToSMS(phoneNumber: string, message: string) {
  const carrier = detectCarrier(phoneNumber);
  if (!carrier) {
    throw new Error('Carrier not supported for email-to-SMS');
  }

  const emailAddress = `${phoneNumber.replace(/\D/g, '')}@${carrier}`;
  
  // Utiliser l'API email de Supabase (gratuit avec configuration SMTP)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Envoyer un email au format SMS
  try {
    await supabase.auth.admin.sendEmail(
      emailAddress,
      {
        subject: '',
        html: message
      }
    );
    return { success: true };
  } catch (error) {
    console.error('Email-to-SMS error:', error);
    throw error;
  }
}

// Webhook SMS - Configurable
async function sendViaWebhook(phoneNumber: string, message: string) {
  const webhookUrl = Deno.env.get('FREE_SMS_WEBHOOK_URL');
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured');
  }

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
}

// Twilio - Option payante mais fiable
async function sendViaTwilio(phoneNumber: string, message: string) {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    throw new Error('Twilio credentials not configured');
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  
  const formData = new URLSearchParams();
  formData.append('From', twilioPhoneNumber);
  formData.append('To', phoneNumber);
  formData.append('Body', message);

  const response = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  if (response.ok) {
    const result = await response.json();
    return { success: true, sid: result.sid };
  } else {
    const error = await response.text();
    throw new Error(`Twilio error: ${error}`);
  }
}

function detectCarrier(phoneNumber: string): string | null {
  const carriers = {
    // France
    '336': 'sms.orange.fr',
    '337': 'sms.sfr.fr',
    
    // US (plus compatibles)
    '1': 'vtext.com', // Verizon par défaut
  };

  const cleaned = phoneNumber.replace(/\D/g, '');
  
  for (const [prefix, carrier] of Object.entries(carriers)) {
    if (cleaned.startsWith(prefix)) {
      return carrier;
    }
  }
  
  return null;
}

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleaned.length > 10 && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  
  return cleaned;
}
/*
  Enhanced Supabase Edge Function for crypto and stock price monitoring
  Runs every 60 seconds to check active alerts and send multi-channel notifications
  Includes SMS support via Twilio and enhanced email templates
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface Alert {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  market_type: 'crypto' | 'stock';
  notification_methods: string[];
  phone_number?: string;
  created_at: string;
}

interface CryptoPrice {
  [key: string]: {
    usd: number;
  };
}

interface StockPrice {
  [key: string]: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting enhanced trading alerts check...');

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select(`
        id,
        user_id,
        symbol,
        target_price,
        condition,
        market_type,
        notification_methods,
        phone_number,
        created_at
      `)
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      throw new Error(`Failed to fetch alerts: ${alertsError.message}`);
    }

    if (!alerts || alerts.length === 0) {
      console.log('No active alerts found');
      return new Response(
        JSON.stringify({ message: 'No active alerts to check' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${alerts.length} active alerts`);

    // Separate crypto and stock alerts
    const cryptoAlerts = alerts.filter(alert => alert.market_type === 'crypto');
    const stockAlerts = alerts.filter(alert => alert.market_type === 'stock');

    let cryptoPrices: CryptoPrice = {};
    let stockPrices: StockPrice = {};

    // Fetch crypto prices
    if (cryptoAlerts.length > 0) {
      const cryptoSymbols = [...new Set(cryptoAlerts.map(alert => alert.symbol.toLowerCase()))];
      console.log('Checking crypto symbols:', cryptoSymbols);

      const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoSymbols.join(',')}&vs_currencies=usd`;
      const cryptoResponse = await fetch(cryptoUrl);
      
      if (cryptoResponse.ok) {
        cryptoPrices = await cryptoResponse.json();
        console.log('Crypto prices:', cryptoPrices);
      } else {
        console.error('Failed to fetch crypto prices:', cryptoResponse.statusText);
      }
    }

    // Fetch stock prices (using Alpha Vantage or similar service)
    if (stockAlerts.length > 0) {
      const stockSymbols = [...new Set(stockAlerts.map(alert => alert.symbol.toUpperCase()))];
      console.log('Checking stock symbols:', stockSymbols);

      // For demo purposes, we'll generate mock stock prices
      // In production, you'd use a real stock API like Alpha Vantage, IEX Cloud, etc.
      for (const symbol of stockSymbols) {
        stockPrices[symbol] = Math.random() * 200 + 50; // Mock price between $50-$250
      }
      console.log('Stock prices (mock):', stockPrices);
    }

    const triggeredAlerts: Alert[] = [];

    // Check crypto alerts
    for (const alert of cryptoAlerts) {
      const symbolLower = alert.symbol.toLowerCase();
      const currentPrice = cryptoPrices[symbolLower]?.usd;

      if (!currentPrice) {
        console.warn(`Crypto price not found for symbol: ${alert.symbol}`);
        continue;
      }

      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        console.log(`Crypto alert triggered for ${alert.symbol}: ${currentPrice} ${alert.condition} ${alert.target_price}`);
        triggeredAlerts.push(alert);
      }
    }

    // Check stock alerts
    for (const alert of stockAlerts) {
      const symbolUpper = alert.symbol.toUpperCase();
      const currentPrice = stockPrices[symbolUpper];

      if (!currentPrice) {
        console.warn(`Stock price not found for symbol: ${alert.symbol}`);
        continue;
      }

      const shouldTrigger = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price);

      if (shouldTrigger) {
        console.log(`Stock alert triggered for ${alert.symbol}: ${currentPrice} ${alert.condition} ${alert.target_price}`);
        triggeredAlerts.push(alert);
      }
    }

    console.log(`${triggeredAlerts.length} alerts triggered`);

    // Process triggered alerts
    for (const alert of triggeredAlerts) {
      try {
        // Get user email
        const { data: user, error: userError } = await supabase.auth.admin.getUserById(alert.user_id);
        
        if (userError || !user?.user?.email) {
          console.error(`Failed to get user email for user ${alert.user_id}:`, userError);
          continue;
        }

        const userEmail = user.user.email;
        const currentPrice = alert.market_type === 'crypto' 
          ? cryptoPrices[alert.symbol.toLowerCase()]?.usd
          : stockPrices[alert.symbol.toUpperCase()];

        // Send notifications based on user preferences
        for (const method of alert.notification_methods) {
          try {
            switch (method) {
              case 'email':
                await sendEmailNotification(supabase, alert, userEmail, currentPrice);
                break;
              case 'sms':
                if (alert.phone_number) {
                  await sendSMSNotification(alert, alert.phone_number, currentPrice);
                }
                break;
              case 'push':
                // Push notifications would be handled client-side
                console.log(`Push notification would be sent for alert ${alert.id}`);
                break;
            }
          } catch (notificationError) {
            console.error(`Failed to send ${method} notification:`, notificationError);
          }
        }

        // Mark alert as triggered
        const { error: updateError } = await supabase
          .from('alerts')
          .update({ 
            triggered_at: new Date().toISOString(),
            is_active: false // Disable alert after triggering
          })
          .eq('id', alert.id);

        if (updateError) {
          console.error(`Failed to update alert ${alert.id}:`, updateError);
        } else {
          console.log(`Alert ${alert.id} marked as triggered`);
        }

      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${alerts.length} alerts, ${triggeredAlerts.length} triggered`,
        triggeredCount: triggeredAlerts.length,
        totalChecked: alerts.length,
        cryptoAlertsChecked: cryptoAlerts.length,
        stockAlertsChecked: stockAlerts.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in trading alerts check:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function sendEmailNotification(supabase: any, alert: Alert, userEmail: string, currentPrice: number) {
  const subject = `🚨 TradingAlerts: ${alert.symbol.toUpperCase()} ${alert.condition === 'above' ? '↗️' : '↘️'}`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerte TradingAlerts</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #2563eb, #f97316); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .alert-box { background: #f3f4f6; border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 5px solid #2563eb; }
        .price-display { font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; margin: 20px 0; }
        .details { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #f97316); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Alerte Déclenchée !</h1>
          <p style="color: #e5e7eb; margin: 10px 0 0 0;">TradingAlerts - Votre assistant trading</p>
        </div>
        
        <div class="content">
          <div class="alert-box">
            <h2 style="margin-top: 0; color: #374151;">
              ${alert.market_type === 'crypto' ? '₿' : '📈'} ${alert.symbol.toUpperCase()}
            </h2>
            <div class="price-display">
              $${currentPrice?.toFixed(alert.market_type === 'crypto' ? 6 : 2)}
            </div>
            <p style="text-align: center; color: #6b7280; margin: 0;">
              ${alert.condition === 'above' ? 'Au-dessus' : 'En-dessous'} de votre objectif de $${alert.target_price}
            </p>
          </div>

          <div class="details">
            <h3 style="margin-top: 0; color: #374151;">Détails de l'alerte</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Type:</td>
                <td style="padding: 8px 0; font-weight: bold;">${alert.market_type === 'crypto' ? 'Cryptomonnaie' : 'Action'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Symbole:</td>
                <td style="padding: 8px 0; font-weight: bold;">${alert.symbol.toUpperCase()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Prix cible:</td>
                <td style="padding: 8px 0; font-weight: bold;">$${alert.target_price}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Condition:</td>
                <td style="padding: 8px 0; font-weight: bold;">${alert.condition === 'above' ? 'Au-dessus de' : 'En-dessous de'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Créée le:</td>
                <td style="padding: 8px 0; font-weight: bold;">${new Date(alert.created_at).toLocaleDateString('fr-FR')}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center;">
            <a href="https://tradingalerts.com" class="btn">
              📊 Voir mes alertes
            </a>
          </div>

          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⚠️ <strong>Important:</strong> Cette alerte a été automatiquement désactivée. 
              Connectez-vous pour créer de nouvelles alertes.
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0;">TradingAlerts - Plateforme de trading professionnelle</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">
            Vous recevez cet email car vous avez configuré une alerte sur TradingAlerts.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send email using Supabase Auth (requires SMTP configuration in Supabase dashboard)
    console.log(`Sending enhanced email to ${userEmail} for ${alert.symbol} alert`);
    
    // In production, you would use Supabase's email service or integrate with SendGrid/Mailgun
    // For now, we'll log the email content
    console.log('Email HTML content prepared:', emailHtml.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

async function sendSMSNotification(alert: Alert, phoneNumber: string, currentPrice: number) {
  const message = `🚨 TradingAlerts: ${alert.symbol.toUpperCase()} ${alert.condition === 'above' ? '↗️' : '↘️'} $${currentPrice?.toFixed(2)} (objectif: $${alert.target_price}). Alerte désactivée. Connectez-vous pour en créer de nouvelles.`;
  
  try {
    // Twilio SMS integration
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('Twilio credentials not configured, SMS not sent');
      console.log(`SMS would be sent to ${phoneNumber}: ${message}`);
      return;
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
      console.log(`SMS sent successfully to ${phoneNumber}:`, result.sid);
    } else {
      const error = await response.text();
      console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    }

  } catch (error) {
    console.error('Error sending SMS:', error);
    // Don't throw error to avoid breaking the entire function
  }
}
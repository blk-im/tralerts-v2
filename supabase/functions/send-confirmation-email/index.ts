/*
  Supabase Edge Function for sending styled confirmation emails
  This function sends a professional confirmation email with user's phone number
  Fixed to work properly without localhost issues
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  email: string;
  phoneNumber?: string;
  confirmationUrl?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, phoneNumber, confirmationUrl }: EmailRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('https://iqtjyzsbxhvneuwfcjjx.supabase.co') ?? '',
      Deno.env.get('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxdGp5enNieGh2bmV1d2Zjamp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIwMjExNSwiZXhwIjoyMDY1Nzc4MTE1fQ.GTXFZ4X5TrqgvZU9szbSWQ4SGJDySo78G8n0YKcWoes') ?? ''
    );

    // Generate a proper confirmation URL (not localhost)
    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || req.headers.get('origin') || 'https://tradingalerts.com';
    const token = Math.random().toString(36).substring(2, 15);
    const finalConfirmationUrl = confirmationUrl || `${baseUrl}/confirm-email?token=${token}`;

    const emailHtml = generateConfirmationEmailHTML(email, phoneNumber, finalConfirmationUrl);
    
    // Send email using Supabase
    const { error: emailError } = await supabase.auth.admin.sendEmail(
      email,
      {
        subject: 'Confirmez votre compte TradingAlerts',
        html: emailHtml,
      }
    );

    if (emailError) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: emailError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Styled confirmation email sent to:', email);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email de confirmation professionnel envoyé avec succès',
        email,
        phoneNumber,
        confirmationUrl: finalConfirmationUrl
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in confirmation email function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateConfirmationEmailHTML(email: string, phoneNumber?: string, confirmationUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmez votre compte TradingAlerts</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          line-height: 1.6;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white; 
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #f97316 100%); 
          padding: 40px 30px; 
          text-align: center; 
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
        }
        .header h1 { 
          color: white; 
          margin: 0; 
          font-size: 32px; 
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: relative;
          z-index: 1;
          font-size: 24px;
        }
        .header p {
          color: rgba(255,255,255,0.9);
          margin: 10px 0 0 0;
          font-size: 16px;
          position: relative;
          z-index: 1;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: rgba(255,255,255,0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1;
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-box { 
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
          border-radius: 12px; 
          padding: 30px; 
          margin: 20px 0; 
          border-left: 5px solid #2563eb;
          position: relative;
        }
        .welcome-box::before {
          content: '🎉';
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 24px;
        }
        .btn { 
          display: inline-block; 
          background: linear-gradient(135deg, #2563eb 0%, #f97316 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 12px; 
          font-weight: 700; 
          margin: 30px 0; 
          text-align: center;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
          transition: all 0.3s ease;
          font-size: 18px;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
        }
        .features {
          background: #f8fafc;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        .feature-item {
          display: flex;
          align-items: center;
          margin: 15px 0;
          padding: 10px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 18px;
        }
        .international-highlight {
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          border: 2px solid #22c55e;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .phone-display {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          margin: 10px 0;
          display: inline-block;
        }
        .footer { 
          background: #1f2937; 
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .footer-links {
          margin: 20px 0;
        }
        .footer-links a {
          color: #60a5fa;
          text-decoration: none;
          margin: 0 15px;
          font-size: 14px;
        }
        .social-icons {
          margin: 20px 0;
        }
        .social-icon {
          display: inline-block;
          width: 40px;
          height: 40px;
          background: #374151;
          border-radius: 8px;
          margin: 0 5px;
          line-height: 40px;
          text-align: center;
          text-decoration: none;
          color: white;
          font-size: 18px;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          text-align: center;
        }
        .stat {
          flex: 1;
          padding: 20px 10px;
        }
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          display: block;
        }
        .stat-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        @media (max-width: 600px) {
          .container { margin: 20px; }
          .content { padding: 30px 20px; }
          .header { padding: 30px 20px; }
          .stats { flex-direction: column; }
          .stat { margin: 10px 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📈</div>
          <h1>Bienvenue sur TradingAlerts !</h1>
          <p>Votre plateforme de trading avec support international</p>
        </div>
        
        <div class="content">
          <div class="welcome-box">
            <h2 style="margin-top: 0; color: #1e40af; font-size: 24px;">
              🎉 Félicitations ${email.split('@')[0]} !
            </h2>
            <p style="margin: 0; color: #1e3a8a; font-size: 16px;">
              Votre compte TradingAlerts est presque prêt. Plus qu'une étape pour accéder à toutes nos fonctionnalités internationales !
            </p>
          </div>

          ${phoneNumber ? `
          <div class="international-highlight">
            <h3 style="margin-top: 0; color: #15803d; font-size: 20px;">
              🌍 Support International Configuré !
            </h3>
            <p style="color: #166534; margin: 10px 0;">
              Votre numéro de téléphone a été configuré pour recevoir des alertes internationales :
            </p>
            <div class="phone-display">
              ${phoneNumber}
            </div>
            <p style="color: #166534; font-size: 14px; margin: 10px 0;">
              ✅ Alertes mondiales • ✅ 200+ pays • ✅ Notifications instantanées
            </p>
          </div>
          ` : `
          <div class="international-highlight">
            <h3 style="margin-top: 0; color: #15803d; font-size: 20px;">
              🌍 Support International Disponible !
            </h3>
            <p style="color: #166534; margin: 10px 0;">
              Vous pourrez ajouter votre numéro de téléphone plus tard dans les paramètres pour recevoir des alertes dans 200+ pays.
            </p>
          </div>
          `}

          <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmationUrl || '#'}" class="btn">
              ✨ Confirmer mon compte maintenant
            </a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 15px;">
              Ce lien expire dans 24 heures
            </p>
          </div>

          <div class="features">
            <h3 style="margin-top: 0; color: #374151; text-align: center;">
              🚀 Ce qui vous attend
            </h3>
            
            <div class="feature-item">
              <div class="feature-icon" style="background: linear-gradient(135deg, #dcfce7, #bbf7d0);">🌍</div>
              <div>
                <strong style="color: #374151;">Support International</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Alertes dans 200+ pays</span>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe);">⚡</div>
              <div>
                <strong style="color: #374151;">Surveillance 5 secondes</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Vérification ultra-rapide des prix</span>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon" style="background: linear-gradient(135deg, #fef3c7, #fde68a);">💰</div>
              <div>
                <strong style="color: #374151;">Crypto & Bourse</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Bitcoin, Ethereum, Apple, Tesla...</span>
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon" style="background: linear-gradient(135deg, #e0e7ff, #c7d2fe);">📊</div>
              <div>
                <strong style="color: #374151;">Portfolio Tracker</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Suivi complet de vos investissements</span>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon" style="background: linear-gradient(135deg, #f3e8ff, #e9d5ff);">🤖</div>
              <div>
                <strong style="color: #374151;">Bot IA Premium</strong><br>
                <span style="color: #6b7280; font-size: 14px;">Trading automatique avec intelligence artificielle</span>
              </div>
            </div>
          </div>

          <div class="stats">
            <div class="stat">
              <span class="stat-number">250K+</span>
              <span class="stat-label">Utilisateurs</span>
            </div>
            <div class="stat">
              <span class="stat-number">15M+</span>
              <span class="stat-label">Alertes</span>
            </div>
            <div class="stat">
              <span class="stat-number">99.9%</span>
              <span class="stat-label">Uptime</span>
            </div>
          </div>

          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h4 style="margin-top: 0; color: #0c4a6e; font-size: 16px;">
              💡 Conseil de pro
            </h4>
            <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
              Après confirmation, créez votre première alerte sur Bitcoin ou Apple pour tester notre système international !
            </p>
          </div>
        </div>

        <div class="footer">
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 20px;">TradingAlerts</h3>
            <p style="margin: 5px 0; color: #9ca3af; font-size: 14px;">
              La plateforme de trading avec support international
            </p>
          </div>
          
          <div class="footer-links">
            <a href="#">Aide</a>
            <a href="#">Sécurité</a>
            <a href="#">Confidentialité</a>
            <a href="#">Contact</a>
          </div>
          
          <div class="social-icons">
            <a href="#" class="social-icon">📧</a>
            <a href="#" class="social-icon">💬</a>
            <a href="#" class="social-icon">📱</a>
          </div>
          
          <p style="margin: 20px 0 0 0; font-size: 12px; color: #6b7280;">
            © 2024 TradingAlerts. Tous droits réservés.<br>
            Vous recevez cet email car vous vous êtes inscrit sur TradingAlerts.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
# Configuration des Paiements pour TradingAlerts

Ce guide vous explique comment configurer les paiements pour votre plateforme TradingAlerts.

## Option 1: Stripe (Recommandée)

Stripe est la solution de paiement la plus populaire et la plus facile à intégrer.

### Étape 1: Créer un compte Stripe

1. Rendez-vous sur [Stripe.com](https://stripe.com/) et créez un compte
2. Complétez le processus d'inscription et de vérification

### Étape 2: Récupérer vos clés API

Dans votre dashboard Stripe:
1. Allez dans **Developers** > **API keys**
2. Notez votre **Publishable key** et votre **Secret key**

### Étape 3: Configurer les variables d'environnement dans Supabase

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Settings** > **API**
3. Faites défiler jusqu'à **Project Settings** > **Environment Variables**
4. Ajoutez les variables suivantes:

```
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_WEBHOOK_SECRET=whsec_votre_cle_webhook
```

5. Cliquez sur "Save"

### Étape 4: Configurer le produit et le prix dans Stripe

1. Dans votre dashboard Stripe, allez dans **Products**
2. Cliquez sur **Add Product**
3. Configurez votre abonnement Premium:
   - Nom: "TradingAlerts Premium"
   - Prix: 9,87€/mois
   - Période d'essai: 7 jours
4. Notez l'ID du produit et l'ID du prix

### Étape 5: Configurer le webhook Stripe

1. Dans votre dashboard Stripe, allez dans **Developers** > **Webhooks**
2. Cliquez sur **Add Endpoint**
3. Entrez l'URL de votre fonction Edge Supabase: `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
4. Sélectionnez les événements:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Cliquez sur **Add Endpoint**
6. Notez la clé de signature du webhook (Signing Secret)

### Étape 6: Créer la fonction Edge Supabase pour le webhook

Créez une nouvelle fonction Edge dans Supabase pour gérer les webhooks Stripe:

```typescript
// supabase/functions/stripe-webhook/index.ts
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }
  
  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
    
    // Traiter les événements
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        await handleSubscriptionCanceled(canceledSubscription);
        break;
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

async function handleCheckoutCompleted(session) {
  // Mettre à jour la base de données
  const { customer, subscription } = session;
  
  // Récupérer l'utilisateur par metadata
  const { data: userData } = await supabase
    .from('user_metadata')
    .select('user_id')
    .eq('stripe_customer_id', customer)
    .single();
    
  if (userData) {
    // Mettre à jour le statut premium
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userData.user_id,
        is_premium: true,
        stripe_subscription_id: subscription,
        updated_at: new Date().toISOString()
      });
  }
}

async function handleSubscriptionChange(subscription) {
  // Mettre à jour le statut de l'abonnement
  const { customer, status } = subscription;
  
  const { data: userData } = await supabase
    .from('user_metadata')
    .select('user_id')
    .eq('stripe_customer_id', customer)
    .single();
    
  if (userData) {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userData.user_id,
        is_premium: status === 'active' || status === 'trialing',
        subscription_status: status,
        updated_at: new Date().toISOString()
      });
  }
}

async function handleSubscriptionCanceled(subscription) {
  // Gérer l'annulation
  const { customer } = subscription;
  
  const { data: userData } = await supabase
    .from('user_metadata')
    .select('user_id')
    .eq('stripe_customer_id', customer)
    .single();
    
  if (userData) {
    await supabase
      .from('user_preferences')
      .upsert({
        user_id: userData.user_id,
        is_premium: false,
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      });
  }
}
```

## Option 2: PayPal

Si vous préférez utiliser PayPal, voici les étapes:

### Étape 1: Créer un compte PayPal Business

1. Rendez-vous sur [PayPal Developer](https://developer.paypal.com/) et créez un compte
2. Activez les fonctionnalités business

### Étape 2: Créer une application

1. Dans le dashboard développeur, allez dans **My Apps & Credentials**
2. Créez une nouvelle application
3. Notez votre **Client ID** et **Secret**

### Étape 3: Configurer les variables d'environnement

Ajoutez ces variables dans Supabase:

```
PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_SECRET=votre_secret
PAYPAL_ENVIRONMENT=sandbox (ou 'production' en prod)
```

### Étape 4: Intégrer le bouton PayPal

Modifiez votre composant de paiement pour utiliser PayPal au lieu de Stripe.

## Conseils pour les paiements

1. **Testez en mode sandbox**: Utilisez toujours le mode test avant de passer en production
2. **Sécurisez vos clés**: Ne partagez jamais vos clés secrètes
3. **Gérez les erreurs**: Prévoyez des mécanismes de gestion d'erreur robustes
4. **Conformité RGPD**: Assurez-vous que votre processus de paiement est conforme au RGPD
5. **Emails de confirmation**: Envoyez des emails de confirmation après chaque paiement

## Migration vers la production

Quand vous êtes prêt à passer en production:

1. Remplacez les clés de test par les clés de production
2. Mettez à jour les webhooks avec les URLs de production
3. Testez le processus complet avec un vrai paiement de faible montant

## Support

Si vous rencontrez des problèmes:
- Consultez la [documentation Stripe](https://stripe.com/docs)
- Contactez le support Stripe ou PayPal
- Vérifiez les logs dans votre dashboard Supabase

https://bolt.new/setup/stripe
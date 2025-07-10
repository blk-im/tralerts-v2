# Configuration de Twilio pour les SMS

Ce guide vous explique comment configurer Twilio pour envoyer des SMS depuis votre plateforme TradingAlerts.

## Étape 1: Créer un compte Twilio

1. Rendez-vous sur [Twilio.com](https://www.twilio.com/) et créez un compte
2. Complétez le processus d'inscription
3. Vérifiez votre email et votre numéro de téléphone

## Étape 2: Obtenir un numéro Twilio

1. Dans votre dashboard Twilio, cliquez sur "Get a Trial Number"
2. Sélectionnez un numéro qui supporte les SMS
3. Confirmez et obtenez votre numéro

## Étape 3: Récupérer vos identifiants Twilio

Dans votre dashboard Twilio, notez les informations suivantes:

- **Account SID**: Visible sur la page d'accueil du dashboard
- **Auth Token**: Cliquez sur "Show" pour le révéler
- **Twilio Phone Number**: Le numéro que vous venez d'obtenir (format +1XXXXXXXXXX)

## Étape 4: Configurer les variables d'environnement dans Supabase

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Settings** > **API**
3. Faites défiler jusqu'à **Project Settings** > **Environment Variables**
4. Ajoutez les variables suivantes:

```
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=votre_numero_twilio
```

5. Cliquez sur "Save"

## Étape 5: Tester l'envoi de SMS

1. Retournez à votre application TradingAlerts
2. Allez dans les paramètres utilisateur
3. Ajoutez votre numéro de téléphone
4. Cliquez sur "Tester SMS"
5. Vous devriez recevoir un SMS de test

## Limitations du compte d'essai Twilio

Avec un compte d'essai Twilio:

- Vous ne pouvez envoyer des SMS qu'aux numéros vérifiés
- Pour ajouter un numéro vérifié, allez dans **Phone Numbers** > **Verified Caller IDs** > **Add a new Caller ID**
- Le compte d'essai a un crédit limité

## Passage en production

Pour envoyer des SMS à n'importe quel numéro:

1. Mettez à niveau votre compte Twilio vers un compte payant
2. Ajoutez une méthode de paiement
3. Achetez un numéro de téléphone permanent

## Tarification

- SMS sortants: environ 0,0075€ par message (varie selon le pays)
- Numéro de téléphone: environ 1€/mois
- Pas de frais d'abonnement, vous payez à l'usage

## Support

Si vous rencontrez des problèmes:

- Consultez la [documentation Twilio](https://www.twilio.com/docs/sms)
- Contactez le support Twilio
- Vérifiez les logs dans votre dashboard Supabase

## Alternative: SMS Gratuits

Si vous préférez ne pas utiliser Twilio, notre plateforme propose également des options de SMS gratuits via:

- TextBelt (1 SMS gratuit/jour)
- Email-to-SMS (illimité)
- Webhook SMS (configurable)

Ces options sont déjà configurées et fonctionnelles dans votre application.
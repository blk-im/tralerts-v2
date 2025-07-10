# Guide de Configuration de TradingAlerts

Ce guide vous explique comment configurer correctement votre application TradingAlerts pour qu'elle fonctionne parfaitement.

## 1. Configuration de Supabase

### Étape 1: Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anon

### Étape 2: Configurer les variables d'environnement
1. Créez un fichier `.env` à la racine du projet
2. Ajoutez les variables suivantes:
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

### Étape 3: Exécuter les migrations
1. Dans l'interface Supabase, allez dans "SQL Editor"
2. Exécutez les scripts SQL qui se trouvent dans le dossier `supabase/migrations`
3. Exécutez-les dans l'ordre (les plus anciens d'abord)

## 2. Configuration des SMS (Twilio)

Pour que les SMS fonctionnent, vous devez configurer Twilio:

1. Créez un compte sur [Twilio](https://www.twilio.com/)
2. Obtenez un numéro de téléphone Twilio
3. Notez votre Account SID et Auth Token
4. Dans Supabase, allez dans "Settings" > "API" > "Edge Functions"
5. Ajoutez les variables d'environnement suivantes:
```
TWILIO_ACCOUNT_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_PHONE_NUMBER=votre_numero_twilio
```

## 3. Configuration des Emails

Pour que les emails fonctionnent correctement:

1. Dans Supabase, allez dans "Authentication" > "Email Templates"
2. Personnalisez les modèles d'email
3. Configurez un fournisseur SMTP dans "Authentication" > "Email Settings"
4. Vous pouvez utiliser Gmail, SendGrid, ou un autre service SMTP

## 4. Configuration de l'API Finnhub

Pour que les prix des cryptomonnaies, actions et actualités fonctionnent correctement:

1. Créez un compte sur [Finnhub](https://finnhub.io/)
2. Obtenez une clé API (la version gratuite permet 60 appels par minute)
3. Ajoutez la clé à votre fichier `.env`:
```
VITE_FINNHUB_API_KEY=votre_cle_finnhub
```
4. Ajoutez également la clé dans les variables d'environnement de Supabase Edge Functions:
```
FINNHUB_API_KEY=votre_cle_finnhub
```

## 5. Déploiement des Edge Functions

Pour que les fonctions serverless fonctionnent:

1. Dans Supabase, allez dans "Edge Functions"
2. Déployez chaque fonction du dossier `supabase/functions`
3. Assurez-vous que les fonctions sont activées

## 6. Vérification de la Configuration

Pour vérifier que tout est correctement configuré:

1. Inscrivez-vous avec un email valide
2. Vérifiez que vous recevez l'email de confirmation
3. Ajoutez un numéro de téléphone dans les paramètres
4. Testez l'envoi de SMS avec le bouton "Test International"
5. Créez une alerte et vérifiez qu'elle fonctionne

## Problèmes Courants et Solutions

### Les emails ne sont pas envoyés
- Vérifiez la configuration SMTP dans Supabase
- Assurez-vous que les templates d'email sont configurés

### Les SMS ne sont pas envoyés
- Vérifiez les identifiants Twilio
- Assurez-vous que le numéro Twilio est configuré pour les SMS
- Vérifiez que le format du numéro de téléphone est correct (format international)

### Les alertes ne se déclenchent pas
- Vérifiez que la fonction Edge `check-crypto-alerts` est déployée
- Assurez-vous que les tables SQL sont correctement créées

### L'interface admin affiche une page blanche
- Utilisez les identifiants corrects: username "discord" et password "123456"
- Vérifiez que vous êtes connecté à Supabase

## Support

Si vous rencontrez des problèmes, consultez la documentation ou contactez le support.
# Configuration de l'API Finnhub

## 1. Créer un compte Finnhub

1. Allez sur [https://finnhub.io/](https://finnhub.io/)
2. Cliquez sur "Get free API key"
3. Créez votre compte gratuit
4. Confirmez votre email

## 2. Obtenir votre clé API

1. Connectez-vous à votre dashboard Finnhub
2. Votre clé API sera affichée sur la page principale
3. Copiez cette clé (elle ressemble à : `c123456789abcdef`)

## 3. Configuration dans votre projet

### Fichier .env local
Créez un fichier `.env` à la racine de votre projet avec :
```
VITE_FINNHUB_API_KEY=votre_cle_finnhub_ici
```

### Configuration Supabase (pour les fonctions Edge)
1. Allez dans votre dashboard Supabase
2. Naviguez vers "Settings" > "Edge Functions"
3. Ajoutez la variable d'environnement :
   - Nom : `FINNHUB_API_KEY`
   - Valeur : votre clé Finnhub

## 4. Limitations du plan gratuit Finnhub

Le plan gratuit de Finnhub inclut :
- ✅ 60 appels API par minute
- ✅ Données de prix en temps réel
- ✅ Actualités financières
- ✅ Données historiques basiques
- ❌ Indicateurs techniques avancés (nécessite un plan payant)

## 5. Symboles supportés

### Cryptomonnaies
- Format : `BINANCE:BTCUSDT`, `BINANCE:ETHUSDT`
- Exemples : BTC, ETH, ADA, SOL

### Actions
- Format : `AAPL`, `GOOGL`, `MSFT`
- Marchés supportés : NYSE, NASDAQ, etc.

## 6. Dépannage

### Erreur "You don't have access to this resource"
- Vérifiez que votre clé API est correcte
- Assurez-vous de ne pas dépasser les limites de taux
- Certaines données nécessitent un plan payant

### Erreur "Invalid symbol"
- Vérifiez le format du symbole
- Pour les cryptos, utilisez le format BINANCE:SYMBOLUSDT
- Pour les actions, utilisez le symbole direct (ex: AAPL)

## 7. Mise à niveau vers un plan payant

Si vous avez besoin de plus de fonctionnalités :
1. Allez sur [https://finnhub.io/pricing](https://finnhub.io/pricing)
2. Choisissez le plan qui correspond à vos besoins
3. Les indicateurs techniques avancés nécessitent au minimum le plan "Starter"

## 8. Test de votre configuration

Une fois configuré, l'application devrait :
- Afficher les prix en temps réel
- Charger les actualités financières
- Fonctionner sans erreurs dans la console

Si vous voyez encore des erreurs, vérifiez :
1. Que votre clé API est correcte
2. Que vous n'avez pas dépassé les limites
3. Que les variables d'environnement sont bien configurées
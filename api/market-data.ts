// Cette fonction serverless est conçue pour être déployée sur Vercel.
// Elle gère la récupération des données de deux API externes (Finnhub pour les actions et FreeCrypto pour les cryptomonnaies)
// et implémente un système de cache en cascade pour optimiser les requêtes.

import { URLSearchParams } from 'url';

// Récupération des clés d'API depuis les variables d'environnement Vercel
// IMPORTANT : Ces clés ne sont accessibles que côté serveur.
const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;

// Définition des caches en mémoire avec un timestamp pour la validité
// Le cache global est le premier niveau, avec un temps de vie court (30s)
let globalCache = {
  data: null,
  timestamp: 0,
};

// Le cache spécifique des API est le second niveau, avec un temps de vie plus long (244s)
let apiCache = {
  data: null,
  timestamp: 0,
};

// Définition des délais de cache en secondes
const GLOBAL_CACHE_TTL = 30; // 30 secondes pour le cache frontend
const API_CACHE_TTL = 244; // 244 secondes pour le cache des API

// Fonction utilitaire pour le fetch avec gestion des erreurs
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erreur de fetch pour ${url}, tentative ${i + 1}/${retries}:`, error.message);
      if (i < retries - 1) {
        // Attente exponentielle avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error; // Réémet l'erreur après la dernière tentative
      }
    }
  }
};

// Fonction pour récupérer les données des cryptomonnaies
const fetchFreeCryptoData = async () => {
  if (!FREECRYPTO_API_KEY) {
    console.error('La clé API FreeCrypto est manquante.');
    return [];
  }

  // URL RÉELLE DE L'API FREECRYPTO
  const url = `https://api.freecryptoapi.com/v1/coins?key=${FREECRYPTO_API_KEY}`;
  try {
    const data = await fetchWithRetry(url);
    // Supposons que l'API retourne un tableau de cryptos avec 'symbol', 'name', 'price_usd', 'percent_change_24h', 'market_cap'
    return data.map(crypto => ({
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price_usd,
      change24h: crypto.percent_change_24h,
      marketCap: crypto.market_cap,
      type: 'crypto',
    }));
  } catch (error) {
    console.error('Erreur de récupération des données FreeCrypto:', error);
    return [];
  }
};

// Fonction pour récupérer les données des actions
const fetchFinnhubData = async () => {
  if (!FINNHUB_STOCKS_API_KEY) {
    console.error('La clé API Finnhub est manquante.');
    return [];
  }
  
  // Exemple de symboles d'actions
  const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
  const stockData = [];

  for (const symbol of stocks) {
    try {
      // Endpoint pour les cotations en temps réel
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const data = await fetchWithRetry(url);
      
      // Endpoint pour les profils de l'entreprise (pour le nom)
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const profileData = await fetchWithRetry(profileUrl);

      stockData.push({
        symbol: symbol,
        name: profileData.name || symbol,
        price: data.c,
        change24h: data.dp, // dp = pourcentage de changement quotidien
        marketCap: profileData.marketCapitalization,
        volume24h: data.v,
        type: 'stock',
      });
    } catch (error) {
      console.error(`Erreur de récupération des données Finnhub pour ${symbol}:`, error);
    }
  }
  return stockData;
};

// Fonction principale qui gère le cache et les appels API
const fetchDataAndCache = async () => {
  const currentTime = Date.now();
  
  // Vérification du cache des API
  if (currentTime - apiCache.timestamp < API_CACHE_TTL * 1000) {
    console.log('Utilisation du cache API existant.');
    return apiCache.data;
  }
  
  // Si le cache est expiré, on fait les appels API
  console.log('Cache API expiré, récupération de nouvelles données...');
  const [cryptoData, stockData] = await Promise.all([
    fetchFreeCryptoData(),
    fetchFinnhubData(),
  ]);

  // On combine les données en un seul tableau
  const combinedData = [...cryptoData, ...stockData];

  // Mise à jour du cache API
  apiCache.data = combinedData;
  apiCache.timestamp = currentTime;

  return combinedData;
};

// Handler de la fonction serverless Vercel
export default async function handler(req, res) {
  const currentTime = Date.now();
  
  // Vérification du cache global (30s)
  if (currentTime - globalCache.timestamp < GLOBAL_CACHE_TTL * 1000) {
    console.log('Cache global valide, renvoi des données.');
    return res.status(200).json(globalCache.data);
  }
  
  // Si le cache global est invalide, on récupère les données via le cache des API
  console.log('Cache global expiré, récupération des données via fetchDataAndCache.');
  try {
    const data = await fetchDataAndCache();
    
    // Mise à jour du cache global
    globalCache.data = data;
    globalCache.timestamp = currentTime;

    // Renvoi des données au client
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur fatale dans le handler:', error);
    return res.status(500).json({ error: 'Échec de la récupération des données du marché.', message: error.message });
  }
}

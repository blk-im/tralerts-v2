// Cette fonction serverless récupère les données de marché (crypto et actions).
// Elle utilise un cache double niveau pour optimiser les appels externes et la performance Vercel.

const fetch = require('node-fetch'); // Utilisation de require pour Node.js/CommonJS
const URLSearchParams = require('url').URLSearchParams; // Module Node.js intégré

// --- 1. Variables d'Environnement (CLÉS API MISES À JOUR) ---
// La clé API pour les cryptomonnaies
const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY; 
// La clé API pour les actions (Finnhub)
const FINNHUB_API_KEY = process.env.FINNHUB_NEWS_API_KEY; // NOM DE LA CLÉ CORRIGÉ ICI

// --- 2. Configuration du Cache en Mémoire ---
let globalCache = {
  data: null,
  timestamp: 0,
};
let apiCache = {
  data: null,
  timestamp: 0,
};

// Durées de vie des caches en secondes
const GLOBAL_CACHE_TTL = 30; // Cache utilisé pour le frontend (le frontend appelle toutes les 30s)
const API_CACHE_TTL = 244;  // Cache des données API externes (pour limiter les appels Finnhub/FreeCrypto)

// --- 3. Fonctions Utilitaire ---

// Fonction de récupération avec gestion des erreurs et réessais (Exponential Backoff)
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        // Log l'erreur HTTP spécifique pour le débogage
        console.error(`Erreur HTTP pour ${url}: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erreur de fetch pour ${url}, tentative ${i + 1}/${retries}:`, error.message);
      if (i < retries - 1) {
        // Attendre 1s, 2s, 4s... avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error; // Échec final
      }
    }
  }
};

// --- 4. Fonctions de Récupération de Données Spécifiques ---

const fetchFreeCryptoData = async () => {
  if (!FREECRYPTO_API_KEY) {
    console.error('La clé API FreeCrypto est manquante. Retourne un tableau vide.');
    return [];
  }
  // URL FreeCrypto confirmée
  const url = `https://api.freecryptoapi.com/v1/coins?key=${FREECRYPTO_API_KEY}`;
  try {
    const data = await fetchWithRetry(url);
    // S'assurer que 'data' est un tableau avant de mapper
    if (!Array.isArray(data)) {
      console.error('Format de réponse FreeCrypto inattendu. Retourne un tableau vide.');
      return [];
    }
    return data.map(crypto => ({
      symbol: crypto.symbol,
      name: crypto.name,
      price: crypto.price_usd,
      change24h: crypto.percent_change_24h,
      marketCap: crypto.market_cap,
      type: 'crypto',
    }));
  } catch (error) {
    console.error('Erreur de récupération des données FreeCrypto. Retourne un tableau vide.', error);
    return [];
  }
};

const fetchFinnhubData = async () => {
  // Utilisation de la clé d'API corrigée
  if (!FINNHUB_API_KEY) {
    console.error('La clé API Finnhub est manquante. Retourne un tableau vide.');
    return [];
  }
  const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
  const stockData = [];

  for (const symbol of stocks) {
    try {
      // 1. Récupération des prix
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const quoteData = await fetchWithRetry(quoteUrl);
      
      // 2. Récupération des informations de profil (pour le nom et la market cap)
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
      const profileData = await fetchWithRetry(profileUrl);
      
      stockData.push({
        symbol: symbol,
        name: profileData.name || symbol,
        price: quoteData.c, // Prix courant
        change24h: quoteData.dp, // Changement en pourcentage
        marketCap: profileData.marketCapitalization, // Capitalisation boursière
        volume24h: quoteData.v, // Volume
        type: 'stock',
      });
    } catch (error) {
      console.error(`Erreur de récupération des données Finnhub pour ${symbol}.`, error);
    }
  }
  return stockData;
};

// --- 5. Logique de Cache API (Niveau 2) ---

const fetchDataAndCache = async () => {
  const currentTime = Date.now();
  // Vérifie si le cache des API externes est encore valide
  if (currentTime - apiCache.timestamp < API_CACHE_TTL * 1000) {
    console.log('Utilisation du cache API (244s) existant. Pas de requêtes externes.');
    return apiCache.data;
  }
  console.log('Cache API (244s) expiré, récupération de nouvelles données externes...');

  // Lance les deux récupérations d'API en parallèle
  const [cryptoData, stockData] = await Promise.all([
    fetchFreeCryptoData(),
    fetchFinnhubData(),
  ]);

  const combinedData = [...cryptoData, ...stockData].filter(item => item.price !== undefined); // Filtrer les entrées sans prix valide
  apiCache.data = combinedData;
  apiCache.timestamp = currentTime;

  return combinedData;
};

// --- 6. Handler de la Fonction Serverless (Niveau 1 - Cache Global) ---

module.exports = async function handler(req, res) {
  // S'assurer que seule la méthode GET est autorisée
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Seules les requêtes GET sont acceptées sur cette API.' });
  }
  
  const currentTime = Date.now();
  
  // Vérifie si le cache global (30s) est encore valide
  if (currentTime - globalCache.timestamp < GLOBAL_CACHE_TTL * 1000) {
    console.log('Cache global (30s) valide, renvoi des données instantané.');
    // Envoie la réponse du cache global
    return res.status(200).json(globalCache.data);
  }
  
  console.log('Cache global (30s) expiré, exécution de fetchDataAndCache...');
  
  try {
    // Récupère les données (cela va soit utiliser le cache API de 244s, soit appeler les API externes)
    const data = await fetchDataAndCache();
    
    // Met à jour le cache global (30s) avec les données fraîches
    globalCache.data = data;
    globalCache.timestamp = currentTime;
    
    // Renvoie les données
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur fatale dans le handler de la fonction Vercel:', error);
    // En cas d'échec total (les deux caches sont invalides et les API ne répondent pas)
    return res.status(500).json({ error: 'Échec de la récupération des données du marché.', message: error.message });
  }
};

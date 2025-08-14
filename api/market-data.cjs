// Cette fonction serverless a été renommée en .cjs pour forcer Vercel à utiliser la syntaxe CommonJS.
// Cela résout l'erreur de module 'exports is not defined'.

const fetch = require('node-fetch'); // Utilisation de require pour le fetch
const URLSearchParams = require('url').URLSearchParams;

// Récupération des clés d'API depuis les variables d'environnement Vercel
const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;

// Définition des caches en mémoire avec un timestamp pour la validité
let globalCache = {
  data: null,
  timestamp: 0,
};
let apiCache = {
  data: null,
  timestamp: 0,
};

const GLOBAL_CACHE_TTL = 30;
const API_CACHE_TTL = 244;

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
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
};

const fetchFreeCryptoData = async () => {
  if (!FREECRYPTO_API_KEY) {
    console.error('La clé API FreeCrypto est manquante.');
    return [];
  }
  const url = `https://api.freecryptoapi.com/v1/coins?key=${FREECRYPTO_API_KEY}`;
  try {
    const data = await fetchWithRetry(url);
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

const fetchFinnhubData = async () => {
  if (!FINNHUB_STOCKS_API_KEY) {
    console.error('La clé API Finnhub est manquante.');
    return [];
  }
  const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
  const stockData = [];

  for (const symbol of stocks) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const data = await fetchWithRetry(url);
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const profileData = await fetchWithRetry(profileUrl);
      stockData.push({
        symbol: symbol,
        name: profileData.name || symbol,
        price: data.c,
        change24h: data.dp,
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

const fetchDataAndCache = async () => {
  const currentTime = Date.now();
  if (currentTime - apiCache.timestamp < API_CACHE_TTL * 1000) {
    console.log('Utilisation du cache API existant.');
    return apiCache.data;
  }
  console.log('Cache API expiré, récupération de nouvelles données...');
  const [cryptoData, stockData] = await Promise.all([
    fetchFreeCryptoData(),
    fetchFinnhubData(),
  ]);

  const combinedData = [...cryptoData, ...stockData];
  apiCache.data = combinedData;
  apiCache.timestamp = currentTime;

  return combinedData;
};

// Handler de la fonction serverless Vercel en CommonJS
module.exports = async function handler(req, res) {
  const currentTime = Date.now();
  if (currentTime - globalCache.timestamp < GLOBAL_CACHE_TTL * 1000) {
    console.log('Cache global valide, renvoi des données.');
    return res.status(200).json(globalCache.data);
  }
  console.log('Cache global expiré, récupération des données via fetchDataAndCache.');
  try {
    const data = await fetchDataAndCache();
    globalCache.data = data;
    globalCache.timestamp = currentTime;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur fatale dans le handler:', error);
    return res.status(500).json({ error: 'Échec de la récupération des données du marché.', message: error.message });
  }
};

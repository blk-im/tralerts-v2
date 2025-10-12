const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const CRYPTOAPIS_KEY = process.env.CRYPTOAPIS_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS_CRYPTO = 26;

const TOP_CRYPTOS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX',
  'SHIB', 'LTC', 'TRX', 'UNI', 'ATOM', 'ETC', 'LINK', 'XMR', 'BCH', 'XLM'
];

function getCacheKey(symbol) {
  return `CRYPTO-${symbol.toUpperCase()}`;
}

// LOG: clé utilisée
console.log('CRYPTOAPIS_KEY:', CRYPTOAPIS_KEY && CRYPTOAPIS_KEY.slice(0,8)+"...");

// --- LOGGÉ À CHAQUE APPEL CRYPTO ---
async function fetchCryptoAssetDetails(symbol) {
  const url = `https://rest.cryptoapis.io/v2/assets/${symbol}`;
  console.log(`APPEL api details: ${url}`);
  const resp = await fetch(url, {
    headers: { "X-API-Key": CRYPTOAPIS_KEY }
  });
  const json = await resp.json();
  console.log(`Réponse détails ${symbol}:`, JSON.stringify(json).slice(0,200)); // log tronqué
  return json.data?.item || null;
}

async function fetchCryptoExchangeRate(symbol) {
  const url = `https://rest.cryptoapis.io/v2/exchange-rates/by-asset-symbols?fromAssetSymbol=${symbol}&toAssetSymbol=USD`;
  console.log(`APPEL api rate: ${url}`);
  const resp = await fetch(url, {
    headers: { "X-API-Key": CRYPTOAPIS_KEY }
  });
  const json = await resp.json();
  console.log(`Réponse taux ${symbol}:`, JSON.stringify(json).slice(0,200));
  return json.data?.item || null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  let results = [];
  for (const symbol of TOP_CRYPTOS) {
    const cacheKey = getCacheKey(symbol);

    // LOG: vérification du cache
    console.log('[CACHE] Recherche pour:', cacheKey);
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) { 
        cachedData = data; 
        console.log(`[CACHE HIT] ${symbol}:`, data);
      }
    } catch (err) {
      console.log(`[CACHE ERROR] ${symbol}:`, err.message || err);
    }

    if (cachedData) {
      results.push({ ...cachedData, type: 'crypto', symbol });
      continue;
    }

    try {
      const [assetDetails, exchangeRate] = await Promise.all([
        fetchCryptoAssetDetails(symbol),
        fetchCryptoExchangeRate(symbol)
      ]);
      if (!assetDetails || !exchangeRate) {
        console.log(`[API] Pas de data pour ${symbol}: assetDetails`, !!assetDetails, 'exchangeRate', !!exchangeRate);
        continue;
      }
      const specificData = assetDetails.specificData || {};

      const item = {
        symbol,
        name: assetDetails.name,
        price: exchangeRate.rate ? parseFloat(exchangeRate.rate) : null,
        change24h: specificData['24HoursPriceChangeInPercentage'] ? parseFloat(specificData['24HoursPriceChangeInPercentage']) : null,
        volume24h: specificData['24HoursTradingVolume'] ? parseFloat(specificData['24HoursTradingVolume']) : null,
        marketCap: specificData['marketCapInUSD'] ? parseFloat(specificData['marketCapInUSD']) : null,
        type: 'crypto'
      };

      // LOG: data envoyée dans le cache
      console.log(`[CACHE SET] ${symbol}:`, item);

      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: item,
          cache_duration_seconds: CACHE_TTL_SECONDS_CRYPTO,
        });
      } catch (err) {
        console.log(`[CACHE WRITE ERROR] ${symbol}:`, err.message || err);
      }

      results.push(item);
    } catch (error) {
      console.log(`[API ERROR] ${symbol}:`, error.message || error);
    }
  }

  console.log('[RETOUR FINAL] Nombre de cryptos:', results.length);
  res.status(200).json(results);
};

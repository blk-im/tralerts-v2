const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
//
const CRYPTOAPIS_KEY = process.env.CRYPTOAPIS_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS_CRYPTO = 26;

const TOP_CRYPTOS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX',
  'SHIB', 'LTC', 'TRX', 'UNI', 'ATOM', 'ETC', 'LINK', 'XMR', 'BCH', 'XLM'
];

// LOG: clé utilisée
console.log('CRYPTOAPIS_KEY:', CRYPTOAPIS_KEY && CRYPTOAPIS_KEY.slice(0,8)+"...");

// Fonctions utilitaires pour le cache Supabase TABLE crypto
async function getCryptoCache(symbol) {
  const { data, error } = await supabase
    .from('market_price_cache_crypto')
    .select('*')
    .eq('symbol', symbol)
    .single();
  if (error) console.log(`[CACHE ERROR] ${symbol}:`, error.message);
  // Vérifie la fraîcheur: si la ligne existe et < TTL, retourne le cache
  if (data && data.updated_at) {
    const updatedAt = new Date(data.updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt < CACHE_TTL_SECONDS_CRYPTO * 1000) {
      console.log(`[CACHE HIT] ${symbol}:`, data);
      return data;
    }
  }
  return null;
}

async function setCryptoCache(row) {
  row.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from('market_price_cache_crypto')
    .upsert([row], { onConflict: ['symbol'] });
  if (error) console.log(`[CACHE WRITE ERROR] ${row.symbol}:`, error.message);
}

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
    let cachedData = await getCryptoCache(symbol);

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

      console.log(`[CACHE SET] ${symbol}:`, item);
      await setCryptoCache(item);

      results.push(item);
    } catch (error) {
      console.log(`[API ERROR] ${symbol}:`, error.message || error);
    }
  }

  console.log('[RETOUR FINAL] Nombre de cryptos:', results.length);
  res.status(200).json(results);
};

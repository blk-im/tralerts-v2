const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const CRYPTOAPIS_KEY = process.env.CRYPTOAPIS_KEY; // Stocké côté Vercel
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// -- Config --
const CACHE_TTL_SECONDS_CRYPTO = 26;
const CACHE_TTL_SECONDS_STOCK = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];

// Helper pour cache
function getCacheKey(type, symbol) {
  return `${type.toUpperCase()}-${symbol.toUpperCase()}`;
}

// --- CRYPTOS (CryptoAPIs) ---
async function fetchTrendingCryptos() {
  const url = `https://rest.cryptoapis.io/market-data/assets?limit=50`;
  const resp = await fetch(url, {
    headers: { "X-API-Key": CRYPTOAPIS_KEY }
  });
  const json = await resp.json();
  return (json.data && json.data.items) ? json.data.items : [];
}

async function fetchAndCacheCryptoPrices() {
  let cryptos = [];
  let results = [];

  try {
    cryptos = await fetchTrendingCryptos();
    console.log("DEBUG CRYPTOAPIS cryptos", cryptos);
  } catch (err) {
    cryptos = [];
    console.error("DEBUG CRYPTOAPIS erreur fetch", err);
  }

  for (const tkn of cryptos) {
    const symbol = tkn.assetSymbol || tkn.symbol || null;
    const name = tkn.assetName || tkn.name || symbol;
    if (!symbol) continue;
    const cacheKey = getCacheKey('crypto', symbol);

    // Essai cache Supabase
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch {}

    if (cachedData) {
      results.push({ ...cachedData, type: 'crypto', symbol, name });
      continue;
    }

    // Champs principaux CryptoAPIs standardisés
    const priceUsd = tkn.assetLatestRate && tkn.assetLatestRate.rate ? +tkn.assetLatestRate.rate : null;
    const marketCap = tkn.marketCapUsd || tkn.assetMarketCapUsd || null;
    const volume24h = tkn.assetVolumeLast24h || tkn.volume24h || null;
    const change24h = tkn.assetLatestRate && tkn.assetLatestRate.percentChange24h
      ? +tkn.assetLatestRate.percentChange24h
      : null;

    const item = {
      symbol,
      name,
      type: 'crypto',
      price: priceUsd,
      change24h,
      volume24h,
      marketCap,
      // Ajoute ici d'autres infos si dispo (platform, url, assetType, etc)
    };

    try {
      await supabase.rpc('set_market_price_cache', {
        cache_key: cacheKey,
        price_data: item,
        cache_duration_seconds: CACHE_TTL_SECONDS_CRYPTO,
      });
    } catch {}

    results.push(item);
  }

  return results;
}

// --- STOCKS (Finnhub + cache Supabase, inchangé) ---
async function fetchAndCacheStockPrices() {
  let results = [];
  for (const symbol of stocks) {
    const type = 'stock';
    const cacheKey = getCacheKey(type, symbol);

    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch {}

    if (cachedData) {
      results.push({ symbol, type, ...cachedData });
      continue;
    }

    let priceData = null;
    try {
      const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const quoteResp = await fetch(quoteUrl);
      const quote = await quoteResp.json();
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_STOCKS_API_KEY}`;
      const profileResp = await fetch(profileUrl);
      const profile = await profileResp.json();

      priceData = {
        price: quote.c,
        change24h: quote.dp,
        marketCap: profile.marketCapitalization || null,
        volume: quote.v
      };
    } catch {
      priceData = null;
    }

    if (priceData) {
      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: priceData,
          cache_duration_seconds: CACHE_TTL_SECONDS_STOCK,
        });
      } catch {}
      results.push({ symbol, type, ...priceData });
    } else {
      results.push({ symbol, type, error: 'No data found' });
    }
  }
  return results;
}

// --- Handler API ---
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const [cryptoPrices, stockPrices] = await Promise.all([
      fetchAndCacheCryptoPrices(),
      fetchAndCacheStockPrices()
    ]);
    res.status(200).json([...cryptoPrices, ...stockPrices]);
  } catch (error) {
    console.error('Erreur fatale backend:', error);
    res.status(500).json({ error: 'Échec backend', message: error.message });
  }
};

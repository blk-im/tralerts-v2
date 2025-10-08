const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// -- Config --
const CACHE_TTL_SECONDS_CRYPTO = 17;
const CACHE_TTL_SECONDS_STOCK = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];

// Helper pour cache
function getCacheKey(type, symbol) {
  return `${type.toUpperCase()}-${symbol.toUpperCase()}`;
}

// --- CRYPTOS (DEXScreener Trending) ---
async function fetchTrendingCryptos() {
  const url = `https://api.dexscreener.com/latest/dex/tokens/trending`;
  const resp = await fetch(url);
  const json = await resp.json();
  return json.pairs || [];
}

async function fetchAndCacheCryptoPrices() {
  let cryptos = [];
  let results = [];

  try {
    cryptos = await fetchTrendingCryptos();
    // LOG DEBUG TOUTE LA LISTE DES CRYPTOS RECUPEREES
    console.log("DEBUG DEXSCREENER cryptos", cryptos);
  } catch (err) {
    cryptos = [];
    console.error("DEBUG DEXSCREENER erreur fetch", err);
  }

  // Pour limiter l'affichage (modifie le slice si besoin)
  for (const token of cryptos.slice(0, 50)) {
    // Nom du token (normalisation)
    const symbol =
      token.baseToken && token.baseToken.symbol
        ? token.baseToken.symbol
        : token.token && token.token.symbol
        ? token.token.symbol
        : null;
    if (!symbol) continue;
    const cacheKey = getCacheKey('CRYPTO', symbol);

    // Essai cache Supabase
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch {}

    if (cachedData) {
      results.push({ ...cachedData, type: 'CRYPTO', symbol, name: token.baseToken.name });
      continue;
    }

    // Compose la data
    const priceUsd = token.priceUsd || null;
    const change24h = token.priceChange && token.priceChange.h24;
    const volume24h = token.volume && token.volume.h24;
    const marketCap = token.marketCap || null;
    const name = token.baseToken.name || symbol;

    const item = {
      symbol,
      name,
      type: 'CRYPTO',
      price: priceUsd ? parseFloat(priceUsd) : null,
      change24h: change24h ? parseFloat(change24h) : null,
      volume24h: volume24h ? parseFloat(volume24h) : null,
      marketCap: marketCap ? parseFloat(marketCap) : null,
      chainId: token.chainId,
      dexId: token.dexId,
      url: token.url
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

// --- STOCKS (Finnhub + cache Supabase) ---
async function fetchAndCacheStockPrices() {
  let results = [];
  for (const symbol of stocks) {
    const type = 'STOCK';
    const cacheKey = getCacheKey(type, symbol);

    // Essai cache Supabase
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
    // LOG DEBUG REPONSE COMPLETE
    console.log("DEBUG /api/market-data final", [...cryptoPrices, ...stockPrices]);
    res.status(200).json([...cryptoPrices, ...stockPrices]);
  } catch (error) {
    console.error('Erreur fatale backend:', error);
    res.status(500).json({ error: 'Échec backend', message: error.message });
  }
};

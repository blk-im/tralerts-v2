const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const CRYPTOAPIS_KEY = process.env.CRYPTOAPIS_KEY;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS_CRYPTO = 26;
const CACHE_TTL_SECONDS_STOCK = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];

// Liste des top cryptos à récupérer
const TOP_CRYPTOS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'DOGE', 'MATIC', 'SOL', 'DOT', 'AVAX',
  'SHIB', 'LTC', 'TRX', 'UNI', 'ATOM', 'ETC', 'LINK', 'XMR', 'BCH', 'XLM'
];

function getCacheKey(type, symbol) {
  return `${type.toUpperCase()}-${symbol.toUpperCase()}`;
}

// -- CRYPTOS (nouvelle méthode asset par asset) --
async function fetchCryptoAssetDetails(symbol) {
  const url = `https://rest.cryptoapis.io/v2/assets/${symbol}`;
  const resp = await fetch(url, {
    headers: { "X-API-Key": CRYPTOAPIS_KEY }
  });
  const json = await resp.json();
  return json.data?.item || null;
}

async function fetchCryptoExchangeRate(symbol) {
  const url = `https://rest.cryptoapis.io/v2/exchange-rates/by-asset-symbols?fromAssetSymbol=${symbol}&toAssetSymbol=USD`;
  const resp = await fetch(url, {
    headers: { "X-API-Key": CRYPTOAPIS_KEY }
  });
  const json = await resp.json();
  return json.data?.item || null;
}

async function fetchAndCacheCryptoPrices() {
  let results = [];

  for (const symbol of TOP_CRYPTOS) {
    const cacheKey = getCacheKey('crypto', symbol);

    // Essai cache
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch {}

    if (cachedData) {
      results.push({ ...cachedData, type: 'crypto', symbol });
      continue;
    }

    try {
      // Détail asset + taux USD
      const [assetDetails, exchangeRate] = await Promise.all([
        fetchCryptoAssetDetails(symbol),
        fetchCryptoExchangeRate(symbol)
      ]);

      if (!assetDetails || !exchangeRate) continue;

      const specificData = assetDetails.specificData || {};

      const item = {
        symbol,
        name: assetDetails.name,
        type: 'crypto',
        price: exchangeRate.rate ? parseFloat(exchangeRate.rate) : null,
        change24h: specificData['24HoursPriceChangeInPercentage'] ? parseFloat(specificData['24HoursPriceChangeInPercentage']) : null,
        volume24h: specificData['24HoursTradingVolume'] ? parseFloat(specificData['24HoursTradingVolume']) : null,
        marketCap: specificData['marketCapInUSD'] ? parseFloat(specificData['marketCapInUSD']) : null,
      };

      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: item,
          cache_duration_seconds: CACHE_TTL_SECONDS_CRYPTO,
        });
      } catch {}

      results.push(item);
    } catch (error) {
      console.error(`Erreur pour ${symbol}:`, error);
    }
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

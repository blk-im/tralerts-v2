const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
const cryptos = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']; // Binance symbols

function getCacheKey(type, symbol) {
  return `${type.toUpperCase()}-${symbol.toUpperCase()}`;
}

async function fetchAndCachePrices() {
  let results = [];

  // ---- CRYPTOS (Binance + cache Supabase) ----
  for (const symbol of cryptos) {
    const type = 'CRYPTO';
    const cacheKey = getCacheKey(type, symbol);

    // 1. Tenter le cache
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch (err) {
      console.error('SUPABASE CACHE error (get)', symbol, err);
    }

    if (cachedData) {
      results.push({ symbol, type, ...cachedData });
      continue;
    }

    // 2. Si pas le cache, fetch Binance
    let item = { symbol, type };
    try {
      const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
      const resp = await fetch(url);
      const data = await resp.json();
      console.log('DEBUG BINANCE', symbol, data);

      if (data && data.lastPrice) {
        item.price = parseFloat(data.lastPrice);
        item.change24h = parseFloat(data.priceChangePercent);
        item.volume24h = parseFloat(data.volume);
        item.marketCap = null;
        // 3. Stocker dans le cache
        try {
          await supabase.rpc('set_market_price_cache', {
            cache_key: cacheKey,
            price_data: {
              price: item.price,
              change24h: item.change24h,
              marketCap: null,
              volume24h: item.volume24h
            },
            cache_duration_seconds: CACHE_TTL_SECONDS,
          });
        } catch (err) {
          console.error('SUPABASE CACHE error (set)', symbol, err);
        }
      } else {
        item.error = 'No data found';
      }
    } catch (err) {
      console.error('CRYPTO fetch error', symbol, err);
      item.error = 'No data found';
    }
    results.push(item);
  }

  // ---- STOCKS (Finnhub + cache Supabase) ----
  for (const symbol of stocks) {
    const type = 'STOCK';
    const cacheKey = getCacheKey(type, symbol);

    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch (err) {
      console.error('SUPABASE CACHE error (get-stocks)', symbol, err);
    }

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
    } catch (err) {
      priceData = null;
      console.error('STOCK fetch error', symbol, err);
    }

    if (priceData) {
      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: priceData,
          cache_duration_seconds: CACHE_TTL_SECONDS,
        });
      } catch (err) {
        console.error('SUPABASE CACHE error (set-stocks)', symbol, err);
      }
      results.push({ symbol, type, ...priceData });
    } else {
      results.push({ symbol, type, error: 'No data found' });
    }
  }

  return results;
}

// Handler Vercel API
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const allPrices = await fetchAndCachePrices();
    res.status(200).json(allPrices);
  } catch (error) {
    console.error('Erreur fatale backend:', error);
    res.status(500).json({ error: 'Échec backend', message: error.message });
  }
};

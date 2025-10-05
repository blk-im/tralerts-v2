const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS = 30;

const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
const cryptos = ['BTC', 'ETH', 'SOL', 'BNB', 'ADA'];

const getCacheKey = (type, symbol) => `${type.toUpperCase()}-${symbol.toUpperCase()}`;

async function fetchAndCachePrices() {
  let results = [];

  for (const symbol of [...stocks, ...cryptos]) {
    const type = stocks.includes(symbol) ? 'STOCK' : 'CRYPTO';
    const cacheKey = getCacheKey(type, symbol);

    // 1. Lire depuis Supabase (cache partagé)
    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch (err) {
      // ignore juste erreur cache
    }

    if (cachedData) {
      results.push({ symbol, type, ...cachedData });
      continue;
    }

    // 2. Fetch API externe si cache absent/expiré
    let priceData = null;

    if (type === 'CRYPTO') {
      try {
        const url = `https://api.freecryptoapi.com/v1/coins?key=${FREECRYPTO_API_KEY}`;
        const resp = await fetch(url);
        const rawData = await resp.json();
        const coin = rawData.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
        if (coin) {
          priceData = {
            price: coin.price_usd,
            marketCap: coin.market_cap,
            volume: coin.volume_24h,
            change24h: coin.percent_change_24h
          };
        }
      } catch (err) {
        priceData = null;
      }
    } else {
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
      }
    }

    // 3. Stockage du nouveau cache dans Supabase
    if (priceData) {
      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: priceData,
          cache_duration_seconds: CACHE_TTL_SECONDS,
        });
      } catch (err) {}
      results.push({ symbol, type, ...priceData });
    } else {
      results.push({ symbol, type, error: 'No data found' });
    }
  }

  return results;
}

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

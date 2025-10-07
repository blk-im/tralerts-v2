const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const FREECRYPTO_API_KEY = process.env.FREECRYPTOAPI_KEY;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];
const cryptos = [
  '$AI',      // source: bitget
  '$ALT',     // source: bitget
  '$DEGEN',   // source: bitget
  '0G',       // source: binance
  '1000CAT',  // source: binance
  '1000CHEEMS',// source: binance
  '1000SATS', // source: binance
  '10SET',    // source: gateio
  '1CAT',     // source: gateio
  '1DOLLAR'   // source: gateio
];

const getCacheKey = (type, symbol) => `${type.toUpperCase()}-${symbol.toUpperCase()}`;

async function fetchAndCachePrices() {
  let results = [];
  const cryptoSymbols = cryptos.join('+');
  let cryptoDataRaw = null;
  try {
    const cryptoCacheKey = 'CRYPTO-BATCH';
    let { data: cachedCryptoBatch } = await supabase.rpc('get_market_price_from_cache', { cache_key: cryptoCacheKey });
    if (cachedCryptoBatch) {
      cryptoDataRaw = cachedCryptoBatch;
    } else {
      const url = `https://api.freecryptoapi.com/v1/getData?symbol=${cryptoSymbols}`;
      const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${FREECRYPTO_API_KEY}` }
      });
      cryptoDataRaw = await resp.json();
      console.log("RAW FreeCryptoAPI:", cryptoDataRaw);
      await supabase.rpc('set_market_price_cache', {
        cache_key: cryptoCacheKey,
        price_data: cryptoDataRaw,
        cache_duration_seconds: CACHE_TTL_SECONDS,
      });
    }
  } catch (err) {
    cryptoDataRaw = null;
  }

  // Extraction des cryptos
  if (cryptoDataRaw && cryptoDataRaw.symbols && Array.isArray(cryptoDataRaw.symbols)) {
    for (const symbol of cryptos) {
      let item = { symbol, type: 'CRYPTO' };
      const symbolData = cryptoDataRaw.symbols.find((c) => c.symbol?.toUpperCase() === symbol.toUpperCase());
      if (symbolData) {
        item.price = symbolData.price_usd ?? null;
        item.marketCap = symbolData.market_cap ?? null;
        item.volume24h = symbolData.volume_24h ?? null;
        item.change24h = symbolData.percent_change_24h ?? null;
      } else {
        item.error = 'No data found';
      }
      results.push(item);
    }
  } else {
    for (const symbol of cryptos) {
      results.push({ symbol, type: 'CRYPTO', error: 'No data found' });
    }
  }

  // Actions (Finnhub)
  for (const symbol of stocks) {
    const type = 'STOCK';
    const cacheKey = getCacheKey(type, symbol);

    let cachedData = null;
    try {
      const { data } = await supabase.rpc('get_market_price_from_cache', { cache_key: cacheKey });
      if (data) cachedData = data;
    } catch (err) { }

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
    }

    if (priceData) {
      try {
        await supabase.rpc('set_market_price_cache', {
          cache_key: cacheKey,
          price_data: priceData,
          cache_duration_seconds: CACHE_TTL_SECONDS,
        });
      } catch (err) { }
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

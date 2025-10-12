const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS_STOCK = 30;
const stocks = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA'];

// Fonctions utilitaires pour cache Supabase TABLE stock
async function getStockCache(symbol) {
  const { data, error } = await supabase
    .from('market_price_cache_stock')
    .select('*')
    .eq('symbol', symbol)
    .single();
  if (error) console.log(`[CACHE ERROR] ${symbol}:`, error.message);
  // Vérifie la fraîcheur: si la ligne existe et < TTL, retourne le cache
  if (data && data.updated_at) {
    const updatedAt = new Date(data.updated_at).getTime();
    const now = Date.now();
    if (now - updatedAt < CACHE_TTL_SECONDS_STOCK * 1000) {
      console.log(`[CACHE HIT] ${symbol}:`, data);
      return data;
    }
  }
  return null;
}

async function setStockCache(row) {
  row.updated_at = new Date().toISOString();
  const { error } = await supabase
    .from('market_price_cache_stock')
    .upsert([row], { onConflict: ['symbol'] });
  if (error) console.log(`[CACHE WRITE ERROR] ${row.symbol}:`, error.message);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  let results = [];
  for (const symbol of stocks) {
    let cachedData = await getStockCache(symbol);

    if (cachedData) {
      results.push({ symbol, type: 'stock', ...cachedData });
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
      console.log(`[API ERROR] ${symbol}:`, err && err.message || err);
    }

    if (priceData) {
      await setStockCache({ symbol, ...priceData });
      results.push({ symbol, type: 'stock', ...priceData });
    } else {
      results.push({ symbol, type: 'stock', error: 'No data found' });
    }
  }
  res.status(200).json(results);
};

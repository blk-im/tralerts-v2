// API endpoint pour récupérer les données crypto via CoinGecko (top 100)
// Utilise CoinGecko API gratuite (pas de clé requise) + cache Supabase

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_TTL_SECONDS = 60; // Cache de 60 secondes
const CACHE_ID = 'crypto_top_100'; // ID unique pour le cache global

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Vérifier le cache Supabase
    const { data: cached } = await supabase
      .from('market_price_cache_crypto')
      .select('*')
      .eq('id', CACHE_ID)
      .single();

    const now = Date.now();
    if (cached && cached.updated_at) {
      const cacheAge = now - new Date(cached.updated_at).getTime();
      if (cacheAge < CACHE_TTL_SECONDS * 1000) {
        console.log('[CACHE HIT] Crypto data from cache');
        return res.status(200).json(JSON.parse(cached.data));
      }
    }

    console.log('[CACHE MISS] Fetching from CoinGecko API...');

    // 2. Appeler CoinGecko pour récupérer le top 100
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const rawData = await response.json();

    // 3. Formater les données
    const formattedData = rawData.map(crypto => ({
      symbol: crypto.symbol.toUpperCase(),
      name: crypto.name,
      price: crypto.current_price,
      change24h: crypto.price_change_percentage_24h,
      volume24h: crypto.total_volume,
      marketCap: crypto.market_cap,
      rank: crypto.market_cap_rank,
      image: crypto.image,
      high24h: crypto.high_24h,
      low24h: crypto.low_24h,
      circulatingSupply: crypto.circulating_supply,
      type: 'crypto'
    }));

    console.log(`[SUCCESS] Fetched ${formattedData.length} cryptos from CoinGecko`);

    // 4. Mettre en cache dans Supabase
    await supabase
      .from('market_price_cache_crypto')
      .upsert({
        id: CACHE_ID,
        data: JSON.stringify(formattedData),
        updated_at: new Date().toISOString()
      });

    console.log('[CACHE WRITE] Data cached in Supabase');

    // 5. Retourner les données
    return res.status(200).json(formattedData);

  } catch (error) {
    console.error('[ERROR] Crypto API failed:', error.message);
    return res.status(500).json({ 
      error: 'Erreur lors de la récupération des données crypto',
      details: error.message 
    });
  }
};

import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Assurez-vous d'avoir ces variables d'environnement configurées sur Vercel
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const FREECRYPTO_API_KEY = process.env.FREECRYPTO_API_KEY as string;
const FINNHUB_STOCKS_API_KEY = process.env.FINNHUB_STOCKS_API_KEY as string;

// Initialiser le client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Définir la durée de vie du cache en secondes
const CACHE_DURATION_SECONDS = 60;

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  type: 'crypto' | 'stock';
}

interface PriceData {
  p: number; // price
  d: number; // change
  dp: number; // change percent
  c: number; // current price
  h: number; // high price
  l: number; // low price
  o: number; // open price
  pc: number; // previous close price
  t: number; // timestamp
}

// Fonction pour récupérer les données de l'API FreeCrypto
async function fetchCryptoData(symbol: string): Promise<MarketItem | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erreur de l'API Crypto pour ${symbol}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data[symbol.toLowerCase()]) {
      const item = data[symbol.toLowerCase()];
      return {
        symbol: symbol.toUpperCase(),
        name: symbol, // Nom de la crypto
        price: item.usd,
        change24h: item.usd_24h_change,
        marketCap: item.usd_market_cap,
        volume24h: item.usd_24h_vol,
        type: 'crypto',
      };
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de crypto pour ${symbol}:`, error);
  }
  return null;
}

// Fonction pour récupérer les données de l'API Finnhub
async function fetchStockData(symbol: string): Promise<MarketItem | null> {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_STOCKS_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Erreur de l'API Finnhub pour ${symbol}: ${response.statusText}`);
      return null;
    }
    const data: PriceData = await response.json();
    if (data.c && data.dp) {
      return {
        symbol: symbol.toUpperCase(),
        name: symbol, // Nom de l'action
        price: data.c,
        change24h: data.dp,
        type: 'stock',
      };
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des données d'action pour ${symbol}:`, error);
  }
  return null;
}

// Liste des symboles à surveiller
const marketSymbols = [
  // Cryptos
  { symbol: 'bitcoin', type: 'crypto', name: 'Bitcoin' },
  { symbol: 'ethereum', type: 'crypto', name: 'Ethereum' },
  { symbol: 'solana', type: 'crypto', name: 'Solana' },
  { symbol: 'cardano', type: 'crypto', name: 'Cardano' },
  { symbol: 'binancecoin', type: 'crypto', name: 'Binance Coin' },
  // Actions (Finnhub utilise des symboles standard)
  { symbol: 'AAPL', type: 'stock', name: 'Apple Inc.' },
  { symbol: 'MSFT', type: 'stock', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', type: 'stock', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', type: 'stock', name: 'Amazon.com Inc.' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const allMarketData: MarketItem[] = [];

    // On parcourt chaque symbole
    for (const item of marketSymbols) {
      // Définir une clé de cache unique
      const cacheKey = `${item.type}-${item.symbol}`;

      // 1. Vérifier le cache Supabase
      const { data: cachedPrice, error: getError } = await supabase.rpc('get_market_price_from_cache', {
        cache_key: cacheKey,
      });

      if (getError) {
        console.error('Erreur lors de la récupération du cache :', getError.message);
      }

      let marketItem: MarketItem | null = null;

      if (cachedPrice) {
        // Cache valide trouvé
        marketItem = { ...cachedPrice, name: item.name, type: item.type }; // Ajoutez le nom depuis la config
        console.log(`Cache trouvé pour ${cacheKey}.`);
      } else {
        // Cache expiré ou non trouvé, on fait un appel externe
        console.log(`Cache expiré pour ${cacheKey}. Récupération des données...`);
        if (item.type === 'crypto') {
          marketItem = await fetchCryptoData(item.symbol);
        } else if (item.type === 'stock') {
          marketItem = await fetchStockData(item.symbol);
        }

        // Si on a réussi à récupérer les données, on les met en cache
        if (marketItem) {
          const { error: setError } = await supabase.rpc('set_market_price_cache', {
            cache_key: cacheKey,
            price_data: marketItem,
            cache_duration_seconds: CACHE_DURATION_SECONDS,
          });

          if (setError) {
            console.error(`Erreur lors de la mise en cache de ${cacheKey} :`, setError.message);
          } else {
            console.log(`Données de ${cacheKey} mises en cache.`);
          }
        }
      }

      if (marketItem) {
        allMarketData.push(marketItem);
      }
    }

    // Gérer l'erreur si aucune donnée n'a pu être récupérée
    if (allMarketData.length === 0) {
      return res.status(500).json({ error: 'Aucune donnée de marché n\'a pu être récupérée.' });
    }

    // Réponse au frontend avec la liste complète des données du marché
    return res.status(200).json(allMarketData);
  } catch (error: any) {
    console.error('Erreur globale dans la fonction Vercel :', error.message);
    return res.status(500).json({ error: 'Une erreur interne est survenue.' });
  }
}


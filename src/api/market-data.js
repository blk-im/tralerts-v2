// api/market-data.js

const serverCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Fonctions pour obtenir les noms (pour la cohérence de l'affichage)
const getCryptoName = (symbol) => {
    const names = {
        BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', ADA: 'Cardano', BNB: 'Binance Coin',
        XRP: 'Ripple', DOT: 'Polkadot', DOGE: 'Dogecoin', AVAX: 'Avalanche', MATIC: 'Polygon',
    };
    return names[symbol] || symbol;
};

const getStockName = (symbol) => {
    const names = {
        AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet Inc.', AMZN: 'Amazon.com Inc.',
        TSLA: 'Tesla Inc.', NVDA: 'NVIDIA Corp.', META: 'Meta Platforms', JPM: 'JPMorgan Chase',
        V: 'Visa Inc.', WMT: 'Walmart Inc.',
    };
    return names[symbol] || symbol;
};

// Fonction principale de la fonction serverless
module.exports = async (req, res) => {
    const now = Date.now();
    let fetchedItems = [];

    // Récupération des clés API depuis les variables d'environnement Vercel
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
    // NOUVELLE variable d'environnement pour votre API crypto
    const FREE_CRYPTO_API_KEY = process.env.FREE_CRYPTO_API_KEY;

    // Vérification des clés API
    if (!FINNHUB_API_KEY || !FREE_CRYPTO_API_KEY) {
        console.error("[Serverless] Missing one or more API keys. Check Vercel Environment Variables.");
        return res.status(500).json({ error: "Server API keys are not configured." });
    }

    // URLs de base des APIs externes
    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    const FREE_CRYPTO_API_BASE_URL = 'https://freecryptoapi.com/v1/cryptocurrency';

    // Définition des symboles à récupérer
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const cryptoSymbols = ['BTC', 'ETH', 'SOL', 'ADA', 'BNB'];

    // --- Fonction pour récupérer les données d'une API externe avec cache ---
    const fetchDataWithCache = async (symbol, type) => {
        const cacheKey = `${type}_${symbol}`;
        const cached = serverCache.get(cacheKey);

        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
            console.log(`[Serverless Cache] Using cached data for ${symbol}`);
            return cached.data;
        }

        let item = null;
        try {
            if (type === 'stock') {
                // Appel Finnhub pour les actions
                const response = await fetch(
                    `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
                );
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Serverless] Finnhub Stock API Error for ${symbol}: Status ${response.status}. Body:`, errorText);
                    throw new Error(`Finnhub API returned status ${response.status} for ${symbol}`);
                }
                const quote = await response.json();
                if (!quote || !quote.c) {
                    console.warn(`[Serverless] Finnhub: Missing or invalid data for ${symbol}. Response:`, quote);
                    throw new Error(`Missing/invalid data from Finnhub for ${symbol}`);
                }

                item = {
                    symbol: symbol,
                    name: getStockName(symbol),
                    price: quote.c,
                    change24h: quote.dp ?? 0,
                    type: 'stock',
                };
            } else if (type === 'crypto') {
                // Appel FreeCryptoAPI.com pour les cryptos
                // Point de terminaison supposé, à ajuster si besoin
                const response = await fetch(
                    `${FREE_CRYPTO_API_BASE_URL}/quotes/latest?symbol=${encodeURIComponent(symbol)}&CMC_PRO_API_KEY=${FREE_CRYPTO_API_KEY}`
                );
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Serverless] Crypto API Error for ${symbol}: Status ${response.status}. Body:`, errorText);
                    throw new Error(`Crypto API returned status ${response.status} for ${symbol}`);
                }
                const data = await response.json();

                // Assurez-vous que la structure de la réponse correspond à ce que l'API renvoie
                if (data.data && data.data[symbol] && data.data[symbol].quote.USD.price) {
                    const quote = data.data[symbol].quote.USD;
                    item = {
                        symbol: symbol,
                        name: getCryptoName(symbol),
                        price: quote.price,
                        change24h: quote.percent_change_24h,
                        marketCap: quote.market_cap,
                        volume24h: quote.volume_24h,
                        type: 'crypto',
                    };
                } else {
                    console.warn(`[Serverless] Crypto API: Missing or invalid data for ${symbol}. Response:`, data);
                    throw new Error(`Missing/invalid data from Crypto API for ${symbol}`);
                }
            }

            if (item) {
                serverCache.set(cacheKey, { data: item, timestamp: now });
                return item;
            }
            return null;
        } catch (error) {
            console.error(`[Serverless] Failed to fetch data for ${symbol}:`, error.message);
            return null;
        }
    };

    // Exécuter toutes les requêtes en parallèle
    const allPromises = [
        ...stockSymbols.map(s => fetchDataWithCache(s, 'stock')),
        ...cryptoSymbols.map(s => fetchDataWithCache(s, 'crypto'))
    ];

    const results = await Promise.allSettled(allPromises);

    fetchedItems = results
        .filter(res => res.status === 'fulfilled' && res.value !== null)
        .map(res => res.value);

    if (fetchedItems.length === 0) {
        return res.status(500).json({ error: 'Failed to fetch any valid market data from external APIs. Check logs for details.' });
    }

    res.status(200).json(fetchedItems);
};

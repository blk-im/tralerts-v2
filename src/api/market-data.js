// api/market-data.js

// Importation des modules nécessaires
// 'node-fetch' est généralement disponible par défaut dans les environnements Node.js de Vercel
// ou peut être ajouté via un package.json dans le dossier api/ si nécessaire.
// Pour les fonctions serverless simples, `fetch` global est souvent suffisant.
// const fetch = require('node-fetch'); // Décommenter si 'fetch' n'est pas global

// Le cache en mémoire partagé par les instances réutilisées de la fonction
// Il sera réinitialisé si l'instance de la fonction est "froide" (cold start)
const serverCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Fonctions pour obtenir les noms (peuvent être déplacées dans un fichier utilitaire si vous voulez)
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
// Vercel s'attend à un export par défaut d'une fonction qui prend (req, res)
module.exports = async (req, res) => {
    const now = Date.now();
    let fetchedItems = [];

    // Récupération des clés API depuis les variables d'environnement Vercel
    const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    // URLs de base des APIs externes
    const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

    // Définition des symboles à récupérer
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const cryptoSymbolsForFinnhub = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'BNBUSDT'];

    // --- Fonction pour récupérer les données d'une API externe avec cache ---
    const fetchDataWithCache = async (symbol, type) => {
        const cacheKey = `${type}_${symbol}`;
        const cached = serverCache.get(cacheKey);

        // Vérifier si les données sont en cache et encore valides
        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
            console.log(`[Serverless Cache] Using cached data for ${symbol}`);
            return cached.data;
        }

        let item = null;
        try {
            if (type === 'stock') {
                // Appel Alpha Vantage pour les actions
                const response = await fetch(
                    `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`
                );
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Serverless] Alpha Vantage API Error for ${symbol}: Status ${response.status} - ${response.statusText}. Body:`, errorText);
                    throw new Error(`Alpha Vantage API Error for ${symbol}`);
                }
                const data = await response.json();

                if (data['Global Quote'] && data['Global Quote']['05. price']) {
                    const price = parseFloat(data['Global Quote']['05. price']);
                    const changePercent = parseFloat(data['Global Quote']['10. change percent'].replace('%', '')) || 0;
                    const volume = parseFloat(data['Global Quote']['06. volume']) || undefined;

                    item = {
                        symbol: symbol,
                        name: getStockName(symbol),
                        price: price,
                        change24h: changePercent,
                        volume24h: volume,
                        type: 'stock',
                    };
                } else {
                    console.warn(`[Serverless] Alpha Vantage: Missing or invalid data for ${symbol}. Response:`, data);
                    throw new Error(`Missing or invalid data for ${symbol} (Alpha Vantage)`);
                }
            } else if (type === 'crypto') {
                // Appel Finnhub pour les cryptos
                const apiSymbol = `BINANCE:${symbol}`; // Finnhub format for Binance pairs
                const response = await fetch(
                    `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(apiSymbol)}&token=${FINNHUB_API_KEY}`
                );
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`[Serverless] Finnhub API Error for ${apiSymbol}: Status ${response.status} - ${response.statusText}. Body: ${errorText}`);
                    throw new Error(`Finnhub API Error for ${symbol}`);
                }
                const quote = await response.json();

                if (!quote || Object.keys(quote).length === 0 || !quote.c) {
                    console.warn(`[Serverless] Finnhub: Missing or invalid data for ${symbol}. Response:`, quote);
                    throw new Error(`Missing or invalid data for ${symbol} (Finnhub)`);
                }

                item = {
                    symbol: symbol.replace('USDT', ''), // Afficher le symbole court
                    name: getCryptoName(symbol.replace('USDT', '')),
                    price: quote.c,
                    change24h: quote.dp ?? 0,
                    marketCap: quote.marketCapitalization || undefined,
                    volume24h: quote.v || undefined,
                    type: 'crypto',
                };
            }

            if (item) {
                serverCache.set(cacheKey, { data: item, timestamp: now }); // Mettre en cache sur le serveur
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
        ...cryptoSymbolsForFinnhub.map(s => fetchDataWithCache(s, 'crypto'))
    ];

    const results = await Promise.allSettled(allPromises);

    fetchedItems = results
        .filter(res => res.status === 'fulfilled' && res.value !== null)
        .map(res => res.value);

    if (fetchedItems.length === 0) {
        return res.status(500).json({ error: 'Failed to fetch any valid market data.' });
    }

    res.status(200).json(fetchedItems);
};

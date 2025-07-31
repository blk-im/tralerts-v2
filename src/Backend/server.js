// backend/server.js

// Importation des modules nécessaires
const express = require('express');
const fetch = require('node-fetch'); // Pour faire des requêtes HTTP depuis le serveur
const cors = require('cors'); // Pour permettre les requêtes depuis votre frontend
require('dotenv').config(); // Pour charger les variables d'environnement depuis .env

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3001; // Le port sur lequel votre backend écoutera

// Vos clés API (chargées depuis le fichier .env pour la sécurité)
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// URLs de base des APIs externes
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Durée du cache en millisecondes (ex: 5 minutes)
// Ce cache est sur le serveur et est partagé par TOUS les utilisateurs
const CACHE_DURATION_MS = 5 * 60 * 1000;
const serverCache = new Map(); // Map pour stocker les données en cache : clé -> { data, timestamp }

// Middleware pour gérer les requêtes CORS (permet à votre frontend de communiquer avec ce backend)
// Configurez CORS pour autoriser les requêtes depuis votre frontend (par exemple, http://localhost:5173 ou votre URL de déploiement)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Remplacez par l'URL de votre frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Middleware pour parser le JSON des requêtes (si nécessaire, pas pour ce cas précis)
app.use(express.json());

// Endpoint pour récupérer les données du marché
app.get('/api/market-data', async (req, res) => {
    const now = Date.now();
    let fetchedItems = [];

    // Définition des symboles à récupérer
    const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
    const cryptoSymbolsForFinnhub = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'BNBUSDT'];

    // --- Fonction pour récupérer les données d'une API externe avec cache ---
    const fetchDataWithCache = async (symbol, type) => {
        const cacheKey = `${type}_${symbol}`;
        const cached = serverCache.get(cacheKey);

        // Vérifier si les données sont en cache et encore valides
        if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
            console.log(`[Backend Cache] Using cached data for ${symbol}`);
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
                    console.error(`[Backend] Alpha Vantage API Error for ${symbol}: Status ${response.status} - ${response.statusText}. Body: ${errorText}`);
                    throw new Error(`Alpha Vantage API Error for ${symbol}`);
                }
                const data = await response.json();

                if (data['Global Quote'] && data['Global Quote']['05. price']) {
                    const price = parseFloat(data['Global Quote']['05. price']);
                    const changePercent = parseFloat(data['Global Quote']['10. change percent'].replace('%', '')) || 0;
                    const volume = parseFloat(data['Global Quote']['06. volume']) || undefined;

                    item = {
                        symbol: symbol,
                        name: getStockName(symbol), // Fonction à définir ou à importer si nécessaire
                        price: price,
                        change24h: changePercent,
                        volume24h: volume,
                        type: 'stock',
                    };
                } else {
                    console.warn(`[Backend] Alpha Vantage: Missing or invalid data for ${symbol}. Response:`, data);
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
                    console.error(`[Backend] Finnhub API Error for ${apiSymbol}: Status ${response.status} - ${response.statusText}. Body: ${errorText}`);
                    throw new Error(`Finnhub API Error for ${symbol}`);
                }
                const quote = await response.json();

                if (!quote || Object.keys(quote).length === 0 || !quote.c) {
                    console.warn(`[Backend] Finnhub: Missing or invalid data for ${symbol}. Response:`, quote);
                    throw new Error(`Missing or invalid data for ${symbol} (Finnhub)`);
                }

                item = {
                    symbol: symbol.replace('USDT', ''), // Afficher le symbole court
                    name: getCryptoName(symbol.replace('USDT', '')), // Fonction à définir ou à importer si nécessaire
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
            console.error(`[Backend] Failed to fetch data for ${symbol}:`, error.message);
            return null;
        }
    };

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

    res.json(fetchedItems);
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Remember to set ALPHA_VANTAGE_API_KEY, FINNHUB_API_KEY, and FRONTEND_URL in your .env file!');
});


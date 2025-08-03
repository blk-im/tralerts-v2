// api/news.js
// Cette fonction serverless est dédiée à la récupération des actualités sur une entreprise.

module.exports = async (req, res) => {
    // Récupération de la clé API Finnhub depuis les variables d'environnement Vercel
    const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

    // Récupération du symbole boursier à partir des paramètres de la requête
    // Exemple d'URL : /api/news?symbol=AAPL
    const { symbol } = req.query;

    // Vérification de la présence des paramètres requis
    if (!FINNHUB_API_KEY || !symbol) {
        return res.status(400).json({ error: "Missing required parameters: FINNHUB_API_KEY and/or symbol." });
    }

    const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
    
    // Pour les actualités d'entreprise, on peut spécifier une date de début et de fin.
    // Ici, nous récupérons les actualités du dernier mois pour l'exemple.
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];

    try {
        const response = await fetch(
            `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Serverless] Finnhub News API Error for ${symbol}: Status ${response.status}. Body:`, errorText);
            throw new Error(`Finnhub API returned status ${response.status} for news on ${symbol}`);
        }

        const newsData = await response.json();

        // Finnhub peut renvoyer un tableau vide si aucune actualité n'est trouvée.
        if (!newsData || newsData.length === 0) {
            console.warn(`[Serverless] Finnhub: No news found for ${symbol}.`);
            return res.status(200).json([]);
        }

        res.status(200).json(newsData);
    } catch (error) {
        console.error(`[Serverless] Failed to fetch news for ${symbol}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch news data from Finnhub.' });
    }
};

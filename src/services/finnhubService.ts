/**
 * Service Finnhub complètement refait - Version fonctionnelle
 * API Key: d1s3vs1r01qskg7rdfl0d1s3vs1r01qskg7rdflg
 */

const FINNHUB_API_KEY = 'd1s3vs1r01qskg7rdfl0d1s3vs1r01qskg7rdflg';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface Quote {
  c: number; // Prix actuel
  d: number; // Variation
  dp: number; // Pourcentage de variation
  h: number; // Prix le plus haut de la journée
  l: number; // Prix le plus bas de la journée
  o: number; // Prix d'ouverture
  pc: number; // Clôture précédente
  t: number; // Horodatage (timestamp)
}

export interface CandleData {
  c: number[]; // Prix de clôture
  h: number[]; // Prix les plus hauts
  l: number[]; // Prix les plus bas
  o: number[]; // Prix d'ouverture
  s: string;   // Statut
  t: number[]; // Horodatages
  v: number[]; // Volumes
}

class FinnhubService {
  private apiKey = FINNHUB_API_KEY;
  private baseURL = FINNHUB_BASE_URL;

  /**
   * Effectue une requête à l'API Finnhub
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}&token=${this.apiKey}`;
    
    console.log(`🔄 Finnhub Request: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Response Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ HTTP Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Data received:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Finnhub API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le prix actuel d'un actif
   */
  async getQuote(symbol: string, marketType: 'crypto' | 'stock' = 'stock'): Promise<Quote> {
    let formattedSymbol: string;
    
    if (marketType === 'crypto') {
      // Format crypto pour Finnhub: BINANCE:BTCUSDT
      formattedSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
    } else {
      // Format stock pour Finnhub: AAPL
      formattedSymbol = symbol.toUpperCase();
    }
    
    console.log(`💰 Getting quote for ${formattedSymbol} (${marketType})`);
    
    const endpoint = `/quote?symbol=${encodeURIComponent(formattedSymbol)}`;
    const data = await this.makeRequest<Quote>(endpoint);
    
    // Affichage de la data pour vérification
    console.log('📦 Données de quote reçues: ', data);
    
    // Vérifie si le prix actuel (c) est valide
    if (!data || data.c === 0) {
      console.warn(`⚠️ Aucune donnée de prix pour ${formattedSymbol}. Retour des valeurs par défaut.`);
      // Retourne un objet par défaut pour éviter l'erreur dans l'affichage
      return {
        c: 0,
        d: 0,
        dp: 0,
        h: 0,
        l: 0,
        o: 0,
        pc: 0,
        t: 0,
      };
    }
    
    console.log(`💵 Current price for ${formattedSymbol}: $${data.c}`);
    return data;
  }

  /**
   * Obtenir les données de chandelier pour un graphique
   */
  async getCandles(
    symbol: string, 
    resolution: string = 'D', 
    count: number = 30,
    marketType: 'crypto' | 'stock' = 'stock'
  ): Promise<CandleData> {
    let formattedSymbol: string;
    let endpoint: string;
    
    if (marketType === 'crypto') {
      formattedSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
      endpoint = `/crypto/candle?symbol=${encodeURIComponent(formattedSymbol)}&resolution=${resolution}&count=${count}`;
    } else {
      formattedSymbol = symbol.toUpperCase();
      endpoint = `/stock/candle?symbol=${encodeURIComponent(formattedSymbol)}&resolution=${resolution}&count=${count}`;
    }
    
    console.log(`📊 Getting candles for ${formattedSymbol}`);
    
    const data = await this.makeRequest<CandleData>(endpoint);
    
    if (data.s !== 'ok' || !data.c || data.c.length === 0) {
      throw new Error(`No candle data for ${formattedSymbol}`);
    }
    
    console.log(`📈 Candle data for ${formattedSymbol}: ${data.c.length} points`);
    return data;
  }

  /**
   * Obtenir plusieurs prix en une seule fois
   */
  async getMultipleQuotes(symbols: Array<{symbol: string, marketType: 'crypto' | 'stock'}>): Promise<Record<string, Quote>> {
    console.log(`🔄 Getting multiple quotes for ${symbols.length} symbols`);
    
    const results: Record<string, Quote> = {};
    
    // Traiter les symboles un par un pour éviter les limites de rate
    for (const {symbol, marketType} of symbols) {
      try {
        const quote = await this.getQuote(symbol, marketType);
        results[symbol.toUpperCase()] = quote;
        
        // Petit délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Failed to get quote for ${symbol}:`, error);
        // Continue avec les autres symboles
      }
    }
    
    console.log(`✅ Successfully fetched ${Object.keys(results).length}/${symbols.length} quotes`);
    return results;
  }

  /**
   * Rechercher des symboles
   */
  async searchSymbols(query: string): Promise<any> {
    console.log(`🔍 Searching symbols for: ${query}`);
    
    const endpoint = `/search?q=${encodeURIComponent(query)}`;
    const data = await this.makeRequest(endpoint);
    
    return data.result || [];
  }

  /**
   * Obtenir les actualités du marché
   */
  async getMarketNews(category: string = 'general'): Promise<any[]> {
    console.log(`📰 Getting market news for category: ${category}`);
    
    const endpoint = `/news?category=${category}`;
    const data = await this.makeRequest<any[]>(endpoint);
    
    return Array.isArray(data) ? data : [];
  }

  /**
   * Vérifier si l'API est configurée et fonctionnelle
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing Finnhub connection...');
      
      // Test avec Apple (action)
      const appleQuote = await this.getQuote('AAPL', 'stock');
      
      if (appleQuote && appleQuote.c && appleQuote.c > 0) {
        console.log('✅ Finnhub connection successful!');
        return true;
      } else {
        console.error('❌ Invalid response from Finnhub');
        return false;
      }
    } catch (error) {
      console.error('❌ Finnhub connection failed:', error);
      return false;
    }
  }

  /**
   * Obtenir les prix populaires pour le dashboard
   */
  async getPopularPrices(): Promise<Record<string, Quote>> {
    const popularAssets = [
      { symbol: 'BTC', marketType: 'crypto' as const },
      { symbol: 'ETH', marketType: 'crypto' as const },
      { symbol: 'AAPL', marketType: 'stock' as const },
      { symbol: 'GOOGL', marketType: 'stock' as const },
      { symbol: 'TSLA', marketType: 'stock' as const }
    ];
    
    return this.getMultipleQuotes(popularAssets);
  }

  /**
   * Vérifier si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'placeholder-key');
  }
}

// Instance singleton
export const finnhubService = new FinnhubService();

// Export par défaut
export default finnhubService;

// Fonction utilitaire pour tester la connexion
export const testFinnhubConnection = async (): Promise<boolean> => {
  return finnhubService.testConnection();
};

// Fonction pour obtenir un prix simple
export const getPrice = async (symbol: string, marketType: 'crypto' | 'stock'): Promise<number> => {
  try {
    const quote = await finnhubService.getQuote(symbol, marketType);
    return quote.c;
  } catch (error) {
    console.error(`Error getting price for ${symbol}:`, error);
    throw error;
  }
};

// Fonction pour obtenir plusieurs prix
export const getPrices = async (symbols: string[], marketType: 'crypto' | 'stock'): Promise<Record<string, number>> => {
  try {
    const symbolsWithType = symbols.map(symbol => ({ symbol, marketType }));
    const quotes = await finnhubService.getMultipleQuotes(symbolsWithType);
    
    const prices: Record<string, number> = {};
    for (const [symbol, quote] of Object.entries(quotes)) {
      prices[symbol] = quote.c;
    }
    
    return prices;
  } catch (error) {
    console.error('Error getting multiple prices:', error);
    throw error;
  }
};

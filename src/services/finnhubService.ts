/**
 * Service pour l'API Finnhub - Données financières en temps réel
 */

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

export interface Quote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface CandleData {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  s: string; // Status
  t: number[]; // Timestamps
  v: number[]; // Volumes
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

class FinnhubService {
  private baseURL = FINNHUB_BASE_URL;
  private apiKey = API_KEY;

  constructor() {
    if (!this.apiKey || this.apiKey === 'placeholder-key') {
      console.warn('Finnhub API key not configured');
    }
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    if (!this.apiKey || this.apiKey === 'placeholder-key') {
      throw new Error('Finnhub API key not configured');
    }

    const url = `${this.baseURL}${endpoint}&token=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return data;
    } catch (error) {
      console.error(`Finnhub API error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir le prix actuel d'un actif
   */
  async getQuote(symbol: string, marketType: 'crypto' | 'stock' = 'stock'): Promise<Quote> {
    const formattedSymbol = marketType === 'crypto' 
      ? `BINANCE:${symbol.toUpperCase()}USDT`
      : symbol.toUpperCase();
    
    return this.makeRequest<Quote>(`/quote?symbol=${formattedSymbol}`);
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
    const formattedSymbol = marketType === 'crypto' 
      ? `BINANCE:${symbol.toUpperCase()}USDT`
      : symbol.toUpperCase();
    
    const endpoint = marketType === 'crypto' 
      ? `/crypto/candle?symbol=${formattedSymbol}&resolution=${resolution}&count=${count}`
      : `/stock/candle?symbol=${formattedSymbol}&resolution=${resolution}&count=${count}`;
    
    return this.makeRequest<CandleData>(endpoint);
  }

  /**
   * Obtenir le profil d'une entreprise
   */
  async getCompanyProfile(symbol: string): Promise<CompanyProfile> {
    return this.makeRequest<CompanyProfile>(`/stock/profile2?symbol=${symbol.toUpperCase()}`);
  }

  /**
   * Obtenir plusieurs prix en une seule fois
   */
  async getMultipleQuotes(symbols: Array<{symbol: string, marketType: 'crypto' | 'stock'}>): Promise<Record<string, Quote>> {
    const promises = symbols.map(async ({symbol, marketType}) => {
      try {
        const quote = await this.getQuote(symbol, marketType);
        return { symbol: symbol.toUpperCase(), quote };
      } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return { symbol: symbol.toUpperCase(), quote: null };
      }
    });

    const results = await Promise.all(promises);
    
    return results.reduce((acc, {symbol, quote}) => {
      if (quote) {
        acc[symbol] = quote;
      }
      return acc;
    }, {} as Record<string, Quote>);
  }

  /**
   * Rechercher des symboles
   */
  async searchSymbols(query: string): Promise<any> {
    return this.makeRequest(`/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Obtenir les actualités du marché
   */
  async getMarketNews(category: string = 'general'): Promise<any[]> {
    return this.makeRequest(`/news?category=${category}`);
  }

  /**
   * Vérifier si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 'placeholder-key');
  }
}

export const finnhubService = new FinnhubService();
export default finnhubService;

// Fonction utilitaire pour vérifier si l'API est configurée
export const checkFinnhubConnection = async (): Promise<boolean> => {
  try {
    const quote = await finnhubService.getQuote('AAPL', 'stock');
    return quote && typeof quote.c === 'number' && quote.c > 0;
  } catch (error) {
    console.error('Finnhub connection test failed:', error);
    return false;
  }
};
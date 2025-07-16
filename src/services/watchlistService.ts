/**
 * Service pour la gestion de la watchlist utilisateur
 */

import { supabase } from '../lib/supabase';
import { finnhubService } from './finnhubService';

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  market_type: 'crypto' | 'stock';
  is_favorite: boolean;
  created_at: string;
}

export interface WatchlistItemWithPrice extends WatchlistItem {
  current_price: number;
  change_24h: number;
  change_24h_percentage: number;
  name: string;
}

class WatchlistService {
  /**
   * Obtenir la watchlist d'un utilisateur
   */
  async getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtenir la watchlist avec les prix actuels
   */
  async getUserWatchlistWithPrices(userId: string): Promise<WatchlistItemWithPrice[]> {
    const watchlist = await this.getUserWatchlist(userId);
    
    if (watchlist.length === 0) {
      return [];
    }

    // Obtenir les prix actuels pour tous les actifs
    const symbols = watchlist.map(item => ({
      symbol: item.symbol,
      marketType: item.market_type
    }));

    const quotes = await finnhubService.getMultipleQuotes(symbols);

    // Enrichir les données de la watchlist avec les prix actuels
    const watchlistWithPrices: WatchlistItemWithPrice[] = watchlist.map(item => {
      const quote = quotes[item.symbol.toUpperCase()];
      const currentPrice = quote?.c || 0;
      const change24h = quote?.d || 0;
      const change24hPercentage = quote?.dp || 0;

      return {
        ...item,
        current_price: currentPrice,
        change_24h: change24h,
        change_24h_percentage: change24hPercentage,
        name: this.getAssetName(item.symbol, item.market_type)
      };
    });

    return watchlistWithPrices;
  }

  /**
   * Ajouter un actif à la watchlist
   */
  async addToWatchlist(
    userId: string,
    symbol: string,
    marketType: 'crypto' | 'stock'
  ): Promise<WatchlistItem> {
    // Vérifier si l'actif existe déjà
    const { data: existing } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .eq('market_type', marketType)
      .single();

    if (existing) {
      throw new Error('Asset already in watchlist');
    }

    const { data, error } = await supabase
      .from('watchlist')
      .insert({
        user_id: userId,
        symbol: symbol.toUpperCase(),
        market_type: marketType,
        is_favorite: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer un actif de la watchlist
   */
  async removeFromWatchlist(userId: string, watchlistId: string): Promise<void> {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('id', watchlistId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Basculer le statut favori d'un actif
   */
  async toggleFavorite(
    userId: string,
    watchlistId: string,
    isFavorite: boolean
  ): Promise<WatchlistItem> {
    const { data, error } = await supabase
      .from('watchlist')
      .update({ is_favorite: isFavorite })
      .eq('id', watchlistId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtenir les favoris de l'utilisateur
   */
  async getFavorites(userId: string): Promise<WatchlistItemWithPrice[]> {
    const watchlist = await this.getUserWatchlistWithPrices(userId);
    return watchlist.filter(item => item.is_favorite);
  }

  /**
   * Rechercher des actifs à ajouter
   */
  async searchAssets(query: string): Promise<any[]> {
    if (!finnhubService.isConfigured()) {
      return this.getPopularAssets().filter(asset => 
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const results = await finnhubService.searchSymbols(query);
      return results.result || [];
    } catch (error) {
      console.error('Error searching assets:', error);
      return this.getPopularAssets().filter(asset => 
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  /**
   * Obtenir les actifs populaires
   */
  private getPopularAssets() {
    return [
      // Crypto
      { symbol: 'BTC', name: 'Bitcoin', type: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', type: 'crypto' },
      { symbol: 'ADA', name: 'Cardano', type: 'crypto' },
      { symbol: 'SOL', name: 'Solana', type: 'crypto' },
      { symbol: 'BNB', name: 'Binance Coin', type: 'crypto' },
      
      // Stocks
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock' }
    ];
  }

  /**
   * Obtenir le nom d'un actif
   */
  private getAssetName(symbol: string, marketType: 'crypto' | 'stock'): string {
    const names: Record<string, string> = {
      // Crypto
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'BNB': 'Binance Coin',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon',
      
      // Stocks
      'AAPL': 'Apple Inc.',
      'MSFT': 'Microsoft Corp.',
      'GOOGL': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'TSLA': 'Tesla Inc.',
      'NVDA': 'NVIDIA Corp.',
      'META': 'Meta Platforms',
      'JPM': 'JPMorgan Chase',
      'V': 'Visa Inc.',
      'WMT': 'Walmart Inc.'
    };

    return names[symbol.toUpperCase()] || symbol.toUpperCase();
  }
}

export const watchlistService = new WatchlistService();
export default watchlistService;
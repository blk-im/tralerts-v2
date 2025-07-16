/**
 * Service pour la gestion du portfolio utilisateur
 */

import { supabase } from '../lib/supabase';
import { finnhubService } from './finnhubService';

export interface PortfolioItem {
  id: string;
  user_id: string;
  symbol: string;
  market_type: 'crypto' | 'stock';
  quantity: number;
  average_price: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItemWithPrice extends PortfolioItem {
  current_price: number;
  total_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  name: string;
}

class PortfolioService {
  /**
   * Obtenir le portfolio d'un utilisateur
   */
  async getUserPortfolio(userId: string): Promise<PortfolioItem[]> {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtenir le portfolio avec les prix actuels
   */
  async getUserPortfolioWithPrices(userId: string): Promise<PortfolioItemWithPrice[]> {
    const portfolio = await this.getUserPortfolio(userId);
    
    if (portfolio.length === 0) {
      return [];
    }

    // Obtenir les prix actuels pour tous les actifs
    const symbols = portfolio.map(item => ({
      symbol: item.symbol,
      marketType: item.market_type
    }));

    const quotes = await finnhubService.getMultipleQuotes(symbols);

    // Enrichir les données du portfolio avec les prix actuels
    const portfolioWithPrices: PortfolioItemWithPrice[] = portfolio.map(item => {
      const quote = quotes[item.symbol.toUpperCase()];
      const currentPrice = quote?.c || item.average_price;
      const totalValue = item.quantity * currentPrice;
      const totalCost = item.quantity * item.average_price;
      const profitLoss = totalValue - totalCost;
      const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      return {
        ...item,
        current_price: currentPrice,
        total_value: totalValue,
        profit_loss: profitLoss,
        profit_loss_percentage: profitLossPercentage,
        name: this.getAssetName(item.symbol, item.market_type)
      };
    });

    return portfolioWithPrices;
  }

  /**
   * Ajouter un actif au portfolio
   */
  async addToPortfolio(
    userId: string,
    symbol: string,
    marketType: 'crypto' | 'stock',
    quantity: number,
    averagePrice: number
  ): Promise<PortfolioItem> {
    // Vérifier si l'actif existe déjà
    const { data: existing } = await supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase())
      .eq('market_type', marketType)
      .single();

    if (existing) {
      // Mettre à jour la quantité et le prix moyen
      const newQuantity = existing.quantity + quantity;
      const newAveragePrice = ((existing.quantity * existing.average_price) + (quantity * averagePrice)) / newQuantity;

      const { data, error } = await supabase
        .from('portfolio')
        .update({
          quantity: newQuantity,
          average_price: newAveragePrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Créer un nouvel élément
      const { data, error } = await supabase
        .from('portfolio')
        .insert({
          user_id: userId,
          symbol: symbol.toUpperCase(),
          market_type: marketType,
          quantity,
          average_price: averagePrice
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Supprimer un actif du portfolio
   */
  async removeFromPortfolio(userId: string, portfolioId: string): Promise<void> {
    const { error } = await supabase
      .from('portfolio')
      .delete()
      .eq('id', portfolioId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mettre à jour la quantité d'un actif
   */
  async updateQuantity(
    userId: string,
    portfolioId: string,
    newQuantity: number
  ): Promise<PortfolioItem> {
    if (newQuantity <= 0) {
      await this.removeFromPortfolio(userId, portfolioId);
      throw new Error('Asset removed from portfolio');
    }

    const { data, error } = await supabase
      .from('portfolio')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Calculer les statistiques du portfolio
   */
  async getPortfolioStats(userId: string) {
    const portfolio = await this.getUserPortfolioWithPrices(userId);
    
    const totalValue = portfolio.reduce((sum, item) => sum + item.total_value, 0);
    const totalCost = portfolio.reduce((sum, item) => sum + (item.quantity * item.average_price), 0);
    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercentage = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    const topPerformer = portfolio.reduce((best, current) => 
      current.profit_loss_percentage > best.profit_loss_percentage ? current : best
    , portfolio[0]);

    const worstPerformer = portfolio.reduce((worst, current) => 
      current.profit_loss_percentage < worst.profit_loss_percentage ? current : worst
    , portfolio[0]);

    return {
      totalValue,
      totalCost,
      totalProfitLoss,
      totalProfitLossPercentage,
      assetCount: portfolio.length,
      topPerformer,
      worstPerformer,
      portfolio
    };
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

export const portfolioService = new PortfolioService();
export default portfolioService;
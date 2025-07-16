/**
 * Hook pour la gestion du portfolio
 */

import { useState, useEffect } from 'react';
import { portfolioService, PortfolioItemWithPrice } from '../services/portfolioService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function usePortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItemWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchPortfolio = async () => {
    if (!user?.id) {
      setPortfolio([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [portfolioData, statsData] = await Promise.all([
        portfolioService.getUserPortfolioWithPrices(user.id),
        portfolioService.getPortfolioStats(user.id)
      ]);
      
      setPortfolio(portfolioData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Erreur lors du chargement du portfolio');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (
    symbol: string,
    marketType: 'crypto' | 'stock',
    quantity: number,
    averagePrice: number
  ) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await portfolioService.addToPortfolio(user.id, symbol, marketType, quantity, averagePrice);
      toast.success(`${symbol.toUpperCase()} ajouté au portfolio`);
      await fetchPortfolio();
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Erreur lors de l\'ajout de l\'actif');
    }
  };

  const removeAsset = async (portfolioId: string) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await portfolioService.removeFromPortfolio(user.id, portfolioId);
      toast.success('Actif supprimé du portfolio');
      await fetchPortfolio();
    } catch (error) {
      console.error('Error removing asset:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateQuantity = async (portfolioId: string, newQuantity: number) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      if (newQuantity <= 0) {
        await removeAsset(portfolioId);
        return;
      }

      await portfolioService.updateQuantity(user.id, portfolioId, newQuantity);
      toast.success('Quantité mise à jour');
      await fetchPortfolio();
    } catch (error) {
      console.error('Error updating quantity:', error);
      if (error instanceof Error && error.message === 'Asset removed from portfolio') {
        toast.success('Actif supprimé du portfolio');
        await fetchPortfolio();
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user?.id]);

  return {
    portfolio,
    stats,
    loading,
    addAsset,
    removeAsset,
    updateQuantity,
    refresh: fetchPortfolio
  };
}
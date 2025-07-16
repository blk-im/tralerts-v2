/**
 * Hook pour la gestion de la watchlist
 */

import { useState, useEffect } from 'react';
import { watchlistService, WatchlistItemWithPrice } from '../services/watchlistService';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItemWithPrice[]>([]);
  const [favorites, setFavorites] = useState<WatchlistItemWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWatchlist = async () => {
    if (!user?.id) {
      setWatchlist([]);
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [watchlistData, favoritesData] = await Promise.all([
        watchlistService.getUserWatchlistWithPrices(user.id),
        watchlistService.getFavorites(user.id)
      ]);
      
      setWatchlist(watchlistData);
      setFavorites(favoritesData);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Erreur lors du chargement de la watchlist');
    } finally {
      setLoading(false);
    }
  };

  const addAsset = async (symbol: string, marketType: 'crypto' | 'stock') => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await watchlistService.addToWatchlist(user.id, symbol, marketType);
      toast.success(`${symbol.toUpperCase()} ajouté à la watchlist`);
      await fetchWatchlist();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (error instanceof Error && error.message === 'Asset already in watchlist') {
        toast.error('Cet actif est déjà dans votre watchlist');
      } else {
        toast.error('Erreur lors de l\'ajout à la watchlist');
      }
    }
  };

  const removeAsset = async (watchlistId: string) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await watchlistService.removeFromWatchlist(user.id, watchlistId);
      toast.success('Actif supprimé de la watchlist');
      await fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleFavorite = async (watchlistId: string, isFavorite: boolean) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      await watchlistService.toggleFavorite(user.id, watchlistId, isFavorite);
      toast.success(isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
      await fetchWatchlist();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const searchAssets = async (query: string) => {
    try {
      return await watchlistService.searchAssets(query);
    } catch (error) {
      console.error('Error searching assets:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user?.id]);

  return {
    watchlist,
    favorites,
    loading,
    addAsset,
    removeAsset,
    toggleFavorite,
    searchAssets,
    refresh: fetchWatchlist
  };
}
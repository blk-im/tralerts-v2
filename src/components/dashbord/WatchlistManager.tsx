import React, { useState, useEffect } from 'react';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Star, Search, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  marketType: 'crypto' | 'stock';
  isFavorite: boolean;
}

interface WatchlistManagerProps {
  onPremiumUpgrade?: () => void;
}

export function WatchlistManager({ onPremiumUpgrade }: WatchlistManagerProps) {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<'all' | 'crypto' | 'stock'>('all');
  const [isFreePlan] = useState(true);
  const [loading, setLoading] = useState(true);

  // Charger la watchlist au démarrage
  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      setWatchlist([]);
      setLoading(false);
    }
  }, [user]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      
      // Récupérer la watchlist depuis la base de données
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error fetching watchlist:', error);
        setWatchlist([]);
        return;
      }
      
      if (data && data.length > 0) {
        // Récupérer les prix actuels
        const items: WatchlistItem[] = await Promise.all(data.map(async (item) => {
          const currentPrice = await fetchCurrentPrice(item.symbol, item.market_type);
          const change24h = await fetchPriceChange(item.symbol, item.market_type);
          
          return {
            id: item.id,
            symbol: item.symbol,
            name: getAssetName(item.symbol, item.market_type),
            currentPrice,
            change24h,
            marketType: item.market_type,
            isFavorite: item.is_favorite || false
          };
        }));
        
        setWatchlist(items);
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error in watchlist fetch:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le prix actuel d'un actif
  const fetchCurrentPrice = async (symbol: string, marketType: string): Promise<number> => {
    if (marketType === 'crypto') {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data[symbol.toLowerCase()]?.usd || getDefaultPrice(symbol, marketType);
        }
      } catch (error) {
        console.error('Error fetching crypto price:', error);
      }
    } else if (marketType === 'stock') {
      // Pour les actions, utiliser des prix réalistes
      const stockPrices = {
        'AAPL': 175.43 + (Math.random() - 0.5) * 5,
        'GOOGL': 2750.80 + (Math.random() - 0.5) * 50,
        'MSFT': 378.85 + (Math.random() - 0.5) * 10,
        'TSLA': 248.50 + (Math.random() - 0.5) * 15,
        'AMZN': 3380.00 + (Math.random() - 0.5) * 70,
        'NVDA': 875.30 + (Math.random() - 0.5) * 25,
      };
      
      return stockPrices[symbol] || 100;
    }
    
    return getDefaultPrice(symbol, marketType);
  };

  // Récupérer le changement de prix sur 24h
  const fetchPriceChange = async (symbol: string, marketType: string): Promise<number> => {
    if (marketType === 'crypto') {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (response.ok) {
          const data = await response.json();
          return data[symbol.toLowerCase()]?.usd_24h_change || (Math.random() * 10 - 5);
        }
      } catch (error) {
        console.error('Error fetching crypto price change:', error);
      }
    }
    
    // Pour les actions ou en cas d'erreur, générer un changement réaliste
    return (Math.random() * 6) - 3; // Entre -3% et +3%
  };

  // Prix par défaut pour les actifs non trouvés
  const getDefaultPrice = (symbol: string, marketType: string): number => {
    const prices: {[key: string]: number} = {
      'bitcoin': 45000,
      'ethereum': 3200,
      'cardano': 0.45,
      'solana': 98,
      'AAPL': 175,
      'GOOGL': 2750,
      'MSFT': 378,
      'TSLA': 250,
      'AMZN': 3380,
      'NVDA': 875
    };
    
    return prices[symbol.toLowerCase()] || (marketType === 'crypto' ? 100 : 200);
  };

  // Noms des actifs
  const getAssetName = (symbol: string, marketType: string): string => {
    const names: {[key: string]: string} = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'cardano': 'Cardano',
      'solana': 'Solana',
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.'
    };
    
    return names[symbol.toLowerCase()] || symbol;
  };

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return;

    if (isFreePlan && watchlist.length >= 10) {
      alert('Limite gratuite atteinte ! Vous pouvez surveiller maximum 10 actifs avec le plan gratuit. Passez au Premium pour une watchlist illimitée.');
      return;
    }

    try {
      setLoading(true);
      // Déterminer le type de marché
      const isCrypto = !newSymbol.match(/^[A-Z]{1,5}$/);
      const marketType = isCrypto ? 'crypto' : 'stock';
      const formattedSymbol = isCrypto ? newSymbol.toLowerCase() : newSymbol.toUpperCase();
      
      // Vérifier si l'actif existe déjà dans la watchlist
      const exists = watchlist.some(item => 
        item.symbol.toLowerCase() === formattedSymbol.toLowerCase() && 
        item.marketType === marketType
      );
      
      if (exists) {
        alert(`${formattedSymbol} est déjà dans votre watchlist.`);
        return;
      }
      
      // Récupérer le prix actuel
      let currentPrice = 0;
      let change24h = 0;
      
      try {
        currentPrice = await fetchCurrentPrice(formattedSymbol, marketType);
        change24h = await fetchPriceChange(formattedSymbol, marketType);
      } catch (priceError) {
        console.error('Error fetching price:', priceError);
        // Utiliser des valeurs par défaut en cas d'erreur
        currentPrice = getDefaultPrice(formattedSymbol, marketType);
        change24h = (Math.random() * 6) - 3;
      }
      
      // Ajouter à la base de données
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user?.id,
          symbol: formattedSymbol,
          market_type: marketType,
          is_favorite: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding to watchlist:', error);
        alert('Erreur lors de l\'ajout à la watchlist');
        return;
      }
      
      // Ajouter à l'état local
      const newItem: WatchlistItem = {
        id: data.id,
        symbol: formattedSymbol,
        name: getAssetName(formattedSymbol, marketType),
        currentPrice,
        change24h,
        marketType,
        isFavorite: false
      };
      
      setWatchlist(prev => [newItem, ...prev]);
      setNewSymbol('');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      alert('Erreur lors de l\'ajout à la watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      // Supprimer de la base de données
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error removing from watchlist:', error);
        alert('Erreur lors de la suppression');
        return;
      }
      
      // Mettre à jour l'état local
      setWatchlist(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      // Trouver l'élément dans la watchlist
      const item = watchlist.find(item => item.id === id);
      if (!item) return;
      
      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('watchlist')
        .update({ is_favorite: !item.isFavorite })
        .eq('id', id);
      
      if (error) {
        console.error('Error toggling favorite:', error);
        alert('Erreur lors de la mise à jour');
        return;
      }
      
      // Mettre à jour l'état local
      setWatchlist(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const filteredWatchlist = watchlist.filter(item => {
    const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket = selectedMarket === 'all' || item.marketType === selectedMarket;
    return matchesSearch && matchesMarket;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  const assetsRemaining = Math.max(0, 10 - watchlist.length);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-6 h-6 mr-3 text-purple-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ma Watchlist
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Surveillez vos actifs préférés
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {watchlist.length} actif{watchlist.length > 1 ? 's' : ''} surveillé{watchlist.length > 1 ? 's' : ''}
              {isFreePlan && <span> / 10 max</span>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Free Plan Limitation */}
          {isFreePlan && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 mr-2" />
                  <span className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                    Plan Gratuit - 10 actifs maximum
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  assetsRemaining > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {assetsRemaining} places restantes
                </span>
              </div>
              
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(watchlist.length / 10) * 100}%` }}
                ></div>
              </div>
              
              {assetsRemaining > 0 ? (
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Vous pouvez ajouter encore <strong>{assetsRemaining} actif{assetsRemaining > 1 ? 's' : ''}</strong> à votre watchlist.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Watchlist complète ! Vous avez atteint la limite de 10 actifs.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                    onClick={handleUpgradeClick}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Passer au Premium pour watchlist illimitée
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Add new asset */}
          <div className="flex space-x-2 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Ajouter un symbole (ex: BTC, AAPL)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
              />
            </div>
            <Button
              onClick={addToWatchlist}
              disabled={isFreePlan && assetsRemaining === 0}
              className={`${
                isFreePlan && assetsRemaining === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              {isFreePlan && assetsRemaining === 0 ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Premium
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans la watchlist..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedMarket('all')}
                variant={selectedMarket === 'all' ? 'primary' : 'secondary'}
                size="sm"
              >
                Tout
              </Button>
              <Button
                onClick={() => setSelectedMarket('crypto')}
                variant={selectedMarket === 'crypto' ? 'primary' : 'secondary'}
                size="sm"
              >
                Crypto
              </Button>
              <Button
                onClick={() => setSelectedMarket('stock')}
                variant={selectedMarket === 'stock' ? 'primary' : 'secondary'}
                size="sm"
              >
                Actions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Items */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWatchlist.map((item) => (
            <Card key={item.id} hover className="transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                      item.marketType === 'crypto' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      {item.symbol.slice(0, 3)}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {item.symbol}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.marketType === 'crypto' 
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {item.marketType === 'crypto' ? 'CRYPTO' : 'ACTION'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.currentPrice)}
                      </p>
                      <div className={`flex items-center ${
                        item.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        <span className="text-sm font-medium">
                          {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => toggleFavorite(item.id)}
                        variant="ghost"
                        size="sm"
                        className="p-2"
                      >
                        <Star className={`w-4 h-4 ${
                          item.isFavorite 
                            ? 'text-yellow-500 fill-current' 
                            : 'text-gray-400'
                        }`} />
                      </Button>
                      <Button
                        onClick={() => removeFromWatchlist(item.id)}
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredWatchlist.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun actif dans votre watchlist
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ajoutez des cryptomonnaies et actions pour les surveiller facilement.
            </p>
            <Button
              onClick={() => setNewSymbol('bitcoin')}
              disabled={isFreePlan && assetsRemaining === 0}
              className={`${
                isFreePlan && assetsRemaining === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isFreePlan && assetsRemaining === 0 ? 'Premium requis' : 'Ajouter Bitcoin'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Premium Upgrade CTA */}
      {isFreePlan && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Surveillez Tous vos Actifs Préférés
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Plan Gratuit :</h5>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• 10 actifs maximum</li>
                    <li>• Surveillance de base</li>
                    <li>• Favoris limités</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Plan Premium :</h5>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• <strong>Actifs illimités</strong></li>
                    <li>• <strong>Alertes automatiques</strong></li>
                    <li>• <strong>Groupes personnalisés</strong></li>
                    <li>• <strong>Synchronisation multi-appareils</strong></li>
                  </ul>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-full"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-4 h-4 mr-2" />
                Passer au Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Suggestions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Suggestions populaires
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['bitcoin', 'ethereum', 'AAPL', 'GOOGL', 'cardano', 'solana', 'TSLA', 'MSFT'].map((symbol) => (
              <Button
                key={symbol}
                onClick={() => setNewSymbol(symbol)}
                disabled={isFreePlan && assetsRemaining === 0}
                variant="secondary"
                size="sm"
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                {symbol}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
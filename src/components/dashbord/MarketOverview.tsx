import { finnhubService } from '../../services/FinnhubService';
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  type: 'crypto' | 'stock';
}

interface MarketOverviewProps {
  onPremiumUpgrade?: () => void;
}

export function MarketOverview({ onPremiumUpgrade }: MarketOverviewProps) {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [filteredData, setFilteredData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'crypto' | 'stock'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [isFreePlan] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    fetchMarketData();
    
    // Rafraîchir les données toutes les 5 secondes
    const interval = setInterval(fetchMarketData, 5000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [marketData, searchTerm, selectedType, selectedFilter]);

  const fetchMarketData = async () => {
    setLoading(true);
    
    console.log('🔄 Fetching real market data from Finnhub...');
    
    try {
      // Test de connexion d'abord
      const isConnected = await finnhubService.testConnection();
      if (!isConnected) {
        throw new Error('Finnhub API connection failed');
      }
      
      // Liste des symboles à surveiller
      const symbolsToFetch = [
        { symbol: 'BTC', marketType: 'crypto' as const },
        { symbol: 'ETH', marketType: 'crypto' as const },
        { symbol: 'SOL', marketType: 'crypto' as const },
        { symbol: 'ADA', marketType: 'crypto' as const },
        { symbol: 'BNB', marketType: 'crypto' as const },
        { symbol: 'AAPL', marketType: 'stock' as const },
        { symbol: 'MSFT', marketType: 'stock' as const },
        { symbol: 'GOOGL', marketType: 'stock' as const },
        { symbol: 'AMZN', marketType: 'stock' as const },
        { symbol: 'TSLA', marketType: 'stock' as const }
      ];
      
      console.log(`📊 Fetching data for ${symbolsToFetch.length} symbols...`);
      
      // Utiliser le service Finnhub pour récupérer les prix
      const quotes = await finnhubService.getMultipleQuotes(symbolsToFetch);
      
      // Transformer les données en format MarketItem
      const marketData: MarketItem[] = [];
      
      for (const { symbol, marketType } of symbolsToFetch) {
        const quote = quotes[symbol.toUpperCase()];
        if (quote && quote.c) {
          marketData.push({
            symbol: symbol.toUpperCase(),
            name: marketType === 'crypto' ? getCryptoName(symbol) : getStockName(symbol),
            price: quote.c,
            change24h: quote.dp || 0,
            marketCap: quote.marketCapitalization || 0,
            volume24h: quote.v || 0,
            type: marketType
          });
        }
      }
      
      if (marketData.length > 0) {
        console.log(`✅ Successfully loaded ${marketData.length} real market prices`);
        setMarketData(marketData);
      } else {
        throw new Error('No market data received');
      }
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Afficher une alerte utilisateur claire
      alert(`❌ Erreur de récupération des données Finnhub: ${error.message}\n\nVérifiez votre connexion internet et réessayez.`);
    } finally {
      setLoading(false);
    }
  };


  const applyFilters = () => {
    let filtered = [...marketData];
    
    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }
    
    // Filtrer par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.symbol.toLowerCase().includes(term) || 
        item.name.toLowerCase().includes(term)
      );
    }
    
    // Filtrer par performance
    if (selectedFilter === 'gainers') {
      filtered = filtered.filter(item => item.change24h > 0);
      filtered.sort((a, b) => b.change24h - a.change24h);
    } else if (selectedFilter === 'losers') {
      filtered = filtered.filter(item => item.change24h < 0);
      filtered.sort((a, b) => a.change24h - b.change24h);
    }
    
    // Limiter pour le plan gratuit
    if (isFreePlan) {
      filtered = filtered.slice(0, 10);
    }
    
    setFilteredData(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else {
      return value.toLocaleString();
    }
  };

  const getCryptoName = (symbol: string): string => {
    const names: {[key: string]: string} = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'BNB': 'Binance Coin',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon'
    };
    
    return names[symbol] || symbol;
  };

  const getStockName = (symbol: string): string => {
    const names: {[key: string]: string} = {
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
    
    return names[symbol] || symbol;
  };

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Aperçu du Marché
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mise à jour en temps réel via Finnhub
                </p>
              </div>
            </div>
            <Button
              onClick={fetchMarketData}
              variant="ghost"
              size="sm"
              className="p-2"
              loading={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Free Plan Limitation */}
          {isFreePlan && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    Plan Gratuit - 10 actifs visibles
                  </span>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-bold">
                  {filteredData.length}/{marketData.length}
                </span>
              </div>
              
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                Passez au Premium pour voir tous les actifs et accéder aux données avancées.
              </p>
              
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-3 h-3 mr-1" />
                Débloquer tous les actifs - Premium
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un actif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setSelectedType('all')}
                variant={selectedType === 'all' ? 'primary' : 'secondary'}
                size="sm"
              >
                Tout
              </Button>
              <Button
                onClick={() => setSelectedType('crypto')}
                variant={selectedType === 'crypto' ? 'primary' : 'secondary'}
                size="sm"
              >
                Crypto
              </Button>
              <Button
                onClick={() => setSelectedType('stock')}
                variant={selectedType === 'stock' ? 'primary' : 'secondary'}
                size="sm"
              >
                Actions
              </Button>
            </div>
          </div>

          {/* Performance Filters */}
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setSelectedFilter('all')}
              variant={selectedFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
            >
              Tous les actifs
            </Button>
            <Button
              onClick={() => setSelectedFilter('gainers')}
              variant={selectedFilter === 'gainers' ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Gainers
            </Button>
            <Button
              onClick={() => setSelectedFilter('losers')}
              variant={selectedFilter === 'losers' ? 'primary' : 'secondary'}
              size="sm"
              className="flex-1"
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Top Losers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Data */}
      {loading && filteredData.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
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
          {filteredData.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Essayez de modifier vos filtres ou votre recherche.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('all');
                    setSelectedFilter('all');
                  }}
                  variant="secondary"
                >
                  Réinitialiser les filtres
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredData.map((item) => (
              <Card key={item.symbol} hover className="transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        item.type === 'crypto' 
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
                            item.type === 'crypto' 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}>
                            {item.type === 'crypto' ? 'CRYPTO' : 'ACTION'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.price)}
                      </p>
                      <div className={`flex items-center justify-end ${
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
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {item.marketCap && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${formatLargeNumber(item.marketCap)}
                        </p>
                      </div>
                    )}
                    {item.volume24h && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Volume 24h</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${formatLargeNumber(item.volume24h)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Premium Upgrade CTA */}
      {isFreePlan && marketData.length > 10 && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Débloquez l'Aperçu Complet du Marché
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Plan Gratuit :</h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• 10 actifs visibles</li>
                    <li>• Données de base</li>
                    <li>• Mise à jour 5 secondes</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Plan Premium :</h5>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>Tous les actifs visibles</strong></li>
                    <li>• <strong>Données avancées</strong></li>
                    <li>• <strong>Mise à jour temps réel</strong></li>
                    <li>• <strong>Alertes automatiques</strong></li>
                  </ul>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-4 h-4 mr-2" />
                Passer au Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {marketData.filter(item => item.change24h > 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actifs en hausse
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {marketData.filter(item => item.change24h < 0).length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Actifs en baisse
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              5s
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fréquence de mise à jour
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
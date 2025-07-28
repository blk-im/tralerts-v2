import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast'; // Assurez-vous d'avoir toast installé et configuré

// Votre clé API Twelve Data
const TWELVE_DATA_API_KEY = 'ced07f32e4d0415dab6cc96aa79d4ccc';
// URL de base de l'API Twelve Data pour les quotes
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number; // Pourcentage de changement
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
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'crypto' | 'stock'>('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [isFreePlan] = useState(true); // Conservez ceci pour la logique d'affichage du plan gratuit

  // Noms pour cryptos et actions (ces listes sont toujours utiles pour l'affichage)
  const getCryptoName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      ADA: 'Cardano',
      BNB: 'Binance Coin',
      XRP: 'Ripple',
      DOT: 'Polkadot',
      DOGE: 'Dogecoin',
      AVAX: 'Avalanche',
      MATIC: 'Polygon',
    };
    return names[symbol] || symbol;
  };

  const getStockName = (symbol: string): string => {
    const names: { [key: string]: string } = {
      AAPL: 'Apple Inc.',
      MSFT: 'Microsoft Corp.',
      GOOGL: 'Alphabet Inc.',
      AMZN: 'Amazon.com Inc.',
      TSLA: 'Tesla Inc.',
      NVDA: 'NVIDIA Corp.',
      META: 'Meta Platforms',
      JPM: 'JPMorgan Chase',
      V: 'Visa Inc.',
      WMT: 'Walmart Inc.',
    };
    return names[symbol] || symbol;
  };

  // Formatage devise et nombres grands
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);

  const formatLargeNumber = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    return value.toLocaleString();
  };

  // Fonction de fetch des données de marché
  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    try {
      const symbolsToFetch = [
        { symbol: 'BTC/USD', marketType: 'crypto' as const, originalSymbol: 'BTC' },
        { symbol: 'ETH/USD', marketType: 'crypto' as const, originalSymbol: 'ETH' },
        { symbol: 'SOL/USD', marketType: 'crypto' as const, originalSymbol: 'SOL' },
        { symbol: 'ADA/USD', marketType: 'crypto' as const, originalSymbol: 'ADA' },
        { symbol: 'BNB/USD', marketType: 'crypto' as const, originalSymbol: 'BNB' },
        { symbol: 'AAPL', marketType: 'stock' as const, originalSymbol: 'AAPL' },
        { symbol: 'MSFT', marketType: 'stock' as const, originalSymbol: 'MSFT' },
        { symbol: 'GOOGL', marketType: 'stock' as const, originalSymbol: 'GOOGL' },
        { symbol: 'AMZN', marketType: 'stock' as const, originalSymbol: 'AMZN' },
        { symbol: 'TSLA', marketType: 'stock' as const, originalSymbol: 'TSLA' },
      ];

      // Twelve Data utilise des endpoints différents pour les quotes (prix actuels)
      // et les time_series (pour le changement sur 24h, qui nécessite des données historiques)
      // Pour simplifier, nous allons utiliser l'endpoint 'quote' qui donne le prix et le changement.
      // Note: Le plan gratuit de Twelve Data peut ne pas fournir toutes les données (marketCap, volume)
      // ou peut avoir un délai sur certaines données.

      const promises = symbolsToFetch.map(async ({ symbol, marketType, originalSymbol }) => {
        try {
          const response = await fetch(
            `${TWELVE_DATA_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Twelve Data API Error for ${symbol}: Status ${response.status} - ${response.statusText}. Response Body: ${errorText}`);
            throw new Error(`Erreur API pour ${originalSymbol} (Code: ${response.status})`);
          }

          const data = await response.json();

          // Vérifier si les données sont valides et contiennent les champs nécessaires
          // Twelve Data renvoie 'close' pour le prix actuel, 'percent_change' pour le changement sur 24h
          if (!data || data.status === 'error' || !data.close || data.percent_change === undefined) {
            console.warn(`Twelve Data: Données vides ou invalides reçues pour ${originalSymbol}. Réponse:`, data);
            throw new Error(`Données manquantes ou invalides pour ${originalSymbol}`);
          }

          // Twelve Data renvoie le volume et la capitalisation boursière dans l'objet quote pour certains plans/endpoints.
          // Pour le plan gratuit, ces champs peuvent être absents ou nécessiter un endpoint différent.
          // Nous les rendons optionnels dans l'interface MarketItem.
          const marketCap = parseFloat(data.market_cap) || undefined; // Twelve Data peut fournir market_cap
          const volume24h = parseFloat(data.volume) || undefined; // Twelve Data peut fournir volume

          return {
            symbol: originalSymbol, // Utilisez le symbole original pour l'affichage
            name: marketType === 'crypto' ? getCryptoName(originalSymbol) : getStockName(originalSymbol),
            price: parseFloat(data.close),
            change24h: parseFloat(data.percent_change) ?? 0, // Utilisez percent_change
            marketCap: marketCap,
            volume24h: volume24h,
            type: marketType,
          } as MarketItem;
        } catch (innerError: any) {
          console.error(`Failed to fetch data for ${originalSymbol}:`, innerError);
          // Ne pas propager l'erreur pour permettre aux autres promesses de s'exécuter
          // Retourner null ou un objet d'erreur pour le filtrage ultérieur
          return null;
        }
      });

      const results = await Promise.allSettled(promises);

      const marketData: MarketItem[] = results
        .filter((res) => res.status === 'fulfilled' && res.value !== null)
        .map((res: PromiseFulfilledResult<MarketItem | null>) => res.value as MarketItem); // Cast pour s'assurer du type

      if (marketData.length === 0) {
        toast.error('❌ Erreur de récupération des données Twelve Data: Aucune donnée valide reçue.');
        throw new Error('Aucune donnée valide reçue');
      }

      setMarketData(marketData);
      toast.success('Données du marché mises à jour avec Twelve Data !');

    } catch (error: any) {
      console.error('Erreur globale de récupération des données Twelve Data:', error);
      // Le toast est déjà affiché pour le cas marketData.length === 0
      // Si c'est une autre erreur, on l'affiche ici
      if (marketData.length > 0 || error.message !== 'Aucune donnée valide reçue') {
          toast.error(`❌ Erreur de récupération des données Twelve Data: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Application des filtres
  useEffect(() => {
    let filtered = [...marketData];

    if (selectedType !== 'all') filtered = filtered.filter((item) => item.type === selectedType);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) => item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term)
      );
    }

    if (selectedFilter === 'gainers') {
      filtered = filtered.filter((item) => item.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    } else if (selectedFilter === 'losers') {
      filtered = filtered.filter((item) => item.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    }

    if (isFreePlan) filtered = filtered.slice(0, 10);

    setFilteredData(filtered);
  }, [marketData, selectedType, searchTerm, selectedFilter, isFreePlan]);

  // Rafraîchissement toutes les 20 secondes (comme discuté)
  useEffect(() => {
    fetchMarketData(); // Exécute une fois au montage
    const interval = setInterval(() => fetchMarketData(), 20000); // Puis toutes les 20 secondes
    return () => clearInterval(interval); // Nettoyage de l'intervalle au démontage
  }, [fetchMarketData]);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) onPremiumUpgrade();
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
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Aperçu du Marché</h2>
                {/* Mettre à jour le texte pour refléter Twelve Data */}
                <p className="text-sm text-gray-600 dark:text-gray-400">Mise à jour en temps réel via Twelve Data</p>
              </div>
            </div>
            <Button onClick={fetchMarketData} variant="ghost" size="sm" className="p-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un actif..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
      ) : filteredData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Essayez de modifier vos filtres ou votre recherche.</p>
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
        <div className="space-y-4">
          {filteredData.map((item) => (
            <Card key={item.symbol} hover className="transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        item.type === 'crypto'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                    >
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.symbol}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'crypto'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {item.type === 'crypto' ? 'CRYPTO' : 'ACTION'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                    <div
                      className={`flex items-center justify-end ${
                        item.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {item.change24h >= 0 ? '+' : ''}
                        {item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {item.marketCap !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
                      <p className="font-semibold text-gray-900 dark:text-white">${formatLargeNumber(item.marketCap)}</p>
                    </div>
                  )}
                  {item.volume24h !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Volume 24h</p>
                      <p className="font-semibold text-gray-900 dark:text-white">${formatLargeNumber(item.volume24h)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Premium Upgrade CTA */}
      {isFreePlan && marketData.length > 10 && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Débloquez l&apos;Aperçu Complet du Marché
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Tout voir</h5>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">Accès à tous les actifs crypto et actions.</p>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Données avancées</h5>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">Indicateurs techniques et graphiques détaillés.</p>
                </div>
              </div>
              <Button
                onClick={handleUpgradeClick}
                className="w-full bg-gradient-to-r from-primary-600 to-crypto-600 text-white"
              >
                <Crown className="w-5 h-5 mr-2" />
                Passer au Premium
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
              20s
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

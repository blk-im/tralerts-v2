import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast'; // Assurez-vous d'avoir toast installé et configuré

// Vos clés API
const ALPHA_VANTAGE_API_KEY = 'AI72KH8ESTBNYNNZ';
const ALPACA_API_KEY = 'PKA6CIB622DQWL15SVRS'; // Note: Alpaca API key est souvent un "API Key ID" et un "Secret Key".
                                              // Pour les requêtes côté client, l'API Key ID est généralement suffisante
                                              // si l'endpoint ne nécessite pas d'authentification complète.
                                              // Si vous rencontrez des problèmes, vérifiez la documentation Alpaca pour l'authentification côté client.

// URLs de base des APIs
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const ALPACA_DATA_BASE_URL = 'https://data.alpaca.markets/v2'; // Utilisez v2 pour les données de marché

// Durée du cache en millisecondes (ex: 5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;
// Cache en mémoire (vide à chaque rechargement de page)
const dataCache = new Map<string, { data: MarketItem; timestamp: number }>();

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
      BTCUSD: 'Bitcoin', // Symboles Alpaca
      ETHUSD: 'Ethereum',
      SOLUSD: 'Solana',
      ADAUSD: 'Cardano',
      BNBUSD: 'Binance Coin',
      XRPUSD: 'Ripple',
      DOTUSD: 'Polkadot',
      DOGEUSD: 'Dogecoin',
      AVAXUSD: 'Avalanche',
      MATICUSD: 'Polygon',
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
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    return value.toLocaleString('en-US'); // Utiliser en-US pour les grands nombres sans devise
  };

  // Fonction de fetch des données de marché
  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    let fetchedItems: MarketItem[] = [];
    const now = Date.now();

    const symbolsToProcess = [
      // Actions (Alpha Vantage)
      { symbol: 'AAPL', type: 'stock' as const },
      { symbol: 'MSFT', type: 'stock' as const },
      { symbol: 'GOOGL', type: 'stock' as const },
      { symbol: 'AMZN', type: 'stock' as const },
      { symbol: 'TSLA', type: 'stock' as const },
      // Cryptos (Alpaca)
      { symbol: 'BTCUSD', type: 'crypto' as const },
      { symbol: 'ETHUSD', type: 'crypto' as const },
      { symbol: 'SOLUSD', type: 'crypto' as const },
      { symbol: 'ADAUSD', type: 'crypto' as const },
      { symbol: 'BNBUSD', type: 'crypto' as const },
    ];

    const fetchPromises = symbolsToProcess.map(async ({ symbol, type }) => {
      const cached = dataCache.get(symbol);
      if (cached && now - cached.timestamp < CACHE_DURATION_MS) {
        console.log(`Using cached data for ${symbol}`);
        return cached.data;
      }

      try {
        let item: MarketItem | null = null;

        if (type === 'stock') {
          // Alpha Vantage pour les actions
          // ATTENTION: Le plan gratuit d'Alpha Vantage est limité à 5 requêtes/minute.
          // Si vous avez 5 actions, chaque rafraîchissement va consommer 5 requêtes.
          const response = await fetch(
            `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Alpha Vantage API Error for ${symbol}: Status ${response.status} - ${response.statusText}. Body: ${errorText}`);
            throw new Error(`Erreur API Alpha Vantage pour ${symbol} (Code: ${response.status})`);
          }
          const data = await response.json();

          if (data['Global Quote'] && data['Global Quote']['05. price']) {
            const price = parseFloat(data['Global Quote']['05. price']);
            const changePercent = parseFloat(data['Global Quote']['10. change percent'].replace('%', '')) || 0;
            const volume = parseFloat(data['Global Quote']['06. volume']) || undefined;
            // Alpha Vantage ne fournit pas directement la capitalisation boursière sur cet endpoint simple
            // marketCap sera undefined
            item = {
              symbol: symbol,
              name: getStockName(symbol),
              price: price,
              change24h: changePercent,
              volume24h: volume,
              type: 'stock',
            };
          } else {
            console.warn(`Alpha Vantage: Données manquantes ou invalides pour ${symbol}. Réponse:`, data);
            throw new Error(`Données manquantes ou invalides pour ${symbol} (Alpha Vantage)`);
          }
        } else {
          // Alpaca pour les cryptos
          // ATTENTION: Obtenir le changement sur 24h avec Alpaca nécessite de multiples requêtes
          // ou un plan supérieur. Le code ci-dessous fera 2 requêtes par crypto pour le 24h change.
          // Cela va consommer vos limites très rapidement sur un plan gratuit.
          const quoteResponse = await fetch(
            `${ALPACA_DATA_BASE_URL}/crypto/quotes/latest?symbols=${encodeURIComponent(symbol)}`, {
                headers: {
                    'APCA-API-KEY-ID': ALPACA_API_KEY,
                    // 'APCA-API-SECRET-KEY': 'YOUR_SECRET_KEY' // Souvent nécessaire pour le backend, pas toujours pour le frontend
                }
            }
          );
          if (!quoteResponse.ok) {
            const errorText = await quoteResponse.text();
            console.error(`Alpaca Crypto Quote API Error for ${symbol}: Status ${quoteResponse.status} - ${quoteResponse.statusText}. Body: ${errorText}`);
            throw new Error(`Erreur API Alpaca Crypto pour ${symbol} (Code: ${quoteResponse.status})`);
          }
          const quoteData = await quoteResponse.json();
          const latestQuote = quoteData.quotes?.[symbol];

          let price: number | undefined;
          if (latestQuote) {
            price = (parseFloat(latestQuote.ap) + parseFloat(latestQuote.bp)) / 2; // Prix moyen bid/ask
          }

          let change24h = 0;
          let volume24h: number | undefined;
          // Pour le changement sur 24h, on doit récupérer les bars (OHLCV)
          // On prend la barre la plus récente et la barre d'il y a 24h
          const barsResponse = await fetch(
            `${ALPACA_DATA_BASE_URL}/crypto/${encodeURIComponent(symbol)}/bars?timeframe=1D&limit=2`, {
                headers: {
                    'APCA-API-KEY-ID': ALPACA_API_KEY,
                }
            }
          );
          if (!barsResponse.ok) {
            const errorText = await barsResponse.text();
            console.error(`Alpaca Crypto Bars API Error for ${symbol}: Status ${barsResponse.status} - ${barsResponse.statusText}. Body: ${errorText}`);
            // Ne pas jeter l'erreur ici, car le prix peut être suffisant
            volume24h = undefined; // Si les bars échouent, le volume est inconnu
          } else {
            const barsData = await barsResponse.json();
            const bars = barsData.bars; // Assurez-vous que la structure est correcte
            if (bars && bars.length >= 2) {
              const currentDayBar = bars[bars.length - 1];
              const previousDayBar = bars[bars.length - 2];
              if (currentDayBar && previousDayBar && previousDayBar.c !== 0) {
                change24h = ((currentDayBar.c - previousDayBar.c) / previousDayBar.c) * 100;
                volume24h = currentDayBar.v;
              }
            } else if (bars && bars.length === 1) {
                // Si seulement une barre est disponible (jour actuel), on ne peut pas calculer le change sur 24h
                volume24h = bars[0].v;
            }
          }

          if (price !== undefined) {
            item = {
              symbol: symbol,
              name: getCryptoName(symbol),
              price: price,
              change24h: change24h,
              marketCap: undefined, // Alpaca ne fournit pas directement la capitalisation boursière sur ces endpoints
              volume24h: volume24h,
              type: 'crypto',
            };
          } else {
            console.warn(`Alpaca: Données de prix manquantes pour ${symbol}. Réponse quote:`, quoteData);
            throw new Error(`Données de prix manquantes pour ${symbol} (Alpaca Crypto)`);
          }
        }

        if (item) {
          dataCache.set(symbol, { data: item, timestamp: now });
          return item;
        }
        return null; // Retourne null si aucune donnée valide n'a pu être construite
      } catch (innerError: any) {
        console.error(`Failed to process data for ${symbol}:`, innerError.message);
        return null; // Retourne null sur erreur pour que Promise.allSettled puisse filtrer
      }
    });

    const results = await Promise.allSettled(fetchPromises);

    fetchedItems = results
      .filter((res) => res.status === 'fulfilled' && res.value !== null)
      .map((res: PromiseFulfilledResult<MarketItem | null>) => res.value as MarketItem);

    if (fetchedItems.length === 0) {
      toast.error('❌ Erreur de récupération des données du marché: Aucune donnée valide reçue. Vérifiez vos clés API et les limites de requêtes.');
      // Ne pas jeter d'erreur ici pour permettre au composant de rendre un état vide sans crash
    } else {
      setMarketData(fetchedItems);
      toast.success('Données du marché mises à jour !');
    }
    setLoading(false);
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

    if (isFreePlan) filtered = filtered.slice(0, 10); // Limite d'affichage pour le plan gratuit

    setFilteredData(filtered);
  }, [marketData, selectedType, searchTerm, selectedFilter, isFreePlan]);

  // Rafraîchissement toutes les 60 secondes (pour tenter de respecter les limites d'Alpha Vantage)
  useEffect(() => {
    fetchMarketData(); // Exécute une fois au montage
    const interval = setInterval(() => fetchMarketData(), 60000); // Puis toutes les 60 secondes
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
                {/* Mettre à jour le texte pour refléter les nouvelles APIs */}
                <p className="text-sm text-gray-600 dark:text-gray-400">Mise à jour en temps réel via Alpha Vantage et Alpaca</p>
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
              60s
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

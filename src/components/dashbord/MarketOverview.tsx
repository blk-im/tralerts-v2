import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const CRYPTO_API_URL = '/api/market-data-crypto';
const STOCK_API_URL = '/api/market-data-stocks';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number | string;
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
  const [isFreePlan] = useState(true);

  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

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
    return value.toLocaleString('en-US');
  };

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setCryptoError(null); setStockError(null);

    try {
      const [cryptoRes, stockRes] = await Promise.all([
        fetch(CRYPTO_API_URL),
        fetch(STOCK_API_URL),
      ]);
      let cryptoData: MarketItem[] = [];
      let stockData: MarketItem[] = [];

      if (cryptoRes.ok) {
        cryptoData = await cryptoRes.json();
        if (!Array.isArray(cryptoData) || cryptoData.length === 0) {
          setCryptoError("Aucune donnée crypto disponible — vérifiez votre backend/quotas.");
        }
      } else {
        setCryptoError(`Erreur API crypto : ${cryptoRes.statusText}`);
      }

      if (stockRes.ok) {
        stockData = await stockRes.json();
        if (!Array.isArray(stockData) || stockData.length === 0) {
          setStockError("Aucune donnée actions disponible — vérifiez le backend ou la clé API.");
        }
      } else {
        setStockError(`Erreur API actions : ${stockRes.statusText}`);
      }

      setMarketData([...cryptoData, ...stockData]);
      toast.success('Données du marché mises à jour!');
    } catch (error: any) {
      setCryptoError("Erreur de récupération des données du marché.");
      setStockError("Erreur de récupération des données du marché.");
      toast.error(`Erreur récupération: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => fetchMarketData(), 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useEffect(() => {
    let filtered = [...marketData];
    if (selectedType !== 'all') filtered = filtered.filter(item => item.type === selectedType);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(term) ||
        (item.name && item.name.toLowerCase().includes(term))
      );
    }

    if (selectedFilter === 'gainers') {
      filtered = filtered.filter(item => item.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h);
    } else if (selectedFilter === 'losers') {
      filtered = filtered.filter(item => item.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h);
    }

    if (isFreePlan) filtered = filtered.slice(0, 10);
    setFilteredData(filtered);
  }, [marketData, selectedType, searchTerm, selectedFilter, isFreePlan]);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) onPremiumUpgrade();
  };

  // Séparation
  const cryptoData = filteredData.filter(item => item.type === 'crypto');
  const stockData = filteredData.filter(item => item.type === 'stock');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Aperçu du Marché</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Crypto & Actions en temps réel</p>
              </div>
            </div>
            <Button onClick={fetchMarketData} variant="ghost" size="sm" className="p-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cryptoError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 dark:text-red-200 text-sm font-bold">Crypto :</span>
              <span className="text-red-700 dark:text-red-300 text-sm">{cryptoError}</span>
            </div>
          )}
          {stockError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 dark:text-yellow-200 text-sm font-bold">Actions :</span>
              <span className="text-yellow-700 dark:text-yellow-300 text-sm">{stockError}</span>
            </div>
          )}

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

      {/* MARKET CRYPTO SECTION */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-orange-700 dark:text-orange-300">Marché Crypto</h2>
        </CardHeader>
        <CardContent>
          {cryptoData.length === 0 ? (
            <p className="text-gray-500">Aucune crypto affichée.</p>
          ) : (
            cryptoData.map((item) => (
              <Card key={item.symbol} className="transition-all duration-200 mb-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600">
                        {item.symbol.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.symbol.toUpperCase()}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                            CRYPTO
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                      <div className={`flex items-center justify-end ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {typeof item.marketCap === "string"
                            ? item.marketCap
                            : `$${formatLargeNumber(item.marketCap)}`}
                        </p>
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
            ))
          )}
        </CardContent>
      </Card>

      {/* MARKET STOCK SECTION */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-300">Marché Actions</h2>
        </CardHeader>
        <CardContent>
          {stockData.length === 0 ? (
            <p className="text-gray-500">Aucune action affichée.</p>
          ) : (
            stockData.map((item) => (
              <Card key={item.symbol} className="transition-all duration-200 mb-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600">
                        {item.symbol.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.symbol.toUpperCase()}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            ACTION
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(item.price)}</p>
                      <div className={`flex items-center justify-end ${item.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {typeof item.marketCap === "string"
                            ? item.marketCap
                            : `$${formatLargeNumber(item.marketCap)}`}
                        </p>
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
            ))
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}

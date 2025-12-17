import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const CRYPTO_API_URL = '/api/market-data-crypto';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number | string;
  volume24h?: number;
  type: 'crypto';
  image?: string | null;
  rank?: number | null;
}

export function MarketCrypto() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [filtered, setFiltered] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [isFreePlan] = useState(false); // Changé à false pour voir les 100
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<string>('');

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'USD', 
      minimumFractionDigits: value < 1 ? 4 : 2, 
      maximumFractionDigits: value < 1 ? 6 : 2 
    }).format(value);

  const formatLargeNumber = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(2)}T`;
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    return value.toLocaleString('en-US');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setCryptoError(null);
    try {
      const res = await fetch(CRYPTO_API_URL);
      if (res.ok) {
        const result = await res.json();
        if (result.data && Array.isArray(result.data) && result.data.length > 0) {
          setData(result.data);
          setCacheInfo(result.cached ? `Cache (${result.age}s)` : 'Fresh');
          toast.success('Données crypto à jour !');
        } else {
          setCryptoError("Aucune donnée crypto disponible.");
        }
      } else {
        setCryptoError(`Erreur API crypto : ${res.statusText}`);
      }
    } catch (error: any) {
      setCryptoError("Erreur de récupération des données du marché.");
      toast.error(`Erreur récupération: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling toutes les 2 secondes
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 2000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    let filtered = [...data];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.symbol.toLowerCase().includes(term) ||
        (item.name && item.name.toLowerCase().includes(term))
      );
    }
    if (selectedFilter === 'gainers') {
      filtered = filtered.filter(item => item.change24h > 0).sort((a, b) => b.change24h - a.change24h);
    } else if (selectedFilter === 'losers') {
      filtered = filtered.filter(item => item.change24h < 0).sort((a, b) => a.change24h - b.change24h);
    }
    if (isFreePlan) filtered = filtered.slice(0, 10);
    setFiltered(filtered);
  }, [data, searchTerm, selectedFilter, isFreePlan]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-3 text-orange-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marché Crypto</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Actifs crypto en temps réel - {cacheInfo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <Button onClick={fetchData} variant="ghost" size="sm" className="p-2" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
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

          {isFreePlan && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2" />
                <span className="font-medium text-orange-800 dark:text-orange-200 text-sm">Plan Gratuit - 10 cryptos visibles</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-bold">
                  {filtered.length}/{data.length}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une crypto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-2 mb-6">
            <Button onClick={() => setSelectedFilter('all')} variant={selectedFilter === 'all' ? 'primary' : 'secondary'} size="sm" className="flex-1">
              Toutes les cryptos
            </Button>
            <Button onClick={() => setSelectedFilter('gainers')} variant={selectedFilter === 'gainers' ? 'primary' : 'secondary'} size="sm" className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />Top Gainers
            </Button>
            <Button onClick={() => setSelectedFilter('losers')} variant={selectedFilter === 'losers' ? 'primary' : 'secondary'} size="sm" className="flex-1">
              <TrendingDown className="w-4 h-4 mr-2" />Top Losers
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && filtered.length === 0 ? (
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Essayez de modifier votre recherche.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={item.symbol}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600">
                        {item.symbol.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.symbol.toUpperCase()}</h3>
                        {item.rank && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            #{item.rank}
                          </span>
                        )}
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
                        {typeof item.marketCap === "string" ? item.marketCap : `$${formatLargeNumber(Number(item.marketCap))}`}
                      </p>
                    </div>
                  )}
                  {item.volume24h !== undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Volume 24h</p>
                      <p className="font-semibold text-gray-900 dark:text-white">${formatLargeNumber(Number(item.volume24h))}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

            {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {data.filter((item) => item.change24h > 0).length}
            </p>
            <p className="text-sm text-gray-600">Cryptos en hausse</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {data.filter((item) => item.change24h < 0).length}
            </p>
            <p className="text-sm text-gray-600">Cryptos en baisse</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <RefreshCw className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">2s</p>
            <p className="text-sm text-gray-600">Fréquence de mise à jour</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

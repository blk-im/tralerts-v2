import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

const STOCK_API_URL = '/api/market-data-stocks';

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap?: number | string;
  volume?: number;
  type: 'stock';
}

export function MarketStock() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [filtered, setFiltered] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [isFreePlan] = useState(true);
  const [stockError, setStockError] = useState<string | null>(null);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: value<1?4:2, maximumFractionDigits: value<1?6:2 }).format(value);

  const formatLargeNumber = (value: number) => {
    if (value===undefined||value===null||isNaN(value)) return 'N/A';
    if (value>=1_000_000_000_000) return `${(value/1_000_000_000_000).toFixed(2)}T`;
    if (value>=1_000_000_000) return `${(value/1_000_000_000).toFixed(2)}B`;
    if (value>=1_000_000) return `${(value/1_000_000).toFixed(2)}M`;
    return value.toLocaleString('en-US');
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setStockError(null);
    try {
      const res = await fetch(STOCK_API_URL);
      let result: MarketItem[] = [];
      if (res.ok) {
        result = await res.json();
        if (!Array.isArray(result) || result.length === 0) {
          setStockError("Aucune donnée actions disponible — vérifiez le backend ou la clé API.");
        }
      } else {
        setStockError(`Erreur API actions : ${res.statusText}`);
      }
      setData(result);
      toast.success('Données actions à jour !');
    } catch (error: any) {
      setStockError("Erreur de récupération des données du marché.");
      toast.error(`Erreur récupération: ${error.message}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60000);
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
    if (selectedFilter==='gainers') {
      filtered = filtered.filter(item=>item.change24h>0).sort((a,b)=>b.change24h-a.change24h);
    } else if (selectedFilter==='losers') {
      filtered = filtered.filter(item=>item.change24h<0).sort((a,b)=>a.change24h-b.change24h);
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
              <Globe className="w-6 h-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Marché Actions</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Actifs boursiers en temps réel</p>
              </div>
            </div>
            <Button onClick={fetchData} variant="ghost" size="sm" className="p-2" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">Plan Gratuit - 10 stocks visibles</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-bold">
                  {filtered.length}/{data.length}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e)=>setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-2 mb-6">
            <Button onClick={()=>setSelectedFilter('all')} variant={selectedFilter==='all'?'primary':'secondary'} size="sm" className="flex-1">Toutes les actions</Button>
            <Button onClick={()=>setSelectedFilter('gainers')} variant={selectedFilter==='gainers'?'primary':'secondary'} size="sm" className="flex-1">
              <TrendingUp className="w-4 h-4 mr-2" />Top Gainers
            </Button>
            <Button onClick={()=>setSelectedFilter('losers')} variant={selectedFilter==='losers'?'primary':'secondary'} size="sm" className="flex-1">
              <TrendingDown className="w-4 h-4 mr-2" />Top Losers
            </Button>
          </div>
        </CardContent>
      </Card>
      {loading && filtered.length===0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_,i)=>(
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
      ) : filtered.length===0 ? (
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
                    <div className={`flex items-center justify-end ${item.change24h>=0?'text-green-600':'text-red-600'}`}>
                      {item.change24h>=0?(
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ):(
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-sm font-medium">
                        {item.change24h>=0?'+':''}
                        {item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {item.marketCap!==undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {typeof item.marketCap==="string"?item.marketCap:`$${formatLargeNumber(Number(item.marketCap))}`}
                      </p>
                    </div>
                  )}
                  {item.volume!==undefined && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Volume 24h</p>
                      <p className

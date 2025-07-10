import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Star, Globe, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  marketCap?: number;
  type: 'crypto' | 'stock';
}

export function MarketOverview() {
  const [cryptoData, setCryptoData] = useState<MarketData[]>([]);
  const [stockData, setStockData] = useState<MarketData[]>([]);
  const [activeTab, setActiveTab] = useState<'crypto' | 'stocks'>('crypto');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
    
    // Rafraîchir les données toutes les 5 secondes
    const interval = setInterval(fetchMarketData, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      
      // Fetch crypto data from CoinGecko
      const cryptoResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&x_cg_demo_api_key=CG-Demo'
      );
      
      if (cryptoResponse.ok) {
        const cryptoJson = await cryptoResponse.json();
        const formattedCrypto = cryptoJson.map((coin: any) => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h,
          volume: coin.total_volume,
          marketCap: coin.market_cap,
          type: 'crypto' as const
        }));
        setCryptoData(formattedCrypto);
      }

      // Mock stock data (in production, use real stock API)
      const mockStocks: MarketData[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change24h: 1.2, volume: 45000000, type: 'stock' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.80, change24h: -0.8, volume: 1200000, type: 'stock' },
        { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.85, change24h: 0.5, volume: 25000000, type: 'stock' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change24h: -2.1, volume: 35000000, type: 'stock' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3380.00, change24h: 1.8, volume: 3500000, type: 'stock' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30, change24h: 3.2, volume: 28000000, type: 'stock' },
      ];
      setStockData(mockStocks);

    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  const currentData = activeTab === 'crypto' ? cryptoData : stockData;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('crypto')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
            activeTab === 'crypto'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          Cryptomonnaies
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center ${
            activeTab === 'stocks'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Actions
        </button>
      </div>

      {/* Market Data */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Top {activeTab === 'crypto' ? 'Cryptomonnaies' : 'Actions'}
          </h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentData.map((item, index) => (
              <div key={item.symbol} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                    item.type === 'crypto' 
                      ? 'bg-gradient-to-r from-crypto-500 to-crypto-600' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}>
                    {item.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.symbol}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.name}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vol: {formatVolume(item.volume)}
                    </p>
                  </div>
                  
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    item.change24h >= 0 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {item.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
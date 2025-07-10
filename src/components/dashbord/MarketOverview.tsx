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
    
    // Rafraîchir les données toutes les 5 secondes (5000 ms)
    const interval = setInterval(fetchMarketData, 5000); 
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      
      if (!apiKey) {
        console.error('Finnhub API key not found');
        setDemoData();
        return;
      }
      
      // Fetch crypto data from CoinGecko
      const cryptoResponse = await fetch(
        try {
          // Utiliser Finnhub pour les cryptomonnaies
          const cryptoSymbols = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:BNBUSDT', 'BINANCE:XRPUSDT', 'BINANCE:ADAUSDT', 'BINANCE:DOGEUSDT', 'BINANCE:SOLUSDT', 'BINANCE:DOTUSDT'];
          
          const cryptoPromises = cryptoSymbols.map(async (symbol) => {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
            if (response.ok) {
              const data = await response.json();
              // Extraire le symbole de base (ex: BINANCE:BTCUSDT -> BTC)
              const baseSymbol = symbol.split(':')[1].replace('USDT', '');
              
              return {
                symbol: baseSymbol,
                name: getCryptoName(baseSymbol),
                price: data.c || 0,
                change24h: data.dp || 0,
                volume: data.v || 0,
                type: 'crypto' as const
              };
            }
            return null;
          });
          
          const cryptoResults = await Promise.all(cryptoPromises);
          const validResults = cryptoResults.filter(result => result !== null);
        // Mettre à jour les prix des cryptos existantes
        try {
          const updatedCrypto = [...cryptoData];
          const updatePromises = updatedCrypto.map(async (crypto, index) => {
            const symbol = `BINANCE:${crypto.symbol}USDT`;
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.c) {
                updatedCrypto[index].price = data.c;
                updatedCrypto[index].change24h = data.dp || updatedCrypto[index].change24h;
              }
            }
          });
          
          await Promise.all(updatePromises);
          setCryptoData(updatedCrypto);
        } catch (error) {
          console.error('Error updating crypto prices:', error);
          // Légère mise à jour aléatoire en cas d'erreur
          const updatedCrypto = [...cryptoData];
          for (let i = 0; i < updatedCrypto.length; i++) {
            const priceChange = (Math.random() - 0.5) * 0.01 * updatedCrypto[i].price;
            updatedCrypto[i].price += priceChange;
            updatedCrypto[i].change24h += (Math.random() - 0.5) * 0.1;
          }
          setCryptoData(updatedCrypto);
        }
          setDemoCryptoData();
        }
      // Fetch stock data from Finnhub
      if (stockData.length === 0) {
        try {
          const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA'];
          
          const stockPromises = stockSymbols.map(async (symbol) => {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
            if (response.ok) {
              const data = await response.json();
              
              return {
                symbol: symbol,
                name: getStockName(symbol),
                price: data.c || 0,
                change24h: data.dp || 0,
                volume: data.v || 0,
                type: 'stock' as const
              };
            }
            return null;
          });
          
          const stockResults = await Promise.all(stockPromises);
          const validResults = stockResults.filter(result => result !== null);
          
          if (validResults.length > 0) {
            setStockData(validResults);
          } else {
            throw new Error('No valid stock data from Finnhub');
          }
        } catch (error) {
          console.error('Error fetching stock data from Finnhub:', error);
          // Fallback to demo data
          setDemoStockData();
        }
      } else {
        // Mettre à jour les prix des actions existantes
        try {
          const updatedStocks = [...stockData];
          const updatePromises = updatedStocks.map(async (stock, index) => {
            const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.c) {
                updatedStocks[index].price = data.c;
                updatedStocks[index].change24h = data.dp || updatedStocks[index].change24h;
              }
            }
          });
          
          await Promise.all(updatePromises);
          setStockData(updatedStocks);
        } catch (error) {
          console.error('Error updating stock prices:', error);
          // Légère mise à jour aléatoire en cas d'erreur
          const updatedStocks = [...stockData];
          for (let i = 0; i < updatedStocks.length; i++) {
            const priceChange = (Math.random() - 0.5) * 0.01 * updatedStocks[i].price;
            updatedStocks[i].price += priceChange;
            updatedStocks[i].change24h += (Math.random() - 0.5) * 0.1;
          }
          setStockData(updatedStocks);
        }
      }

    } catch (error) {
      console.error('Error fetching market data:', error);
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  // Définir des données de démonstration en cas d'erreur API
  const setDemoData = () => {
    setDemoCryptoData();
    setDemoStockData();
  };
  
  const setDemoCryptoData = () => {
    const demoCryptos: MarketData[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000 + (Math.random() - 0.5) * 1000, change24h: (Math.random() - 0.3) * 5, volume: 25000000000, type: 'crypto' },
      { symbol: 'ETH', name: 'Ethereum', price: 3200 + (Math.random() - 0.5) * 100, change24h: (Math.random() - 0.3) * 5, volume: 15000000000, type: 'crypto' },
      { symbol: 'BNB', name: 'Binance Coin', price: 580 + (Math.random() - 0.5) * 20, change24h: (Math.random() - 0.3) * 5, volume: 2000000000, type: 'crypto' },
      { symbol: 'XRP', name: 'Ripple', price: 0.5 + (Math.random() - 0.5) * 0.05, change24h: (Math.random() - 0.3) * 5, volume: 1500000000, type: 'crypto' },
      { symbol: 'ADA', name: 'Cardano', price: 0.45 + (Math.random() - 0.5) * 0.05, change24h: (Math.random() - 0.3) * 5, volume: 1000000000, type: 'crypto' },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.08 + (Math.random() - 0.5) * 0.01, change24h: (Math.random() - 0.3) * 5, volume: 800000000, type: 'crypto' },
    ];
    setCryptoData(demoCryptos);
  };
  
  const setDemoStockData = () => {
    const demoStocks: MarketData[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43 + (Math.random() - 0.5) * 5, change24h: (Math.random() - 0.3) * 3, volume: 45000000, type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2750.80 + (Math.random() - 0.5) * 50, change24h: (Math.random() - 0.3) * 3, volume: 1200000, type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.85 + (Math.random() - 0.5) * 10, change24h: (Math.random() - 0.3) * 3, volume: 25000000, type: 'stock' },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50 + (Math.random() - 0.5) * 15, change24h: (Math.random() - 0.3) * 3, volume: 35000000, type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3380.00 + (Math.random() - 0.5) * 70, change24h: (Math.random() - 0.3) * 3, volume: 3500000, type: 'stock' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.30 + (Math.random() - 0.5) * 25, change24h: (Math.random() - 0.3) * 3, volume: 28000000, type: 'stock' },
    ];
    setStockData(demoStocks);
  };
  
  // Obtenir le nom complet d'une crypto à partir de son symbole
  const getCryptoName = (symbol: string): string => {
    const cryptoNames: {[key: string]: string} = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'XRP': 'Ripple',
      'ADA': 'Cardano',
      'DOGE': 'Dogecoin',
      'SOL': 'Solana',
      'DOT': 'Polkadot'
    };
    
    return cryptoNames[symbol] || symbol;
  };
  
  // Obtenir le nom complet d'une action à partir de son symbole
  const getStockName = (symbol: string): string => {
    const stockNames: {[key: string]: string} = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.'
    };
    
    return stockNames[symbol] || symbol;
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
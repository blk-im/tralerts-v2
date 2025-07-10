import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  marketType: 'crypto' | 'stock';
}

interface PriceData {
  time: string;
  price: number;
}

export function PriceChart({ symbol, marketType }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchPriceData();
    
    // Mettre à jour les prix toutes les 5 secondes
    intervalRef.current = window.setInterval(fetchPriceData, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, marketType]);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      
      if (marketType === 'crypto') {
        // Fetch crypto data from CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        const price = data[symbol.toLowerCase()]?.usd;
        const change = data[symbol.toLowerCase()]?.usd_24h_change;
        
        if (price) {
          setCurrentPrice(price);
          setPriceChange(change || 0);
          
          // Ajouter le nouveau prix aux données historiques
          setData(prevData => {
            const newData = [...prevData];
            const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            
            // Ajouter le nouveau point de données
            newData.push({
              time,
              price: Number(price.toFixed(2))
            });
            
            // Limiter à 24 points de données
            if (newData.length > 24) {
              return newData.slice(newData.length - 24);
            }
            
            return newData;
          });
        }
      } else {
        // Pour les actions, utiliser une API de marché boursier
        // Pour cette démo, nous utilisons des prix simulés mais réalistes
        const stockPrices = {
          'AAPL': 175.43 + (Math.random() - 0.5) * 5,
          'GOOGL': 2750.80 + (Math.random() - 0.5) * 50,
          'MSFT': 378.85 + (Math.random() - 0.5) * 10,
          'TSLA': 248.50 + (Math.random() - 0.5) * 15,
          'AMZN': 3380.00 + (Math.random() - 0.5) * 70,
          'NVDA': 875.30 + (Math.random() - 0.5) * 25,
        };
        
        const price = stockPrices[symbol.toUpperCase()] || (Math.random() * 200 + 50);
        const change = (Math.random() - 0.5) * 6; // Entre -3% et +3%
        
        setCurrentPrice(price);
        setPriceChange(change);
        
        // Ajouter le nouveau prix aux données historiques
        setData(prevData => {
          const newData = [...prevData];
          const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          
          // Ajouter le nouveau point de données
          newData.push({
            time,
            price: Number(price.toFixed(2))
          });
          
          // Limiter à 24 points de données
          if (newData.length > 24) {
            return newData.slice(newData.length - 24);
          }
          
          return newData;
        });
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap">
          <div>
            <h3 className="text-lg font-semibold uppercase">{symbol}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {marketType === 'crypto' ? 'Cryptomonnaie' : 'Action'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              ${currentPrice?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </p>
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm font-medium">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg)',
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`$${value.toFixed(6)}`, 'Prix']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={priceChange >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Mise à jour toutes les 5 secondes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
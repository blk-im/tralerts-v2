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

// Finnhub WebSocket pour les mises à jour en temps réel
let finnhubSocket: WebSocket | null = null;

export function PriceChart({ symbol, marketType }: PriceChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);

  // Fonction pour fermer le WebSocket
  const closeWebSocket = () => {
    if (finnhubSocket) {
      console.log('Closing Finnhub WebSocket');
      finnhubSocket.close();
      finnhubSocket = null;
    }
  };

  useEffect(() => {
    fetchPriceData();
    
    // Mettre à jour les prix toutes les 5 secondes si le WebSocket échoue
    intervalRef.current = window.setInterval(() => {
      if (!finnhubSocket || finnhubSocket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, fetching data via REST API');
        fetchPriceData();
      }
    }, 5000);
    
    // Initialiser le WebSocket pour les mises à jour en temps réel
    initWebSocket();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      closeWebSocket();
    };
  }, [symbol, marketType]);

  // Initialiser le WebSocket Finnhub
  const initWebSocket = () => {
    const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
    if (!apiKey || typeof WebSocket === 'undefined') {
      console.error('Finnhub API key not found or WebSocket not supported');
      return;
    }
    
    closeWebSocket();
    
    try {
      finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
      
      finnhubSocket.onopen = () => {
        console.log('Finnhub WebSocket connected');
        // S'abonner au symbole
        if (finnhubSocket && finnhubSocket.readyState === WebSocket.OPEN) {
          const formattedSymbol = marketType === 'crypto' 
            ? `BINANCE:${symbol.toUpperCase()}USDT` 
            : symbol.toUpperCase();
          
          console.log(`Subscribing to ${formattedSymbol}`);
          const subscribeMsg = {
            type: 'subscribe',
            symbol: formattedSymbol
          };
          finnhubSocket.send(JSON.stringify(subscribeMsg));
        }
      };
      
      finnhubSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'trade' && message.data && message.data.length > 0) {
            const trade = message.data[0];
            const price = trade.p;
            
            if (price) {
              setCurrentPrice(price);
              
              // Calculer le changement de prix
              if (data.length > 0) {
                const firstPrice = data[0].price;
                const change = ((price - firstPrice) / firstPrice) * 100;
                setPriceChange(change);
              }
              
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
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      finnhubSocket.onerror = (error) => {
        console.error('Finnhub WebSocket error:', error);
      };
      
      finnhubSocket.onclose = () => {
        console.log('Finnhub WebSocket disconnected');
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  };

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey || apiKey === 'placeholder-key') {
        console.error('Finnhub API key not configured');
        alert('⚠️ Clé API Finnhub manquante ! Configurez VITE_FINNHUB_API_KEY dans .env');
        return;
      }
      
      if (marketType === 'crypto') {
        // Format du symbole pour Finnhub crypto
        const cryptoSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
        console.log(`🔄 Récupération prix crypto: ${cryptoSymbol}`);
        
        const response = await fetch(
          `https://finnhub.io/api/v1/crypto/candle?symbol=${cryptoSymbol}&resolution=5&count=24&token=${apiKey}`
        );
        
        if (response.ok) {
          const candleData = await response.json();
          console.log(`✅ Données crypto reçues pour ${cryptoSymbol}:`, candleData);
          
          if (candleData.s === 'ok' && candleData.c && candleData.c.length > 0) {
            const prices = candleData.c;
            const currentPrice = prices[prices.length - 1];
            const firstPrice = prices[0];
            const change = ((currentPrice - firstPrice) / firstPrice) * 100;
            
            console.log(`💰 Prix actuel ${symbol}: $${currentPrice}`);
            setCurrentPrice(currentPrice);
            setPriceChange(change);
            
            // Créer des données historiques à partir des chandeliers
            const historicalData = prices.map((price: number, index: number) => {
              const timestamp = candleData.t[index] * 1000;
              const time = new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              return {
                time,
                price: Number(price.toFixed(2))
              };
            });
            
            setData(historicalData);
          } else {
            console.error('❌ Format de données invalide pour', cryptoSymbol, ':', candleData);
            alert(`❌ Données invalides pour ${symbol}. Vérifiez que le symbole existe sur Finnhub.`);
          }
        } else {
          const errorText = await response.text();
          console.error('❌ Erreur API crypto:', errorText);
          alert(`❌ Erreur API pour ${symbol}: ${response.status}`);
        }
      } else {
        // Format du symbole pour Finnhub stocks
        const stockSymbol = symbol.toUpperCase();
        console.log(`🔄 Récupération prix action: ${stockSymbol}`);
        
        // Récupérer le prix actuel
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${apiKey}`
        );
        
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          console.log(`✅ Données action reçues pour ${stockSymbol}:`, quoteData);
          
          if (quoteData.c) {
            const currentPrice = quoteData.c;
            const change = quoteData.dp || 0; // Changement en pourcentage
            
            console.log(`💰 Prix actuel ${symbol}: $${currentPrice}`);
            setCurrentPrice(currentPrice);
            setPriceChange(change);
            
            // Récupérer les données historiques
            const candleResponse = await fetch(
              `https://finnhub.io/api/v1/stock/candle?symbol=${stockSymbol}&resolution=5&count=24&token=${apiKey}`
            );
            
            if (candleResponse.ok) {
              const candleData = await candleResponse.json();
              
              if (candleData.s === 'ok' && candleData.c && candleData.c.length > 0) {
                const prices = candleData.c;
                
                // Créer des données historiques à partir des chandeliers
                const historicalData = prices.map((price: number, index: number) => {
                  const timestamp = candleData.t[index] * 1000;
                  const time = new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return {
                    time,
                    price: Number(price.toFixed(2))
                  };
                });
                
                setData(historicalData);
              } else {
                console.error('❌ Format de données chandelier invalide:', candleData);
                alert(`❌ Données historiques invalides pour ${symbol}`);
              }
            } else {
              const errorText = await candleResponse.text();
              console.error('❌ Erreur données historiques:', errorText);
              alert(`❌ Erreur données historiques pour ${symbol}`);
            }
          } else {
            console.error('❌ Format de prix invalide:', quoteData);
            alert(`❌ Prix invalide pour ${symbol}. Vérifiez que le symbole existe.`);
          }
        } else {
          const errorText = await quoteResponse.text();
          console.error('❌ Erreur prix action:', errorText);
          alert(`❌ Erreur prix pour ${symbol}: ${quoteResponse.status}`);
        }
      }
    } catch (error) {
      console.error('Error fetching price data:', error);
      alert(`❌ Erreur réseau: ${error.message}`);
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
      <CardContent className="overflow-hidden p-0">
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
                type="linear" 
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
            Mise à jour en temps réel via Finnhub
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
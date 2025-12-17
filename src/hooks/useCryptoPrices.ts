import { useEffect, useState, useRef } from 'react';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  market_cap: number | null;
  circulating_supply: number | null;
  image: string | null;
  rank: number | null;
  updated_at: string;
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchPrices();
    
    // Polling toutes les 2 secondes
    intervalRef.current = setInterval(fetchPrices, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function fetchPrices() {
    try {
      const response = await fetch('/api/market-data-crypto');
      const result = await response.json();
      
      if (result.data) {
        setPrices(result.data);
        setCacheInfo(result.cached ? `Cache (${result.age}s)` : 'Fresh');
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur fetch crypto:', error);
    }
  }

  return { prices, loading, cacheInfo };
}

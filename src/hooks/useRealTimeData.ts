/**
 * Hook pour les données en temps réel
 */

import { useState, useEffect, useRef } from 'react';
import { finnhubService } from '../services/finnhubService';

interface UseRealTimeDataOptions {
  symbols: Array<{symbol: string, marketType: 'crypto' | 'stock'}>;
  refreshInterval?: number; // en millisecondes
  enabled?: boolean;
}

export function useRealTimeData({
  symbols,
  refreshInterval = 30000, // 30 secondes par défaut
  enabled = true
}: UseRealTimeDataOptions) {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  const fetchData = async () => {
    if (!enabled || symbols.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const quotes = await finnhubService.getMultipleQuotes(symbols);
      setData(quotes);
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchData();

    // Set up interval for real-time updates
    if (refreshInterval > 0) {
      intervalRef.current = window.setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbols, refreshInterval, enabled]);

  const refresh = () => {
    setLoading(true);
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refresh
  };
}
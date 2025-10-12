import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Search, Filter, Globe, Zap, Crown } from 'lucide-react';
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
  marketCap?: number;
  volume24h?: number;
  type: 'crypto' | 'stock';
  dexId?: string;
  chainId?: string;
  url?: string;
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

  // Utilitaire pour afficher les devises correctement
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

  // Nouveau fetch qui combine crypto et stocks
  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    try {
      const [cryptoRes, stockRes] = await Promise.all([
        fetch(CRYPTO_API_URL),
        fetch(STOCK_API_URL),
      ]);

      // Ajout d'un gestionnaire d'erreur par réponse brute
      if (!cryptoRes.ok) {
        const err = await cryptoRes.text();
        toast.error(`❌ Crypto error: ${cryptoRes.status} - ${err}`);
      }
      if (!stockRes.ok) {
        const err = await stockRes.text();
        toast.error(`❌ Stock error: ${stockRes.status} - ${err}`);
      }

      const cryptoData = cryptoRes.ok ? await cryptoRes.json() : [];
      const stockData = stockRes.ok ? await stockRes.json() : [];
      if ((!Array.isArray(cryptoData) && !Array.isArray(stockData)) || (cryptoData.length === 0 && stockData.length === 0)) {
        toast.error('❌ Aucune donnée de marché reçue (cryptos/stocks).');
      }

      // Fusion des résultats pour l'affichage, type déjà marqué sur chaque item
      setMarketData([...cryptoData, ...stockData]);
      toast.success('📊 Données du marché à jour !');
    } catch (error: any) {
      console.error('Erreur récupération marché:', error);
      toast.error(`❌ Impossible de récupérer les données : ${error.message}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = [...marketData];
    if (selectedType !== 'all') filtered = filtered.filter((item) => item.type === selectedType);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.symbol.toLowerCase().includes(term) ||
          (item.name && item.name.toLowerCase().includes(term))
      );
    }

    if (selectedFilter === 'gainers') {
      filtered = filtered
        .filter((item) => item.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h);
    } else if (selectedFilter === 'losers') {
      filtered = filtered
        .filter((item) => item.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h);
    }

    if (isFreePlan) filtered = filtered.slice(0, 10);
    setFilteredData(filtered);
  }, [marketData, selectedType, searchTerm, selectedFilter, isFreePlan]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(() => fetchMarketData(), 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) onPremiumUpgrade();
  };

  // ... (Le JSX d'affichage reste identique, pas de bug structurel à corriger : tu peux utiliser tel quel le code de ta question !)
  // Si tu veux, ajoute une Card de débogage pour voir si tu as bien la data côté stocks ou cryptos.

  return (
    <div className="space-y-6">
      {/* ... tout ton JSX identique ! */}
    </div>
  );
}

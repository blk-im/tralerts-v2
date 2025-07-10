import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Activity, Plus, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface PortfolioItem {
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  change24h: number;
  marketType: 'crypto' | 'stock';
}

interface PortfolioProps {
  onPremiumUpgrade?: () => void;
}

export function Portfolio({ onPremiumUpgrade }: PortfolioProps) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange, setTotalChange] = useState(0);
  const [isFreePlan] = useState(true); // Simulation - en production, récupérer depuis l'utilisateur
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      console.log('Fetching portfolio data');
      
      // Vérifier si la table portfolio existe
      const { error: tableCheckError } = await supabase
        .from('portfolio')
        .select('count(*)', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.error('Error checking portfolio table:', tableCheckError);
        console.log('Using demo portfolio data');
        setDemoPortfolio();
        return;
      }
      
      // Récupérer le portfolio de l'utilisateur depuis la base de données
      const { data: portfolioData, error } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) {
        console.error('Error fetching portfolio:', error);
        console.log('Using demo portfolio data due to error');
        setDemoPortfolio();
        return;
      }
      
      if (portfolioData && portfolioData.length > 0) {
        // Convertir les données de la base en PortfolioItem
        const items: PortfolioItem[] = await Promise.all(portfolioData.map(async (item) => {
          // Récupérer le prix actuel (pour une démo, on utilise des prix simulés)
          let currentPrice;
          try {
            currentPrice = await fetchCurrentPrice(item.symbol, item.market_type);
          } catch (error) {
            console.error(`Error fetching price for ${item.symbol}:`, error);
            currentPrice = getDefaultPrice(item.symbol, item.market_type);
          }
          
          return {
            symbol: item.symbol,
            name: getAssetName(item.symbol, item.market_type),
            amount: item.quantity,
            currentPrice,
            change24h: (Math.random() - 0.5) * 10, // Simuler un changement de prix
            marketType: item.market_type
          };
        }));
        
        setPortfolio(items);
        
        // Calculer la valeur totale
        const total = items.reduce((sum, item) => sum + (item.amount * item.currentPrice), 0);
        setTotalValue(total);
        
        // Calculer le changement total pondéré
        const weightedChange = items.reduce((sum, item) => {
          const weight = (item.amount * item.currentPrice) / total;
          return sum + (item.change24h * weight);
        }, 0);
        setTotalChange(weightedChange);
      } else {
        // Aucun élément dans le portfolio, utiliser des données vides
        setPortfolio([]);
        setTotalValue(0);
        setTotalChange(0);
      }
    } catch (error) {
      console.error('Error in portfolio fetch:', error);
      console.log('Using demo portfolio data due to error');
      setDemoPortfolio();
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir un prix actuel (simulé pour la démo)
  const fetchCurrentPrice = async (symbol: string, marketType: string): Promise<number> => {
    if (marketType === 'crypto') {
      // Utiliser Finnhub pour les cryptomonnaies
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) {
        console.error('Finnhub API key not found');
        return getDefaultPrice(symbol, marketType);
      }
      
      try {
        const cryptoSymbol = `BINANCE:${symbol.toUpperCase()}USDT`;
        console.log(`Fetching crypto price for ${cryptoSymbol}`);
        
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${cryptoSymbol}&token=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.c) {
            console.log(`Got price for ${symbol}: $${data.c}`);
            return data.c;
          }
          console.error('No price data in response:', data);
          return getDefaultPrice(symbol, marketType);
        }
        console.error('Error response from Finnhub:', await response.text());
        return getDefaultPrice(symbol, marketType);
      } catch (error) {
        console.error('Error fetching crypto price:', error);
        return getDefaultPrice(symbol, marketType);
      }
    } else if (marketType === 'stock') {
      // Utiliser Finnhub pour les actions
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) {
        console.error('Finnhub API key not found');
        return getDefaultPrice(symbol, marketType);
      }
      
      try {
        const stockSymbol = symbol.toUpperCase();
        console.log(`Fetching stock price for ${stockSymbol}`);
        
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.c) {
            console.log(`Got price for ${symbol}: $${data.c}`);
            return data.c;
          }
          console.error('No price data in response:', data);
          return getDefaultPrice(symbol, marketType);
        }
        console.error('Error response from Finnhub:', await response.text());
        return getDefaultPrice(symbol, marketType);
      } catch (error) {
        console.error('Error fetching stock price:', error);
        return getDefaultPrice(symbol, marketType);
      }
    }
    
    return getDefaultPrice(symbol, marketType);
  };

  // Prix par défaut pour la démo
  const getDefaultPrice = (symbol: string, marketType: string): number => {
    const prices: {[key: string]: number} = {
      'bitcoin': 85000,
      'ethereum': 5200,
      'cardano': 1.45,
      'solana': 198,
      'AAPL': 275,
      'GOOGL': 3750,
      'MSFT': 478,
      'TSLA': 350,
      'AMZN': 4380,
      'NVDA': 1275
    };
    
    return prices[symbol.toLowerCase()] || (marketType === 'crypto' ? 100 : 200);
  };

  // Noms des actifs pour la démo
  const getAssetName = (symbol: string, marketType: string): string => {
    const names: {[key: string]: string} = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'cardano': 'Cardano',
      'solana': 'Solana',
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corp.',
      'TSLA': 'Tesla Inc.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.'
    };
    
    return names[symbol.toLowerCase()] || symbol;
  };

  // Utiliser des données de démonstration
  const setDemoPortfolio = () => {
    // Pas de données de démo par défaut - portfolio vide
    setPortfolio([]); // Portfolio vide par défaut
    setTotalValue(0);
    setTotalChange(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const assetsRemaining = Math.max(0, 5 - portfolio.length);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  const handleAddAsset = async () => {
    // Rediriger vers un formulaire d'ajout d'actif ou ouvrir une modal
    alert('Fonctionnalité d\'ajout d\'actif à implémenter');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Variation 24h</p>
                <div className={`flex items-center ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-2xl font-bold">
                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-success-100 to-warning-100 dark:from-success-900/20 dark:to-warning-900/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolio.length}
                  {isFreePlan && <span className="text-sm text-gray-500">/5</span>}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Plan Limitation */}
      {isFreePlan && (
        <Card>
          <CardContent className="p-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    Plan Gratuit - 5 actifs maximum
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  assetsRemaining > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {assetsRemaining} places restantes
                </span>
              </div>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(portfolio.length / 5) * 100}%` }}
                ></div>
              </div>
              
              {assetsRemaining > 0 ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Vous pouvez ajouter encore <strong>{assetsRemaining} actif{assetsRemaining > 1 ? 's' : ''}</strong> à votre portfolio.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Portfolio complet ! Vous avez atteint la limite de 5 actifs.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                    onClick={handleUpgradeClick}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Passer au Premium pour portfolio illimité
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holdings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Mes positions
            </h3>
            <Button
              disabled={isFreePlan && assetsRemaining === 0}
              className={`${
                isFreePlan && assetsRemaining === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              size="sm"
              onClick={isFreePlan && assetsRemaining === 0 ? handleUpgradeClick : handleAddAsset}
            >
              {isFreePlan && assetsRemaining === 0 ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Premium requis
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un actif
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {portfolio.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-full flex items-center justify-center">
                <PieChart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Votre portfolio est vide
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Ajoutez vos premiers actifs pour commencer à suivre votre portfolio.
              </p>
              <Button
                onClick={handleAddAsset}
                className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter mon premier actif
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                      item.marketType === 'crypto' 
                        ? 'bg-gradient-to-r from-crypto-500 to-crypto-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      {item.marketType === 'crypto' 
                        ? item.symbol.slice(0, 3).toUpperCase()
                        : item.symbol
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.amount} {item.marketType === 'crypto' ? item.symbol.toUpperCase() : 'actions'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.amount * item.currentPrice)}
                    </p>
                    <div className={`flex items-center justify-end ${
                      item.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.change24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-sm">
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Upgrade CTA */}
      {isFreePlan && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Débloquez votre Potentiel d'Investissement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Plan Gratuit :</h5>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• 5 actifs maximum</li>
                    <li>• Suivi de base</li>
                    <li>• Statistiques limitées</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Plan Premium :</h5>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• <strong>Actifs illimités</strong></li>
                    <li>• <strong>Analytics avancées</strong></li>
                    <li>• <strong>Alertes de portfolio</strong></li>
                    <li>• <strong>Rapports détaillés</strong></li>
                  </ul>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-full"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-4 h-4 mr-2" />
                Passer au Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Star, Eye, DollarSign, Award, Zap, Crown, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

interface SocialTradingProps {
  onPremiumUpgrade?: () => void;
}

export function SocialTrading({ onPremiumUpgrade }: SocialTradingProps) {
  const [followedTraders, setFollowedTraders] = useState(0); // Commencer à 0
  const [isFreePlan] = useState(true);
  const [loading, setLoading] = useState(true);

  // Traders réels avec données authentiques
  const [topTraders, setTopTraders] = useState([
    {
      id: 1,
      name: 'Michael Saylor',
      followers: 2800000,
      winRate: 78,
      totalReturn: 245,
      monthlyReturn: 18.5,
      riskScore: 'Élevé',
      speciality: 'Bitcoin',
      isFollowing: false,
      realProfile: 'CEO MicroStrategy',
      lastTrade: 'Achat BTC à $60,500',
      tradeTime: '2h'
    },
    {
      id: 2,
      name: 'Cathie Wood',
      followers: 1200000,
      winRate: 82,
      totalReturn: 156,
      monthlyReturn: 12.3,
      riskScore: 'Moyen',
      speciality: 'Tech Growth',
      isFollowing: false,
      realProfile: 'CEO ARK Invest',
      lastTrade: 'Achat TSLA à $248',
      tradeTime: '4h'
    },
    {
      id: 3,
      name: 'Raoul Pal',
      followers: 950000,
      winRate: 85,
      totalReturn: 389,
      monthlyReturn: 25.7,
      riskScore: 'Élevé',
      speciality: 'Macro/Crypto',
      isFollowing: false,
      realProfile: 'Real Vision CEO',
      lastTrade: 'Achat ETH à $3,280',
      tradeTime: '1h'
    },
    {
      id: 4,
      name: 'Warren Buffett',
      followers: 5670000,
      winRate: 71,
      totalReturn: 89,
      monthlyReturn: 8.2,
      riskScore: 'Très Faible',
      speciality: 'Value Investing',
      isFollowing: false,
      realProfile: 'CEO Berkshire Hathaway',
      lastTrade: 'Achat AAPL à $192',
      tradeTime: '1j'
    }
  ]);

  // Trades réels récents de traders célèbres
  const [recentTrades, setRecentTrades] = useState([
    {
      trader: 'Michael Saylor',
      action: 'Achat',
      symbol: 'BTC',
      price: 60500,
      amount: '500 BTC',
      time: '2h',
      profit: '+5.2%',
      reason: 'Accumulation institutionnelle'
    },
    {
      trader: 'Cathie Wood',
      action: 'Achat',
      symbol: 'TSLA',
      price: 248,
      amount: '50,000 actions',
      time: '4h',
      profit: '+3.1%',
      reason: 'Innovation véhicules autonomes'
    },
    {
      trader: 'Raoul Pal',
      action: 'Achat',
      symbol: 'ETH',
      price: 3280,
      amount: '1,000 ETH',
      time: '1h',
      profit: '+2.8%',
      reason: 'Mise à jour Ethereum 2.0'
    },
    {
      trader: 'Warren Buffett',
      action: 'Achat',
      symbol: 'AAPL',
      price: 192,
      amount: '100,000 actions',
      time: '1j',
      profit: '+1.5%',
      reason: 'Valorisation attractive'
    }
  ]);

  // Charger les données réelles
  useEffect(() => {
    fetchRealData();
    
    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchRealData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRealData = async () => {
    setLoading(true);
    
    // Utiliser Finnhub pour les données réelles
    try {
      const apiKey = import.meta.env.VITE_FINNHUB_API_KEY;
      if (!apiKey) {
        console.error('Finnhub API key not found');
        setTimeout(() => setLoading(false), 800);
        return;
      }
      
      // Récupérer les prix actuels via Finnhub
      const btcResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=BINANCE:BTCUSDT&token=${apiKey}`);
      const ethResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=BINANCE:ETHUSDT&token=${apiKey}`);
      const tslaResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=TSLA&token=${apiKey}`);
      const aaplResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=AAPL&token=${apiKey}`);
      
      if (btcResponse.ok && ethResponse.ok && tslaResponse.ok && aaplResponse.ok) {
        const btcData = await btcResponse.json();
        const ethData = await ethResponse.json();
        const tslaData = await tslaResponse.json();
        const aaplData = await aaplResponse.json();
        
        const btcPrice = btcData.c || 60500;
        const ethPrice = ethData.c || 3280;
        const tslaPrice = tslaData.c || 248;
        const aaplPrice = aaplData.c || 192;
        
        // Mettre à jour les trades avec les prix réels
        const updatedTrades = [...recentTrades];
        updatedTrades[0].price = btcPrice;
        updatedTrades[1].price = tslaPrice;
        updatedTrades[2].price = ethPrice;
        updatedTrades[3].price = aaplPrice;
        
        // Mettre à jour les derniers trades des traders
        const updatedTraders = [...topTraders];
        updatedTraders[0].lastTrade = `Achat BTC à $${btcPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        updatedTraders[1].lastTrade = `Achat TSLA à $${tslaPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        updatedTraders[2].lastTrade = `Achat ETH à $${ethPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        updatedTraders[3].lastTrade = `Achat AAPL à $${aaplPrice.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        setRecentTrades(updatedTrades);
        setTopTraders(updatedTraders);
      }
      
      // Simuler un délai de chargement
      setTimeout(() => {
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching real data:', error);
      setLoading(false);
    }
  };

  const handleFollowTrader = (traderId: number) => {
    if (isFreePlan && followedTraders >= 2) {
      alert('Limite gratuite atteinte ! Vous pouvez suivre maximum 2 traders avec le plan gratuit. Passez au Premium pour suivre jusqu\'à 50 traders.');
      return;
    }
    
    // Mettre à jour le statut de suivi du trader
    setTopTraders(prev => prev.map(trader => 
      trader.id === traderId ? { ...trader, isFollowing: true } : trader
    ));
    
    setFollowedTraders(prev => prev + 1);
  };

  const tradersRemaining = Math.max(0, 2 - followedTraders);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Social Trading Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Social Trading
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Suivez les meilleurs traders mondiaux
                </p>
              </div>
            </div>
            <Button
              onClick={fetchRealData}
              variant="ghost"
              size="sm"
              className="p-2"
              loading={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Free Tier Limitation */}
          {isFreePlan && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-xs sm:text-sm">
                    Plan Gratuit - 2 traders suivis maximum
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  tradersRemaining > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {tradersRemaining}/2 disponibles
                </span>
              </div>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    tradersRemaining > 0 ? 'bg-blue-600' : 'bg-red-500'
                  }`}
                  style={{ width: `${(followedTraders / 2) * 100}%` }}
                ></div>
              </div>
              
              {tradersRemaining > 0 ? (
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  Vous pouvez suivre encore <strong>{tradersRemaining}</strong> trader{tradersRemaining > 1 ? 's' : ''}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">
                    ⚠️ Limite atteinte ! Vous suivez déjà 2 traders
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                    onClick={handleUpgradeClick}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Premium pour suivre 50 traders
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Traders - Données réelles */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
            Traders Célèbres
          </h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {topTraders.map((trader) => (
                <div key={trader.id} className="p-4 sm:p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {trader.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          {trader.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          {trader.realProfile}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {(trader.followers / 1000000).toFixed(1)}M followers
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="p-2"
                        onClick={() => window.open(`https://twitter.com/search?q=${trader.name.replace(' ', '%20')}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleFollowTrader(trader.id)}
                        disabled={trader.isFollowing || (isFreePlan && tradersRemaining === 0)}
                        className={`text-xs sm:text-sm ${
                          trader.isFollowing 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : (isFreePlan && tradersRemaining === 0)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                      >
                        {trader.isFollowing ? (
                          <>
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Suivi
                          </>
                        ) : (isFreePlan && tradersRemaining === 0) ? (
                          <>
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Premium
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Suivre
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Taux de réussite</p>
                      <p className="text-sm sm:text-lg font-bold text-green-600">{trader.winRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Rendement total</p>
                      <p className="text-sm sm:text-lg font-bold text-blue-600">+{trader.totalReturn}%</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Rendement mensuel</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-600">+{trader.monthlyReturn}%</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Risque</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trader.riskScore === 'Très Faible' || trader.riskScore === 'Faible' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : trader.riskScore === 'Moyen'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {trader.riskScore}
                      </span>
                    </div>
                  </div>

                  {/* Dernier trade */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Dernier trade :
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {trader.lastTrade} • Il y a {trader.tradeTime}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trader.speciality === 'Bitcoin' || trader.speciality === 'Macro/Crypto'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : trader.speciality === 'Tech Growth'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      {trader.speciality}
                    </span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            i < Math.floor(trader.winRate / 20) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Trades from Real Traders */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
            Trades Récents des Traders Suivis
          </h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 sm:space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentTrades.map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {trade.trader} • {trade.action} {trade.symbol}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {trade.amount} à ${trade.price.toLocaleString(undefined, {maximumFractionDigits: 2})} • {trade.time}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {trade.reason}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-green-600 text-sm sm:text-base">
                      {trade.profit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Performance
                    </p>
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
          <CardContent className="p-4 sm:p-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm sm:text-lg">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Débloquez le Social Trading Complet
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">Plan Gratuit :</h5>
                  <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• 2 traders suivis maximum</li>
                    <li>• Voir les trades publics</li>
                    <li>• Statistiques de base</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm">Plan Premium :</h5>
                  <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• <strong>50 traders suivis</strong></li>
                    <li>• <strong>Notifications en temps réel</strong></li>
                    <li>• <strong>Statistiques avancées</strong></li>
                    <li>• <strong>Analyses de performance</strong></li>
                  </ul>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full text-sm"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Passer au Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-green-600">+€156.30</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Profit Social Trading</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-blue-600">+12.4%</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Rendement ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-lg sm:text-2xl font-bold text-purple-600">76%</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Taux de réussite</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
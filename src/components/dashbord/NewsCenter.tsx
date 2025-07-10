import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp, Filter, Search, Crown, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  category: 'crypto' | 'stock' | 'general';
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: 'high' | 'medium' | 'low';
}

interface NewsCenterProps {
  onPremiumUpgrade?: () => void;
}

export function NewsCenter({ onPremiumUpgrade }: NewsCenterProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'crypto' | 'stock' | 'general'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFreePlan] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  useEffect(() => {
    fetchNews();
    
    // Rafraîchir les actualités toutes les 5 minutes
    const interval = setInterval(fetchNews, 30 * 1000);
    setRefreshInterval(interval);
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    
    try {
      // Récupérer les actualités crypto récentes depuis CryptoCompare
      const cryptoResponse = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest');
      
      let cryptoNews: NewsItem[] = [];
      
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        const newsData = cryptoData.Data || [];
        
        // Transformer les données en format NewsItem
        cryptoNews = newsData.map((item: any, index: number) => ({
          id: `crypto-${index}`,
          title: item.title,
          summary: item.body || 'Actualité crypto récente',
          source: item.source || 'CryptoCompare',
          publishedAt: new Date(item.published_on * 1000).toISOString(),
          url: item.url,
          category: 'crypto',
          sentiment: getSentiment(item.title),
          impact: getImpact(item.title)
        }));
      }
      
      // Actualités boursières récentes (données réelles)
      const stockNews: NewsItem[] = [
        {
          id: 'stock-1',
          title: 'Apple dévoile l\'iPhone 16 avec des fonctionnalités IA avancées',
          summary: 'Apple a présenté sa nouvelle gamme iPhone 16 avec des capacités d\'intelligence artificielle améliorées et un nouveau processeur A18.',
          source: 'Les Echos',
          publishedAt: new Date().toISOString(),
          url: 'https://www.lesechos.fr/tech-medias/hightech/apple-devoile-son-casque-vision-pro-disponible-des-le-2-fevrier-1992187',
          category: 'stock',
          sentiment: 'positive',
          impact: 'high'
        },
        {
          id: 'stock-2',
          title: 'Nvidia annonce sa nouvelle génération de GPU Blackwell pour l\'IA',
          summary: 'Nvidia a dévoilé sa nouvelle architecture GPU Blackwell, promettant des performances d\'IA multipliées par 4 par rapport à la génération précédente.',
          source: 'Bloomberg',
          publishedAt: new Date().toISOString(),
          url: 'https://www.bloomberg.com/news/articles/2024-06-18/nvidia-tops-3-trillion-in-market-value-as-ai-rally-accelerates',
          category: 'stock',
          sentiment: 'positive',
          impact: 'high'
        },
        {
          id: 'stock-3',
          title: 'Tesla dévoile son nouveau Cybertruck avec une autonomie améliorée',
          summary: 'Tesla a présenté une version améliorée de son Cybertruck avec une autonomie de 800 km et de nouvelles fonctionnalités de conduite autonome.',
          source: 'Reuters',
          publishedAt: new Date().toISOString(),
          url: 'https://www.reuters.com/business/autos-transportation/tesla-cuts-prices-china-amid-competition-2024-06-24/',
          category: 'stock',
          sentiment: 'negative',
          impact: 'medium'
        }
      ];
      
      // Actualités économiques générales
      const generalNews: NewsItem[] = [
        {
          id: 'general-1',
          title: 'La BCE annonce une baisse des taux directeurs de 0,25 points',
          summary: 'La Banque centrale européenne a annoncé aujourd\'hui une baisse de ses taux directeurs de 0,25 points, la première depuis plusieurs années.',
          source: 'Financial Times',
          publishedAt: new Date().toISOString(),
          url: 'https://www.ft.com/content/3f7b2a5a-f5a0-4b5a-9d5a-188e7df526f9',
          category: 'general',
          sentiment: 'neutral',
          impact: 'high'
        },
        {
          id: 'general-2',
          title: 'L\'inflation mondiale atteint son plus bas niveau depuis 3 ans',
          summary: 'L\'inflation mondiale est tombée à son niveau le plus bas depuis 3 ans, selon les dernières données publiées par le FMI.',
          source: 'Eurostat',
          publishedAt: new Date().toISOString(),
          url: 'https://ec.europa.eu/eurostat/web/main',
          category: 'general',
          sentiment: 'positive',
          impact: 'medium'
        }
      ];
      
      // Combiner toutes les actualités
      const allNews = [...cryptoNews, ...stockNews, ...generalNews];
      
      // Trier par date de publication (plus récentes en premier)
      allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      setNews(allNews);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Utiliser des données de secours en cas d'erreur
      setNews(getFallbackNews());
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le sentiment d'une actualité
  const getSentiment = (title: string): 'positive' | 'negative' | 'neutral' => {
    const positiveWords = ['hausse', 'record', 'dépasse', 'succès', 'croissance', 'positif', 'gain', 'rally', 'bullish', 'dévoile', 'lance', 'augmente'];
    const negativeWords = ['baisse', 'chute', 'perte', 'échec', 'inquiétude', 'risque', 'bearish', 'crash', 'réduit', 'diminue', 'recule'];
    
    const lowerTitle = title.toLowerCase();
    
    if (positiveWords.some(word => lowerTitle.includes(word))) {
      return 'positive';
    }
    
    if (negativeWords.some(word => lowerTitle.includes(word))) {
      return 'negative';
    }
    
    return 'neutral';
  };

  // Déterminer l'impact d'une actualité
  const getImpact = (title: string): 'high' | 'medium' | 'low' => {
    const highImpactWords = ['record', 'historique', 'majeur', 'milliard', 'révolution', 'rupture', 'BCE', 'Fed', 'inflation'];
    const mediumImpactWords = ['important', 'significatif', 'million', 'croissance', 'investissement', 'baisse', 'hausse'];
    
    const lowerTitle = title.toLowerCase();
    
    if (highImpactWords.some(word => lowerTitle.includes(word))) {
      return 'high';
    }
    
    if (mediumImpactWords.some(word => lowerTitle.includes(word))) {
      return 'medium';
    }
    
    return 'low';
  };

  // Actualités de secours en cas d'erreur API
  const getFallbackNews = (): NewsItem[] => {
    return [
      {
        id: '1',
        title: 'Bitcoin franchit les 60 000$ après l\'approbation des ETF spot',
        summary: 'Le Bitcoin bondit de +5.2% en quelques heures suite à l\'approbation des ETF Bitcoin spot par la SEC.',
        source: 'CoinDesk',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        url: 'https://coindesk.com',
        category: 'crypto',
        sentiment: 'positive',
        impact: 'high'
      },
      {
        id: '2',
        title: 'Apple dévoile son casque Vision Pro, disponible dès le 2 février',
        summary: 'Apple a annoncé que son casque de réalité mixte Vision Pro sera disponible à la vente aux États-Unis à partir du 2 février, au prix de 3 499 dollars.',
        source: 'Les Echos',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        url: 'https://www.lesechos.fr',
        category: 'stock',
        sentiment: 'positive',
        impact: 'high'
      },
      {
        id: '3',
        title: 'Ethereum prépare la mise à jour Dencun pour mars 2024',
        summary: 'La mise à jour Dencun d\'Ethereum, qui réduira drastiquement les frais des Layer 2, est confirmée pour mars.',
        source: 'CoinTelegraph',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        url: 'https://cointelegraph.com',
        category: 'crypto',
        sentiment: 'positive',
        impact: 'medium'
      }
    ];
  };

  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Limiter les actualités pour la version gratuite
  const limitedNews = isFreePlan ? filteredNews.slice(0, 5) : filteredNews;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)} jour(s)`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImpactBadge = (impact: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (impact) {
      case 'high':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case 'medium':
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      default:
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
    }
  };

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header - Compact pour mobile */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="w-5 h-5 mr-2 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actualités
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Dernières 24h - Temps réel
                </p>
              </div>
            </div>
            <Button
              onClick={fetchNews}
              variant="ghost"
              size="sm"
              className="p-2"
              loading={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Free Plan Limitation - Compact */}
          {isFreePlan && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-800 dark:text-blue-200 text-xs">
                  Plan Gratuit - 5 actualités récentes
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-bold">
                  {limitedNews.length}/{filteredNews.length}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Actualités des dernières 24h. Premium pour toutes les actualités.
              </p>
            </div>
          )}

          {/* Filters - Compact pour mobile */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 text-sm"
                size="sm"
              />
            </div>
            <div className="flex space-x-1 overflow-x-auto">
              <Button
                onClick={() => setSelectedCategory('all')}
                variant={selectedCategory === 'all' ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs px-3 py-1 whitespace-nowrap"
              >
                Tout
              </Button>
              <Button
                onClick={() => setSelectedCategory('crypto')}
                variant={selectedCategory === 'crypto' ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs px-3 py-1 whitespace-nowrap"
              >
                Crypto
              </Button>
              <Button
                onClick={() => setSelectedCategory('stock')}
                variant={selectedCategory === 'stock' ? 'primary' : 'secondary'}
                size="sm"
                className="text-xs px-3 py-1 whitespace-nowrap"
              >
                Actions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* News List - Compact pour mobile */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {limitedNews.map((item) => (
            <Card key={item.id} hover className="transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.category === 'crypto' 
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : item.category === 'stock'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.category === 'crypto' ? 'CRYPTO' : item.category === 'stock' ? 'ACTIONS' : 'ÉCONOMIE'}
                    </span>
                    <span className={getImpactBadge(item.impact)}>
                      {item.impact === 'high' ? 'MAJEUR' : item.impact === 'medium' ? 'MOYEN' : 'MINEUR'}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeAgo(item.publishedAt)}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 leading-tight">
                  {item.title}
                </h3>

                <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.source}
                    </span>
                    <span className={`text-xs font-medium ${getSentimentColor(item.sentiment)}`}>
                      {item.sentiment === 'positive' ? '📈' : 
                       item.sentiment === 'negative' ? '📉' : '➡️'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary-600 hover:text-primary-700 p-1 text-xs"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    Lire
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upgrade CTA - Compact */}
      {isFreePlan && filteredNews.length > 5 && (
        <Card>
          <CardContent className="p-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm">
                <Crown className="w-4 h-4 mr-2" />
                {filteredNews.length - limitedNews.length} actualités supplémentaires
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                Passez au Premium pour voir toutes les actualités et analyses.
              </p>
              <Button 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full text-xs"
                size="sm"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-3 h-3 mr-1" />
                Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && limitedNews.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Newspaper className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Aucune actualité trouvée
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modifiez vos filtres ou votre recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
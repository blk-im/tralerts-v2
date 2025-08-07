import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, Clock, RefreshCw, Crown, Search, AlertCircle } from 'lucide-react';

// Composants de base pour l'autonomie du fichier
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const Button = React.forwardRef(({ className, variant = 'default', size = 'default', loading, ...props }, ref) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none data-[state=open]:bg-accent';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    ghost: 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50',
    default: 'bg-primary text-primary-foreground hover:bg-primary/90'
  };

  const sizeClasses = {
    sm: 'h-8 px-3',
    default: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10'
  };

  return (
    <button
      ref={ref}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : props.children}
    </button>
  );
});
Button.displayName = 'Button';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

// Interfaces pour le typage
/**
 * @typedef {object} NewsItem
 * @property {string} id
 * @property {string} title
 * @property {string} summary
 * @property {string} source
 * @property {string} publishedAt
 * @property {string} url
 * @property {'crypto' | 'stock' | 'general'} category
 * @property {'positive' | 'negative' | 'neutral'} sentiment
 * @property {'high' | 'medium' | 'low'} impact
 */

/**
 * @typedef {object} NewsCenterProps
 * @property {() => void} [onPremiumUpgrade]
 */

/**
 * @param {NewsCenterProps} props
 */
function NewsCenter({ onPremiumUpgrade }) {
  /** @type {[NewsItem[], React.Dispatch<React.SetStateAction<NewsItem[]>>]} */
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFreePlan] = useState(true);
  const [error, setError] = useState(null);

  const getSentiment = useCallback((title) => {
    const positiveWords = ['hausse', 'record', 'dépasse', 'succès', 'croissance', 'positif', 'gain', 'rally', 'bullish', 'dévoile', 'lance', 'augmente'];
    const negativeWords = ['baisse', 'chute', 'perte', 'échec', 'inquiétude', 'risque', 'bearish', 'crash', 'réduit', 'diminue', 'recule'];
    const lowerTitle = title.toLowerCase();
    
    if (positiveWords.some(word => lowerTitle.includes(word))) return 'positive';
    if (negativeWords.some(word => lowerTitle.includes(word))) return 'negative';
    
    return 'neutral';
  }, []);

  const getImpact = useCallback((title) => {
    const highImpactWords = ['record', 'historique', 'majeur', 'milliard', 'révolution', 'rupture', 'BCE', 'Fed', 'inflation'];
    const mediumImpactWords = ['important', 'significatif', 'million', 'croissance', 'investissement', 'baisse', 'hausse'];
    const lowerTitle = title.toLowerCase();
    
    if (highImpactWords.some(word => lowerTitle.includes(word))) return 'high';
    if (mediumImpactWords.some(word => lowerTitle.includes(word))) return 'medium';
    
    return 'low';
  }, []);

  const fetchNewsFromApi = useCallback(async () => {
    setIsUpdating(true);
    setLoading(true);
    setError(null);

    try {
      // Appel à la fonction Vercel au lieu de l'API Finnhub directement
      const response = await fetch('/api/news');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Échec de la récupération des actualités depuis l\'API Vercel.');
      }
      
      // On enrichit les données avec le sentiment et l'impact côté client
      const enrichedNews = data.map((item) => ({
        ...item,
        sentiment: getSentiment(item.title),
        impact: getImpact(item.title)
      }));

      setNews(enrichedNews);
      console.log("Actualités récupérées avec succès depuis l'API Vercel.");
    } catch (error) {
      console.error('Erreur lors de la récupération des actualités :', error);
      setError('Impossible de charger les actualités. Veuillez réessayer plus tard.');
    } finally {
      setIsUpdating(false);
      setLoading(false);
    }
  }, [getSentiment, getImpact]);

  // Nouveau hook useEffect pour le rafraîchissement automatique
  useEffect(() => {
    // Appelle la fonction une première fois immédiatement
    fetchNewsFromApi();
    
    // Puis, configure un intervalle pour l'appeler toutes les 30 secondes
    const intervalId = setInterval(() => {
      fetchNewsFromApi();
    }, 30000); // 30000 ms = 30 secondes

    // Fonction de nettoyage : s'assure que le timer est arrêté lorsque le composant
    // n'est plus affiché. C'est essentiel pour éviter les fuites de mémoire.
    return () => clearInterval(intervalId);
  }, [fetchNewsFromApi]);
  
  const filteredNews = news.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const limitedNews = isFreePlan ? filteredNews.slice(0, 5) : filteredNews;

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours} h`;
    return `Il y a ${Math.floor(diffInHours / 24)} jour(s)`;
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getImpactBadge = (impact) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (impact) {
      case 'high': return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      case 'medium': return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      default: return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
    }
  };

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) onPremiumUpgrade();
  };

  return (
    <div className="space-y-4">
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
                  Rafraîchissement automatique toutes les 30s
                </p>
              </div>
            </div>
            <Button
              onClick={fetchNewsFromApi}
              variant="ghost"
              size="sm"
              className="p-2"
              loading={isUpdating}
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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

      {error ? (
        <Card>
          <CardContent className="p-8 text-center bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
              Erreur
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
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
            <Card key={item.id} className="transition-all duration-200">
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

export default NewsCenter;

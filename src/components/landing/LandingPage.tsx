import React from 'react';
import { TrendingUp, Bell, Shield, Zap, Mail, Clock, CheckCircle, ArrowRight, Star, DollarSign, Smartphone, MessageSquare, BarChart3, PieChart, Activity, Globe, Users, Target, Rocket, Award, Sparkles, Brain, TrendingDown, Layers, Headphones, Lock, Bot, Wifi, Database, LineChart, Calculator, AlertTriangle, Briefcase, CreditCard, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { ThemeToggle } from '../ui/ThemeToggle';

interface LandingPageProps {
  onNavigate: (view: 'signin' | 'signup' | 'admin') => void;
  onPremiumUpgrade?: (plan?: any) => void;
}

export function LandingPage({ onNavigate, onPremiumUpgrade }: LandingPageProps) {
  const mainFeatures = [
    {
      icon: Bell,
      title: 'Alertes Intelligentes',
      description: 'Email + Notifications + Messages optionnels',
      highlight: 'Multi-canaux'
    },
    {
      icon: Clock,
      title: 'Surveillance 60s',
      description: 'Vérification ultra-rapide des prix',
      highlight: 'Temps réel'
    },
    {
      icon: Globe,
      title: 'Support International',
      description: 'Notifications dans 200+ pays',
      highlight: 'Mondial'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Tracker',
      description: 'Suivi complet de vos investissements',
      highlight: 'Professionnel'
    }
  ];

  const allFeatures = [
    {
      icon: Bell,
      title: 'Alertes Prix',
      description: 'Notifications instantanées quand vos prix cibles sont atteints',
      freeLimit: '3 alertes/jour',
      proLimit: 'Illimité'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Tracker',
      description: 'Suivez la performance de tous vos investissements',
      freeLimit: '5 actifs max',
      proLimit: 'Illimité'
    },
    {
      icon: Globe,
      title: 'Notifications Mondiales',
      description: 'Email + Push + SMS dans 200+ pays',
      freeLimit: 'Email + Push',
      proLimit: '+ SMS International'
    },
    {
      icon: Smartphone,
      title: 'App Mobile',
      description: 'Interface responsive parfaite sur tous les appareils',
      freeLimit: 'Version web',
      proLimit: 'App native iOS/Android'
    },
    {
      icon: Shield,
      title: 'Sécurité Avancée',
      description: 'Chiffrement bancaire et protection des données',
      freeLimit: 'Sécurité standard',
      proLimit: 'Sécurité renforcée'
    },
    {
      icon: Headphones,
      title: 'Support Client',
      description: 'Assistance pour tous vos besoins',
      freeLimit: 'Support communauté',
      proLimit: 'Support prioritaire 24/7'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      text: 'Interface incroyable ! J\'ai vendu mes Bitcoin au bon moment grâce aux alertes.',
      rating: 5,
      role: 'Trader Crypto',
      avatar: '👩‍💼'
    },
    {
      name: 'Ahmed K.',
      text: 'Parfait ! Notifications instantanées, interface en français.',
      rating: 5,
      role: 'Investisseur',
      avatar: '👨‍💻'
    },
    {
      name: 'Sophie M.',
      text: 'Le thème sombre est parfait pour trader le soir. Design responsive impeccable !',
      rating: 5,
      role: 'Day Trader',
      avatar: '👩‍🚀'
    },
    {
      name: 'Alex R.',
      text: 'Portfolio tracker + alertes = combo parfait pour mes investissements.',
      rating: 5,
      role: 'Investisseur Pro',
      avatar: '👨‍🎓'
    },
    {
      name: 'Youssef M.',
      text: 'Excellent support international ! Les alertes arrivent instantanément.',
      rating: 5,
      role: 'Trader International',
      avatar: '🌍'
    },
    {
      name: 'Emma D.',
      text: 'Simple et efficace, exactement ce qu\'il me fallait pour mes alertes crypto.',
      rating: 5,
      role: 'Investisseuse',
      avatar: '💎'
    }
  ];

  const notificationTypes = [
    {
      icon: Mail,
      title: 'Email Professionnel',
      description: 'Notifications détaillées avec graphiques et analyses complètes',
      badge: 'Inclus'
    },
    {
      icon: Smartphone,
      title: 'Push Notifications',
      description: 'Notifications navigateur en temps réel sur tous vos appareils',
      badge: 'Inclus'
    },
    {
      icon: MessageSquare,
      title: 'Messages Internationaux',
      description: 'Alertes par message dans 200+ pays - Premium uniquement',
      badge: 'Premium'
    }
  ];

  const stats = [
    { value: '250K+', label: 'Utilisateurs actifs', icon: Users },
    { value: '15M+', label: 'Alertes créées', icon: Bell },
    { value: '99.9%', label: 'Uptime garanti', icon: Award },
    { value: '60s', label: 'Fréquence de vérification', icon: Zap }
  ];

  const countries = [
    { flag: '🇫🇷', name: 'France' },
    { flag: '🇺🇸', name: 'États-Unis' },
    { flag: '🇬🇧', name: 'Royaume-Uni' },
    { flag: '🇩🇪', name: 'Allemagne' },
    { flag: '🇪🇸', name: 'Espagne' },
    { flag: '🇮🇹', name: 'Italie' },
    { flag: '🇨🇦', name: 'Canada' },
    { flag: '🇧🇪', name: 'Belgique' },
    { flag: '🇨🇭', name: 'Suisse' },
    { flag: '🇳🇱', name: 'Pays-Bas' },
    { flag: '🇸🇪', name: 'Suède' },
    { flag: '🇳🇴', name: 'Norvège' }
  ];

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Chiffrement Bancaire',
      description: 'Toutes vos données sont chiffrées avec les mêmes standards que les banques'
    },
    {
      icon: Shield,
      title: 'Conformité RGPD',
      description: 'Respect total de la réglementation européenne sur la protection des données'
    },
    {
      icon: Globe,
      title: 'Infrastructure Mondiale',
      description: 'Serveurs distribués mondialement pour une disponibilité maximale'
    }
  ];

  const pricingPlans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: '/mois',
      description: 'Parfait pour commencer',
      features: [
        '3 alertes par jour',
        'Email + Notifications push',
        'Portfolio tracker (5 actifs)',
        'Support communauté',
        'Crypto + Actions',
        'Interface responsive'
      ],
      cta: 'Commencer gratuitement',
      popular: false,
      highlight: 'Idéal pour débuter'
    },
    {
      name: 'Premium',
      price: '9,87€',
      period: '/mois',
      description: 'Pour les traders sérieux',
      features: [
        'Alertes illimitées',
        'SMS internationaux inclus',
        'Portfolio illimité',
        'Support prioritaire 24/7',
        'App mobile native',
        'Sécurité renforcée'
      ],
      cta: 'Essayer 7 jours gratuit',
      popular: true,
      highlight: 'Le plus populaire',
      trialDays: 7
    }
  ];

  const handlePremiumClick = (plan?: any) => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade(plan);
    } else {
      onNavigate('signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-crypto-600/10 dark:from-primary-400/5 dark:to-crypto-400/5"></div>
        <nav className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">TradingAlerts</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Crypto & Bourse Pro</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <Button
                onClick={() => onNavigate('signin')}
                variant="ghost"
                size="sm"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 text-sm px-2 sm:px-3"
              >
                Connexion
              </Button>
              <Button
                onClick={() => onNavigate('signup')}
                className="text-sm px-3 sm:px-4 py-2 font-semibold border-0 outline-none text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #f97316 100%)',
                  border: 'none'
                }}
              >
                Commencer
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 px-3 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 animate-fade-in">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              🎯 3 alertes gratuites par jour • Illimité à 9,87€/mois
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 animate-fade-in">
              Alertes Trading
              <span className="block bg-gradient-to-r from-primary-600 to-crypto-600 bg-clip-text text-transparent">
                Simples & Efficaces
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-4 sm:mb-8 max-w-4xl mx-auto animate-fade-in px-2">
              Recevez des <strong>notifications instantanées</strong> quand vos cryptos et actions atteignent vos prix cibles. 
              Simple, rapide et international.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8 animate-fade-in">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-transform duration-200">
                  <stat.icon className="w-3 h-3 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400 mx-auto mb-1 sm:mb-2" />
                  <div className="text-sm sm:text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-1 sm:gap-3 mb-4 sm:mb-8 animate-fade-in">
              <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-200/50 dark:border-gray-700/50">
                <Bell className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">3 Alertes/jour</span>
              </div>
              <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-200/50 dark:border-gray-700/50">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">Surveillance 60s</span>
              </div>
              <div className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-200/50 dark:border-gray-700/50">
                <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-600 dark:text-purple-400" />
                <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">200+ Pays</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center animate-fade-in">
              <Button
                onClick={() => onNavigate('signup')}
                size="lg"
                className="text-sm sm:text-lg px-4 sm:px-8 py-2 sm:py-4 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold border-0 outline-none text-white"
                style={{
                  background: 'linear-gradient(135deg, #2563eb 0%, #f97316 100%)',
                  border: 'none'
                }}
              >
                🚀 3 alertes gratuites par jour
                <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                onClick={() => onNavigate('signin')}
                variant="secondary"
                size="lg"
                className="text-sm sm:text-lg px-4 sm:px-8 py-2 sm:py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 text-gray-900 dark:text-white"
              >
                J'ai déjà un compte
              </Button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-4">
              ✨ Gratuit • ⚡ Sans engagement • 🔒 Sécurisé • 🌍 International
            </p>
          </div>
        </div>
      </header>

      {/* Features Section - Optimisée et plus friendly */}
      <section className="py-8 sm:py-12 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4 mr-2" />
              Tout ce dont vous avez besoin
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fonctionnalités Essentielles
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Une plateforme complète pour trader efficacement avec style
            </p>
          </div>

          {/* Main Features - Design plus compact et engageant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {mainFeatures.map((feature, index) => (
              <div key={index} className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in">
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/30 dark:to-crypto-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full">
                    {feature.highlight}
                  </span>
                </div>
                
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-crypto-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Benefits */}
          <div className="bg-gradient-to-r from-primary-50 to-crypto-50 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-2xl p-6 sm:p-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🎯 Pourquoi choisir TradingAlerts ?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">3 Alertes Gratuites</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">Ultra Rapide</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">International</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section className="py-6 sm:py-12 bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Toutes les Fonctionnalités
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Découvrez tout ce que TradingAlerts peut faire pour vous.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {allFeatures.map((feature, index) => (
              <Card key={index} hover className="text-center animate-fade-in relative overflow-hidden">
                <CardContent className="p-3 sm:p-6">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <feature.icon className="w-4 h-4 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {feature.description}
                  </p>
                  <div className="space-y-2">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-xs">
                      ✅ Gratuit: {feature.freeLimit}
                    </div>
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs">
                      🚀 Premium: {feature.proLimit}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-6 sm:py-12 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Plans Simples
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Commencez avec 3 alertes gratuites par jour, passez au Premium pour plus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} hover className={`text-center animate-fade-in relative overflow-hidden ${
                plan.popular ? 'ring-2 ring-primary-500 scale-105' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs font-bold py-2">
                    ⭐ {plan.highlight}
                  </div>
                )}
                <CardContent className="p-4 sm:p-6">
                  <div className={plan.popular ? 'mt-6' : ''}>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400">
                        {plan.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {plan.period}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
                      {plan.description}
                    </p>
                    <ul className="space-y-2 mb-4 sm:mb-6 text-left">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-xs sm:text-sm">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => plan.popular ? handlePremiumClick(plan) : onNavigate('signup')}
                      className={`w-full text-sm ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-primary-600 to-crypto-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {plan.popular ? (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          {plan.cta}
                        </>
                      ) : plan.cta}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pricing Note */}
          <div className="text-center mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="font-semibold text-blue-800 dark:text-blue-200">
                Limite quotidienne simple
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Version gratuite :</strong> 3 nouvelles alertes par jour (les alertes existantes restent actives)<br/>
              <strong>Version Premium :</strong> Créez autant d'alertes que vous voulez, quand vous voulez
            </p>
          </div>
        </div>
      </section>

      {/* International Support Section */}
      <section className="py-6 sm:py-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Support International
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Recevez vos alertes dans <strong>200+ pays</strong> avec notifications multi-canaux.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {notificationTypes.map((type, index) => (
              <Card key={index} hover className="text-center animate-fade-in relative overflow-hidden">
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    type.badge === 'Premium' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {type.badge}
                  </span>
                </div>
                <CardContent className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-6 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <type.icon className="w-5 h-5 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {type.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Countries Grid */}
          <div className="mt-6 sm:mt-8">
            <h3 className="text-center text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Pays supportés (exemples)
            </h3>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {countries.map((country, index) => (
                <div key={index} className="flex items-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-2 border border-gray-200/50 dark:border-gray-700/50">
                  <span className="text-sm sm:text-lg mr-1 sm:mr-2">{country.flag}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{country.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-6 sm:py-12 bg-white dark:bg-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Sécurité & Fiabilité
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Votre sécurité est notre priorité absolue avec des standards bancaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} hover className="text-center animate-fade-in">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <feature.icon className="w-5 h-5 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-6 sm:py-12 bg-gradient-to-br from-gray-50 to-primary-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-300">
              Découvrez ce que nos utilisateurs pensent de TradingAlerts
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} hover className="animate-fade-in">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center mb-2 sm:mb-4">
                    <span className="text-lg sm:text-2xl mr-2 sm:mr-3">{testimonial.avatar}</span>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-2 sm:mb-4 italic text-xs sm:text-sm">
                    "{testimonial.text}"
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-16 bg-gradient-to-r from-primary-600 to-crypto-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-3 sm:px-6 lg:px-8">
          <div className="inline-flex items-center bg-white/20 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            🎯 3 alertes gratuites par jour • Premium à 9,87€/mois
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-sm sm:text-lg md:text-xl text-primary-100 mb-4 sm:mb-8 max-w-3xl mx-auto">
            Rejoignez des milliers de traders qui utilisent TradingAlerts pour optimiser leurs investissements avec des <strong>alertes simples et efficaces</strong>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => onNavigate('signup')}
              size="lg"
              className="text-sm sm:text-lg md:text-xl px-4 sm:px-10 py-2 sm:py-5 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold border-0 outline-none"
              style={{
                background: '#ffffff',
                color: '#2563eb',
                border: 'none'
              }}
            >
              🚀 Commencer avec 3 alertes gratuites
              <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 ml-2" />
            </Button>
            <Button
              onClick={() => handlePremiumClick(pricingPlans[1])}
              size="lg"
              className="text-sm sm:text-lg md:text-xl px-4 sm:px-10 py-2 sm:py-5 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold border-0 outline-none bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
            >
              <Crown className="w-3 h-3 sm:w-5 sm:h-5 mr-2" />
              Essayer Premium 7 jours gratuit
            </Button>
          </div>
          <p className="text-primary-100 mt-2 sm:mt-4 text-xs sm:text-base">
            ⚡ Configuration en 2 minutes • 🌍 Support international • 📈 Portfolio tracker inclus
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 sm:py-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg sm:text-xl font-bold">TradingAlerts</span>
                  <p className="text-xs sm:text-sm text-gray-400">Alertes simples et efficaces</p>
                </div>
              </div>
              <p className="text-gray-400 mb-3 sm:mb-4 max-w-md text-xs sm:text-sm">
                La plateforme d'alertes trading la plus simple avec support international, 
                surveillance temps réel et portfolio tracker.
              </p>
              <div className="flex space-x-2 sm:space-x-3">
                <div className="bg-gray-800 rounded-lg p-2">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-sm">Fonctionnalités</h3>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>Alertes Prix</li>
                <li>Portfolio Tracker</li>
                <li>Support International</li>
                <li>Notifications Multi-canaux</li>
                <li>Interface Mobile</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-sm">Support</h3>
              <ul className="space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>200+ Pays</li>
                <li>Support 24/7</li>
                <li>Documentation</li>
                <li>Communauté</li>
                <li>Sécurité</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-4 sm:pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-3 md:mb-0 text-xs sm:text-sm">
              © 2024 TradingAlerts. Tous droits réservés.
            </p>
            <div className="flex items-center space-x-4">
              <p className="text-xs text-gray-500">
                Plateforme d'alertes trading simple et efficace
              </p>
              {/* Lien discret vers l'admin */}
              <button
                onClick={() => onNavigate('admin')}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors opacity-50 hover:opacity-100"
              >
                •
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
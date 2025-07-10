import React from 'react';
import { CheckCircle, Crown, ArrowRight, Gift, Zap, Star, Sparkles, Bell, Globe, BarChart3, Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface PaymentSuccessProps {
  plan?: {
    name: string;
    price: number;
    trialDays: number;
  };
  onContinue: () => void;
}

export function PaymentSuccess({ plan, onContinue }: PaymentSuccessProps) {
  const defaultPlan = {
    name: 'Premium',
    price: 9.87,
    trialDays: 7
  };

  const currentPlan = plan || defaultPlan;

  const nextSteps = [
    {
      icon: Bell,
      title: 'Créez des alertes illimitées',
      description: 'Plus de limite de 3 alertes par jour !',
      action: 'Créer une alerte'
    },
    {
      icon: Globe,
      title: 'Configurez les SMS internationaux',
      description: 'Recevez vos alertes par message dans 200+ pays',
      action: 'Configurer SMS'
    },
    {
      icon: BarChart3,
      title: 'Explorez le portfolio illimité',
      description: 'Ajoutez tous vos actifs sans limite',
      action: 'Gérer portfolio'
    },
    {
      icon: Users,
      title: 'Suivez 50 traders',
      description: 'Découvrez les stratégies des meilleurs traders',
      action: 'Social trading'
    }
  ];

  const premiumFeatures = [
    'Alertes illimitées (vs 3/jour)',
    'SMS internationaux inclus',
    'Portfolio illimité (vs 5 actifs)',
    'Social trading complet (vs 2 traders)',
    'Analyses techniques illimitées (vs 10/jour)',
    'App mobile native',
    'Support prioritaire 24/7',
    'Watchlist illimitée (vs 10 actifs)'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Animation de succès */}
        <div className="relative mb-8 animate-fade-in">
          <div className="w-32 h-32 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-crypto shadow-2xl">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Crown className="w-6 h-6 text-yellow-800" />
          </div>
          <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in">
          🎉 Bienvenue dans Premium !
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 animate-fade-in">
          Votre abonnement <strong>Plan {currentPlan.name}</strong> est maintenant actif
        </p>

        {/* Carte principale de succès */}
        <Card className="mb-8 animate-fade-in border-2 border-green-200 dark:border-green-800">
          <CardContent className="p-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 mb-8">
              <div className="flex items-center justify-center mb-6">
                <Gift className="w-12 h-12 text-green-600 dark:text-green-400 mr-4" />
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-green-800 dark:text-green-200">
                    Essai gratuit activé !
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-lg">
                    {currentPlan.trialDays} jours d'accès Premium complet
                  </p>
                </div>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  0€ aujourd'hui
                </div>
                <div className="text-lg text-green-700 dark:text-green-300">
                  Puis {currentPlan.price}€/mois à partir du {new Date(Date.now() + currentPlan.trialDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-xl">
                  🚀 Vous avez maintenant accès à :
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {premiumFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-left">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="mb-8">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-xl">
                🎯 Prochaines étapes recommandées
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nextSteps.map((step, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-crypto-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <step.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          {step.title}
                        </h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {step.description}
                        </p>
                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                          {step.action} →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bouton principal */}
            <Button
              onClick={onContinue}
              size="lg"
              className="bg-gradient-to-r from-primary-600 to-crypto-600 hover:from-primary-700 hover:to-crypto-700 text-white px-12 py-4 text-xl font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 mb-6"
            >
              🚀 Accéder à mon Dashboard Premium
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Un email de confirmation a été envoyé à votre adresse
            </p>
          </CardContent>
        </Card>

        {/* Statistiques impressionnantes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center animate-fade-in">
            <CardContent className="p-6">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-green-600 mb-2">+127%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Rendement moyen des utilisateurs Premium
              </div>
            </CardContent>
          </Card>
          
          <Card className="text-center animate-fade-in">
            <CardContent className="p-6">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-blue-600 mb-2">250K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Traders font confiance à TradingAlerts
              </div>
            </CardContent>
          </Card>
          
          <Card className="text-center animate-fade-in">
            <CardContent className="p-6">
              <Award className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-purple-600 mb-2">4.9/5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Note moyenne des utilisateurs
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message de bienvenue personnalisé */}
        <div className="bg-gradient-to-r from-primary-50 to-crypto-50 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-2xl p-8 animate-fade-in">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            🎊 Vous faites maintenant partie de l'élite !
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Rejoignez les 250 000+ traders qui utilisent TradingAlerts Premium pour maximiser leurs profits. 
            Votre voyage vers le succès financier commence maintenant !
          </p>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Annulation à tout moment
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Support prioritaire 24/7
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Accès immédiat
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, ArrowLeft, Shield, Star, Crown, Zap, Sparkles, Gift, Users, TrendingUp, Award, Globe, Smartphone, Bell, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface PaymentPageProps {
  selectedPlan?: {
    id: string;
    name: string;
    price: number;
    trialDays: number;
    features: string[];
  };
  onBack: () => void;
  onSuccess: () => void;
}

export function PaymentPage({ selectedPlan, onBack, onSuccess }: PaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [formData, setFormData] = useState({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    country: 'FR'
  });
  const [processing, setProcessing] = useState(false);

  // Plan par défaut si aucun plan sélectionné
  const defaultPlan = {
    id: 'premium',
    name: 'Premium',
    price: 9.87,
    trialDays: 7,
    features: [
      'Alertes illimitées',
      'SMS internationaux inclus',
      'Portfolio illimité',
      'Support prioritaire 24/7',
      'Analyses techniques avancées',
      'Social trading complet'
    ]
  };

  const plan = selectedPlan || defaultPlan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    // Simulation du paiement
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const benefits = [
    {
      icon: Bell,
      title: 'Alertes Illimitées',
      description: 'Créez autant d\'alertes que vous voulez, quand vous voulez',
      highlight: 'vs 3/jour gratuit'
    },
    {
      icon: Globe,
      title: 'SMS Internationaux',
      description: 'Notifications par message dans 200+ pays',
      highlight: 'Inclus'
    },
    {
      icon: BarChart3,
      title: 'Portfolio Illimité',
      description: 'Suivez tous vos actifs sans limite',
      highlight: 'vs 5 actifs gratuit'
    },
    {
      icon: Users,
      title: 'Social Trading Pro',
      description: 'Suivez jusqu\'à 50 traders célèbres',
      highlight: 'vs 2 traders gratuit'
    },
    {
      icon: TrendingUp,
      title: 'Analyses Avancées',
      description: 'Analyses techniques illimitées et outils pro',
      highlight: 'vs 10/jour gratuit'
    },
    {
      icon: Smartphone,
      title: 'App Mobile Native',
      description: 'Application iOS/Android dédiée',
      highlight: 'Exclusif Premium'
    }
  ];

  const testimonials = [
    {
      name: 'Marie L.',
      text: 'Le Premium m\'a fait économiser des milliers d\'euros grâce aux alertes illimitées !',
      avatar: '👩‍💼',
      savings: '€3,200'
    },
    {
      name: 'Ahmed K.',
      text: 'Les SMS internationaux sont parfaits pour mes trades depuis le Maroc.',
      avatar: '👨‍💻',
      savings: '€1,800'
    },
    {
      name: 'Sophie M.',
      text: 'L\'app mobile native est incroyable, je trade partout maintenant !',
      avatar: '👩‍🚀',
      savings: '€2,500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header avec animation */}
        <div className="flex items-center mb-6 animate-fade-in">
          <Button onClick={onBack} variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              🚀 Débloquez Votre Potentiel Trading
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Rejoignez 250K+ traders qui utilisent TradingAlerts Premium
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne 1: Bénéfices Premium */}
          <div className="lg:col-span-1 space-y-6">
            {/* Plan sélectionné */}
            <Card className="relative overflow-hidden border-2 border-primary-500 animate-fade-in">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-center py-2">
                <span className="font-bold text-sm">⭐ PLAN SÉLECTIONNÉ</span>
              </div>
              <CardContent className="p-6 pt-12">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Plan {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">
                      {plan.price}€
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">/mois</span>
                  </div>
                  
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-bold mb-4">
                    🎁 {plan.trialDays} jours d'essai GRATUIT
                  </div>

                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-center mb-1">
                      <Sparkles className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">
                        OFFRE LIMITÉE
                      </span>
                    </div>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      <s>19,87€/mois</s> → <strong>9,87€/mois</strong> (-50%)
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Témoignages */}
            <Card className="animate-fade-in">
              <CardHeader>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Ils ont économisé des milliers d'euros
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {testimonials.map((testimonial, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{testimonial.avatar}</span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {testimonial.name}
                        </p>
                        <p className="text-green-600 font-bold text-xs">
                          Économies: {testimonial.savings}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                      "{testimonial.text}"
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Colonne 2: Formulaire de paiement */}
          <div className="lg:col-span-2">
            <Card className="animate-fade-in">
              <CardHeader>
                <h2 className="text-xl font-semibold flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Informations de paiement
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sécurisé par Stripe • Chiffrement SSL 256-bit • Annulation à tout moment
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Méthodes de paiement */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Méthode de paiement
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-4 border rounded-lg flex items-center justify-center transition-all duration-200 ${
                          paymentMethod === 'card'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span className="font-medium">Carte Bancaire</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`p-4 border rounded-lg flex items-center justify-center transition-all duration-200 ${
                          paymentMethod === 'paypal'
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-200'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <div className="w-5 h-5 mr-2 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <span className="font-medium">PayPal</span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4">
                      {/* Email */}
                      <Input
                        label="Email de facturation"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="votre@email.com"
                        required
                      />

                      {/* Informations carte */}
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          label="Numéro de carte"
                          type="text"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Date d'expiration"
                            type="text"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                            placeholder="MM/AA"
                            required
                          />
                          <Input
                            label="CVV"
                            type="text"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            placeholder="123"
                            required
                          />
                        </div>

                        <Input
                          label="Nom sur la carte"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Jean Dupont"
                          required
                        />

                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pays
                          </label>
                          <select
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            required
                          >
                            <option value="FR">🇫🇷 France</option>
                            <option value="MA">🇲🇦 Maroc</option>
                            <option value="US">🇺🇸 États-Unis</option>
                            <option value="CA">🇨🇦 Canada</option>
                            <option value="GB">🇬🇧 Royaume-Uni</option>
                            <option value="DE">🇩🇪 Allemagne</option>
                            <option value="ES">🇪🇸 Espagne</option>
                            <option value="IT">🇮🇹 Italie</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white font-bold">P</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Vous serez redirigé vers PayPal pour finaliser votre paiement sécurisé
                      </p>
                    </div>
                  )}

                  {/* Récapitulatif de commande */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Récapitulatif de commande
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Essai gratuit ({plan.trialDays} jours)
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">0€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Puis {plan.price}€/mois
                        </span>
                        <span className="text-gray-900 dark:text-white">{plan.price}€</span>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-gray-900 dark:text-white">Aujourd'hui</span>
                          <span className="text-green-600 dark:text-green-400">0€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sécurité */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Lock className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                      <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                        Paiement 100% sécurisé
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Vos informations sont chiffrées et protégées selon les standards bancaires. 
                      Annulation possible à tout moment.
                    </p>
                  </div>

                  {/* Conditions */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    En continuant, vous acceptez nos{' '}
                    <a href="#" className="text-primary-600 hover:underline">
                      Conditions d'utilisation
                    </a>{' '}
                    et notre{' '}
                    <a href="#" className="text-primary-600 hover:underline">
                      Politique de confidentialité
                    </a>
                    .
                  </div>

                  {/* Bouton de soumission */}
                  <Button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-primary-600 to-crypto-600 hover:from-primary-700 hover:to-crypto-700 text-white py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                    loading={processing}
                  >
                    {processing ? (
                      'Traitement en cours...'
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        🚀 Commencer l'essai gratuit de {plan.trialDays} jours
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Vous ne serez pas facturé aujourd'hui • Annulation à tout moment
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Garanties */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">SSL Sécurisé</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Chiffrement bancaire</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">30 jours garantie</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Remboursement intégral</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">4.9/5 étoiles</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">250K+ utilisateurs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bénéfices détaillés */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            🎯 Ce que vous débloquez avec Premium
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} hover className="text-center animate-fade-in">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {benefit.description}
                  </p>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-bold">
                    {benefit.highlight}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
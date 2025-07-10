import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, TrendingUp, TrendingDown, Sparkles, Bell, Settings, AlertCircle, Zap, Crown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { MarketSelector } from './MarketSelector';
import { NotificationSettings } from './NotificationSettings';

interface CreateAlertFormProps {
  onSubmit: (data: AlertFormData) => Promise<void>;
  loading: boolean;
  onPremiumUpgrade?: () => void;
}

export interface AlertFormData {
  symbol: string;
  target_price: number;
  condition: 'above' | 'below';
  market_type: 'crypto' | 'stock';
  notification_methods: string[];
  phone_number?: string;
}

const popularCryptos = [
  { symbol: 'bitcoin', name: 'Bitcoin', ticker: 'BTC' },
  { symbol: 'ethereum', name: 'Ethereum', ticker: 'ETH' },
  { symbol: 'cardano', name: 'Cardano', ticker: 'ADA' },
  { symbol: 'solana', name: 'Solana', ticker: 'SOL' },
];

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

export function CreateAlertForm({ onSubmit, loading, onPremiumUpgrade }: CreateAlertFormProps) {
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [marketType, setMarketType] = useState<'crypto' | 'stock'>('crypto');
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    push: false,
    phoneNumber: '',
  });
  
  // Simulation du compteur d'alertes - CORRIGÉ
  const [dailyAlertsUsed, setDailyAlertsUsed] = useState(0); // Commencer à 0 pour nouveaux utilisateurs
  const [isFreePlan] = useState(true); // Simulation - en production, récupérer depuis l'utilisateur
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AlertFormData>();
  
  const watchedSymbol = watch('symbol');
  const watchedPrice = watch('target_price');

  const onFormSubmit = async (data: AlertFormData) => {
    // Vérifier la limite quotidienne pour les utilisateurs gratuits
    if (isFreePlan && dailyAlertsUsed >= 3) {
      alert('Limite quotidienne atteinte ! Vous avez utilisé vos 3 alertes gratuites aujourd\'hui. Passez au plan Premium pour des alertes illimitées.');
      return;
    }

    // Vérifier que le prix cible est valide
    if (!data.target_price || isNaN(data.target_price) || data.target_price <= 0) {
      alert('Veuillez entrer un prix cible valide');
      return;
    }

    const methods = [];
    if (notificationSettings.email) methods.push('email');
    if (notificationSettings.sms) methods.push('sms');
    if (notificationSettings.push) methods.push('push');

    try {
      await onSubmit({ 
        ...data, 
        condition,
        market_type: marketType,
        notification_methods: methods,
        phone_number: notificationSettings.phoneNumber || undefined,
      });
      
      // Incrémenter le compteur SEULEMENT après succès
      setDailyAlertsUsed(prev => prev + 1);
      reset();
      setCondition('above');
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte:', error);
      // Ne pas incrémenter le compteur en cas d'erreur
    }
  };

  const selectAsset = (symbol: string) => {
    setValue('symbol', symbol);
  };

  const currentAssets = marketType === 'crypto' ? popularCryptos : popularStocks;
  const alertsRemaining = Math.max(0, 3 - dailyAlertsUsed);

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center">
              <div className="w-6 h-6 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-lg flex items-center justify-center mr-2">
                <Plus className="w-3 h-3 text-white" />
              </div>
              Nouvelle alerte
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Créez une alerte pour être notifié
            </p>
          </div>
          <NotificationSettings onSave={setNotificationSettings} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Limite quotidienne - Version gratuite - CORRIGÉE */}
        {isFreePlan && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                  Plan Gratuit - Limite quotidienne
                </span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                alertsRemaining > 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {alertsRemaining}/3 restantes
              </span>
            </div>
            
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  alertsRemaining > 0 ? 'bg-blue-600' : 'bg-red-500'
                }`}
                style={{ width: `${(dailyAlertsUsed / 3) * 100}%` }}
              ></div>
            </div>
            
            {alertsRemaining > 0 ? (
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Vous pouvez créer encore <strong>{alertsRemaining} alerte{alertsRemaining > 1 ? 's' : ''}</strong> aujourd'hui.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 dark:text-red-300">
                  ⚠️ Limite quotidienne atteinte ! Vos 3 alertes gratuites ont été utilisées.
                </p>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                  onClick={handleUpgradeClick}
                >
                  Passer au Premium (9,87€/mois) pour des alertes illimitées
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Market Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Type de marché
          </label>
          <MarketSelector 
            selectedMarket={marketType}
            onMarketChange={setMarketType}
          />
        </div>

        {/* Popular assets quick select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {marketType === 'crypto' ? 'Cryptos populaires' : 'Actions populaires'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {currentAssets.map((asset) => (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => selectAsset(asset.symbol)}
                className={`
                  p-2 text-left rounded-lg border transition-all duration-200 text-xs
                  ${watchedSymbol === asset.symbol 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="font-medium">
                  {marketType === 'crypto' ? asset.ticker || asset.symbol.toUpperCase() : asset.symbol}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{asset.name}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Custom Symbol Input */}
          <Input
            {...register('symbol', {
              required: 'Symbole requis',
              pattern: {
                value: marketType === 'crypto' ? /^[a-zA-Z-]{2,20}$/ : /^[A-Z]{1,5}$/,
                message: marketType === 'crypto' 
                  ? 'Symbole crypto invalide (ex: bitcoin, ethereum)' 
                  : 'Symbole action invalide (ex: AAPL, GOOGL)',
              },
            })}
            label="Symbole personnalisé"
            placeholder={marketType === 'crypto' ? 'bitcoin, ethereum...' : 'AAPL, GOOGL...'}
            className={`text-sm ${marketType === 'stock' ? 'uppercase' : 'lowercase'}`}
            error={errors.symbol?.message}
          />

          {/* Target Price */}
          <Input
            {...register('target_price', {
              required: 'Prix cible requis',
              min: {
                value: 0.000001,
                message: 'Prix doit être positif',
              },
            })}
            type="number"
            step="any"
            label="Prix cible (USD)"
            placeholder="0.00"
            className="text-sm"
            error={errors.target_price?.message}
          />

          {/* Condition Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Condition d'alerte
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={condition === 'above' ? 'primary' : 'secondary'}
                onClick={() => setCondition('above')}
                className="flex items-center justify-center py-2 text-sm"
                size="sm"
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Au-dessus
              </Button>
              <Button
                type="button"
                variant={condition === 'below' ? 'primary' : 'secondary'}
                onClick={() => setCondition('below')}
                className="flex items-center justify-center py-2 text-sm"
                size="sm"
              >
                <TrendingDown className="w-3 h-3 mr-1" />
                En-dessous
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {condition === 'above' 
                ? 'Vous serez alerté quand le prix dépasse votre objectif'
                : 'Vous serez alerté quand le prix descend sous votre objectif'
              }
            </p>
          </div>

          {/* Notification Preview */}
          <div className="bg-gradient-to-r from-primary-50 to-crypto-50 dark:from-primary-900/20 dark:to-crypto-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center text-sm">
              <Bell className="w-3 h-3 mr-1" />
              Notifications activées
            </h4>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {notificationSettings.email && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  📧 Email
                </span>
              )}
              {notificationSettings.push && (
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                  🔔 Push
                </span>
              )}
              {notificationSettings.sms && (
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                  📱 SMS {notificationSettings.phoneNumber && `(${notificationSettings.phoneNumber})`}
                </span>
              )}
            </div>
            
            {notificationSettings.sms && !notificationSettings.phoneNumber && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Numéro de téléphone requis pour les SMS
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-600 to-crypto-600 hover:from-primary-700 hover:to-crypto-700 py-2 text-sm"
            loading={loading}
            size="sm"
            disabled={isFreePlan && alertsRemaining === 0}
          >
            {isFreePlan && alertsRemaining === 0 ? (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Limite atteinte - Passer au Premium
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Créer l'alerte ({alertsRemaining} restante{alertsRemaining > 1 ? 's' : ''})
              </>
            )}
          </Button>
        </form>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-primary-50 to-crypto-50 dark:from-primary-900/20 dark:to-crypto-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
          <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2 flex items-center text-sm">
            <Bell className="w-3 h-3 mr-1" />
            Surveillance Ultra-Rapide (5 secondes)
          </h4>
          <ul className="text-xs text-primary-800 dark:text-primary-200 space-y-1">
            <li>• Vérification des prix toutes les <strong>5 secondes</strong></li>
            <li>• Notifications multi-canaux instantanées</li>
            <li>• Support crypto et actions boursières</li>
            <li>• {isFreePlan ? '3 alertes gratuites par jour' : 'Alertes illimitées'}</li>
          </ul>
        </div>

        {/* Premium Upgrade CTA */}
        {isFreePlan && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center text-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Passez au Premium
            </h4>
            <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 mb-3">
              <li>• <strong>Alertes illimitées</strong> - Créez autant d'alertes que vous voulez</li>
              <li>• <strong>SMS internationaux</strong> - Notifications dans 200+ pays</li>
              <li>• <strong>Portfolio illimité</strong> - Suivez tous vos actifs</li>
              <li>• <strong>Support prioritaire</strong> - Assistance 24/7</li>
            </ul>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs w-full"
              onClick={handleUpgradeClick}
            >
              Passer au Premium - 9,87€/mois
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
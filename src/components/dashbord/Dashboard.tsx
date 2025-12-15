import React, { useState } from 'react';
import { Header } from './Header';
import { CreateAlertForm, AlertFormData } from './CreateAlertForm';
import { AlertsList } from './AlertsList';
import { PriceChart } from './PriceChart';
import { MarketStock } from './MarketStock';
import { MarketCrypto } from './MarketCrypto';
import { UserSettings } from './UserSettings';
import { TechnicalAnalysis } from './TechnicalAnalysis';
import NewsCenter from './NewsCenter';
import { WatchlistManager } from './WatchlistManager';
import { useAlerts } from '../../hooks/useAlerts';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import toast from 'react-hot-toast';

interface DashboardProps {
  onGoHome: () => void;
  onSignOut: () => void;
  onPremiumUpgrade?: (plan?: any) => void;
}

export function Dashboard({ onGoHome, onSignOut, onPremiumUpgrade }: DashboardProps) {
  const { user } = useAuth();
  const { alerts, loading, createAlert, deleteAlert, toggleAlert } = useAlerts(user?.id);
  const [createLoading, setCreateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'alerts' | 'marketStock' | 'marketCrypto' | 'analysis' | 'news' | 'watchlist' | 'settings'
  >('alerts');
  const { showNotification } = useNotification();

  const handleCreateAlert = async (data: AlertFormData) => {
    setCreateLoading(true);
    try {
      const { error } = await createAlert({
        symbol: data.market_type === 'stock' ? data.symbol.toUpperCase() : data.symbol.toLowerCase(),
        target_price: data.target_price,
        condition: data.condition,
        market_type: data.market_type,
        notification_methods: data.notification_methods,
        phone_number: data.phone_number,
      });

      if (error) {
        console.error('Error creating alert:', error);
        toast.error('Erreur lors de la création de l\'alerte');
        throw error;
      } else {
        const symbol = data.market_type === 'stock' ? data.symbol.toUpperCase() : data.symbol.toLowerCase();
        toast.success(`Alerte créée pour ${symbol} ! Surveillance toutes les 5 secondes.`);
        showNotification(
          'Nouvelle alerte créée',
          `Alerte ${symbol} ${data.condition === 'above' ? 'au-dessus' : 'en-dessous'} de $${data.target_price} - Surveillance 5s`
        );
      }
    } catch (error) {
      throw error;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    toast((t) => (
      <div>
        <p className="text-gray-900 dark:text-white">Êtes-vous sûr de vouloir supprimer cette alerte ?</p>
        <div className="mt-2 flex justify-end space-x-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md text-sm"
          >
            Annuler
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const { error } = await deleteAlert(alertId);
              if (error) {
                console.error('Error deleting alert:', error);
                toast.error('Erreur lors de la suppression');
              } else {
                toast.success('Alerte supprimée avec succès');
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded-md text-sm"
          >
            Supprimer
          </button>
        </div>
      </div>
    ));
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    const { error } = await toggleAlert(alertId, isActive);
    if (error) {
      console.error('Error toggling alert:', error);
      toast.error('Erreur lors de la modification');
    } else {
      toast.success(isActive ? 'Alerte activée' : 'Alerte désactivée');
    }
  };

  const handlePremiumUpgrade = () => {
    if (onPremiumUpgrade) {
      const premiumPlan = {
        id: 'premium',
        name: 'Premium',
        price: 9.87,
        trialDays: 7,
        features: [
          'Alertes illimitées',
          'SMS internationaux inclus',
          'Support prioritaire 24/7',
          'Analyses techniques avancées',
        ]
      };
      onPremiumUpgrade(premiumPlan);
    }
  };

  const uniqueSymbols = [...new Set(alerts.map(alert => ({
    symbol: alert.symbol,
    marketType: alert.market_type
  })))].slice(0, 2);

  // Liste des tabs (mobile et desktop)
  const TABS = [
    { key: 'alerts', label: 'Alertes' },
    { key: 'news', label: 'News' },
    { key: 'marketStock', label: 'Marché Actions' },
    { key: 'marketCrypto', label: 'Marché Crypto' },
    { key: 'analysis', label: 'Analyses' },
    { key: 'watchlist', label: 'Watchlist' },
    { key: 'settings', label: 'Paramètres' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header
        userEmail={user?.email || ''}
        onSignOut={onSignOut}
        onGoHome={onGoHome}
        onPremiumUpgrade={handlePremiumUpgrade}
      />
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6">
        <div className="mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">
            Alertes crypto et bourse - Surveillance 5 secondes
          </p>
        </div>

        {/* Mobile layout */}
        <div className="lg:hidden space-y-3 sm:space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <CreateAlertForm
              onSubmit={handleCreateAlert}
              loading={createLoading}
              onPremiumUpgrade={handlePremiumUpgrade}
            />
          </div>
          {/* Navigation Tabs */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-shrink-0 py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Tab content mobile */}
          <div className="min-h-[60vh]">
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {uniqueSymbols.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Graphiques en temps réel ({uniqueSymbols.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {uniqueSymbols.slice(0, 2).map((item, index) => (
                        <div key={`${item.symbol}-${item.marketType}`} className="h-48">
                          <PriceChart
                            symbol={item.symbol}
                            marketType={item.marketType}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <AlertsList
                  alerts={alerts}
                  loading={loading}
                  onDeleteAlert={handleDeleteAlert}
                  onToggleAlert={handleToggleAlert}
                />
              </div>
            )}
            {activeTab === 'marketStock' && <MarketStock />}
            {activeTab === 'marketCrypto' && <MarketCrypto />}
            {activeTab === 'analysis' && <TechnicalAnalysis onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'news' && <NewsCenter onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'watchlist' && <WatchlistManager onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'settings' && <UserSettings />}
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 xl:gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-4">
              <CreateAlertForm
                onSubmit={handleCreateAlert}
                loading={createLoading}
                onPremiumUpgrade={handlePremiumUpgrade}
              />
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9 space-y-6 sm:space-y-8">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* Tab content desktop */}
            {activeTab === 'alerts' && (
              <div className="space-y-6 sm:space-y-8">
                {uniqueSymbols.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                      Graphiques de prix en temps réel
                    </h3>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                      {uniqueSymbols.slice(0, 2).map((item, index) => (
                        <PriceChart
                          key={`${item.symbol}-${item.marketType}`}
                          symbol={item.symbol}
                          marketType={item.marketType}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <AlertsList
                  alerts={alerts}
                  loading={loading}
                  onDeleteAlert={handleDeleteAlert}
                  onToggleAlert={handleToggleAlert}
                />
              </div>
            )}
            {activeTab === 'marketStock' && <MarketStock />}
            {activeTab === 'marketCrypto' && <MarketCrypto />}
            {activeTab === 'analysis' && <TechnicalAnalysis onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'news' && <NewsCenter onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'watchlist' && <WatchlistManager onPremiumUpgrade={handlePremiumUpgrade} />}
            {activeTab === 'settings' && <UserSettings />}
          </div>
        </div>
      </main>
    </div>
  );
}

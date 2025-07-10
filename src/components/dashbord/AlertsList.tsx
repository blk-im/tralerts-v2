import React from 'react';
import { AlertTriangle, Zap, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { AlertCard } from './AlertCard';
import { Database } from '../../lib/supabase';

type Alert = Database['public']['Tables']['alerts']['Row'];

interface AlertsListProps {
  alerts: Alert[];
  loading: boolean;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string, isActive: boolean) => void;
}

export function AlertsList({ alerts, loading, onDeleteAlert, onToggleAlert }: AlertsListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-full flex items-center justify-center">
          <Zap className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          Aucune alerte configurée
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
          Créez votre première alerte pour commencer à suivre les prix de vos cryptomonnaies et actions préférées.
        </p>
        <div className="bg-gradient-to-r from-primary-50 to-crypto-50 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Astuce :</strong> Commencez par Bitcoin (BTC) ou Apple (AAPL) pour tester le système !
          </p>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(alert => alert.is_active);
  const inactiveAlerts = alerts.filter(alert => !alert.is_active);
  const triggeredAlerts = alerts.filter(alert => alert.triggered_at);
  const cryptoAlerts = alerts.filter(alert => alert.market_type === 'crypto');
  const stockAlerts = alerts.filter(alert => alert.market_type === 'stock');

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-success-50 to-success-100 dark:from-success-900/20 dark:to-success-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-success-600 dark:text-success-400 mr-3" />
            <div>
              <p className="text-2xl font-bold text-success-700 dark:text-success-300">{activeAlerts.length}</p>
              <p className="text-sm text-success-600 dark:text-success-400">Actives</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400 mr-3" />
            <div>
              <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">{alerts.length}</p>
              <p className="text-sm text-primary-600 dark:text-primary-400">Total</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-crypto-50 to-crypto-100 dark:from-crypto-900/20 dark:to-crypto-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-crypto-600 dark:text-crypto-400 mr-3" />
            <div>
              <p className="text-2xl font-bold text-crypto-700 dark:text-crypto-300">{triggeredAlerts.length}</p>
              <p className="text-sm text-crypto-600 dark:text-crypto-400">Déclenchées</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {cryptoAlerts.length}/{stockAlerts.length}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Crypto/Actions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <div className="flex items-center mb-6">
            <div className="w-3 h-3 bg-success-500 rounded-full mr-3 animate-pulse"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Alertes actives ({activeAlerts.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={onDeleteAlert}
                onToggle={onToggleAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Alerts */}
      {inactiveAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
            Alertes inactives ({inactiveAlerts.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {inactiveAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={onDeleteAlert}
                onToggle={onToggleAlert}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
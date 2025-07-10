import React from 'react';
import { TrendingUp, TrendingDown, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle, DollarSign, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Database } from '../../lib/supabase';

type Alert = Database['public']['Tables']['alerts']['Row'];

interface AlertCardProps {
  alert: Alert;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export function AlertCard({ alert, onDelete, onToggle }: AlertCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const isTriggered = !!alert.triggered_at;
  const isCrypto = alert.market_type === 'crypto';

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-3 h-3" />;
      case 'sms': return <MessageSquare className="w-3 h-3" />;
      case 'push': return <Smartphone className="w-3 h-3" />;
      default: return <Bell className="w-3 h-3" />;
    }
  };

  return (
    <Card hover className={`animate-fade-in transition-all duration-300 ${
      isTriggered ? 'ring-2 ring-success-200 dark:ring-success-800 bg-success-50/30 dark:bg-success-900/10' : ''
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg
              ${alert.condition === 'above' 
                ? 'bg-gradient-to-r from-success-500 to-success-600' 
                : 'bg-gradient-to-r from-warning-500 to-warning-600'
              }
            `}>
              {isCrypto ? (
                alert.symbol.slice(0, 3).toUpperCase()
              ) : (
                <DollarSign className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white uppercase truncate">
                  {alert.symbol}
                </h3>
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium flex-shrink-0
                  ${isCrypto 
                    ? 'bg-crypto-100 dark:bg-crypto-900/30 text-crypto-700 dark:text-crypto-300' 
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  }
                `}>
                  {isCrypto ? 'CRYPTO' : 'ACTION'}
                </span>
              </div>
              <div className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${alert.condition === 'above' 
                  ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' 
                  : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                }
              `}>
                {alert.condition === 'above' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {alert.condition === 'above' ? 'Au-dessus de' : 'En-dessous de'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button
              onClick={() => onToggle(alert.id, !alert.is_active)}
              variant="ghost"
              size="sm"
              className="p-2"
              title={alert.is_active ? 'Désactiver' : 'Activer'}
            >
              {alert.is_active ? (
                <ToggleRight className="w-5 h-5 text-success-600" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
            </Button>
            <Button
              onClick={() => onDelete(alert.id)}
              variant="ghost"
              size="sm"
              className="p-2 text-error-500 hover:text-error-700 hover:bg-error-50 dark:hover:bg-error-900/20"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Prix cible</span>
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(alert.target_price)}
            </span>
          </div>

          {/* Notification methods */}
          {alert.notification_methods && alert.notification_methods.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Notifications</span>
              <div className="flex space-x-1">
                {alert.notification_methods.map((method, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
                    title={method}
                  >
                    {getNotificationIcon(method)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              Créée le {formatDate(alert.created_at)}
            </div>
            <div className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
              ${alert.is_active 
                ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
            `}>
              {alert.is_active ? (
                <>
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
                  Active
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                  Inactive
                </>
              )}
            </div>
          </div>

          {isTriggered && (
            <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3 mt-4">
              <div className="flex items-center text-success-700 dark:text-success-300">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span className="font-medium text-sm">
                  Alerte déclenchée le {formatDate(alert.triggered_at!)}
                </span>
              </div>
              <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                Notifications envoyées via tous les canaux configurés
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
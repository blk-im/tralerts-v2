import React from 'react';
import { MapPin, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface GeographyData {
  country: string;
  users: number;
  revenue: number;
}

interface RegionMapProps {
  geography: GeographyData[];
}

export function RegionMap({ geography }: RegionMapProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'France': '🇫🇷',
      'Maroc': '🇲🇦',
      'États-Unis': '🇺🇸',
      'Canada': '🇨🇦',
      'Allemagne': '🇩🇪',
      'Royaume-Uni': '🇬🇧',
      'Espagne': '🇪🇸',
      'Italie': '🇮🇹'
    };
    return flags[country] || '🌍';
  };

  const totalUsers = geography.reduce((sum, item) => sum + item.users, 0);
  const totalRevenue = geography.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold flex items-center">
          <Globe className="w-5 h-5 mr-2 text-green-600" />
          Répartition Géographique
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {geography.map((item, index) => {
            const userPercentage = (item.users / totalUsers) * 100;
            const revenuePercentage = (item.revenue / totalRevenue) * 100;
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getCountryFlag(item.country)}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.country}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.users} utilisateurs ({userPercentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(item.revenue)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {revenuePercentage.toFixed(1)}% du total
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Résumé */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Utilisateurs Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenus Total</p>
            </div>
          </div>
        </div>

        {/* Top pays */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
              Pays le plus performant
            </span>
          </div>
          {geography.length > 0 && (
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>{geography[0].country}</strong> génère {((geography[0].revenue / totalRevenue) * 100).toFixed(1)}% 
              des revenus avec {geography[0].users} utilisateurs
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
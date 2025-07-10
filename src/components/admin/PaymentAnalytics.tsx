import React from 'react';
import { CreditCard, AlertTriangle, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Revenue {
  total: number;
  growth: number;
  transactions: number;
  avgOrderValue: number;
}

interface PaymentAnalyticsProps {
  revenue: Revenue;
  failedPayments: number;
  refunds: number;
}

export function PaymentAnalytics({ revenue, failedPayments, refunds }: PaymentAnalyticsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Données pour le graphique de répartition des paiements
  const paymentStatusData = [
    { name: 'Réussis', value: revenue.transactions, color: '#10b981' },
    { name: 'Échoués', value: failedPayments, color: '#ef4444' },
    { name: 'Remboursés', value: refunds, color: '#f59e0b' }
  ];

  // Données pour l'évolution des paiements
  const paymentTrendData = [
    { month: 'Jan', successful: 145, failed: 8, refunds: 2 },
    { month: 'Fév', successful: 167, failed: 12, refunds: 3 },
    { month: 'Mar', successful: 189, failed: 15, refunds: 4 },
    { month: 'Avr', successful: 203, failed: 11, refunds: 2 },
    { month: 'Mai', successful: 234, failed: 18, refunds: 5 },
    { month: 'Juin', successful: revenue.transactions, failed: failedPayments, refunds: refunds }
  ];

  const successRate = (revenue.transactions / (revenue.transactions + failedPayments)) * 100;
  const refundRate = (refunds / revenue.transactions) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des paiements */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
              Statut des Paiements
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              {paymentStatusData.map((item, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="w-4 h-4 rounded-full mx-auto mb-1"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-lg font-bold" style={{ color: item.color }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métriques de paiement */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Métriques Clés
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Taux de Réussite</p>
                  <p className="text-2xl font-bold text-green-600">{successRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Paiements Échoués</p>
                  <p className="text-2xl font-bold text-red-600">{failedPayments}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Taux de Remboursement</p>
                  <p className="text-2xl font-bold text-yellow-600">{refundRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-yellow-600" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Panier Moyen</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(revenue.avgOrderValue)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Évolution des paiements */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Évolution des Paiements (6 derniers mois)</h3>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tooltip-bg)',
                    border: '1px solid var(--tooltip-border)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="successful" fill="#10b981" name="Réussis" radius={[2, 2, 0, 0]} />
                <Bar dataKey="failed" fill="#ef4444" name="Échoués" radius={[2, 2, 0, 0]} />
                <Bar dataKey="refunds" fill="#f59e0b" name="Remboursés" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights et recommandations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-green-600">✅ Points Positifs</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Taux de réussite élevé ({successRate.toFixed(1)}%)
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Croissance des revenus de {revenue.growth.toFixed(1)}%
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Panier moyen stable à {formatCurrency(revenue.avgOrderValue)}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-orange-600">⚠️ Points d'Attention</h3>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                {failedPayments} paiements échoués à analyser
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Taux de remboursement à {refundRate.toFixed(1)}%
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                Optimiser le processus de paiement
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
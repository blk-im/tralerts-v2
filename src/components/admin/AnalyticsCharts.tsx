import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: string;
}

interface Analytics {
  revenue: {
    total: number;
    growth: number;
    transactions: number;
    avgOrderValue: number;
  };
  traffic: {
    visitors: number;
    pageViews: number;
    bounceRate: number;
    avgSessionDuration: number;
  };
  conversions: {
    signups: number;
    premiumUpgrades: number;
    conversionRate: number;
    churnRate: number;
  };
}

interface AnalyticsChartsProps {
  dateRange: DateRange;
  analytics: Analytics;
  detailed?: boolean;
}

export function AnalyticsCharts({ dateRange, analytics, detailed = false }: AnalyticsChartsProps) {
  // Générer des données de graphique basées sur la période
  const generateChartData = () => {
    const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(dateRange.startDate);
      date.setDate(date.getDate() + i);
      
      data.push({
        date: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 2000) + 500,
        visitors: Math.floor(Math.random() * 500) + 100,
        conversions: Math.floor(Math.random() * 20) + 5,
        signups: Math.floor(Math.random() * 15) + 2
      });
    }
    
    return data;
  };

  const chartData = generateChartData();

  const deviceData = [
    { name: 'Desktop', value: 45, color: '#2563eb' },
    { name: 'Mobile', value: 40, color: '#f97316' },
    { name: 'Tablet', value: 15, color: '#10b981' }
  ];

  const sourceData = [
    { source: 'Recherche Google', visitors: 3420, conversions: 156 },
    { source: 'Direct', visitors: 2180, conversions: 89 },
    { source: 'Réseaux sociaux', visitors: 1890, conversions: 67 },
    { source: 'Email', visitors: 1240, conversions: 78 },
    { source: 'Référents', visitors: 890, conversions: 34 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Graphique de revenus détaillé */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Évolution des Revenus
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                    labelStyle={{ color: 'var(--text-color)' }}
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--tooltip-border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sources de trafic */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Sources de Trafic
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--tooltip-border)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="visitors" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des appareils */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Répartition par Appareil</h3>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Pourcentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {deviceData.map((item, index) => (
                  <div key={index} className="text-center">
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mb-1"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.value}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold flex items-center">
                <Target className="w-5 h-5 mr-2 text-purple-600" />
                Conversions par Source
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sourceData.map((source, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{source.source}</p>
                      <p className="text-xs text-gray-500">{source.visitors.toLocaleString()} visiteurs</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{source.conversions}</p>
                      <p className="text-xs text-gray-500">
                        {((source.conversions / source.visitors) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-xl font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Tendances
        </h3>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--tooltip-bg)',
                  border: '1px solid var(--tooltip-border)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={false}
                name="Visiteurs"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Activity, Plus, Crown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePortfolio } from '../../hooks/usePortfolio';
import { useRealTimeData } from '../../hooks/useRealTimeData';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (symbol: string, marketType: 'crypto' | 'stock', quantity: number, averagePrice: number) => void;
}

function AddAssetModal({ isOpen, onClose, onAdd }: AddAssetModalProps) {
  const [symbol, setSymbol] = useState('');
  const [marketType, setMarketType] = useState<'crypto' | 'stock'>('crypto');
  const [quantity, setQuantity] = useState('');
  const [averagePrice, setAveragePrice] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !quantity || !averagePrice) return;

    onAdd(symbol, marketType, parseFloat(quantity), parseFloat(averagePrice));
    setSymbol('');
    setQuantity('');
    setAveragePrice('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Ajouter un actif</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de marché</label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={marketType === 'crypto' ? 'primary' : 'secondary'}
                onClick={() => setMarketType('crypto')}
                size="sm"
              >
                Crypto
              </Button>
              <Button
                type="button"
                variant={marketType === 'stock' ? 'primary' : 'secondary'}
                onClick={() => setMarketType('stock')}
                size="sm"
              >
                Action
              </Button>
            </div>
          </div>
          
          <Input
            label="Symbole"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={marketType === 'crypto' ? 'BTC, ETH...' : 'AAPL, GOOGL...'}
            required
          />
          
          <Input
            label="Quantité"
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.5"
            required
          />
          
          <Input
            label="Prix moyen d'achat (USD)"
            type="number"
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const assetsRemaining = Math.max(0, 5 - (portfolio?.length || 0));

  const handleUpgradeClick = () => {
    if (onPremiumUpgrade) {
      onPremiumUpgrade();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valeur totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Variation 24h</p>
                <div className={`flex items-center ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  <span className="text-2xl font-bold">
                    {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-success-100 to-warning-100 dark:from-success-900/20 dark:to-warning-900/20 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolio.length}
                  {isFreePlan && <span className="text-sm text-gray-500">/5</span>}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free Plan Limitation */}
      {isFreePlan && (
        <Card>
          <CardContent className="p-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                  <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                    Plan Gratuit - 5 actifs maximum
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  assetsRemaining > 0 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {(stats?.totalProfitLossPercentage || 0) >= 0 ? '+' : ''}{(stats?.totalProfitLossPercentage || 0).toFixed(2)}%
                </span>
              </div>
              
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((portfolio?.length || 0) / 5) * 100}%` }}
                ></div>
              </div>
              
              {assetsRemaining > 0 ? (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Vous pouvez ajouter encore <strong>{assetsRemaining} actif{assetsRemaining > 1 ? 's' : ''}</strong> à votre portfolio.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    ⚠️ Portfolio complet ! Vous avez atteint la limite de 5 actifs.
                  </p>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white text-xs"
                    onClick={handleUpgradeClick}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Passer au Premium pour portfolio illimité
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Holdings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              <div className={`flex items-center ${(stats?.totalProfitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(stats?.totalProfitLossPercentage || 0) >= 0 ? (
            <Button
              disabled={isFreePlan && assetsRemaining === 0}
              className={`${
                isFreePlan && assetsRemaining === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
              size="sm"
              onClick={isFreePlan && assetsRemaining === 0 ? handleUpgradeClick : () => setShowAddModal(true)}
            >
              {isFreePlan && assetsRemaining === 0 ? (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Premium requis
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un actif
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!portfolio || portfolio.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-100 to-crypto-100 dark:from-primary-900/20 dark:to-crypto-900/20 rounded-full flex items-center justify-center">
                <PieChart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Votre portfolio est vide
              </h3>
                {portfolio?.length || 0}
                {formatCurrency(stats?.totalValue || 0)}
              </p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-primary-600 to-crypto-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter mon premier actif
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {portfolio.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                      item.market_type === 'crypto' 
                        ? 'bg-gradient-to-r from-crypto-500 to-crypto-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      {item.market_type === 'crypto' 
                        ? item.symbol.slice(0, 3).toUpperCase()
                        : item.symbol
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} {item.market_type === 'crypto' ? item.symbol.toUpperCase() : 'actions'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.total_value)}
                    </p>
                    <div className={`flex items-center justify-end space-x-2 ${
                      item.profit_loss_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.profit_loss_percentage >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-sm">
                        {item.profit_loss_percentage >= 0 ? '+' : ''}{item.profit_loss_percentage.toFixed(2)}%
                      </span>
                      <Button
                        onClick={() => handleRemoveAsset(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bouton de rafraîchissement */}
      <div className="text-center">
        <Button onClick={handleRefresh} variant="secondary" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Actualiser les prix
        </Button>
      </div>

      {/* Premium Upgrade CTA */}
      {isFreePlan && (
        <Card>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 flex items-center text-lg">
                <Crown className="w-5 h-5 mr-2" />
                Débloquez votre Potentiel d'Investissement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Plan Gratuit :</h5>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• 5 actifs maximum</li>
                    <li>• Suivi de base</li>
                    <li>• Statistiques limitées</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">Plan Premium :</h5>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• <strong>Actifs illimités</strong></li>
                    <li>• <strong>Analytics avancées</strong></li>
                    <li>• <strong>Alertes de portfolio</strong></li>
                    <li>• <strong>Rapports détaillés</strong></li>
                  </ul>
                </div>
              </div>
              <Button 
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white w-full"
                onClick={handleUpgradeClick}
              >
                <Crown className="w-4 h-4 mr-2" />
                Passer au Premium - 9,87€/mois
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal d'ajout d'actif */}
      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAsset}
      />
    </div>
  );
}
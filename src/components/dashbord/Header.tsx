import React from 'react';
import { LogOut, TrendingUp, Home, Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';

interface HeaderProps {
  userEmail: string;
  onSignOut: () => void;
  onGoHome?: () => void;
  onPremiumUpgrade?: () => void;
}

export function Header({ userEmail, onSignOut, onGoHome, onPremiumUpgrade }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">TradingAlerts</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Crypto & Bourse</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {onPremiumUpgrade && (
              <Button
                onClick={onPremiumUpgrade}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white text-xs sm:text-sm"
                size="sm"
              >
                <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Premium</span>
                <span className="sm:hidden">Pro</span>
              </Button>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
              {userEmail}
            </span>
            {onGoHome && (
              <Button
                onClick={onGoHome}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                title="Retour à l'accueil"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:block">Accueil</span>
              </Button>
            )}
            <ThemeToggle />
            <Button
              onClick={onSignOut}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Déconnexion</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
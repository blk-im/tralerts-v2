import React from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';

interface MarketSelectorProps {
  selectedMarket: 'crypto' | 'stock';
  onMarketChange: (market: 'crypto' | 'stock') => void;
}

export function MarketSelector({ selectedMarket, onMarketChange }: MarketSelectorProps) {
  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        onClick={() => onMarketChange('crypto')}
        variant={selectedMarket === 'crypto' ? 'primary' : 'ghost'}
        size="sm"
        className="flex-1 flex items-center justify-center"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        Crypto
      </Button>
      <Button
        onClick={() => onMarketChange('stock')}
        variant={selectedMarket === 'stock' ? 'primary' : 'ghost'}
        size="sm"
        className="flex-1 flex items-center justify-center"
      >
        <DollarSign className="w-4 h-4 mr-2" />
        Actions
      </Button>
    </div>
  );
}
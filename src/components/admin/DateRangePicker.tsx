import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface DateRange {
  startDate: Date;
  endDate: Date;
  preset?: string;
}

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: 'Aujourd\'hui', value: '1d', days: 1 },
  { label: '7 derniers jours', value: '7d', days: 7 },
  { label: '30 derniers jours', value: '30d', days: 30 },
  { label: '90 derniers jours', value: '90d', days: 90 },
  { label: '6 derniers mois', value: '6m', days: 180 },
  { label: '1 an', value: '1y', days: 365 },
  { label: 'Personnalisé', value: 'custom', days: 0 }
];

export function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(dateRange.startDate.toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(dateRange.endDate.toISOString().split('T')[0]);

  const handlePresetSelect = (preset: typeof presets[0]) => {
    if (preset.value === 'custom') {
      return; // Ne pas fermer pour le mode personnalisé
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - preset.days);

    onChange({
      startDate,
      endDate,
      preset: preset.value
    });
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    const startDate = new Date(customStart);
    const endDate = new Date(customEnd);
    
    if (startDate > endDate) {
      alert('La date de début doit être antérieure à la date de fin');
      return;
    }

    onChange({
      startDate,
      endDate,
      preset: 'custom'
    });
    setIsOpen(false);
  };

  const formatDateRange = () => {
    const currentPreset = presets.find(p => p.value === dateRange.preset);
    if (currentPreset && currentPreset.value !== 'custom') {
      return currentPreset.label;
    }
    
    return `${dateRange.startDate.toLocaleDateString('fr-FR')} - ${dateRange.endDate.toLocaleDateString('fr-FR')}`;
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        className="flex items-center space-x-2"
      >
        <Calendar className="w-4 h-4" />
        <span>{formatDateRange()}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="space-y-2">
                {presets.map((preset) => (
                  <div key={preset.value}>
                    <button
                      onClick={() => handlePresetSelect(preset)}
                      className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        dateRange.preset === preset.value 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                    
                    {preset.value === 'custom' && dateRange.preset === 'custom' && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date de début
                          </label>
                          <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Date de fin
                          </label>
                          <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <Button
                          onClick={handleCustomApply}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          Appliquer
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
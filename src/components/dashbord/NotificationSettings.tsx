import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Settings, Phone, AlertCircle, Globe, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNotification } from '../../contexts/NotificationContext';
import { FreeSMSTestButton } from './FreeSMSTestButton';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface NotificationSettingsProps {
  onSave: (settings: {
    email: boolean;
    sms: boolean;
    push: boolean;
    phoneNumber?: string;
  }) => void;
}

const countryCodes = [
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+212', country: 'Maroc', flag: '🇲🇦' },
  { code: '+1', country: 'États-Unis', flag: '🇺🇸' },
  { code: '+44', country: 'Royaume-Uni', flag: '🇬🇧' },
  { code: '+49', country: 'Allemagne', flag: '🇩🇪' },
  { code: '+34', country: 'Espagne', flag: '🇪🇸' },
  { code: '+39', country: 'Italie', flag: '🇮🇹' },
  { code: '+213', country: 'Algérie', flag: '🇩🇿' },
  { code: '+216', country: 'Tunisie', flag: '🇹🇳' },
  { code: '+32', country: 'Belgique', flag: '🇧🇪' },
  { code: '+41', country: 'Suisse', flag: '🇨🇭' },
  { code: '+352', country: 'Luxembourg', flag: '🇱🇺' }
];

export function NotificationSettings({ onSave }: NotificationSettingsProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    email: true,
    sms: false,
    push: false,
    phoneNumber: '',
  });
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const { requestPermission, hasPermission } = useNotification();

  // Charger le numéro de téléphone de l'utilisateur s'il existe
  useEffect(() => {
    if (user?.user_metadata?.phone_number) {
      console.log('Loading phone from metadata:', user.user_metadata.phone_number);
      setSettings(prev => ({
        ...prev,
        phoneNumber: user.user_metadata.phone_number,
        sms: true
      }));
    }
    
    // Charger les préférences utilisateur depuis la base de données
    loadUserPreferences();
  }, [user]);
  
  const loadUserPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error loading user preferences:', error);
        return;
      }
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          email: data.email_notifications,
          sms: data.sms_notifications,
          push: data.push_notifications,
          phoneNumber: data.phone_number || prev.phoneNumber
        }));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handlePushToggle = async () => {
    if (!settings.push) {
      const granted = await requestPermission();
      if (granted) {
        setSettings(prev => ({ ...prev, push: true }));
      }
    } else {
      setSettings(prev => ({ ...prev, push: false }));
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone);
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.length > 10 && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '+33' + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const handleSave = async () => {
    if (settings.sms && !settings.phoneNumber) {
      toast.error('Numéro de téléphone requis pour les alertes par message');
      return;
    }

    if (settings.sms && settings.phoneNumber) {
      if (!validatePhoneNumber(settings.phoneNumber)) {
        toast.error('Format de numéro invalide. Utilisez le format international (+33612345678)');
        return;
      }
    }

    const formattedSettings = {
      ...settings,
      phoneNumber: settings.phoneNumber ? formatPhoneNumber(settings.phoneNumber) : undefined
    };

    // Mettre à jour les métadonnées de l'utilisateur avec le numéro de téléphone
    if (user && formattedSettings.phoneNumber) {
      try {
        const { data, error } = await fetch('/api/update-user-phone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            phoneNumber: formattedSettings.phoneNumber
          })
        }).then(res => res.json());

        if (error) {
          console.error('Error updating user phone:', error);
          toast.error('Erreur lors de la mise à jour du numéro de téléphone');
        } else {
          console.log('User phone updated:', data);
        }
      } catch (error) {
        console.error('Error updating user phone:', error);
      }
    }

    onSave(formattedSettings);
    setIsOpen(false);
    toast.success('Paramètres de notification sauvegardés');
  };

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <Settings className="w-4 h-4 mr-2" />
        Notifications
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
      <Card className="w-full max-w-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-white">
            <Bell className="w-5 h-5 mr-2" />
            Paramètres de notification
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Email</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Notifications par email avec graphiques
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 mr-3 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Notifications Push</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Notifications dans le navigateur
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.push}
                  onChange={handlePushToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Messages Internationaux */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white flex items-center text-sm">
                    Messages
                    <span className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-bold flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      International
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Alertes par message dans 200+ pays
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sms}
                  onChange={(e) => setSettings(prev => ({ ...prev, sms: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.sms && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="font-medium">Configuration Messages Internationaux</span>
                </div>
                
                <div className="flex space-x-2">
                  {/* Country Code Selector */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountrySelector(!showCountrySelector)}
                      className="flex items-center px-3 py-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-sm min-w-[90px]"
                    >
                      <span className="mr-1">{selectedCountry.flag}</span>
                      <span className="mr-1">{selectedCountry.code}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showCountrySelector && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handleCountrySelect(country)}
                            className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                          >
                            <span className="mr-2">{country.flag}</span>
                            <span className="mr-2 font-mono">{country.code}</span>
                            <span className="text-gray-600 dark:text-gray-400">{country.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="612345678"
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {/* Test Button */}
                {settings.phoneNumber && (
                  <div className="flex justify-center">
                    <FreeSMSTestButton phoneNumber={`${selectedCountry.code}${settings.phoneNumber.replace(/^0+/, '')}`} />
                  </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm">
                    <Zap className="w-4 h-4 mr-2" />
                    Support International
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• <strong>Maroc :</strong> +212 6XXXXXXXX</li>
                    <li>• <strong>France :</strong> +33 6XXXXXXXX</li>
                    <li>• <strong>États-Unis :</strong> +1 XXXXXXXXXX</li>
                    <li>• <strong>200+ autres pays</strong> supportés</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Formats acceptés
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• International: <code>+33612345678</code></li>
                    <li>• France: <code>0612345678</code> (converti auto)</li>
                    <li>• Maroc: <code>+212612345678</code></li>
                    <li>• Autres pays: <code>+[code pays][numéro]</code></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Info Box International */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm">
              <Globe className="w-4 h-4 mr-2" />
              Alertes Mondiales
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Support dans 200+ pays</li>
              <li>• Notifications multi-canaux</li>
              <li>• Configuration simple</li>
              <li>• Ajout/modification à tout moment</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
            >
              Sauvegarder
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              variant="secondary"
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Bell, Shield, Globe, Save, Edit2, MessageSquare, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { FreeSMSTestButton } from './FreeSMSTestButton';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

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

export function UserSettings() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState({
    phoneNumber: user?.user_metadata?.phone_number || '',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    theme: 'dark'
  });
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Charger les données utilisateur au démarrage
  useEffect(() => {
    if (user) {
      console.log('User metadata:', user.user_metadata);
      // Mettre à jour le numéro de téléphone depuis les métadonnées utilisateur
      if (user.user_metadata?.phone_number) {
        setSettings(prev => ({
          ...prev,
          phoneNumber: user.user_metadata.phone_number,
          smsNotifications: true
        }));
      }
      
      // Charger les préférences utilisateur depuis la base de données
      loadUserPreferences();
    }
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
          phoneNumber: data.phone_number || prev.phoneNumber,
          emailNotifications: data.email_notifications,
          smsNotifications: data.sms_notifications,
          pushNotifications: data.push_notifications,
          theme: data.theme
        }));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Mettre à jour les préférences utilisateur
      const { error } = await supabase.from('user_preferences').upsert({
        user_id: user?.id,
        email_notifications: settings.emailNotifications,
        sms_notifications: settings.smsNotifications,
        push_notifications: settings.pushNotifications,
        theme: settings.theme,
        phone_number: settings.phoneNumber || null,
        updated_at: new Date().toISOString()
      });

      if (error) {
        console.error('Error saving preferences:', error);
        toast.error('Erreur lors de la sauvegarde des préférences');
        return;
      }

      // Mettre à jour les métadonnées utilisateur
      if (settings.phoneNumber) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { phone_number: settings.phoneNumber }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          toast.error('Erreur lors de la mise à jour du numéro de téléphone');
          return;
        }
      }

      toast.success('Paramètres sauvegardés avec succès');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handlePhoneUpdate = async () => {
    if (!settings.phoneNumber) {
      toast.error('Numéro de téléphone requis');
      return;
    }
    
    const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{8,15}$/;
    if (!phoneRegex.test(settings.phoneNumber)) {
      toast.error('Format de numéro invalide');
      return;
    }

    try {
      // Mettre à jour les métadonnées utilisateur
      const { error } = await supabase.auth.updateUser({
        data: { phone_number: settings.phoneNumber }
      });

      if (error) {
        console.error('Error updating phone number:', error);
        toast.error('Erreur lors de la mise à jour du numéro de téléphone');
        return;
      }

      // Mettre à jour également dans user_preferences
      const { error: prefError } = await supabase.from('user_preferences').upsert({
        user_id: user?.id,
        phone_number: settings.phoneNumber,
        updated_at: new Date().toISOString()
      });

      if (prefError) {
        console.error('Error updating preferences:', prefError);
      }

      toast.success('Numéro de téléphone mis à jour');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating phone:', error);
      toast.error('Une erreur est survenue');
    }
  };

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCountry(country);
    setShowCountrySelector(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Profil utilisateur
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Email</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">{user?.email}</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
              Vérifié
            </span>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center flex-1">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Téléphone</p>
                {isEditing ? (
                  <div className="flex items-center space-x-2 mt-2">
                    {/* Country Code Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountrySelector(!showCountrySelector)}
                        className="flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm min-w-[70px]"
                      >
                        <span className="mr-1">{selectedCountry.flag}</span>
                        <span className="text-xs">{selectedCountry.code}</span>
                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              <span className="mr-2 font-mono text-xs">{country.code}</span>
                              <span className="text-gray-600 dark:text-gray-400 text-xs">{country.country}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Input
                      type="tel"
                      value={settings.phoneNumber}
                      onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="612345678"
                      className="text-sm flex-1"
                    />
                    <Button onClick={handlePhoneUpdate} size="sm" className="text-xs px-2 py-1">
                      <Save className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {settings.phoneNumber || 'Non configuré'}
                    </p>
                    {settings.phoneNumber && (
                      <FreeSMSTestButton phoneNumber={settings.phoneNumber} />
                    )}
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Préférences de notification
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Notifications Email</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Alertes par email avec graphiques</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base flex items-center">
                  Messages Internationaux
                  <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-bold">
                    200+ pays
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Alertes par message (Maroc, France, etc.)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-3 text-purple-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Notifications Push</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Notifications dans le navigateur</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => setSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Sécurité & Confidentialité
          </h3>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2 text-sm sm:text-base">
              🔒 Compte sécurisé
            </h4>
            <ul className="text-xs sm:text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Authentification Supabase sécurisée</li>
              <li>• Données chiffrées en base</li>
              <li>• Numéros de téléphone protégés</li>
              <li>• Conformité RGPD</li>
            </ul>
          </div>

          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center text-sm sm:text-base">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Support International
            </h4>
            <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Messages dans 200+ pays</li>
              <li>• Notifications email mondiales</li>
              <li>• Interface multilingue</li>
              <li>• Support 24/7</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-primary-600 to-crypto-600 hover:from-primary-700 hover:to-crypto-700 text-sm sm:text-base"
        >
          <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Sauvegarder les paramètres
        </Button>
      </div>
    </div>
  );
}
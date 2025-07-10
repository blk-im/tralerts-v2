import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User, AlertCircle, ExternalLink, CheckCircle, ArrowLeft, Phone, Globe, ChevronDown } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onSubmit: (email: string, password: string, phoneNumber?: string) => Promise<void>;
  onNavigate: (view: 'landing' | 'signin' | 'signup') => void;
  loading: boolean;
  error: string | null;
  showConfirmation?: boolean;
  confirmationEmail?: string;
}

interface FormData {
  email: string;
  password: string;
  phoneNumber?: string;
  countryCode: string;
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

export function AuthForm({ 
  mode, 
  onSubmit, 
  onNavigate, 
  loading, 
  error, 
  showConfirmation = false,
  confirmationEmail = ''
}: AuthFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      countryCode: '+33'
    }
  });
  const [showSetupInstructions, setShowSetupInstructions] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [selectedCount, setSelectedCount] = useState(countryCodes[0]);
  const [wantsSMS, setWantsSMS] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const watchedPhoneNumber = watch('phoneNumber');

  const onFormSubmit = async (data: FormData) => {
    console.log('Form submitted with data:', data);
    if (data.email && data.password) {
      const fullPhoneNumber = wantsSMS && data.phoneNumber 
        ? `${data.countryCode}${data.phoneNumber.replace(/^0+/, '')}`
        : undefined;
      await onSubmit(data.email, data.password, fullPhoneNumber);
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return false;
    const phoneRegex = /^[0-9]{8,12}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '').replace(/^0+/, '');
    return phoneRegex.test(cleanPhone);
  };

  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    setSelectedCount(country);
    setShowCountrySelector(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      alert('Veuillez entrer votre adresse email');
      return;
    }

    try {
      // Utiliser la fonction Edge pour réinitialiser le mot de passe
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        alert(`Erreur: ${error.message}`);
      } else {
        setResetSent(true);
      }
    } catch (error) {
      console.error('Error sending reset password:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  // Check if we're using placeholder values
  const isUsingPlaceholder = !import.meta.env.VITE_SUPABASE_URL || 
                            import.meta.env.VITE_SUPABASE_URL?.includes('placeholder') ||
                            !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                            import.meta.env.VITE_SUPABASE_ANON_KEY?.includes('placeholder');

  if (isUsingPlaceholder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg animate-fade-in">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-xl mb-3 sm:mb-4 animate-pulse-crypto">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">TradingAlerts</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Configuration Supabase requise</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-lg font-semibold text-center flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2 text-warning-500" />
                Configuration nécessaire
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                <p className="text-warning-800 dark:text-warning-200 mb-3 text-sm">
                  Pour utiliser l'application, vous devez d'abord configurer Supabase.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium text-sm">Créer un projet Supabase</p>
                      <a 
                        href="https://supabase.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 inline-flex items-center text-xs"
                      >
                        Aller sur supabase.com <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium text-sm">Récupérer les clés API</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Settings → API → Project URL et anon public key</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <div className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium text-sm">Créer le fichier .env</p>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1 text-xs font-mono">
                        VITE_SUPABASE_URL=https://votre-projet.supabase.co<br/>
                        VITE_SUPABASE_ANON_KEY=votre-cle-anon
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowSetupInstructions(!showSetupInstructions)}
                variant="secondary"
                className="w-full text-sm"
                size="sm"
              >
                {showSetupInstructions ? 'Masquer' : 'Voir'} les instructions détaillées
              </Button>

              {showSetupInstructions && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-2 animate-slide-up">
                  <h3 className="font-semibold">Instructions complètes :</h3>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li>Créez un compte gratuit sur <a href="https://supabase.com" target="_blank" className="text-primary-600 hover:underline">supabase.com</a></li>
                    <li>Créez un nouveau projet</li>
                    <li>Allez dans Settings → API</li>
                    <li>Copiez le "Project URL" et "anon public key"</li>
                    <li>Créez un fichier .env à la racine du projet avec ces valeurs</li>
                    <li>Allez dans SQL Editor et exécutez le script de migration</li>
                    <li>Rechargez la page</li>
                  </ol>
                </div>
              )}

              <div className="text-center">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-primary-600 to-crypto-600 text-sm"
                  size="sm"
                >
                  Recharger après configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Confirmation email screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-success-500 to-success-600 rounded-xl mb-3 sm:mb-4 animate-pulse-crypto">
              <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Vérifiez votre email</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Email de confirmation envoyé
            </p>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6 text-center space-y-4">
              <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3 sm:p-4">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success-600 dark:text-success-400 mx-auto mb-3" />
                <h3 className="text-base sm:text-lg font-semibold text-success-800 dark:text-success-200 mb-2">
                  Email envoyé ! 🎉
                </h3>
                <p className="text-success-700 dark:text-success-300 text-sm mb-3">
                  Email de confirmation envoyé à :
                </p>
                <p className="font-medium text-success-800 dark:text-success-200 bg-success-100 dark:bg-success-900/30 rounded px-3 py-2 text-sm break-all">
                  {confirmationEmail}
                </p>
              </div>

              <div className="space-y-3 text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Étapes suivantes :</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>Ouvrez votre boîte email</li>
                  <li>Cherchez l'email de TradingAlerts</li>
                  <li>Cliquez sur le bouton de confirmation</li>
                  <li>Revenez ici et connectez-vous</li>
                </ol>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => onNavigate('signin')}
                  className="bg-gradient-to-r from-primary-600 to-crypto-600 text-sm"
                  size="sm"
                >
                  Aller à la connexion
                </Button>
                <Button
                  onClick={() => onNavigate('landing')}
                  variant="ghost"
                  className="flex items-center justify-center text-sm"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-3">
                <p className="mb-1">💡 <strong>Conseil :</strong></p>
                <p>L'email a un design professionnel avec votre numéro pré-configuré !</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Mot de passe oublié
  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mb-3 sm:mb-4 animate-pulse-crypto">
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">Mot de passe oublié</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nous vous enverrons un lien pour réinitialiser votre mot de passe
            </p>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {resetSent ? (
                <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4 text-center">
                  <CheckCircle className="w-10 h-10 text-success-600 dark:text-success-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-success-800 dark:text-success-200 mb-2">
                    Email envoyé !
                  </h3>
                  <p className="text-success-700 dark:text-success-300 mb-4">
                    Vérifiez votre boîte de réception pour les instructions de réinitialisation.
                  </p>
                  <Button
                    onClick={() => onNavigate('signin')}
                    className="bg-gradient-to-r from-primary-600 to-crypto-600"
                  >
                    Retour à la connexion
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-sm
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={handleForgotPassword}
                      className="bg-gradient-to-r from-primary-600 to-crypto-600"
                    >
                      Envoyer les instructions
                    </Button>
                    <Button
                      onClick={() => {
                        setForgotPassword(false);
                        setResetEmail('');
                      }}
                      variant="ghost"
                      className="flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour à la connexion
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-xl mb-3 sm:mb-4 animate-pulse-crypto">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">TradingAlerts</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'signin' ? 'Connectez-vous à votre compte' : 'Créez votre compte avec alertes'}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {mode === 'signin' ? 'Connexion' : 'Inscription'}
              </h2>
              <Button
                onClick={() => onNavigate('landing')}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4" noValidate>
              {error && (
                <div className="flex items-center p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg animate-slide-up">
                  <AlertCircle className="w-4 h-4 text-error-500 mr-2 flex-shrink-0" />
                  <span className="text-sm text-error-700 dark:text-error-300">{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    {...register('email', {
                      required: 'Email requis',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email invalide',
                      },
                    })}
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    className={`
                      w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      disabled:bg-gray-50 disabled:text-gray-500
                      transition-colors duration-200
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      ${errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-error-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    {...register('password', {
                      required: 'Mot de passe requis',
                      minLength: {
                        value: 6,
                        message: 'Au moins 6 caractères',
                      },
                    })}
                    id="password"
                    type="password"
                    placeholder="Mot de passe"
                    className={`
                      w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      disabled:bg-gray-50 disabled:text-gray-500
                      transition-colors duration-200
                      bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                      ${errors.password ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-error-500">{errors.password.message}</p>
                )}
                {mode === 'signup' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Minimum 6 caractères
                  </p>
                )}
                {mode === 'signin' && (
                  <p className="text-xs text-right">
                    <button 
                      type="button" 
                      onClick={() => setForgotPassword(true)}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Mot de passe oublié ?
                    </button>
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                        Alertes Internationales
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                      Recevez vos alertes par email + notifications. Ajoutez optionnellement votre numéro pour les alertes par message.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="wantsSMS"
                          checked={wantsSMS}
                          onChange={(e) => setWantsSMS(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="wantsSMS" className="ml-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                          Ajouter mon numéro pour les alertes par message (optionnel)
                        </label>
                      </div>
                      
                      {wantsSMS && (
                        <div className="space-y-2 animate-slide-up">
                          <label className="block text-sm font-medium text-blue-800 dark:text-blue-200">
                            Numéro de téléphone
                          </label>
                          
                          <div className="flex space-x-2">
                            {/* Country Code Selector */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCountrySelector(!showCountrySelector)}
                                className="flex items-center px-3 py-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-800 text-sm min-w-[90px]"
                              >
                                <span className="mr-1">{selectedCount.flag}</span>
                                <span className="mr-1">{selectedCount.code}</span>
                                <ChevronDown className="w-3 h-3" />
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
                            <div className="flex-1 relative">
                              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <input
                                {...register('phoneNumber', {
                                  validate: (value) => {
                                    if (!wantsSMS || !value) return true;
                                    return validatePhoneNumber(value) || 'Format invalide (ex: 612345678)';
                                  },
                                })}
                                {...register('countryCode', { value: selectedCount.code })}
                                type="tel"
                                placeholder="612345678"
                                className={`
                                  w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm text-sm
                                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                  transition-colors duration-200
                                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                  ${errors.phoneNumber ? 'border-error-500' : 'border-blue-300 dark:border-blue-600'}
                                `}
                                autoComplete="tel"
                              />
                            </div>
                          </div>
                          
                          {errors.phoneNumber && (
                            <p className="text-xs text-error-500">{errors.phoneNumber.message}</p>
                          )}
                          
                          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                            <p>📱 <strong>Avec numéro :</strong> Email + Notifications + Messages (France, Maroc, etc.)</p>
                            <p>📧 <strong>Sans numéro :</strong> Email + Notifications uniquement</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary-600 to-crypto-600 hover:from-primary-700 hover:to-crypto-700 py-3 text-sm"
                loading={loading}
                disabled={loading}
              >
                {mode === 'signin' ? 'Se connecter' : "S'inscrire"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => onNavigate(mode === 'signin' ? 'signup' : 'signin')}
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors text-sm"
                disabled={loading}
              >
                {mode === 'signin' 
                  ? "Pas de compte ? S'inscrire" 
                  : 'Déjà un compte ? Se connecter'
                }
              </button>
            </div>

            {mode === 'signup' && (
              <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded p-3">
                <p className="mb-1">✨ <strong>Inclus :</strong></p>
                <ul className="space-y-1">
                  <li>• Email de confirmation avec design professionnel</li>
                  <li>• Alertes crypto et bourse temps réel</li>
                  <li>• Notifications multi-canaux</li>
                  <li>• Support international (200+ pays)</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
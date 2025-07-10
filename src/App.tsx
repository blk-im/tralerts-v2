import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AuthForm } from './components/auth/AuthForm';
import { Dashboard } from './components/dashbord/Dashboard';
import { PaymentPage } from './components/payment/PaymentPage';
import { PaymentSuccess } from './components/payment/PaymentSuccess';
import { AdminPanel } from './components/admin/AdminPanel';
import { useAuth } from './hooks/useAuth';
import { usePayment } from './hooks/usePayment';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const { showPayment, showSuccess, selectedPlan, openPayment, closePayment, handlePaymentSuccess } = usePayment();
  const [currentView, setCurrentView] = useState<'landing' | 'signin' | 'signup' | 'dashboard' | 'admin'>('landing');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const handleAuth = async (email: string, password: string, phoneNumber?: string) => {
    console.log('Auth attempt:', { email, password: '***', phoneNumber, mode: currentView });
    
    if (!email || !password) {
      setAuthError('Email et mot de passe requis');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      const { data, error } = currentView === 'signin' 
        ? await signIn(email, password)
        : await signUp(email, password, phoneNumber);

      if (error) {
        console.error('Auth error:', error);
        let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email';
        } else if (error.message.includes('Password should be at least 6 characters')) {
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
        } else if (error.message.includes('Unable to validate email address')) {
          errorMessage = 'Adresse email invalide';
        }
        
        setAuthError(errorMessage);
      } else {
        console.log('Auth successful');
        
        // Si c'est une inscription, montrer le message de confirmation
        if (currentView === 'signup' && data?.user && !data.session) {
          setConfirmationEmail(email);
          setShowConfirmation(true);
        } else if (data?.session) {
          // Si connexion réussie, aller au dashboard
          setCurrentView('dashboard');
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setAuthError('Une erreur inattendue est survenue');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleViewChange = (view: 'landing' | 'signin' | 'signup' | 'admin') => {
    setCurrentView(view);
    setAuthError(null);
    setShowConfirmation(false);
  };

  const handleGoHome = () => {
    setCurrentView('landing');
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
  };

  const handlePremiumUpgrade = (plan?: any) => {
    openPayment(plan);
  };

  const handlePaymentComplete = () => {
    handlePaymentSuccess();
  };

  const handleContinueToDashboard = () => {
    closePayment();
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-crypto-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-primary-600 to-crypto-600 rounded-xl animate-pulse-crypto flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Chargement...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Afficher le panel admin
  if (currentView === 'admin') {
    return (
      <ThemeProvider>
        <NotificationProvider>
          <AdminPanel />
        </NotificationProvider>
      </ThemeProvider>
    );
  }

  // Afficher la page de paiement
  if (showPayment) {
    return (
      <ThemeProvider>
        <NotificationProvider>
          <PaymentPage
            selectedPlan={selectedPlan}
            onBack={closePayment}
            onSuccess={handlePaymentComplete}
          />
        </NotificationProvider>
      </ThemeProvider>
    );
  }

  // Afficher la page de succès
  if (showSuccess) {
    return (
      <ThemeProvider>
        <NotificationProvider>
          <PaymentSuccess
            plan={selectedPlan}
            onContinue={handleContinueToDashboard}
          />
        </NotificationProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NotificationProvider>
        {!user || currentView === 'landing' ? (
          currentView === 'landing' ? (
            <LandingPage 
              onNavigate={handleViewChange}
              onPremiumUpgrade={handlePremiumUpgrade}
            />
          ) : (
            <AuthForm
              mode={currentView as 'signin' | 'signup'}
              onSubmit={handleAuth}
              onNavigate={handleViewChange}
              loading={authLoading}
              error={authError}
              showConfirmation={showConfirmation}
              confirmationEmail={confirmationEmail}
            />
          )
        ) : (
          <Dashboard 
            onGoHome={handleGoHome} 
            onSignOut={handleSignOut}
            onPremiumUpgrade={handlePremiumUpgrade}
          />
        )}
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFreeSMS } from '../../hooks/useFreeSMS';
import toast from 'react-hot-toast';

interface FreeSMSTestButtonProps {
  phoneNumber: string;
  disabled?: boolean;
}

export function FreeSMSTestButton({ phoneNumber, disabled = false }: FreeSMSTestButtonProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const { testFreeSMS, loading } = useFreeSMS();

  const handleTestSMS = async () => {
    if (!phoneNumber) {
      toast.error('Numéro de téléphone requis');
      return;
    }

    setTestStatus('sending');
    
    try {
      // Vérifier si la fonction Edge est disponible
      if (typeof supabase.functions.invoke !== 'function') {
        toast.error('Service SMS non disponible - Configuration Supabase requise');
        setTestStatus('error');
        setTimeout(() => setTestStatus('idle'), 4000);
        return;
      }
      
      // Tester l'envoi de SMS
      const result = await testFreeSMS(phoneNumber);
      
      if (result.success) {
        setTestStatus('success');
        toast.success(`Message de test envoyé à ${phoneNumber} ! 🎉`);
        
        setTimeout(() => setTestStatus('idle'), 4000);
      } else if (result.fallback) {
        setTestStatus('success');
        toast('Messages temporairement indisponibles, notification par email envoyée', { icon: '📧' });
        
        setTimeout(() => setTestStatus('idle'), 4000);
      } else {
        setTestStatus('error');
        toast.error(`Erreur lors de l'envoi: ${result.error}`);
        
        setTimeout(() => setTestStatus('idle'), 4000);
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('Erreur lors de l\'envoi du message de test');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  const getButtonContent = () => {
    switch (testStatus) {
      case 'sending':
        return (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
            Envoi...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Envoyé !
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur
          </>
        );
      default:
        return (
          <>
            <Globe className="w-3 h-3 mr-1" />
            Test International
          </>
        );
    }
  };

  const getButtonClass = () => {
    switch (testStatus) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700';
    }
  };

  return (
    <Button
      onClick={handleTestSMS}
      disabled={disabled || loading || !phoneNumber}
      className={`${getButtonClass()} text-white transition-all duration-200 text-xs px-3 py-1`}
      size="sm"
    >
      {getButtonContent()}
    </Button>
  );
}
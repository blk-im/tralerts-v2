import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useSMS } from '../../hooks/useSMS';
import toast from 'react-hot-toast';

interface SMSTestButtonProps {
  phoneNumber: string;
  disabled?: boolean;
}

export function SMSTestButton({ phoneNumber, disabled = false }: SMSTestButtonProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const { testSMS, loading } = useSMS();

  const handleTestSMS = async () => {
    if (!phoneNumber) {
      toast.error('Numéro de téléphone requis');
      return;
    }

    setTestStatus('sending');
    
    try {
      const result = await testSMS(phoneNumber);
      
      if (result.success) {
        setTestStatus('success');
        toast.success(`SMS de test envoyé à ${phoneNumber} !`);
        
        // Reset status after 3 seconds
        setTimeout(() => setTestStatus('idle'), 3000);
      } else {
        setTestStatus('error');
        toast.error(`Erreur SMS: ${result.error}`);
        
        // Reset status after 3 seconds
        setTimeout(() => setTestStatus('idle'), 3000);
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('Erreur lors de l\'envoi du SMS de test');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const getButtonContent = () => {
    switch (testStatus) {
      case 'sending':
        return (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Envoi...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Envoyé !
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            Erreur
          </>
        );
      default:
        return (
          <>
            <Send className="w-4 h-4 mr-2" />
            Tester SMS
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
        return 'bg-purple-600 hover:bg-purple-700';
    }
  };

  return (
    <Button
      onClick={handleTestSMS}
      disabled={disabled || loading || !phoneNumber}
      className={`${getButtonClass()} text-white transition-colors duration-200`}
      size="sm"
    >
      {getButtonContent()}
    </Button>
  );
}
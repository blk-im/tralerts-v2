import { useState } from 'react';

interface PaymentHook {
  showPayment: boolean;
  showSuccess: boolean;
  selectedPlan: any;
  openPayment: (plan?: any) => void;
  closePayment: () => void;
  handlePaymentSuccess: () => void;
  goBackToPayment: () => void;
}

export function usePayment(): PaymentHook {
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const openPayment = (plan?: any) => {
    setSelectedPlan(plan);
    setShowPayment(true);
    setShowSuccess(false);
  };

  const closePayment = () => {
    setShowPayment(false);
    setShowSuccess(false);
    setSelectedPlan(null);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setShowSuccess(true);
  };

  const goBackToPayment = () => {
    setShowSuccess(false);
    setShowPayment(true);
  };

  return {
    showPayment,
    showSuccess,
    selectedPlan,
    openPayment,
    closePayment,
    handlePaymentSuccess,
    goBackToPayment
  };
}
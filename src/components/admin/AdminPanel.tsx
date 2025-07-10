import React, { useState } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { useAuth } from '../../hooks/useAuth';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useAuth();

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Vérifier si l'utilisateur est déjà authentifié
  if (user && user.email === 'admin@tradingalerts.com') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
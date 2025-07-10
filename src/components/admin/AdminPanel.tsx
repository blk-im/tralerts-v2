import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est un administrateur
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        // Vérifier si l'utilisateur est admin@tradingalerts.com
        if (user.email === 'admin@tradingalerts.com') {
          setIsAdmin(true);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // Vérifier dans la base de données
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else if (data) {
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Chargement du panel administrateur...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est déjà authentifié comme admin
  if (isAdmin) {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
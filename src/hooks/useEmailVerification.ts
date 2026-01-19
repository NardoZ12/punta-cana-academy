'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  email?: string;
  email_confirmed_at?: string;
}

export function useEmailVerification() {
  const [user, setUser] = useState<User | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);

  const checkVerificationStatus = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        setIsVerified(!!user.email_confirmed_at);
      } else {
        setUser(null);
        setIsVerified(true); // Si no hay usuario, no mostrar banner
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(true); // En caso de error, no mostrar banner
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email?: string) => {
    if (!email && !user?.email) {
      throw new Error('Email requerido');
    }

    const emailToUse = email || user?.email;
    const supabase = createClient();
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailToUse!,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      throw error;
    }
  };

  useEffect(() => {
    checkVerificationStatus();

    // Escuchar cambios en la autenticación
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkVerificationStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isVerified,
    isLoading,
    resendVerificationEmail,
    refreshStatus: checkVerificationStatus
  };
}
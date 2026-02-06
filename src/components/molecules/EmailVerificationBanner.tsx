'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { createClient } from '@/utils/supabase/client';

function EmailVerificationBannerContent() {
  const { user, isVerified, isLoading, resendVerificationEmail } = useEmailVerification();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Agregar clase al body cuando el banner esté visible
    if (user && !isVerified && !isDismissed && !isLoading) {
      document.body.classList.add('body-with-banner');
    } else {
      document.body.classList.remove('body-with-banner');
    }
    
    // Mostrar mensaje de bienvenida si viene del callback de verificación
    const verified = searchParams.get('verified');
    if (verified === 'true' && isVerified) {
      setShowWelcome(true);
      // Ocultar después de 6 segundos
      setTimeout(() => setShowWelcome(false), 6000);
    }
    
    return () => {
      document.body.classList.remove('body-with-banner');
    };
  }, [user, isVerified, isDismissed, isLoading, searchParams]);

  const handleResendEmail = async () => {
    setResending(true);
    try {
      if (resendVerificationEmail) {
        await resendVerificationEmail();
        alert('¡Email de verificación reenviado! Revisa tu bandeja de entrada.');
      } else {
        // Fallback si no existe la función en el hook
        const supabase = createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser?.email) {
          await supabase.auth.resend({
            type: 'signup',
            email: currentUser.email
          });
          alert('¡Email de verificación reenviado! Revisa tu bandeja de entrada.');
        }
      }
    } catch (error) {
      alert('Error al reenviar el email. Intenta de nuevo más tarde.');
    } finally {
      setResending(false);
    }
  };

  // Mensaje de bienvenida tras verificar email
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 p-8 rounded-2xl shadow-2xl text-center max-w-md mx-4 animate-in border border-green-500/30">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-5xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            ¡Gracias por ser parte de nuestra Familia!
          </h2>
          <p className="text-green-200 mb-6 text-lg">
            Tu correo ha sido verificado exitosamente. Ya puedes disfrutar de todas las funcionalidades de Punta Cana Academy.
          </p>
          <button
            onClick={() => setShowWelcome(false)}
            className="bg-white text-green-800 font-bold px-8 py-3 rounded-xl hover:bg-green-100 transition-all transform hover:scale-105 shadow-lg"
          >
            ¡Comenzar! 🚀
          </button>
        </div>
      </div>
    );
  }

  // No mostrar banner si está cargando, no hay usuario, el email ya está verificado, o fue dismisseado
  if (isLoading || !user || isVerified || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white p-3 shadow-lg z-50 email-verification-banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        
        {/* Contenido principal */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm font-bold text-white">
              ⚠️ Debes confirmar tu correo electrónico
            </p>
            <p className="text-xs text-red-100">
              Revisa tu bandeja de entrada ({user.email})
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleResendEmail}
            disabled={resending}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {resending ? 'Enviando...' : 'Reenviar email'}
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white hover:text-gray-200 transition-colors ml-2 p-1"
            aria-label="Cerrar notificación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmailVerificationBanner() {
  return (
    <Suspense fallback={null}>
      <EmailVerificationBannerContent />
    </Suspense>
  );
}

export default EmailVerificationBanner;
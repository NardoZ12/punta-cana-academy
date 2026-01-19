'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/atoms/Button';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export default function VerifyEmailPage() {
  const { user, isVerified, resendVerificationEmail } = useEmailVerification();
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // Obtener el email de los parámetros de URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    // Contador para el reenvío
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResendVerification = async () => {
    if (!email) {
      setMessage('Por favor, ingresa tu correo electrónico');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      await resendVerificationEmail(email);
      setMessage('¡Email de verificación reenviado con éxito!');
      setCountdown(60); // 60 segundos de espera
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
    
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-pca-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-white tracking-wider mb-6 inline-block">
          PCA
        </Link>
        
        {/* Icono de Email */}
        <div className="mx-auto w-16 h-16 bg-pca-blue/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-pca-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-4">
          Verifica tu email
        </h2>
        
        <div className="text-gray-300 space-y-4">
          <p>
            Hemos enviado un enlace de verificación a tu correo electrónico.
          </p>
          <p className="text-sm">
            Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-800">
          
          {/* Pasos a seguir */}
          <div className="space-y-6">
            
            <div className="bg-blue-500/10 border border-blue-500 text-blue-300 text-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Instrucciones:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Revisa tu bandeja de entrada</li>
                <li>Busca un email de "Punta Cana Academy"</li>
                <li>Haz clic en "Confirmar email"</li>
                <li>Regresa para iniciar sesión</li>
              </ol>
            </div>

            {/* Reenviar verificación */}
            <div className="space-y-4">
              <p className="text-sm text-gray-400 text-center">
                ¿No recibiste el email?
              </p>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Tu correo electrónico:
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="appearance-none block w-full px-3 py-3 border border-gray-700 rounded-md shadow-sm placeholder-gray-500 bg-gray-800 text-white focus:outline-none focus:ring-pca-blue focus:border-pca-blue sm:text-sm"
                />
              </div>

              <Button
                variant="outline"
                fullWidth
                onClick={handleResendVerification}
                disabled={isResending || countdown > 0}
              >
                {isResending 
                  ? 'Reenviando...' 
                  : countdown > 0 
                    ? `Reenviar en ${countdown}s`
                    : 'Reenviar email de verificación'
                }
              </Button>

              {message && (
                <div className={`text-sm p-3 rounded ${
                  message.includes('Error') 
                    ? 'bg-red-500/10 border border-red-500 text-red-400'
                    : 'bg-green-500/10 border border-green-500 text-green-400'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Enlaces de navegación */}
            <div className="pt-6 border-t border-gray-700 space-y-3">
              <Link href="/login">
                <Button variant="primary" fullWidth>
                  Ya verificé mi email - Iniciar sesión
                </Button>
              </Link>
              
              <p className="text-center">
                <Link 
                  href="/" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
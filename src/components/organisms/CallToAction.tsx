// src/components/organisms/CallToAction.tsx
'use client';

import Link from 'next/link'; // Importar Link
import { Button } from '../atoms/Button';

export const CallToAction = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Fondo con gradiente azulado */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-pca-black z-0"></div>
      
      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          ¿Listo para transformar tu futuro?
        </h2>
        <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
          No importa si buscas mejorar tu inglés para un ascenso o aprender a programar. 
          Tu primera clase de prueba es totalmente gratis.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          
          {/* AQUÍ ESTÁ EL CAMBIO: Envolvemos el botón */}
          <Link href="/registro">
            <Button variant="primary">
              Inscribirme Ahora
            </Button>
          </Link>

          <Button variant="outline" onClick={() => console.log('WhatsApp')}>
            Contactar por WhatsApp
          </Button>
        </div>
      </div>
    </section>
  );
};
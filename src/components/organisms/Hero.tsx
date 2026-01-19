// src/components/organisms/Hero.tsx
'use client';

import Link from 'next/link';
import { Button } from '../atoms/Button';
import { motion } from 'framer-motion';

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-cyan-900 overflow-hidden">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 z-0">
        {/* Círculos flotantes */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          
          {/* Logo/Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-white">Punta Cana</span>{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Academy
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
          >
            Impulsa tu carrera en <span className="text-cyan-400 font-semibold">Punta Cana</span> con cursos 
            de <span className="text-cyan-400 font-semibold">inglés</span>, <span className="text-cyan-400 font-semibold">programación</span> y <span className="text-cyan-400 font-semibold">francés</span> diseñados para la industria turística dominicana
          </motion.p>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 text-gray-400 text-sm md:text-base"
          >
            <div className="flex items-center gap-2">
              ✅ <span>100% Gratuito</span>
            </div>
            <div className="flex items-center gap-2">
              🏨 <span>Enfoque en Turismo</span>
            </div>
            <div className="flex items-center gap-2">
              💻 <span>Modalidad Híbrida</span>
            </div>
            <div className="flex items-center gap-2">
              📜 <span>Certificación</span>
            </div>
          </motion.div>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4 pt-8"
          >
            <Link href="/registro">
              <Button variant="primary" fullWidth={false}>
                🚀 Inscríbete Gratis
              </Button>
            </Link>
            
            <Link href="/cursos">
              <Button variant="outline" fullWidth={false}>
                📚 Ver Cursos
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 max-w-3xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400">500+</div>
              <div className="text-gray-400 text-sm">Estudiantes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400">95%</div>
              <div className="text-gray-400 text-sm">Satisfacción</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400">24/7</div>
              <div className="text-gray-400 text-sm">Soporte</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-cyan-400">100%</div>
              <div className="text-gray-400 text-sm">Gratis</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
// src/components/organisms/Features.tsx
'use client'; // Necesario para Framer Motion

import React from 'react';
import { motion } from 'framer-motion'; // <--- Importamos la magia

const features = [
  {
    title: "Modelo Híbrido Flexible",
    description: "Tú decides cómo aprender. Asiste a clases presenciales en nuestro campus de Friusa o conéctate en vivo desde cualquier lugar.",
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  {
    title: "Tecnología e Innovación",
    description: "No es la típica escuela de idiomas. Utilizamos IA, apps móviles y herramientas digitales para acelerar tu aprendizaje.",
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Certificación Profesional",
    description: "Al completar tus niveles, obtienes certificaciones validadas que impulsarán tu currículum en el sector turístico y empresarial.",
    icon: (
      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-black relative overflow-hidden">
      {/* Fondo sutil */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
         <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        
        {/* TÍTULO SIMPLE SIN ANIMACIÓN PROBLEMÁTICA */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Por qué <span className="text-cyan-400">Punta Cana Academy?</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Diseñamos una experiencia educativa adaptada a tu estilo de vida y a las demandas del mercado laboral actual.
          </p>
        </motion.div>

        {/* GRID DE TARJETAS CON ANIMACIÓN SIMPLE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/10 hover:-translate-y-1 relative"
            >
              {/* ÍCONO CON EFECTO SIMPLE */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
                viewport={{ once: true }}
                className="w-14 h-14 bg-cyan-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-cyan-500/20 relative z-10"
              >
                {feature.icon}
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
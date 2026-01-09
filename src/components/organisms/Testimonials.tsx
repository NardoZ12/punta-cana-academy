// src/components/organisms/Testimonials.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: "Carlos Rodriguez",
    role: "Recepción en Hotel Riu",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    quote: "Gracias a las clases intensivos de inglés, pude ascender a Supervisor de Recepción en solo 6 meses. La modalidad híbrida fue clave para mí."
  },
  {
    name: "Sarah Johnson",
    role: "Digital Nomad en Bávaro",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    quote: "I needed a place to learn Spanish and network with locals. Punta Cana Academy gave me both: great tech courses and an amazing community."
  },
  {
    name: "Miguel Ángel",
    role: "Estudiante de Software",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    quote: "El Bootcamp de Desarrollo Web cambió mi vida. Ahora trabajo remoto desde casa ganando en dólares. ¡100% recomendado!"
  }
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Lo que dicen nuestros <span className="text-pca-blue">Estudiantes</span>
          </h2>
          <p className="text-gray-400">Historias reales de crecimiento en Punta Cana.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-pca-black p-8 rounded-2xl border border-gray-800 relative"
            >
              {/* Comillas decorativas */}
              <div className="text-pca-blue text-6xl absolute top-4 left-4 opacity-20 font-serif">"</div>
              
              <p className="text-gray-300 mb-6 relative z-10 italic">
                "{item.quote}"
              </p>
              
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-pca-blue">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{item.name}</h4>
                  <p className="text-pca-blue text-xs">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
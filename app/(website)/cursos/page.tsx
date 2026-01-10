// src/app/(website)/cursos/page.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CourseCard } from '@/components/molecules/CourseCard';
import { Button } from '@/components/atoms/Button';

// Usamos los mismos datos por ahora (luego vendrán de la Base de Datos)
const allCourses = [
  {
    slug: 'ingles-intensivo',
    title: "Inglés Intensivo para el Trabajo",
    category: "Idiomas",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop", 
    mode: "Híbrido" as const, // "as const" es un truco de TypeScript para textos fijos
    level: "Principiante - Avanzado",
    price: "$49 USD/mes"
  },
  {
    slug: 'desarrollo-web',
    title: "Desarrollo Web Full Stack",
    category: "Tecnología",
    image: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop",
    mode: "Online" as const,
    level: "Bootcamp",
    price: "$199 USD"
  },
  {
    slug: 'frances-hoteleria', // Agregué un slug para que no de error
    title: "Francés para Hotelería",
    category: "Idiomas",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    mode: "Presencial" as const,
    level: "Intermedio",
    price: "$59 USD/mes"
  }
];

export default function CoursesPage() {
  return (
    <main className="min-h-screen bg-pca-black pt-10 pb-20">
      
      {/* ENCABEZADO DE LA PÁGINA */}
      <section className="text-center px-4 mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          Nuestros <span className="text-pca-blue">Programas</span>
        </motion.h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Descubre la oferta académica diseñada para impulsar tu carrera en Punta Cana y el mundo.
        </p>
      </section>

      {/* FILTROS (Visuales por ahora) */}
      <div className="max-w-7xl mx-auto px-4 mb-12 flex justify-center gap-4 flex-wrap">
        {['Todos', 'Idiomas', 'Tecnología', 'Híbrido', 'Online'].map((filter, idx) => (
          <button 
            key={idx}
            className={`px-6 py-2 rounded-full border transition-all ${
              idx === 0 
                ? 'bg-pca-blue border-pca-blue text-white' 
                : 'bg-transparent border-gray-700 text-gray-400 hover:border-pca-blue hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* GRID DE CURSOS */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allCourses.map((course, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            {/* NOTA: Tu componente CourseCard original no tenía el Link envolvente dentro.
               Aquí lo envolvemos manualmente para que toda la tarjeta sea cliqueable,
               o solo el botón, dependiendo de tu gusto. 
               Para este ejemplo, envolvemos el botón "Ver Detalles" dentro de la Card.
            */}
            <div className="h-full flex flex-col">
               {/* IMPORTANTE: Si CourseCard no acepta onClick o Link interno, 
                  necesitas modificar CourseCard o envolverlo aquí.
                  Vamos a asumir que modificamos CourseCard ligeramente o lo usamos así:
               */}
               <div className="relative group h-full">
                 <CourseCard {...course} />
                 
                 {/* Parche visual: Un Link absoluto invisible para hacer click en toda la tarjeta */}
                 <Link href={`/cursos/${course.slug}`} className="absolute inset-0 z-10" />
               </div>
            </div>
          </motion.div>
        ))}
      </div>

    </main>
  );
}
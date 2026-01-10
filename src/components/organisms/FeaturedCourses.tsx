// src/components/organisms/FeaturedCourses.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CourseCard } from '../molecules/CourseCard';
import { Button } from '../atoms/Button';

// DATOS DE EJEMPLO (Basados en tu Blueprint)
const courses = [
  {
    slug: 'ingles-intensivo',
    title: "Inglés Intensivo para el Trabajo",
    category: "Idiomas",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop", 
    mode: "Híbrido" as const,
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
    slug: 'frances-hoteleria',
    title: "Francés para Hotelería",
    category: "Idiomas",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    mode: "Presencial" as const,
    level: "Intermedio",
    price: "$59 USD/mes"
  }
];

export const FeaturedCourses = () => {
  return (
    <section className="py-24 bg-pca-black">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Encabezado de sección */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 relative">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Explora nuestros <span className="text-pca-blue">Cursos Populares</span>
            </h2>
            <p className="text-gray-400">Fórmate con los mejores estándares internacionales.</p>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="relative z-20 touch-auto"
          >
            <Link href="/cursos">
              <Button variant="secondary">Ver todos los cursos</Button>
            </Link>
          </motion.div>
        </div>

        {/* Grid de Cursos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }} // Efecto cascada simple
            >
              <CourseCard {...course} />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
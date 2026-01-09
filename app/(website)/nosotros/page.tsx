// app/nosotros/page.tsx
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="bg-pca-black min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative h-[60vh] flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600" // Foto de equipo/estudiantes
            alt="Equipo Punta Cana Academy" 
            fill 
            className="object-cover opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-pca-black/50 via-pca-black/80 to-pca-black" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6"
          >
            Formando el futuro de <br/>
            <span className="text-pca-blue">Punta Cana</span>
          </motion.h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Somos más que una academia. Somos el puente entre el talento local y las oportunidades globales.
          </p>
        </div>
      </section>

      {/* 2. NUESTRA HISTORIA / MISIÓN */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold text-white">
              Nuestra Misión
            </h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              Nacimos en el corazón de Bávaro con un objetivo claro: empoderar a nuestra comunidad. 
              Sabemos que el turismo y la tecnología son los motores de nuestra economía, y creemos que 
              cada persona en Friusa, Verón y Punta Cana merece acceso a educación de primera calidad sin tener que irse a la capital.
            </p>
            <p className="text-gray-400 leading-relaxed text-lg">
              Combinamos la calidez de las clases presenciales con la potencia de la tecnología educativa moderna.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-96 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl"
          >
            <Image 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800" 
              alt="Clase presencial" 
              fill 
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* 3. EL EQUIPO (Team) */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Conoce a tus Mentores</h2>
          <p className="text-gray-400">Profesionales apasionados por enseñar.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Nardo Zorrilla", role: "Director & Fundador", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400" },
            { name: "Ana Martínez", role: "Head Teacher Inglés", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400" },
            { name: "David Chen", role: "Lead Instructor Tech", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400" }
          ].map((member, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="bg-pca-black p-6 rounded-xl border border-gray-800 text-center hover:border-pca-blue/50 transition-colors"
            >
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden mb-4 border-2 border-pca-blue relative">
                <Image src={member.img} alt={member.name} fill className="object-cover" />
              </div>
              <h3 className="text-xl font-bold text-white">{member.name}</h3>
              <p className="text-pca-blue text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. CTA FINAL */}
      <section className="py-20 text-center px-4">
        <h2 className="text-3xl font-bold text-white mb-8">¿Te unes a nosotros?</h2>
        <div className="flex justify-center gap-4">
          <Link href="/contacto">
            <Button variant="primary">Contáctanos</Button>
          </Link>
          <Link href="/#cursos">
            <Button variant="outline">Ver Cursos</Button>
          </Link>
        </div>
      </section>

    </main>
  );
}
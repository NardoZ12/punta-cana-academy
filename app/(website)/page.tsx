'use client';
import { Button } from '../../src/components/atoms/Button';
import { Features } from '../../src/components/organisms/Features';
import { FeaturedCourses } from '../../src/components/organisms/FeaturedCourses';
import { Testimonials } from '../../src/components/organisms/Testimonials'; // <--- Nuevo
import { CallToAction } from '../../src/components/organisms/CallToAction'; // <--- Nuevo
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      {/* SECCIÓN HERO (La portada) */}
      <main className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 text-center">
        
        {/* Logo PCA encima del título */}
        <div className="mb-8">
          <Image 
            src="/images/logos/logo-pca.png" 
            alt="Punta Cana Academy Logo" 
            width={180} 
            height={100}
            className="object-contain"
          />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Domina un nuevo idioma en <br />
          <span className="text-cyan-400">Punta Cana</span>
        </h1>
        
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mb-10">
          La academia más moderna del Caribe. Clases presenciales en Friusa y plataforma online accesible desde cualquier lugar.
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-20"> {/* Añadí margen inferior mb-20 */}
          
          {/* Botón Empezar Ahora -> Registro */}
          <Link href="/registro">
            <Button variant="primary">Empezar Ahora</Button>
          </Link>
          
          {/* Botón Ver Planes -> Página de Cursos */}
          <Link href="/cursos">
            <Button variant="outline">Ver Planes</Button>
          </Link>

        </div>
      </main>

      {/* SECCIÓN FEATURES (Características) */}
      <Features />

      {/* SECCIÓN CURSOS DESTACADOS */}
      <FeaturedCourses />
      
      {/* SECCIÓN TESTIMONIOS */}
      <Testimonials />

      {/* SECCIÓN CTA FINAL */}
      <CallToAction />
    </>
  );
}
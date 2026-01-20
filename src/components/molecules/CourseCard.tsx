// src/components/molecules/CourseCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../atoms/Button';

interface CourseCardProps {
  slug: string;
  title: string;
  category: string;
  image: string; // URL de la imagen
  mode: 'Presencial' | 'Online' | 'Híbrido';
  level: string;
  price: string;
}

export const CourseCard = ({ slug, title, category, image, mode, level, price }: CourseCardProps) => {
  return (
    <div className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-pca-blue/50 transition-all duration-300 hover:shadow-xl hover:shadow-pca-blue/10 flex flex-col h-full">
      
      {/* 1. IMAGEN DEL CURSO */}
      <div className="relative h-48 w-full overflow-hidden">
        {/* Usamos un div con color de fondo por si la imagen falla, o un gradiente bonito */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-pca-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {category}
          </span>
        </div>
      </div>

      {/* 2. CONTENIDO */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-pca-blue transition-colors">
            {title}
          </h3>
        </div>
        
        {/* Detalles pequeños (Iconos) */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            {mode}
          </div>
          <div className="flex items-center gap-1">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            {level}
          </div>
        </div>

        {/* Precio y Botón (Empujados al fondo) */}
        <div className="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Precio</span>
            <span className="text-lg font-bold text-green-400">Acceso Gratuito 🎉</span>
          </div>
          <Link href={`/cursos/${slug}`}>
            <Button variant="outline">
              Ver Detalles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
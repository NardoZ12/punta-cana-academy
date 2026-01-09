// src/components/organisms/CourseHero.tsx
import Image from 'next/image';
import { Button } from '../atoms/Button';

interface CourseHeroProps {
  title: string;
  description: string;
  image: string;
  price: string;
  duration: string;
  modality: string;
}

export const CourseHero = ({ title, description, image, price, duration, modality }: CourseHeroProps) => {
  return (
    <div className="relative h-[500px] w-full flex items-center">
      {/* IMAGEN DE FONDO CON FILTRO MEJORADO */}
      <div className="absolute inset-0 z-0">
        <Image src={image} alt={title} fill className="object-cover" priority />
        {/* Overlay principal más suave */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-transparent" />
        {/* Overlay adicional muy sutil */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* CONTENIDO CON BACKDROP BLUR */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-2xl">
          {/* Contenedor con fondo difuminado */}
          <div className="backdrop-blur-sm bg-black/20 p-8 rounded-2xl border border-white/10">
            <span className="inline-block bg-pca-blue text-white text-sm font-bold px-3 py-1 rounded-full mb-4">
              {modality}
            </span>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              {title}
            </h1>
            <p className="text-gray-100 text-xl mb-8 leading-relaxed drop-shadow-md">
              {description}
            </p>
            
            <div className="flex flex-wrap gap-6 mb-8 text-white font-medium">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-pca-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{duration}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-pca-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{price}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="primary">Inscribirme Ahora</Button>
              <Button variant="outline">Descargar Temario</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
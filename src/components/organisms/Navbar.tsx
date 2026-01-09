// src/components/organisms/Navbar.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../atoms/Button';
import { useUIStore } from '@/store/useUIStore';

export const Navbar = () => {
  const { openSidebar } = useUIStore();

  return (
    <nav className="w-full h-20 bg-pca-black/90 backdrop-blur-md border-b border-gray-800 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-12 h-12"> 
             <Image src="/images/logos/logo-pca.png" alt="PCA Logo" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold text-white hidden md:block">
            Punta Cana <span className="text-pca-blue">Academy</span>
          </span>
        </Link>

        {/* LINKS CENTRALES */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/cursos" className="text-gray-300 hover:text-pca-blue transition-colors">Cursos</Link>
          <Link href="/nosotros" className="text-gray-300 hover:text-pca-blue transition-colors">Nosotros</Link>
          <Link href="/contacto" className="text-gray-300 hover:text-pca-blue transition-colors">Contacto</Link>
        </div>

        {/* ACCIONES (Derecha) */}
        <div className="flex items-center gap-4">
          
          {/* NUEVO: Botón de Login (Solo texto o botón sutil) */}
          <Link href="/login" className="hidden md:block text-white font-medium hover:text-pca-blue transition-colors">
            Ingresar
          </Link>

          {/* Botón CTA - Ahora lleva a /registro */}
          <div className="hidden md:block">
            <Link href="/registro">
              <Button variant="primary">
                Inscribirse
              </Button>
            </Link>
          </div>

          {/* Menú Móvil */}
          <button onClick={openSidebar} className="md:hidden p-2 text-gray-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};
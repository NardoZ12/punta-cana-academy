// src/components/organisms/Navbar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="w-full h-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
          <div className="relative w-11 h-11 rounded-xl bg-white/5 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,180,255,0.18)]">
            <Image src="/images/logos/logo-pca.png" alt="PCA Logo" fill className="object-contain p-1.5" />
          </div>
          <div className="hidden md:block">
            <div className="text-lg font-bold tracking-tight text-white">
              Punta Cana <span className="text-cyan-400">Academy</span>
            </div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="/cursos" className="hover:text-cyan-300 transition-colors">Cursos</Link>
          <Link href="/nosotros" className="hover:text-cyan-300 transition-colors">Nosotros</Link>
          <Link href="/contacto" className="hover:text-cyan-300 transition-colors">Contacto</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:inline-flex text-sm font-medium text-slate-200 hover:text-cyan-300 transition-colors">
            Ingresar
          </Link>

          <Link href="/registro" className="hidden md:inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 transition hover:brightness-110">
            Inscribirse
          </Link>

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-slate-200 hover:text-white z-50 relative"
            aria-label="Abrir menú"
          >
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-slate-950/95 border-b border-white/10 shadow-2xl z-50 backdrop-blur-xl">
          <div className="flex flex-col p-4 space-y-2">
            <Link href="/cursos" className="text-white hover:text-cyan-300 transition-colors py-3 px-4 rounded-xl hover:bg-white/5" onClick={closeMenu}>Cursos</Link>
            <Link href="/nosotros" className="text-white hover:text-cyan-300 transition-colors py-3 px-4 rounded-xl hover:bg-white/5" onClick={closeMenu}>Nosotros</Link>
            <Link href="/contacto" className="text-white hover:text-cyan-300 transition-colors py-3 px-4 rounded-xl hover:bg-white/5" onClick={closeMenu}>Contacto</Link>
            <Link href="/login" className="text-white hover:text-cyan-300 transition-colors py-3 px-4 rounded-xl hover:bg-white/5" onClick={closeMenu}>Ingresar</Link>
            <Link href="/registro" onClick={closeMenu} className="mt-2 inline-flex items-center justify-center px-4 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 font-bold">Inscribirse</Link>
          </div>
        </div>
      )}
    </nav>
  );
};
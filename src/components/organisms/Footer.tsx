// src/components/organisms/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';

export const Footer = () => {
  return (
    <footer className="bg-black border-t border-gray-800 pt-16 pb-8 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        
        {/* COLUMNA 1: Marca y Misión */}
        <div className="col-span-1 md:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-4">
             {/* Ajusta el tamaño si es necesario */}
             <div className="relative w-10 h-10"> 
               <Image src="/images/logos/logo-pca-cuadrado.png" alt="PCA Logo" fill className="object-contain" />
             </div>
             <span className="text-xl font-bold text-white">
               Punta Cana <span className="text-cyan-400">Academy</span>
             </span>
          </div>
          <p className="text-sm leading-relaxed">
            La academia híbrida más moderna del Caribe. Aprende inglés y tecnología con clases presenciales en Friusa o desde cualquier lugar del mundo.
          </p>
        </div>

        {/* COLUMNA 2: Enlaces Rápidos */}
        <div>
          <h3 className="text-white font-semibold mb-4">Explorar</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/cursos" className="hover:text-cyan-400 transition">Cursos de Idiomas</Link></li>
            <li><Link href="/tecnologia" className="hover:text-cyan-400 transition">Cursos de Tecnología</Link></li>
            <li><Link href="/ai-masterclass" className="hover:text-cyan-400 transition">AI Master Class</Link></li>
            <li><Link href="/planes" className="hover:text-cyan-400 transition">Planes y Precios</Link></li>
            <li><Link href="/nosotros" className="hover:text-cyan-400 transition">Sobre Nosotros</Link></li>
          </ul>
        </div>

        {/* COLUMNA 3: Legal y Soporte */}
        <div>
          <h3 className="text-white font-semibold mb-4">Soporte</h3>
          <ul className="space-y-3 text-sm">
            <li><Link href="/contacto" className="hover:text-cyan-400 transition">Ayuda y Soporte</Link></li>
            <li><Link href="/privacidad" className="hover:text-cyan-400 transition">Política de Privacidad</Link></li>
            <li><Link href="/terminos" className="hover:text-cyan-400 transition">Términos de Servicio</Link></li>
            <li><Link href="/trabaja-con-nosotros" className="hover:text-cyan-400 transition">Trabaja con nosotros</Link></li>
          </ul>
        </div>

        {/* COLUMNA 4: Contacto (Clave para Friusa) */}
        <div>
          <h3 className="text-white font-semibold mb-4">Visítanos</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3 items-start">
              <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Av. Estados Unidos 41201<br/>Plaza Doña Belgica, Local L5<br/>Segundo Nivel, Punta Cana 23000</span>
            </li>
            <li className="flex gap-3 items-center">
              <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>puntacanaacademy.info@gmail.com</span>
            </li>
            <li className="flex gap-3 items-center">
              <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+1 (829) 270-7821</span>
            </li>
          </ul>
        </div>
      </div>

      {/* BARRA INFERIOR: Copyright */}
      <div className="border-t border-gray-800 pt-8 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Punta Cana Academy. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};
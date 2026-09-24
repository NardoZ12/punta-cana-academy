// src/components/organisms/Hero.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,180,255,0.18),_transparent_25%),linear-gradient(135deg,#071421_0%,#0b1f30_40%,#0f2740_100%)]">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-20 left-12 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ x: [0, 18, 0], y: [0, -18, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-10 h-[30rem] w-[30rem] rounded-full bg-sky-500/10 blur-3xl"
          animate={{ x: [0, -22, 0], y: [0, 18, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Educación digital para el Caribe
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl font-black tracking-tight text-white md:text-7xl"
          >
            Aprende <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">inglés</span>,
            <br />
            programación y habilidades del futuro.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-300 md:text-xl"
          >
            Punta Cana Academy combina aprendizaje práctico, acompañamiento docente y flexibilidad para preparar a estudiantes y profesionales del turismo, tecnología y negocios.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/registro" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-[0_20px_40px_rgba(59,180,255,0.28)] transition hover:brightness-110">
              Inscribirme gratis
            </Link>
            <Link href="/cursos" className="inline-flex items-center justify-center rounded-full border border-cyan-400/30 bg-white/5 px-7 py-3.5 text-base font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-500/10">
              Ver cursos
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 grid gap-4 text-left sm:grid-cols-3"
          >
            <div className="brand-surface rounded-2xl p-5">
              <div className="mb-2 text-3xl font-black text-cyan-300">+12</div>
              <div className="text-sm text-slate-300">Cursos y rutas de aprendizaje</div>
            </div>
            <div className="brand-surface rounded-2xl p-5">
              <div className="mb-2 text-3xl font-black text-cyan-300">Híbrido</div>
              <div className="text-sm text-slate-300">Clases online y acompañamiento práctico</div>
            </div>
            <div className="brand-surface rounded-2xl p-5">
              <div className="mb-2 text-3xl font-black text-cyan-300">+1K</div>
              <div className="text-sm text-slate-300">Estudiantes en crecimiento</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
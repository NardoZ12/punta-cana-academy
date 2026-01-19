// app/(marketing)/page.tsx
'use client';

import { Hero } from '@/components/organisms/Hero';
import { FeaturedCourses } from '@/components/organisms/FeaturedCourses';
import { Features } from '@/components/organisms/Features';
import { Testimonials } from '@/components/organisms/Testimonials';
import { CallToAction } from '@/components/organisms/CallToAction';

export default function HomePage() {
  return (
    <main className="bg-black">
      <Hero />
      <Features />
      <FeaturedCourses />
      <Testimonials />
      <CallToAction />
    </main>
  );
}
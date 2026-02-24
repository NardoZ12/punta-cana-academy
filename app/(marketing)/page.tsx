// app/(marketing)/page.tsx
import { Hero } from '@/components/organisms/Hero';
import { FeaturedCourses } from '@/components/organisms/FeaturedCourses';
import { Features } from '@/components/organisms/Features';
import { Testimonials } from '@/components/organisms/Testimonials';
import { CallToAction } from '@/components/organisms/CallToAction';
import { createClient } from '@/utils/supabase/server';

// Revalidar cada 60 segundos para mantener datos frescos
export const revalidate = 60;

export default async function HomePage() {
  // Fetch de cursos en el servidor - se renderiza con los datos ya listos
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <main className="bg-black">
      <Hero />
      <Features />
      <FeaturedCourses courses={courses || []} />
      <Testimonials />
      <CallToAction />
    </main>
  );
}
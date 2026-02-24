'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/atoms/Button';

interface EnrollButtonProps {
  courseId: string;
}

export default function EnrollButton({ courseId }: EnrollButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function checkEnrollment() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('student_id', user.id)
          .single();
        
        if (enrollment) setIsEnrolled(true);
      }
      setChecked(true);
    }
    checkEnrollment();
  }, [courseId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("🔒 Debes iniciar sesión para inscribirte.");
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: user.id,
        progress: 0,
        grade: 0
      });

    if (error) {
      alert("Error al inscribirse: " + error.message);
      setEnrolling(false);
    } else {
      alert("¡Felicidades! Te has inscrito correctamente. 🎉");
      router.push('/dashboard/student');
    }
  };

  if (isEnrolled) {
    return (
      <Link href="/dashboard/student" className="w-full md:w-auto">
        <Button variant="secondary" className="w-full md:w-auto rounded-xl md:rounded-full px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg bg-green-600 hover:bg-green-700 text-white border-none font-medium">
          ✅ Ya inscrito - Ir a Clases
        </Button>
      </Link>
    );
  }

  return (
    <Button 
      onClick={handleEnroll} 
      disabled={enrolling}
      variant="primary" 
      className="w-full md:w-auto rounded-xl md:rounded-full px-6 md:px-8 py-3 md:py-4 text-sm md:text-lg shadow-lg hover:shadow-cyan-500/50 transition-all transform hover:-translate-y-1 font-medium"
    >
      {enrolling ? 'Procesando...' : '¡Acceso Gratuito a Classroom!'}
    </Button>
  );
}

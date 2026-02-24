'use client';

import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// This page redirects to the edit page which has all course management
export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  useEffect(() => {
    window.location.href = `/dashboard/teacher/course/${courseId}/edit`;
  }, [courseId]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando curso...</p>
      </div>
    </div>
  );
}

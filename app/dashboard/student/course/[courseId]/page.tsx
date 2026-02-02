import { redirect } from 'next/navigation';

export default async function CourseRedirectPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  
  // Redirigir a la página de overview del curso
  redirect(`/dashboard/student/course/${courseId}/overview`);
}
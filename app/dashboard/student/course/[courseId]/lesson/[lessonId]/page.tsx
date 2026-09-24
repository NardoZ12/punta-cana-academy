import { redirect } from 'next/navigation';

export default async function LegacyLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId } = await params;
  redirect(`/dashboard/student/course/${courseId}/overview`);
}

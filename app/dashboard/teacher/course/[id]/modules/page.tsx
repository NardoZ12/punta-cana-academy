import { redirect } from 'next/navigation';

export default async function CourseModulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/teacher/course/${id}/edit`);
}

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; // Asegúrate de tener configurado el cliente de servidor

// Esta página necesita ser dinámica porque usa autenticación de servidor
export const dynamic = 'force-dynamic';

export default async function DashboardTrafficCop() {
  const supabase = await createClient();

  // 1. Verificamos si hay usuario conectado
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Si no está logueado, pa' fuera (al login)
    return redirect('/login'); // O la ruta donde tengas tu login
  }

  // 2. Buscamos qué ROL tiene este usuario en la base de datos
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // 3. DIRIGIMOS EL TRÁFICO 🚦
  if (profile?.role === 'teacher') {
    return redirect('/dashboard/teacher');
  } else {
    // Si es estudiante (o cualquier otra cosa), va al panel de estudiante
    return redirect('/dashboard/student');
  }
}
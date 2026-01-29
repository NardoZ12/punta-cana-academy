import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardTrafficCop() {
  const supabase = createClient();

  // 1. Obtener usuario actual
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Error fetching user or no session:', userError);
    return redirect('/login');
  }

  // 2. Buscar el user_type en la tabla profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle(); // maybeSingle es más seguro que single()

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    // Si falla, por seguridad lo mandamos a estudiante (o podrías mandarlo a login)
    return redirect('/dashboard/student');
  }

  if (!profile || !profile.user_type) {
    console.warn('Usuario sin perfil o sin user_type:', user.id);
    // Si no tiene perfil, podrías mandarlo a crear uno, pero por ahora... login
    return redirect('/login'); 
  }

  // 3. Normalizar el user_type (quitar espacios y poner minúsculas)
  const userType = String(profile.user_type).toLowerCase().trim();

  if (userType === 'teacher') {
    return redirect('/dashboard/teacher');
  } else if (userType === 'student') {
    return redirect('/dashboard/student');
  } else {
    // Tipo desconocido
    return redirect('/dashboard/student');
  }
}
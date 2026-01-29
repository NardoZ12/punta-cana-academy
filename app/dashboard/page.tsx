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

  // 2. Buscamos qué TIPO DE USUARIO tiene este usuario en la base de datos
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_type, full_name')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error obteniendo perfil:', error);
    // Si hay error obteniendo el perfil, crear uno por defecto
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
          user_type: 'student', // Por defecto estudiante
          language: 'es'
        }
      ]);
    
    if (!insertError) {
      return redirect('/dashboard/student');
    }
  }

  // 3. DIRIGIMOS EL TRÁFICO 🚦
  console.log('👤 Usuario:', user.email, 'Tipo:', profile?.user_type);
  
  if (profile?.user_type === 'teacher') {
    return redirect('/dashboard/teacher');
  } else {
    // Si es estudiante (o cualquier otra cosa), va al panel de estudiante
    return redirect('/dashboard/student');
  }
}
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔧 Variables de entorno:', {
    url: url ? `${url.substring(0, 20)}...` : 'No definida',
    key: key ? `${key.substring(0, 20)}...` : 'No definida'
  });
  
  if (!url || !key) {
    console.error('❌ Variables de Supabase no encontradas');
    throw new Error('Variables de entorno de Supabase no configuradas');
  }
  
  return createBrowserClient(url, key)
}
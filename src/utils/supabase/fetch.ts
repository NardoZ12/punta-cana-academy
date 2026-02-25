/**
 * Shared utility for direct Supabase REST API calls.
 * Bypasses supabase-js client (which hangs on .from() calls)
 * and uses direct fetch() with proper auth headers.
 */
import { createClient } from './client'

const TIMEOUT_MS = 15000

interface SupabaseHeaders {
  token: string
  url: string
  key: string
  headers: Record<string, string>
}

/**
 * Get Supabase auth headers for direct REST calls.
 * Tries to refresh session if no token found.
 */
export async function getSupabaseHeaders(): Promise<SupabaseHeaders> {
  const supabase = createClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  let token = ''
  
  const { data: { session } } = await supabase.auth.getSession()
  token = session?.access_token || ''
  
  if (!token) {
    const { data: { session: refreshed } } = await supabase.auth.refreshSession()
    token = refreshed?.access_token || ''
  }
  
  if (!token || !url || !key) {
    throw new Error('No se pudo obtener la sesión. Por favor recarga la página.')
  }
  
  return {
    token,
    url,
    key,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
    }
  }
}

/**
 * Direct Supabase REST API GET request.
 * @param path - REST path after /rest/v1/ (e.g., 'courses?id=eq.xxx')
 * @returns Parsed JSON response
 */
export async function supabaseGet<T = any>(path: string): Promise<T> {
  const { url, headers } = await getSupabaseHeaders()
  
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message || `Error ${res.status}: ${res.statusText}`)
    }
    
    return await res.json()
  } catch (error: any) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intenta de nuevo.')
    }
    throw error
  }
}

/**
 * Direct Supabase REST API POST request.
 */
export async function supabasePost<T = any>(table: string, body: any): Promise<T> {
  const { url, headers } = await getSupabaseHeaders()
  
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const res = await fetch(`${url}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message || `Error ${res.status}`)
    }
    
    return await res.json()
  } catch (error: any) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intenta de nuevo.')
    }
    throw error
  }
}

/**
 * Direct Supabase REST API PATCH request.
 */
export async function supabasePatch<T = any>(path: string, body: any): Promise<T> {
  const { url, headers } = await getSupabaseHeaders()
  
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.message || `Error ${res.status}`)
    }
    
    return await res.json()
  } catch (error: any) {
    clearTimeout(timeout)
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Intenta de nuevo.')
    }
    throw error
  }
}

/**
 * Encode a value for PostgREST filter
 */
export function pgEncode(value: string): string {
  return encodeURIComponent(value)
}

/**
 * Build an IN filter for PostgREST
 */
export function pgIn(values: string[]): string {
  if (values.length === 0) return 'in.()'
  return `in.(${values.map(v => `"${v}"`).join(',')})`
}

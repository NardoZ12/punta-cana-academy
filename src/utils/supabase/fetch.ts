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
 * Wraps getSession/refreshSession in 5s timeouts to prevent hangs.
 * Falls back to reading cookies directly if supabase-js hangs.
 */
export async function getSupabaseHeaders(): Promise<SupabaseHeaders> {
  const supabase = createClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  let token = ''
  
  // Try getSession with 5s timeout
  try {
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('getSession timeout')), 5000)
    )
    const result = await Promise.race([sessionPromise, timeoutPromise]) as any
    token = result?.data?.session?.access_token || ''
  } catch (e) {
    console.warn('[getSupabaseHeaders] getSession failed/timed out:', e)
  }
  
  // Fallback: refreshSession with 5s timeout
  if (!token) {
    try {
      const refreshPromise = supabase.auth.refreshSession()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('refreshSession timeout')), 5000)
      )
      const result = await Promise.race([refreshPromise, timeoutPromise]) as any
      token = result?.data?.session?.access_token || ''
    } catch (e) {
      console.warn('[getSupabaseHeaders] refreshSession failed/timed out:', e)
    }
  }

  // Last resort: read from sb-* cookies directly
  if (!token && typeof document !== 'undefined') {
    try {
      const cookies = document.cookie.split(';').map(c => c.trim())
      const sbCookies = cookies
        .filter(c => c.startsWith('sb-') && c.includes('-auth-token'))
        .sort()
        .map(c => c.substring(c.indexOf('=') + 1))
      if (sbCookies.length > 0) {
        const raw = decodeURIComponent(sbCookies.join(''))
        try {
          const parsed = JSON.parse(raw)
          token = parsed?.access_token || ''
        } catch {
          try { token = JSON.parse(atob(raw))?.access_token || '' } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
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

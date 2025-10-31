import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  let anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY

  if (typeof window !== 'undefined' && (!url || !anon)) {
    const w = window as unknown as { __env?: Record<string, string> }
    url = url || w.__env?.NEXT_PUBLIC_SUPABASE_URL || ''
    anon = anon || w.__env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || ''
  }

  if (typeof document !== 'undefined' && (!url || !anon)) {
    url =
      url ||
      document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') ||
      ''
    anon =
      anon ||
      document
        .querySelector('meta[name="supabase-anon-key"]')
        ?.getAttribute('content') ||
      ''
  }

  // Logs de debug – diga-me o que aparece
  if (typeof window !== 'undefined') {
    console.log('[auth debug] URL:', url)
    console.log(
      '[auth debug] ANON:',
      anon ? anon.slice(0, 6) + '...' + anon.slice(-6) : ''
    )
  }

  if (!url || !anon) {
    console.warn('[auth] Variáveis do Supabase ausentes. Verifique .env.local')
  }

  return createBrowserClient(url || '', anon || '')
}
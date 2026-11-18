/**
 * GYM OS — Supabase Integration Adapter
 *
 * Prepared for @supabase/supabase-js connection using public anon credentials only.
 * Never place service_role keys in frontend code.
 */

export interface SupabaseReadiness {
  mode: 'prototype_demo' | 'supabase_connected';
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlPreview: string;
}

export function getSupabaseReadiness(): SupabaseReadiness {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const hasUrl = Boolean(url && url.startsWith('https://'));
  const hasAnonKey = Boolean(anonKey && anonKey.length > 20);

  return {
    mode: hasUrl && hasAnonKey ? 'supabase_connected' : 'prototype_demo',
    hasUrl,
    hasAnonKey,
    urlPreview: hasUrl && url ? url : 'Not configured (Prototype Demonstration Mode)',
  };
}

/**
 * Supabase Client
 * 
 * Cliente singleton para conectar con Supabase.
 * Lee las credenciales de las variables de entorno.
 * 
 * Variables requeridas en .env.local:
 * - VITE_SUPABASE_URL: URL del proyecto Supabase
 * - VITE_SUPABASE_ANON_KEY: Clave anónima (public)
 * 
 * Para desarrollo local con Docker:
 * - VITE_SUPABASE_URL=http://localhost:54321
 * - VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (la key de anon del setup local)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ============================================================================
// VALIDACIÓN
// ============================================================================

if (!SUPABASE_URL) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL no está configurado. ' +
    'Usando modo fallback a mocks.'
  );
}

if (!SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase] VITE_SUPABASE_ANON_KEY no está configurado. ' +
    'Usando modo fallback a mocks.'
  );
}

// ============================================================================
// CLIENTE SINGLETON
// ============================================================================

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * Obtiene el cliente de Supabase (singleton)
 * Lanza error si no está configurado - usar isSupabaseConfigured() para verificar
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase no está configurado. ' +
        'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local'
      );
    }
    
    supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
      db: {
        schema: 'public',
      },
    });
  }
  
  return supabaseClient;
}

/**
 * Verifica si Supabase está configurado
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Resetea el cliente (útil para tests)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}

// ============================================================================
// EXPORT DIRECTO (para conveniencia)
// ============================================================================

/**
 * Cliente de Supabase - usar solo si isSupabaseConfigured() es true
 * @deprecated Usar getSupabaseClient() con manejo de errores
 */
export const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;

// ============================================================================
// UTILIDADES DE ERROR
// ============================================================================

/**
 * Error personalizado para operaciones de Supabase
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * Maneja errores de Supabase y los convierte a SupabaseError
 */
export function handleSupabaseError(error: unknown): SupabaseError {
  if (error instanceof SupabaseError) {
    return error;
  }
  
  if (error && typeof error === 'object') {
    const err = error as { message?: string; code?: string; details?: unknown };
    return new SupabaseError(
      err.message || 'Error desconocido de Supabase',
      err.code,
      err.details
    );
  }
  
  return new SupabaseError('Error desconocido de Supabase');
}

// ============================================================================
// RE-EXPORT DATABASE TYPE
// ============================================================================

export type { Database } from '../types/supabase';

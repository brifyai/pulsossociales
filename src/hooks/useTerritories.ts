/**
 * useTerritories Hook
 * 
 * Hook React para obtener datos de territorios desde Supabase.
 * Incluye manejo de estado de carga y errores.
 * 
 * Uso:
 *   const { regions, summary, loading, error, refetch } = useTerritories();
 *   const { region, loading, error } = useRegion('metropolitana');
 */

import { useState, useEffect, useCallback } from 'react';
import { TerritoryRegion, TerritorySummary } from '../types/territory';
import { 
  getAllRegions, 
  getRegionById, 
  getTerritorySummary,
  getAllRegionsWithEventStats,
  getRegionByIdWithEventStats,
} from '../repositories/territoryRepository';

// ============================================================================
// useTerritories - Obtiene todas las regiones y el resumen
// ============================================================================

interface UseTerritoriesReturn {
  regions: TerritoryRegion[];
  summary: TerritorySummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTerritories(): UseTerritoriesReturn {
  const [regions, setRegions] = useState<TerritoryRegion[]>([]);
  const [summary, setSummary] = useState<TerritorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [regionsData, summaryData] = await Promise.all([
        getAllRegions(),
        getTerritorySummary(),
      ]);

      setRegions(regionsData);
      setSummary(summaryData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useTerritories] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    regions,
    summary,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useRegion - Obtiene una región específica por ID
// ============================================================================

interface UseRegionReturn {
  region: TerritoryRegion | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRegion(regionId: string | null): UseRegionReturn {
  const [region, setRegion] = useState<TerritoryRegion | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to show loading immediately
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!regionId) {
      setRegion(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getRegionById(regionId);
      setRegion(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useRegion] Error al obtener región ${regionId}:`, err);
      setRegion(null);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    region,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useTerritorySummary - Obtiene solo el resumen territorial
// ============================================================================

interface UseTerritorySummaryReturn {
  summary: TerritorySummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTerritorySummary(): UseTerritorySummaryReturn {
  const [summary, setSummary] = useState<TerritorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getTerritorySummary();
      setSummary(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useTerritorySummary] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    summary,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useTerritoriesWithEvents - Obtiene regiones con estadísticas de eventos
// ============================================================================

interface UseTerritoriesWithEventsReturn {
  regions: TerritoryRegion[];
  summary: TerritorySummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener regiones con estadísticas de eventos actualizadas
 * Útil cuando se visualiza la capa de eventos en el mapa
 */
export function useTerritoriesWithEvents(): UseTerritoriesWithEventsReturn {
  const [regions, setRegions] = useState<TerritoryRegion[]>([]);
  const [summary, setSummary] = useState<TerritorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [regionsData, summaryData] = await Promise.all([
        getAllRegionsWithEventStats(),
        getTerritorySummary(),
      ]);

      setRegions(regionsData);
      setSummary(summaryData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useTerritoriesWithEvents] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    regions,
    summary,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useRegionWithEvents - Obtiene una región con estadísticas de eventos
// ============================================================================

interface UseRegionWithEventsReturn {
  region: TerritoryRegion | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para obtener una región específica con estadísticas de eventos actualizadas
 */
export function useRegionWithEvents(regionId: string | null): UseRegionWithEventsReturn {
  const [region, setRegion] = useState<TerritoryRegion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!regionId) {
      setRegion(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getRegionByIdWithEventStats(regionId);
      setRegion(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useRegionWithEvents] Error al obtener región ${regionId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    region,
    loading,
    error,
    refetch: fetchData,
  };
}

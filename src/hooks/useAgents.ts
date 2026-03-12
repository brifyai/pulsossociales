/**
 * useAgents Hook
 * 
 * Hook React para obtener datos de agentes desde Supabase.
 * Incluye manejo de estado de carga y errores.
 * 
 * Uso:
 *   const { agents, loading, error, refetch } = useAgentSummariesByRegion('metropolitana');
 *   const { agent, loading, error } = useAgentById('agent-001');
 *   const { agents, loading, error } = useAllAgentSummaries();
 */

import { useState, useEffect, useCallback } from 'react';
import { AgentSummary, FullAgent } from '../types/agent';
import { AgentFilters } from '../types/supabase';
import { 
  getAgentSummariesByRegion,
  getAllAgentSummaries,
  getAgentById,
  getAgentsByFilters,
  getAgentCountByRegion,
} from '../repositories/agentRepository';

// ============================================================================
// useAgentSummariesByRegion - Obtiene summaries de agentes por región
// ============================================================================

interface UseAgentSummariesByRegionReturn {
  agents: AgentSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentSummariesByRegion(
  regionId: string | null
): UseAgentSummariesByRegionReturn {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!regionId) {
      setAgents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentSummariesByRegion(regionId);
      setAgents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useAgentSummariesByRegion] Error al obtener agentes de ${regionId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    agents,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useAllAgentSummaries - Obtiene todos los agentes como summaries
// ============================================================================

interface UseAllAgentSummariesReturn {
  agents: AgentSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAllAgentSummaries(): UseAllAgentSummariesReturn {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAllAgentSummaries();
      setAgents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAllAgentSummaries] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    agents,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useAgentById - Obtiene un agente completo por ID
// ============================================================================

interface UseAgentByIdReturn {
  agent: FullAgent | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentById(agentId: string | null): UseAgentByIdReturn {
  const [agent, setAgent] = useState<FullAgent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!agentId) {
      setAgent(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentById(agentId);
      setAgent(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useAgentById] Error al obtener agente ${agentId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    agent,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useFilteredAgents - Obtiene agentes filtrados
// ============================================================================

interface UseFilteredAgentsReturn {
  agents: AgentSummary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFilteredAgents(
  filters: AgentFilters
): UseFilteredAgentsReturn {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAgentsByFilters(filters);
      setAgents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useFilteredAgents] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    agents,
    loading,
    error,
    refetch: fetchData,
  };
}

// ============================================================================
// useAgentCountByRegion - Obtiene el conteo de agentes por región
// ============================================================================

interface UseAgentCountByRegionReturn {
  count: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAgentCountByRegion(
  regionId: string | null
): UseAgentCountByRegionReturn {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!regionId) {
      setCount(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getAgentCountByRegion(regionId);
      setCount(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useAgentCountByRegion] Error al contar agentes en ${regionId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [regionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    count,
    loading,
    error,
    refetch: fetchData,
  };
}

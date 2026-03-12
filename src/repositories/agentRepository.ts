/**
 * Agent Repository
 * 
 * Capa de acceso a datos para agentes sintéticos.
 * Lee desde Supabase con fallback a mocks.
 * 
 * Arquitectura:
 * - Primero intenta leer de Supabase (vistas agent_summaries y full_agents)
 * - Si falla o no está configurado, usa mocks
 * - Los mocks están en src/mocks/agents.ts
 * 
 * Uso:
 *   const agents = await getAgentSummariesByRegion('metropolitana');
 *   const agent = await getAgentById('agent-001');
 */

import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  handleSupabaseError 
} from '../lib/supabaseClient';
import { 
  AgentSummary as SupabaseAgentSummary,
  FullAgentView,
  AgentMemory,
  AgentFilters,
  UrbanRural,
  Sex,
  EducationLevel,
  EmploymentStatus,
  HouseholdType,
  ConnectivityType,
  Mood,
  MemorySource,
} from '../types/supabase';
import { 
  AgentSummary, 
  FullAgent,
  AgentProfile,
  AgentTraits,
  AgentState as AgentStateType,
  AgentMemory as AgentMemoryType,
  AgentEventExposure,
} from '../types/agent';
import { 
  MOCK_AGENTS,
  getAgentById as getMockAgentById,
  getAgentSummariesByRegion as getMockAgentSummariesByRegion,
  getAllAgentSummaries as getMockAllAgentSummaries,
} from '../mocks/agents';

// ============================================================================
// MAPEO: Supabase -> Frontend
// ============================================================================

/**
 * Convierte un AgentSummary de Supabase al formato del frontend
 */
function mapAgentSummary(supabaseSummary: SupabaseAgentSummary): AgentSummary {
  return {
    id: supabaseSummary.id,
    name: supabaseSummary.name || 'Sin nombre',
    regionId: supabaseSummary.region_id,
    age: supabaseSummary.age || 0,
    sex: (supabaseSummary.sex as Sex) || 'other',
    character: supabaseSummary.character_sprite ?? undefined,
    isActive: supabaseSummary.status === 'active',
    mood: (supabaseSummary.mood as Mood) || 'neutral',
  };
}

/**
 * Convierte un FullAgentView de Supabase al formato FullAgent del frontend
 */
function mapFullAgentView(view: FullAgentView): FullAgent {
  // Construir el perfil
  const profile: AgentProfile = {
    id: view.agent_id,
    name: view.name || 'Sin nombre',
    regionId: view.region_id,
    commune: view.commune,
    urbanRural: (view.urban_rural as UrbanRural) || 'urban',
    sex: (view.sex as Sex) || 'other',
    age: view.age || 0,
    educationLevel: (view.education_level as EducationLevel) || 'none',
    employmentStatus: (view.employment_status as EmploymentStatus) || 'inactive',
    incomeDecile: view.income_decile || 5,
    householdSize: view.household_size || 1,
    householdType: (view.household_type as HouseholdType) || 'single',
    hasChildren: view.has_children || false,
    connectivityType: (view.connectivity_type as ConnectivityType) || 'mobile',
    digitalAccessScore: view.digital_access_score || 50,
    weight: view.weight,
    character: (view.character_sprite ? view.character_sprite : undefined) as string | undefined,
    description: view.description || undefined,
  };

  // Construir los traits
  const traits: AgentTraits = {
    institutionalTrust: view.institutional_trust || 50,
    riskAversion: view.risk_aversion || 50,
    digitalLiteracy: view.digital_literacy || 50,
    patience: view.patience || 50,
    civicInterest: view.civic_interest || 50,
    socialDesirability: view.social_desirability || 50,
    opennessChange: view.openness_change || 50,
    ideologyScore: view.ideology_score || 50,
    nationalismScore: view.nationalism_score || 50,
    consistencyScore: view.consistency_score || 50,
  };

  // Construir el estado
  const state: AgentStateType = {
    fatigue: view.state_fatigue || 0,
    economicStress: view.economic_stress || 0,
    mood: (view.mood as Mood) || 'neutral',
    surveySaturation: view.survey_saturation || 0,
    lastActivationAt: view.last_activation_at ? new Date(view.last_activation_at) : undefined,
    isActive: view.binding_status === 'active',
  };

  // Construir la memoria (simplificada - se carga por separado si es necesario)
  const memory: AgentMemoryType = {
    summary: '', // Se carga por separado
    salientTopics: [],
    previousPositions: [],
    contradictionScore: 0,
  };

  return {
    profile,
    traits,
    memory,
    state,
    events: [], // Se cargan por separado
  };
}

/**
 * Convierte memorias de Supabase al formato del frontend
 */
function mapAgentMemories(memories: AgentMemory[]): AgentMemoryType {
  const summary = memories.find(m => m.memory_type === 'summary')?.content || '';
  const topics = memories
    .filter(m => m.memory_type === 'topic')
    .map(m => m.topic || '');
  const positions = memories
    .filter(m => m.memory_type === 'position')
    .map(m => ({
      topic: m.topic || '',
      stance: m.stance || '',
      timestamp: new Date(m.created_at),
      source: (m.source as MemorySource) || 'manual',
    }));

  return {
    summary,
    salientTopics: topics,
    previousPositions: positions,
    contradictionScore: 0, // Se calcularía dinámicamente
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Obtiene todos los agentes como summaries
 * Fallback a mocks si Supabase no está disponible
 */
export async function getAllAgentSummaries(): Promise<AgentSummary[]> {
  if (!isSupabaseConfigured()) {
    console.log('[AgentRepository] Supabase no configurado, usando mocks');
    return getMockAllAgentSummaries();
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('agent_summaries')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('[AgentRepository] Error de Supabase, usando mocks:', error.message);
      return getMockAllAgentSummaries();
    }

    if (!data || data.length === 0) {
      console.warn('[AgentRepository] No hay datos en Supabase, usando mocks');
      return getMockAllAgentSummaries();
    }

    return data.map(mapAgentSummary);
  } catch (error) {
    console.warn('[AgentRepository] Error, usando mocks:', error);
    return getMockAllAgentSummaries();
  }
}

/**
 * Obtiene summaries de agentes por región
 * Fallback a mocks si Supabase no está disponible
 */
export async function getAgentSummariesByRegion(regionId: string): Promise<AgentSummary[]> {
  if (!isSupabaseConfigured()) {
    return getMockAgentSummariesByRegion(regionId);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('agent_summaries')
      .select('*')
      .eq('region_id', regionId)
      .order('name', { ascending: true });

    if (error) {
      console.warn(`[AgentRepository] Error al obtener agentes de ${regionId}, usando mocks:`, error.message);
      return getMockAgentSummariesByRegion(regionId);
    }

    if (!data || data.length === 0) {
      console.warn(`[AgentRepository] No hay agentes en ${regionId} en Supabase, usando mocks`);
      return getMockAgentSummariesByRegion(regionId);
    }

    return data.map(mapAgentSummary);
  } catch (error) {
    console.warn(`[AgentRepository] Error al obtener agentes de ${regionId}, usando mocks:`, error);
    return getMockAgentSummariesByRegion(regionId);
  }
}

/**
 * Obtiene un agente completo por ID
 * Fallback a mocks si Supabase no está disponible
 */
export async function getAgentById(id: string): Promise<FullAgent | null> {
  if (!isSupabaseConfigured()) {
    return getMockAgentById(id) || null;
  }

  try {
    const supabase = getSupabaseClient();
    
    // Obtener datos básicos de full_agents
    const { data: viewData, error: viewError } = await supabase
      .from('full_agents')
      .select('*')
      .eq('agent_id', id)
      .single();

    if (viewError || !viewData) {
      console.warn(`[AgentRepository] Error al obtener agente ${id}, usando mocks:`, viewError?.message);
      return getMockAgentById(id) || null;
    }

    // Obtener memorias
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('agent_memories')
      .select('*')
      .eq('agent_id', id)
      .order('created_at', { ascending: false });

    // Construir el agente completo
    let agent = mapFullAgentView(viewData);
    
    // Enriquecer con memorias si existen
    if (memoriesData && !memoriesError) {
      agent = {
        ...agent,
        memory: mapAgentMemories(memoriesData),
      };
    }

    return agent;
  } catch (error) {
    console.warn(`[AgentRepository] Error al obtener agente ${id}, usando mocks:`, error);
    return getMockAgentById(id) || null;
  }
}

/**
 * Obtiene agentes filtrados
 * Nota: Implementación básica, se puede extender
 */
export async function getAgentsByFilters(filters: AgentFilters): Promise<AgentSummary[]> {
  if (!isSupabaseConfigured()) {
    // Filtrar mocks
    return MOCK_AGENTS
      .filter(a => !filters.region_id || a.profile.regionId === filters.region_id)
      .filter(a => !filters.sex || a.profile.sex === filters.sex)
      .filter(a => !filters.min_age || a.profile.age >= filters.min_age)
      .filter(a => !filters.max_age || a.profile.age <= filters.max_age)
      .filter(a => !filters.mood || a.state.mood === filters.mood)
      .map(a => ({
        id: a.profile.id,
        name: a.profile.name,
        regionId: a.profile.regionId,
        age: a.profile.age,
        sex: a.profile.sex,
        character: a.profile.character,
        isActive: a.state.isActive,
        mood: a.state.mood,
      }));
  }

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('agent_summaries')
      .select('*');

    // Aplicar filtros
    if (filters.region_id) {
      query = query.eq('region_id', filters.region_id);
    }
    if (filters.sex) {
      query = query.eq('sex', filters.sex);
    }
    if (filters.min_age) {
      query = query.gte('age', filters.min_age);
    }
    if (filters.max_age) {
      query = query.lte('age', filters.max_age);
    }
    if (filters.mood) {
      query = query.eq('mood', filters.mood);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      console.warn('[AgentRepository] Error al filtrar agentes:', error.message);
      return [];
    }

    return (data || []).map(mapAgentSummary);
  } catch (error) {
    console.warn('[AgentRepository] Error al filtrar agentes:', error);
    return [];
  }
}

/**
 * Obtiene el conteo de agentes por región
 */
export async function getAgentCountByRegion(regionId: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return MOCK_AGENTS.filter(a => a.profile.regionId === regionId).length;
  }

  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('agent_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('region_id', regionId);

    if (error) {
      console.warn(`[AgentRepository] Error al contar agentes en ${regionId}:`, error.message);
      return MOCK_AGENTS.filter(a => a.profile.regionId === regionId).length;
    }

    return count || 0;
  } catch (error) {
    console.warn(`[AgentRepository] Error al contar agentes en ${regionId}:`, error);
    return MOCK_AGENTS.filter(a => a.profile.regionId === regionId).length;
  }
}

// ============================================================================
// MUTACIONES (para uso futuro)
// ============================================================================

/**
 * Actualiza el estado de un agente
 * Nota: Solo funciona si Supabase está configurado
 */
export async function updateAgentState(
  agentId: string, 
  updates: Partial<{
    fatigue: number;
    economic_stress: number;
    mood: Mood;
    survey_saturation: number;
  }>
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[AgentRepository] Supabase no configurado, no se puede actualizar estado');
    return false;
  }

  try {
    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('agent_states')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', agentId);

    if (error) {
      console.warn(`[AgentRepository] Error al actualizar estado de ${agentId}:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[AgentRepository] Error al actualizar estado de ${agentId}:`, error);
    return false;
  }
}

/**
 * Agrega una memoria al agente
 * Nota: Solo funciona si Supabase está configurado
 */
export async function addAgentMemory(
  agentId: string,
  memory: {
    memory_type: 'summary' | 'position' | 'topic' | 'reflection';
    topic?: string;
    content: string;
    stance?: string;
    source: MemorySource;
    source_id?: string;
    importance?: number;
    confidence?: number;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('[AgentRepository] Supabase no configurado, no se puede agregar memoria');
    return false;
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('agent_memories')
      .insert({
        agent_id: agentId,
        ...memory,
        created_at: new Date().toISOString(),
      } as any);

    if (error) {
      console.warn(`[AgentRepository] Error al agregar memoria a ${agentId}:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`[AgentRepository] Error al agregar memoria a ${agentId}:`, error);
    return false;
  }
}

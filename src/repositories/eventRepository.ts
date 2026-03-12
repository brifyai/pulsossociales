/**
 * Event Repository - Read-only access to events data from Supabase
 * 
 * Architecture:
 * - Pure data access layer (no business logic)
 * - Returns Supabase rows directly
 * - Error handling with fallback to empty arrays
 * - No mutations (read-only for now)
 * 
 * Tables accessed:
 * - events
 * - agent_event_exposures
 * - event_summaries (view)
 * - full_event_exposures (view)
 * - territory_events (view)
 */

import { 
  getSupabaseClient, 
  isSupabaseConfigured 
} from '../lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import{
  Event,
  EventSummary,
  FullEventExposure,
  TerritoryEvent,
  AgentEventExposure,
} from '../types/event';

// ============================================================================
// ERROR HANDLING
// ============================================================================

function handleError(operation: string, error: unknown): null {
  console.error(`[eventRepository] ${operation} failed:`, error);
  return null;
}

function handleArrayError<T>(operation: string, error: unknown): T[] {
  console.error(`[eventRepository] ${operation} failed:`, error);
  return [];
}

// ============================================================================
// HELPER
// ============================================================================

/**
 * Get Supabase client or throw error if not configured
 */
function getClient(): SupabaseClient<Database> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase not configured');
  }
  return client;
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  try {
    const { data, error } = await getClient()
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<Event>('getAllEvents', error);
  }
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  try {
    const { data, error } = await getClient()
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    return handleError('getEventById', error);
  }
}

/**
 * Get events by territory
 */
export async function getEventsByTerritory(territoryId: string): Promise<Event[]> {
  try {
    const { data, error } = await getClient()
      .from('events')
      .select('*')
      .or(`territory_id.eq.${territoryId},territory_scope.eq.national`)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<Event>('getEventsByTerritory', error);
  }
}

/**
 * Get recent events (last N days)
 */
export async function getRecentEvents(days: number = 30): Promise<Event[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await getClient()
      .from('events')
      .select('*')
      .gte('event_date', cutoffDate.toISOString().split('T')[0])
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<Event>('getRecentEvents', error);
  }
}

/**
 * Get events by category
 */
export async function getEventsByCategory(category: string): Promise<Event[]> {
  try {
    const { data, error } = await getClient()
      .from('events')
      .select('*')
      .eq('category', category)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<Event>('getEventsByCategory', error);
  }
}

// ============================================================================
// EVENT SUMMARIES (with exposure counts)
// ============================================================================

/**
 * Get event summaries with exposure counts
 */
export async function getEventSummaries(): Promise<EventSummary[]> {
  try {
    const { data, error } = await getClient()
      .from('event_summaries')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<EventSummary>('getEventSummaries', error);
  }
}

/**
 * Get event summary by territory
 */
export async function getEventSummariesByTerritory(territoryId: string): Promise<EventSummary[]> {
  try {
    const { data, error } = await getClient()
      .from('event_summaries')
      .select('*')
      .or(`territory_id.eq.${territoryId},territory_scope.eq.national`)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<EventSummary>('getEventSummariesByTerritory', error);
  }
}

// ============================================================================
// TERRITORY EVENTS (for map layer)
// ============================================================================

/**
 * Get events aggregated by territory
 */
export async function getTerritoryEvents(): Promise<TerritoryEvent[]> {
  try {
    const { data, error } = await getClient()
      .from('territory_events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<TerritoryEvent>('getTerritoryEvents', error);
  }
}

/**
 * Get territory events by territory ID
 */
export async function getTerritoryEventsById(territoryId: string): Promise<TerritoryEvent[]> {
  try {
    const { data, error } = await getClient()
      .from('territory_events')
      .select('*')
      .eq('territory_id', territoryId)
      .order('event_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<TerritoryEvent>('getTerritoryEventsById', error);
  }
}

// ============================================================================
// AGENT EVENT EXPOSURES
// ============================================================================

/**
 * Get all exposures for an agent
 */
export async function getAgentEventExposures(agentId: string): Promise<AgentEventExposure[]> {
  try {
    const { data, error } = await getClient()
      .from('agent_event_exposures')
      .select('*')
      .eq('agent_id', agentId)
      .order('exposed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<AgentEventExposure>('getAgentEventExposures', error);
  }
}

/**
 * Get full event exposures for an agent (with event details)
 */
export async function getFullAgentEventExposures(agentId: string): Promise<FullEventExposure[]> {
  try {
    const { data, error } = await getClient()
      .from('full_event_exposures')
      .select('*')
      .eq('agent_id', agentId)
      .order('exposed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<FullEventExposure>('getFullAgentEventExposures', error);
  }
}

/**
 * Get exposures for a specific event
 */
export async function getEventExposures(eventId: string): Promise<AgentEventExposure[]> {
  try {
    const { data, error } = await getClient()
      .from('agent_event_exposures')
      .select('*')
      .eq('event_id', eventId)
      .order('exposed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    return handleArrayError<AgentEventExposure>('getEventExposures', error);
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get event statistics for a territory
 */
export async function getTerritoryEventStats(territoryId: string): Promise<{
  totalEvents: number;
  recentEvents: number;
  avgIntensity: number;
  eventsByCategory: Record<string, number>;
}> {
  try {
    // Get all events for this territory
    const { data: events, error } = await getClient()
      .from('events')
      .select('category, intensity, event_date')
      .or(`territory_id.eq.${territoryId},territory_scope.eq.national`);

    if (error) throw error;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const totalEvents = events?.length || 0;
    const recentEvents = events?.filter((e: { event_date: string }) => new Date(e.event_date) >= cutoffDate).length || 0;
    const avgIntensity = events?.length 
      ? events.reduce((sum: number, e: { intensity: number }) => sum + e.intensity, 0) / events.length 
      : 0;

    const eventsByCategory: Record<string, number> = {};
    events?.forEach((e: { category: string }) => {
      eventsByCategory[e.category] = (eventsByCategory[e.category] || 0) + 1;
    });

    return {
      totalEvents,
      recentEvents,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
      eventsByCategory,
    };
  } catch (error) {
    console.error('[eventRepository] getTerritoryEventStats failed:', error);
    return {
      totalEvents: 0,
      recentEvents: 0,
      avgIntensity: 0,
      eventsByCategory: {},
    };
  }
}

// ============================================================================
// RPC FUNCTIONS
// ============================================================================

/**
 * Get agent events using RPC function
 */
export async function getAgentEventsRPC(agentId: string): Promise<{
  event_id: string;
  title: string;
  summary: string | null;
  category: string;
  intensity: number;
  interpreted_stance: string;
  exposure_level: number;
  mood_impact: number | null;
  exposed_at: string;
  event_date: string;
}[]> {
  try {
    const { data, error } = await getClient()
      .rpc('get_agent_events', { agent_uuid: agentId } as never);

    if (error) throw error;
    return (data as unknown as {
      event_id: string;
      title: string;
      summary: string | null;
      category: string;
      intensity: number;
      interpreted_stance: string;
      exposure_level: number;
      mood_impact: number | null;
      exposed_at: string;
      event_date: string;
    }[]) || [];
  } catch (error) {
    return handleArrayError('getAgentEventsRPC', error);
  }
}

/**
 * Get recent events by territory using RPC function
 */
export async function getTerritoryRecentEventsRPC(
  territoryId: string, 
  daysBack: number = 30
): Promise<{
  event_id: string;
  title: string;
  summary: string | null;
  category: string;
  intensity: number;
  event_date: string;
  exposure_count: number;
}[]> {
  try {
    const { data, error } = await getClient()
      .rpc('get_territory_recent_events', { 
        territory_uuid: territoryId,
        days_back: daysBack 
      } as never);

    if (error) throw error;
    return (data as unknown as {
      event_id: string;
      title: string;
      summary: string | null;
      category: string;
      intensity: number;
      event_date: string;
      exposure_count: number;
    }[]) || [];
  } catch (error) {
    return handleArrayError('getTerritoryRecentEventsRPC', error);
  }
}

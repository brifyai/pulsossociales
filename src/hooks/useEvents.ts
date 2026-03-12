/**
 * useEvents Hook - React hooks for event data
 * 
 * Architecture:
 * - Wraps eventRepository functions
 * - Returns { data, loading, error } pattern
 * - Auto-refetch on dependency changes
 * - Fallback to empty arrays on error
 * 
 * Usage:
 * const { events, loading, error } = useEventsByTerritory('metropolitana');
 * const { exposures, loading } = useAgentEventExposures('agent-123');
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Event,
  EventSummary,
  FullEventExposure,
  TerritoryEvent,
  AgentEventExposure,
  EventForDisplay,
  AgentEventForDisplay,
  TerritoryEventStats,
  toEventForDisplay,
  toAgentEventForDisplay,
} from '../types/event';
import * as eventRepository from '../repositories/eventRepository';

// ============================================================================
// USE ALL EVENTS
// ============================================================================

export function useAllEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await eventRepository.getAllEvents();
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();
    return () => { mounted = false; };
  }, []);

  return { events, loading, error };
}

// ============================================================================
// USE EVENTS BY TERRITORY
// ============================================================================

export function useEventsByTerritory(territoryId: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!territoryId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchEvents() {
      try {
        setLoading(true);
        const data = await eventRepository.getEventsByTerritory(territoryId!);
        if (mounted) {
          setEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();
    return () => { mounted = false; };
  }, [territoryId]);

  return { events, loading, error };
}

// ============================================================================
// USE EVENT SUMMARIES BY TERRITORY
// ============================================================================

export function useEventSummariesByTerritory(territoryId: string | null) {
  const [summaries, setSummaries] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!territoryId) {
      setSummaries([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchSummaries() {
      try {
        setLoading(true);
        const data = await eventRepository.getEventSummariesByTerritory(territoryId!);
        if (mounted) {
          setSummaries(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchSummaries();
    return () => { mounted = false; };
  }, [territoryId]);

  return { summaries, loading, error };
}

// ============================================================================
// USE TERRITORY EVENTS (for map layer)
// ============================================================================

export function useTerritoryEvents() {
  const [territoryEvents, setTerritoryEvents] = useState<TerritoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchTerritoryEvents() {
      try {
        setLoading(true);
        const data = await eventRepository.getTerritoryEvents();
        if (mounted) {
          setTerritoryEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTerritoryEvents();
    return () => { mounted = false; };
  }, []);

  return { territoryEvents, loading, error };
}

// ============================================================================
// USE TERRITORY EVENTS BY ID
// ============================================================================

export function useTerritoryEventsById(territoryId: string | null) {
  const [territoryEvents, setTerritoryEvents] = useState<TerritoryEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!territoryId) {
      setTerritoryEvents([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchTerritoryEvents() {
      try {
        setLoading(true);
        const data = await eventRepository.getTerritoryEventsById(territoryId!);
        if (mounted) {
          setTerritoryEvents(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTerritoryEvents();
    return () => { mounted = false; };
  }, [territoryId]);

  return { territoryEvents, loading, error };
}

// ============================================================================
// USE AGENT EVENT EXPOSURES
// ============================================================================

export function useAgentEventExposures(agentId: string | null) {
  const [exposures, setExposures] = useState<AgentEventExposure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId) {
      setExposures([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchExposures() {
      try {
        setLoading(true);
        const data = await eventRepository.getAgentEventExposures(agentId!);
        if (mounted) {
          setExposures(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchExposures();
    return () => { mounted = false; };
  }, [agentId]);

  return { exposures, loading, error };
}

// ============================================================================
// USE FULL AGENT EVENT EXPOSURES (with event details)
// ============================================================================

export function useFullAgentEventExposures(agentId: string | null) {
  const [exposures, setExposures] = useState<FullEventExposure[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId) {
      setExposures([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchExposures() {
      try {
        setLoading(true);
        const data = await eventRepository.getFullAgentEventExposures(agentId!);
        if (mounted) {
          setExposures(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchExposures();
    return () => { mounted = false; };
  }, [agentId]);

  return { exposures, loading, error };
}

// ============================================================================
// USE TERRITORY EVENT STATS
// ============================================================================

export function useTerritoryEventStats(territoryId: string | null) {
  const [stats, setStats] = useState<TerritoryEventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!territoryId) {
      setStats(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchStats() {
      try {
        setLoading(true);
        const rawStats = await eventRepository.getTerritoryEventStats(territoryId!);
        
        // Get top events for this territory
        const events = await eventRepository.getEventsByTerritory(territoryId!);
        const topEvents = events
          .slice(0, 5)
          .map(e => toEventForDisplay(e));

        if (mounted) {
          setStats({
            territoryId: territoryId!,
            totalEvents: rawStats.totalEvents,
            recentEvents: rawStats.recentEvents,
            avgIntensity: rawStats.avgIntensity,
            eventsByCategory: rawStats.eventsByCategory as Record<import('../types/event').EventCategory, number>,
            topEvents,
          });
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStats();
    return () => { mounted = false; };
  }, [territoryId]);

  return { stats, loading, error };
}

// ============================================================================
// USE EVENTS FOR DISPLAY (formatted for UI)
// ============================================================================

export function useEventsForDisplay(territoryId: string | null) {
  const { summaries, loading, error } = useEventSummariesByTerritory(territoryId);

  const eventsForDisplay: EventForDisplay[] = summaries.map(summary => 
    toEventForDisplay(summary, summary.exposure_count, {
      positive: summary.positive_stances,
      negative: summary.negative_stances,
      neutral: summary.neutral_stances,
    })
  );

  return { events: eventsForDisplay, loading, error };
}

// ============================================================================
// USE AGENT EVENTS FOR DISPLAY (formatted for UI)
// ============================================================================

export function useAgentEventsForDisplay(agentId: string | null) {
  const { exposures, loading, error } = useFullAgentEventExposures(agentId);

  const eventsForDisplay: AgentEventForDisplay[] = exposures.map(exposure => 
    toAgentEventForDisplay(exposure)
  );

  return { events: eventsForDisplay, loading, error };
}

// ============================================================================
// USE REFRESHABLE EVENTS (manual refresh capability)
// ============================================================================

export function useRefreshableEventsByTerritory(territoryId: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!territoryId) {
      setEvents([]);
      return;
    }

    try {
      setLoading(true);
      const data = await eventRepository.getEventsByTerritory(territoryId!);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [territoryId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
}

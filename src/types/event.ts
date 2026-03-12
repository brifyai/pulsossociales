/**
 * Event Types - TypeScript definitions for the event system
 * 
 * Aligned with Supabase schema:
 * - events table
 * - agent_event_exposures table
 * - event_summaries view
 * - full_event_exposures view
 */

// ============================================================================
// ENUMS
// ============================================================================

export type EventCategory = 
  | 'political'      // Elections, legislation, scandals
  | 'economic'       // Inflation, unemployment, markets
  | 'social'         // Protests, movements, cultural shifts
  | 'environmental'  // Natural disasters, climate events
  | 'security'       // Crime, terrorism, public safety
  | 'health'         // Pandemics, healthcare policy
  | 'international'  // Foreign affairs, diplomacy
  | 'other';         // Uncategorized

export type TerritoryScope = 
  | 'national'   // Affects entire country
  | 'regional'   // Affects specific region
  | 'communal'   // Affects specific commune
  | 'local';     // Very localized event

export type InterpretedStance = 
  | 'positive'
  | 'negative'
  | 'neutral'
  | 'mixed';

// ============================================================================
// BASE TYPES (from Supabase tables)
// ============================================================================

/**
 * Event - Core event data from events table
 */
export interface Event {
  id: string;                    // UUID
  title: string;
  summary: string | null;
  category: EventCategory;
  territory_scope: TerritoryScope;
  territory_id: string | null;   // References territories.id
  intensity: number;             // 1-10
  source: string | null;
  source_url: string | null;
  event_date: string;            // ISO date string
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

/**
 * AgentEventExposure - Links agents to events
 */
export interface AgentEventExposure {
  id: string;                    // UUID
  agent_id: string;              // References agents.id
  event_id: string;              // References events.id (UUID)
  exposure_probability: number;  // 0-100
  exposure_level: number;        // 0-100
  interpreted_stance: InterpretedStance;
  mood_impact: number | null;    // -50 to 50
  exposed_at: string;            // ISO timestamp
}

// ============================================================================
// VIEW TYPES (from Supabase views)
// ============================================================================

/**
 * EventSummary - From event_summaries view
 * Includes aggregated exposure data
 */
export interface EventSummary {
  id: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  territory_scope: TerritoryScope;
  territory_id: string | null;
  territory_name: string | null;
  intensity: number;
  source: string | null;
  event_date: string;
  created_at: string;
  exposure_count: number;
  positive_stances: number;
  negative_stances: number;
  neutral_stances: number;
}

/**
 * FullEventExposure - From full_event_exposures view
 * Complete exposure data with event details
 */
export interface FullEventExposure {
  exposure_id: string;
  agent_id: string;
  exposure_probability: number;
  exposure_level: number;
  interpreted_stance: InterpretedStance;
  mood_impact: number | null;
  exposed_at: string;
  event_id: string;
  event_title: string;
  event_summary: string | null;
  event_category: EventCategory;
  territory_scope: TerritoryScope;
  territory_id: string | null;
  territory_name: string | null;
  event_intensity: number;
  event_source: string | null;
  event_date: string;
}

/**
 * TerritoryEvent - From territory_events view
 * Events aggregated by territory for map display
 */
export interface TerritoryEvent {
  id: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  territory_scope: TerritoryScope;
  territory_id: string;
  territory_name: string;
  territory_short_name: string;
  intensity: number;
  source: string | null;
  source_url: string | null;
  event_date: string;
  created_at: string;
  updated_at: string;
  total_exposures: number;
  avg_exposure_level: number | null;
}

// ============================================================================
// UI TYPES (for frontend components)
// ============================================================================

/**
 * EventForDisplay - Simplified event for UI display
 */
export interface EventForDisplay {
  id: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  categoryLabel: string;
  intensity: number;
  eventDate: Date;
  source: string | null;
  exposureCount?: number;
  stanceDistribution?: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * AgentEventForDisplay - Event with exposure details for agent panel
 */
export interface AgentEventForDisplay {
  exposureId: string;
  eventId: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  categoryLabel: string;
  intensity: number;
  eventDate: Date;
  exposureLevel: number;
  interpretedStance: InterpretedStance;
  stanceLabel: string;
  moodImpact: number | null;
  exposedAt: Date;
}

/**
 * TerritoryEventStats - Statistics for events in a territory
 */
export interface TerritoryEventStats {
  territoryId: string;
  totalEvents: number;
  recentEvents: number;          // Last 30 days
  avgIntensity: number;
  eventsByCategory: Record<EventCategory, number>;
  topEvents: EventForDisplay[];
}

// ============================================================================
// CATEGORY HELPERS
// ============================================================================

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  political: 'Político',
  economic: 'Económico',
  social: 'Social',
  environmental: 'Ambiental',
  security: 'Seguridad',
  health: 'Salud',
  international: 'Internacional',
  other: 'Otro',
};

export const EVENT_CATEGORY_COLORS: Record<EventCategory, string> = {
  political: '#8B5CF6',      // Purple
  economic: '#10B981',       // Emerald
  social: '#F59E0B',         // Amber
  environmental: '#22C55E',  // Green
  security: '#EF4444',       // Red
  health: '#06B6D4',         // Cyan
  international: '#3B82F6',  // Blue
  other: '#6B7280',          // Gray
};

export const STANCE_LABELS: Record<InterpretedStance, string> = {
  positive: 'Positivo',
  negative: 'Negativo',
  neutral: 'Neutral',
  mixed: 'Mixto',
};

export const STANCE_COLORS: Record<InterpretedStance, string> = {
  positive: '#22C55E',  // Green
  negative: '#EF4444',  // Red
  neutral: '#6B7280',   // Gray
  mixed: '#F59E0B',     // Amber
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category label
 */
export function getEventCategoryLabel(category: EventCategory): string {
  return EVENT_CATEGORY_LABELS[category] || category;
}

/**
 * Get category color
 */
export function getEventCategoryColor(category: EventCategory): string {
  return EVENT_CATEGORY_COLORS[category] || '#6B7280';
}

/**
 * Get stance label
 */
export function getStanceLabel(stance: InterpretedStance): string {
  return STANCE_LABELS[stance] || stance;
}

/**
 * Get stance color
 */
export function getStanceColor(stance: InterpretedStance): string {
  return STANCE_COLORS[stance] || '#6B7280';
}

/**
 * Convert Event to EventForDisplay
 */
export function toEventForDisplay(
  event: Event | EventSummary,
  exposureCount?: number,
  stanceDistribution?: { positive: number; negative: number; neutral: number }
): EventForDisplay {
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    category: event.category,
    categoryLabel: getEventCategoryLabel(event.category),
    intensity: event.intensity,
    eventDate: new Date(event.event_date),
    source: event.source,
    exposureCount,
    stanceDistribution,
  };
}

/**
 * Convert FullEventExposure to AgentEventForDisplay
 */
export function toAgentEventForDisplay(exposure: FullEventExposure): AgentEventForDisplay {
  return {
    exposureId: exposure.exposure_id,
    eventId: exposure.event_id,
    title: exposure.event_title,
    summary: exposure.event_summary,
    category: exposure.event_category,
    categoryLabel: getEventCategoryLabel(exposure.event_category),
    intensity: exposure.event_intensity,
    eventDate: new Date(exposure.event_date),
    exposureLevel: exposure.exposure_level,
    interpretedStance: exposure.interpreted_stance,
    stanceLabel: getStanceLabel(exposure.interpreted_stance),
    moodImpact: exposure.mood_impact,
    exposedAt: new Date(exposure.exposed_at),
  };
}

/**
 * Format event date for display
 */
export function formatEventDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "hace 2 días")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatEventDate(d);
}

/**
 * Get intensity label
 */
export function getIntensityLabel(intensity: number): string {
  if (intensity >= 8) return 'Muy Alto';
  if (intensity >= 6) return 'Alto';
  if (intensity >= 4) return 'Medio';
  if (intensity >= 2) return 'Bajo';
  return 'Muy Bajo';
}

/**
 * Get intensity color
 */
export function getIntensityColor(intensity: number): string {
  if (intensity >= 8) return '#EF4444';  // Red
  if (intensity >= 6) return '#F59E0B';  // Amber
  if (intensity >= 4) return '#EAB308';  // Yellow
  if (intensity >= 2) return '#22C55E';  // Green
  return '#6B7280';  // Gray
}

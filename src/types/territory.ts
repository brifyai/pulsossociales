/**
 * Territory Types - Core domain models for territorial data
 * 
 * This module defines the contract for territorial entities in the system.
 * Designed to be backend-agnostic - can be populated from:
 * - Static mocks (current)
 * - Supabase (future)
 * - Convex (future)
 * - GeoJSON + API (future)
 */

import type { EventCategory, EventForDisplay } from './event';

/**
 * Map visualization layers
 * Each layer shows different data dimensions on the territory map
 */
export type MapLayer = 'population' | 'events' | 'survey' | 'results';

/**
 * Macro zones of Chile (groupings of regions)
 * Used for filtering, analytics, and visual grouping
 */
export type MacroZone = 
  | 'norte_grande'      // Arica, Tarapacá, Antofagasta
  | 'norte_chico'       // Atacama, Coquimbo
  | 'centro'            // Valparaíso, Metropolitana, O'Higgins, Maule
  | 'sur'               // Ñuble, Biobío, Araucanía, Los Ríos, Los Lagos
  | 'austral';          // Aysén, Magallanes

/**
 * TerritoryRegion - Core territorial unit
 * 
 * Represents a region in Chile with its geographic position,
 * display properties, and indicator scores for different layers.
 * 
 * Note: x, y are in percentage coordinates (0-100) for the map visualization.
 * This allows responsive rendering without complex geographic projections.
 */
export interface TerritoryRegion {
  /** Unique identifier (e.g., 'metropolitana', 'valparaiso') */
  readonly id: string;
  
  /** Full display name (e.g., 'Región Metropolitana de Santiago') */
  readonly name: string;
  
  /** Short name for compact display (e.g., 'Metropolitana') */
  readonly shortName: string;
  
  /** Capital or representative commune */
  readonly capital: string;
  
  /** Macro zone grouping */
  readonly macroZone: MacroZone;
  
  /** X position on map (0-100, left to right) */
  readonly x: number;
  
  /** Y position on map (0-100, top to bottom) */
  readonly y: number;
  
  /** Visual radius for the region marker (in relative units) */
  readonly radius: number;
  
  // === Indicator Scores (0-100) ===
  // These will be populated from real data sources in the future
  // For now, they use mock values that simulate realistic distributions
  
  /** Population density score (for 'population' layer) */
  readonly populationScore: number;
  
  /** Recent event activity score (for 'events' layer) */
  readonly eventScore: number;
  
  /** Active survey coverage score (for 'survey' layer) */
  readonly surveyScore: number;
  
  /** Completed survey results availability (for 'results' layer) */
  readonly resultScore: number;
  
  // === Metadata ===
  
  /** ISO 3166-2:CL code (e.g., 'CL-RM') */
  readonly isoCode?: string;
  
  /** Approximate population (for reference) */
  readonly population?: number;
  
  /** Area in km² (for reference) */
  readonly areaKm2?: number;
}

/**
 * TerritorySummary - Aggregated statistics for all territories
 * Used for the national-level dashboard
 */
export interface TerritorySummary {
  totalRegions: number;
  totalPopulation: number;
  activeSurveys: number;
  completedSurveys: number;
  recentEvents: number;
}

/**
 * LayerConfig - Configuration for a map visualization layer
 */
export interface LayerConfig {
  id: MapLayer;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  hoverColor: string;
  description: string;
  /** Which field on TerritoryRegion to use for this layer */
  dataField: keyof TerritoryRegion;
}

/**
 * Predefined layer configurations
 * Centralizes visual and behavioral settings for each layer
 * 
 * NOTA: Los labels de capas están diseñados para diferenciarse de los módulos del producto:
 * - "Cobertura" (capa) vs "Encuestas" (módulo de gestión)
 * - "Respuestas" (capa) vs "Resultados" (módulo de análisis)
 * Esto evita confusión entre capas de visualización del mapa y funcionalidades del producto.
 */
export const LAYER_CONFIGS: Record<MapLayer, LayerConfig> = {
  population: {
    id: 'population',
    label: 'Población',
    shortLabel: 'Población',
    icon: '👥',
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-400',
    description: 'Densidad poblacional por región',
    dataField: 'populationScore',
  },
  events: {
    id: 'events',
    label: 'Eventos',
    shortLabel: 'Eventos',
    icon: '📅',
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-400',
    description: 'Eventos recientes en cada región',
    dataField: 'eventScore',
  },
  survey: {
    id: 'survey',
    label: 'Cobertura de Encuestas',
    shortLabel: 'Cobertura',
    icon: '📊',
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-400',
    description: 'Cobertura de encuestas activas por región (visualización)',
    dataField: 'surveyScore',
  },
  results: {
    id: 'results',
    label: 'Respuestas',
    shortLabel: 'Respuestas',
    icon: '📈',
    color: 'bg-amber-500',
    hoverColor: 'hover:bg-amber-400',
    description: 'Respuestas recopiladas por región (visualización)',
    dataField: 'resultScore',
  },
};

/**
 * Get color intensity based on score (0-100)
 * Returns a Tailwind-compatible opacity class
 */
export function getScoreOpacity(score: number): string {
  if (score >= 80) return 'opacity-100';
  if (score >= 60) return 'opacity-80';
  if (score >= 40) return 'opacity-60';
  if (score >= 20) return 'opacity-40';
  return 'opacity-20';
}

/**
 * Get color class for a layer
 */
export function getLayerColorClass(layer: MapLayer, score?: number): string {
  const config = LAYER_CONFIGS[layer];
  const opacity = score !== undefined ? getScoreOpacity(score) : 'opacity-100';
  return `${config.color} ${opacity}`;
}

/**
 * Get all regions in a macro zone
 */
export function getRegionsByMacroZone(
  regions: TerritoryRegion[], 
  zone: MacroZone
): TerritoryRegion[] {
  return regions.filter(r => r.macroZone === zone);
}

/**
 * Calculate territory summary from regions
 */
export function calculateTerritorySummary(regions: TerritoryRegion[]): TerritorySummary {
  return {
    totalRegions: regions.length,
    totalPopulation: regions.reduce((sum, r) => sum + (r.population || 0), 0),
    activeSurveys: regions.filter(r => r.surveyScore > 50).length,
    completedSurveys: regions.filter(r => r.resultScore > 0).length,
    recentEvents: regions.filter(r => r.eventScore > 30).length,
  };
}

// ============================================================================
// EVENT STATS
// ============================================================================

/**
 * TerritoryEventStats - Event statistics for a territory
 * 
 * Used for displaying event information on the map and in region views.
 * Calculated from real event data in the database.
 */
export interface TerritoryEventStats {
  /** Territory ID */
  territoryId: string;
  
  /** Total number of events in this territory */
  totalEvents: number;
  
  /** Number of events in the last 30 days */
  recentEvents: number;
  
  /** Average event intensity (0-10) */
  avgIntensity: number;
  
  /** Events grouped by category */
  eventsByCategory: Record<EventCategory, number>;
  
  /** Top events for display */
  topEvents: EventForDisplay[];
}

/**
 * Territory Repository
 * 
 * Capa de acceso a datos para territorios.
 * Lee desde Supabase con fallback a mocks.
 * 
 * Arquitectura:
 * - Primero intenta leer de Supabase
 * - Si falla o no está configurado, usa mocks
 * - Los mocks están en src/mocks/territories.ts
 * 
 * Uso:
 *   const regions = await getAllRegions();
 *   const region = await getRegionById('metropolitana');
 */

import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  handleSupabaseError 
} from '../lib/supabaseClient';
import { 
  Territory, 
  TerritoryLevel, 
  MacroZone 
} from '../types/supabase';
import { 
  TerritoryRegion, 
  TerritorySummary,
  TerritoryEventStats 
} from '../types/territory';
import { 
  MOCK_REGIONS, 
  MOCK_TERRITORY_SUMMARY,
  getRegionById as getMockRegionById 
} from '../mocks/territories';
import { getTerritoryEventStats } from './eventRepository';

// ============================================================================
// MAPEO: Supabase -> Frontend
// ============================================================================

/**
 * Convierte un Territory de Supabase al formato del frontend
 */
function mapSupabaseToFrontend(territory: Territory): TerritoryRegion {
  return {
    id: territory.id,
    name: territory.name,
    shortName: territory.short_name,
    capital: territory.capital || '',
    macroZone: territory.macro_zone as MacroZone,
    x: territory.map_x ?? 0,
    y: territory.map_y ?? 0,
    radius: territory.map_radius ?? 3,
    populationScore: territory.population_score ?? 0,
    eventScore: territory.event_score ?? 0,
    surveyScore: territory.survey_score ?? 0,
    resultScore: territory.result_score ?? 0,
    isoCode: territory.iso_code || '',
    population: territory.population || 0,
    areaKm2: territory.area_km2 || 0,
  };
}

/**
 * Calcula el resumen territorial desde datos de Supabase
 */
function calculateSummaryFromTerritories(territories: Territory[]): TerritorySummary {
  const regions = territories.map(mapSupabaseToFrontend);
  return {
    totalRegions: regions.length,
    totalPopulation: regions.reduce((sum, r) => sum + (r.population || 0), 0),
    activeSurveys: regions.filter(r => r.surveyScore > 50).length,
    completedSurveys: regions.filter(r => r.resultScore > 0).length,
    recentEvents: regions.filter(r => r.eventScore > 30).length,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Obtiene todas las regiones
 * Fallback a mocks si Supabase no está disponible
 */
export async function getAllRegions(): Promise<TerritoryRegion[]> {
  // Si Supabase no está configurado, usar mocks
  if (!isSupabaseConfigured()) {
    console.log('[TerritoryRepository] Supabase no configurado, usando mocks');
    return MOCK_REGIONS;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .eq('level', 'region')
      .order('map_y', { ascending: true });

    if (error) {
      console.warn('[TerritoryRepository] Error de Supabase, usando mocks:', error.message);
      return MOCK_REGIONS;
    }

    if (!data || data.length === 0) {
      console.warn('[TerritoryRepository] No hay datos en Supabase, usando mocks');
      return MOCK_REGIONS;
    }

    return data.map(mapSupabaseToFrontend);
  } catch (error) {
    console.warn('[TerritoryRepository] Error, usando mocks:', error);
    return MOCK_REGIONS;
  }
}

/**
 * Obtiene una región por ID
 * Fallback a mocks si Supabase no está disponible
 */
export async function getRegionById(id: string): Promise<TerritoryRegion | null> {
  // Si Supabase no está configurado, usar mocks
  if (!isSupabaseConfigured()) {
    return getMockRegionById(id) || null;
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn(`[TerritoryRepository] Error al obtener región ${id}, usando mocks:`, error.message);
      return getMockRegionById(id) || null;
    }

    if (!data) {
      console.warn(`[TerritoryRepository] Región ${id} no encontrada en Supabase, usando mocks`);
      return getMockRegionById(id) || null;
    }

    return mapSupabaseToFrontend(data);
  } catch (error) {
    console.warn(`[TerritoryRepository] Error al obtener región ${id}, usando mocks:`, error);
    return getMockRegionById(id) || null;
  }
}

/**
 * Obtiene regiones por macro zona
 */
export async function getRegionsByMacroZone(zone: MacroZone): Promise<TerritoryRegion[]> {
  const allRegions = await getAllRegions();
  return allRegions.filter(r => r.macroZone === zone);
}

/**
 * Obtiene el resumen territorial
 */
export async function getTerritorySummary(): Promise<TerritorySummary> {
  // Si Supabase no está configurado, usar mocks
  if (!isSupabaseConfigured()) {
    return MOCK_TERRITORY_SUMMARY;
  }

  try {
    const regions = await getAllRegions();
    return {
      totalRegions: regions.length,
      totalPopulation: regions.reduce((sum, r) => sum + (r.population || 0), 0),
      activeSurveys: regions.filter(r => r.surveyScore > 50).length,
      completedSurveys: regions.filter(r => r.resultScore > 0).length,
      recentEvents: regions.filter(r => r.eventScore > 30).length,
    };
  } catch (error) {
    console.warn('[TerritoryRepository] Error al calcular resumen, usando mocks:', error);
    return MOCK_TERRITORY_SUMMARY;
  }
}

/**
 * Obtiene territorios hijos (comunas de una región)
 * Nota: Por ahora solo devuelve mocks ya que no tenemos comunas en seeds
 */
export async function getChildTerritories(parentId: string): Promise<TerritoryRegion[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('territories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(mapSupabaseToFrontend);
  } catch (error) {
    return [];
  }
}

// ============================================================================
// ESTADÍSTICAS DE EVENTOS
// ============================================================================

/**
 * Obtiene todas las regiones con estadísticas de eventos actualizadas
 * Calcula el eventScore basado en eventos reales de la base de datos
 * Fallback a mocks si Supabase no está disponible
 */
export async function getAllRegionsWithEventStats(): Promise<TerritoryRegion[]> {
  // Si Supabase no está configurado, usar mocks
  if (!isSupabaseConfigured()) {
    console.log('[TerritoryRepository] Supabase no configurado, usando mocks con eventos');
    return MOCK_REGIONS;
  }

  try {
    // Obtener regiones base
    const regions = await getAllRegions();
    
    // Para cada región, obtener estadísticas de eventos
    const regionsWithStats = await Promise.all(
      regions.map(async (region) => {
        try {
          const eventStats = await getTerritoryEventStats(region.id);
          
          // Calcular eventScore basado en estadísticas reales
          // Fórmula: (totalEvents * 10 + avgIntensity * 10 + recentEvents * 20) / 4
          const calculatedScore = Math.min(100, Math.round(
            (eventStats.totalEvents * 5) + 
            (eventStats.avgIntensity * 8) + 
            (eventStats.recentEvents * 15)
          ) / 4);
          
          return {
            ...region,
            eventScore: Math.round(calculatedScore),
          };
        } catch (err) {
          // Si falla el cálculo de eventos, mantener el score original
          console.warn(`[TerritoryRepository] Error al calcular eventos para ${region.id}:`, err);
          return region;
        }
      })
    );

    return regionsWithStats;
  } catch (error) {
    console.warn('[TerritoryRepository] Error al obtener regiones con eventos, usando mocks:', error);
    return MOCK_REGIONS;
  }
}

/**
 * Obtiene una región por ID con estadísticas de eventos actualizadas
 */
export async function getRegionByIdWithEventStats(id: string): Promise<TerritoryRegion | null> {
  // Obtener región base
  const region = await getRegionById(id);
  
  if (!region) {
    return null;
  }

  // Si Supabase no está configurado, devolver región sin modificar
  if (!isSupabaseConfigured()) {
    return region;
  }

  try {
    const eventStats = await getTerritoryEventStats(id);
    
    // Calcular eventScore basado en estadísticas reales
    const calculatedScore = Math.min(100, Math.round(
      (eventStats.totalEvents * 5) + 
      (eventStats.avgIntensity * 8) + 
      (eventStats.recentEvents * 15)
    ) / 4);
    
    return {
      ...region,
      eventScore: Math.round(calculatedScore),
    };
  } catch (err) {
    console.warn(`[TerritoryRepository] Error al calcular eventos para ${id}:`, err);
    return region;
  }
}

// ============================================================================
// SINCRONIZACIÓN (para migrar mocks a Supabase)
// ============================================================================

/**
 * Sincroniza los mocks de territorios a Supabase
 * Útil para poblar la base de datos inicialmente
 */
export async function syncMockTerritoriesToSupabase(): Promise<{
  success: boolean;
  inserted: number;
  errors: string[];
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, inserted: 0, errors: ['Supabase no configurado'] };
  }

  const errors: string[] = [];
  let inserted = 0;

  try {
    const supabase = getSupabaseClient();
    
    // Primero insertar Chile como país
    const { error: countryError } = await supabase
      .from('territories')
      .upsert({
        id: 'chile',
        name: 'República de Chile',
        short_name: 'Chile',
        parent_id: null,
        level: 'country' as TerritoryLevel,
        macro_zone: null,
        capital: 'Santiago',
        population: 19629590,
        area_km2: 756102,
        map_x: 42,
        map_y: 90,
        map_radius: 8,
        population_score: 100,
        event_score: 100,
        survey_score: 100,
        result_score: 100,
        iso_code: 'CL',
        ine_code: null,
      } as any, { onConflict: 'id' });

    if (countryError) {
      errors.push(`Error al insertar Chile: ${countryError.message}`);
    } else {
      inserted++;
    }

    // Luego insertar regiones
    for (const region of MOCK_REGIONS) {
      const { error } = await supabase
        .from('territories')
        .upsert({
          id: region.id,
          name: region.name,
          short_name: region.shortName,
          parent_id: 'chile',
          level: 'region' as TerritoryLevel,
          macro_zone: region.macroZone,
          capital: region.capital,
          population: region.population,
          area_km2: region.areaKm2,
          map_x: region.x,
          map_y: region.y,
          map_radius: region.radius,
          population_score: region.populationScore,
          event_score: region.eventScore,
          survey_score: region.surveyScore,
          result_score: region.resultScore,
          iso_code: region.isoCode,
          ine_code: null,
        } as any, { onConflict: 'id' });

      if (error) {
        errors.push(`Error al insertar ${region.id}: ${error.message}`);
      } else {
        inserted++;
      }
    }

    return { success: errors.length === 0, inserted, errors };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { success: false, inserted, errors: [...errors, err.message] };
  }
}

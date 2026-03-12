import { TerritoryRegion, TerritorySummary, calculateTerritorySummary } from '../types/territory';

/**
 * Mock Territories - Chilean Regions
 * 
 * This module provides mock data for Chilean regions.
 * In the future, this will be replaced with data from:
 * - Supabase (territorial data)
 * - Census API (population data)
 * - Event engine (event scores)
 * - Survey engine (survey scores)
 * 
 * Data sources used for realistic mock values:
 * - Population: INE 2017 Census projections
 * - Positions: Approximate geographic center in simplified map coordinates
 * - Scores: Simulated distributions based on real demographic patterns
 */

/**
 * All 16 regions of Chile with realistic mock data
 * 
 * Coordinate system:
 * - x: 0-100 (west to east)
 * - y: 0-140 (north to south, stretched for Chile's shape)
 * 
 * Population scores reflect actual density patterns:
 * - Metropolitana: highest (40% of national population)
 * - Valparaíso, Biobío: high
 * - Magallanes, Aysén: lowest
 */
export const MOCK_REGIONS: TerritoryRegion[] = [
  // === NORTE GRANDE ===
  {
    id: 'arica',
    name: 'Región de Arica y Parinacota',
    shortName: 'Arica',
    capital: 'Arica',
    macroZone: 'norte_grande',
    x: 55,
    y: 5,
    radius: 3.5,
    populationScore: 25,
    eventScore: 40,
    surveyScore: 30,
    resultScore: 20,
    isoCode: 'CL-AP',
    population: 252_110,
    areaKm2: 16_873,
  },
  {
    id: 'tarapaca',
    name: 'Región de Tarapacá',
    shortName: 'Tarapacá',
    capital: 'Iquique',
    macroZone: 'norte_grande',
    x: 52,
    y: 15,
    radius: 4,
    populationScore: 35,
    eventScore: 45,
    surveyScore: 35,
    resultScore: 25,
    isoCode: 'CL-TA',
    population: 382_773,
    areaKm2: 42_226,
  },
  {
    id: 'antofagasta',
    name: 'Región de Antofagasta',
    shortName: 'Antofagasta',
    capital: 'Antofagasta',
    macroZone: 'norte_grande',
    x: 48,
    y: 28,
    radius: 5,
    populationScore: 45,
    eventScore: 50,
    surveyScore: 40,
    resultScore: 30,
    isoCode: 'CL-AN',
    population: 607_659,
    areaKm2: 126_049,
  },

  // === NORTE CHICO ===
  {
    id: 'atacama',
    name: 'Región de Atacama',
    shortName: 'Atacama',
    capital: 'Copiapó',
    macroZone: 'norte_chico',
    x: 45,
    y: 42,
    radius: 4.5,
    populationScore: 20,
    eventScore: 35,
    surveyScore: 25,
    resultScore: 15,
    isoCode: 'CL-AT',
    population: 314_709,
    areaKm2: 75_176,
  },
  {
    id: 'coquimbo',
    name: 'Región de Coquimbo',
    shortName: 'Coquimbo',
    capital: 'La Serena',
    macroZone: 'norte_chico',
    x: 42,
    y: 55,
    radius: 4,
    populationScore: 40,
    eventScore: 55,
    surveyScore: 45,
    resultScore: 35,
    isoCode: 'CL-CO',
    population: 836_096,
    areaKm2: 40_580,
  },

  // === CENTRO ===
  {
    id: 'valparaiso',
    name: 'Región de Valparaíso',
    shortName: 'Valparaíso',
    capital: 'Valparaíso',
    macroZone: 'centro',
    x: 38,
    y: 68,
    radius: 5,
    populationScore: 75,
    eventScore: 70,
    surveyScore: 65,
    resultScore: 60,
    isoCode: 'CL-VS',
    population: 1_971_000,
    areaKm2: 16_396,
  },
  {
    id: 'metropolitana',
    name: 'Región Metropolitana de Santiago',
    shortName: 'Metropolitana',
    capital: 'Santiago',
    macroZone: 'centro',
    x: 42,
    y: 78,
    radius: 6,
    populationScore: 100,
    eventScore: 90,
    surveyScore: 85,
    resultScore: 80,
    isoCode: 'CL-RM',
    population: 7_307_000,
    areaKm2: 15_403,
  },
  {
    id: 'ohiggins',
    name: "Región del Libertador General Bernardo O'Higgins",
    shortName: "O'Higgins",
    capital: 'Rancagua',
    macroZone: 'centro',
    x: 38,
    y: 88,
    radius: 4,
    populationScore: 50,
    eventScore: 45,
    surveyScore: 40,
    resultScore: 35,
    isoCode: 'CL-LI',
    population: 991_000,
    areaKm2: 16_387,
  },
  {
    id: 'maule',
    name: 'Región del Maule',
    shortName: 'Maule',
    capital: 'Talca',
    macroZone: 'centro',
    x: 40,
    y: 98,
    radius: 4.5,
    populationScore: 45,
    eventScore: 40,
    surveyScore: 35,
    resultScore: 30,
    isoCode: 'CL-ML',
    population: 1_083_000,
    areaKm2: 30_296,
  },

  // === SUR ===
  {
    id: 'nuble',
    name: 'Región de Ñuble',
    shortName: 'Ñuble',
    capital: 'Chillán',
    macroZone: 'sur',
    x: 42,
    y: 108,
    radius: 3.5,
    populationScore: 35,
    eventScore: 30,
    surveyScore: 25,
    resultScore: 20,
    isoCode: 'CL-NB',
    population: 511_000,
    areaKm2: 13_179,
  },
  {
    id: 'biobio',
    name: 'Región del Biobío',
    shortName: 'Biobío',
    capital: 'Concepción',
    macroZone: 'sur',
    x: 38,
    y: 115,
    radius: 5,
    populationScore: 80,
    eventScore: 75,
    surveyScore: 70,
    resultScore: 65,
    isoCode: 'CL-BI',
    population: 1_670_000,
    areaKm2: 23_890,
  },
  {
    id: 'araucania',
    name: 'Región de La Araucanía',
    shortName: 'Araucanía',
    capital: 'Temuco',
    macroZone: 'sur',
    x: 40,
    y: 125,
    radius: 5,
    populationScore: 55,
    eventScore: 50,
    surveyScore: 45,
    resultScore: 40,
    isoCode: 'CL-AR',
    population: 1_007_000,
    areaKm2: 31_842,
  },
  {
    id: 'rios',
    name: 'Región de Los Ríos',
    shortName: 'Los Ríos',
    capital: 'Valdivia',
    macroZone: 'sur',
    x: 42,
    y: 135,
    radius: 3.5,
    populationScore: 25,
    eventScore: 30,
    surveyScore: 25,
    resultScore: 20,
    isoCode: 'CL-LR',
    population: 405_000,
    areaKm2: 18_430,
  },
  {
    id: 'lagos',
    name: 'Región de Los Lagos',
    shortName: 'Los Lagos',
    capital: 'Puerto Montt',
    macroZone: 'sur',
    x: 40,
    y: 145,
    radius: 5,
    populationScore: 40,
    eventScore: 45,
    surveyScore: 40,
    resultScore: 35,
    isoCode: 'CL-LL',
    population: 891_000,
    areaKm2: 48_584,
  },

  // === AUSTRAL ===
  {
    id: 'aysen',
    name: 'Región de Aysén del General Carlos Ibáñez del Campo',
    shortName: 'Aysén',
    capital: 'Coyhaique',
    macroZone: 'austral',
    x: 45,
    y: 160,
    radius: 4,
    populationScore: 10,
    eventScore: 20,
    surveyScore: 15,
    resultScore: 10,
    isoCode: 'CL-AI',
    population: 107_000,
    areaKm2: 108_494,
  },
  {
    id: 'magallanes',
    name: 'Región de Magallanes y de la Antártica Chilena',
    shortName: 'Magallanes',
    capital: 'Punta Arenas',
    macroZone: 'austral',
    x: 50,
    y: 175,
    radius: 5,
    populationScore: 15,
    eventScore: 25,
    surveyScore: 20,
    resultScore: 15,
    isoCode: 'CL-MA',
    population: 178_000,
    areaKm2: 132_297,
  },
];

/**
 * Pre-calculated territory summary
 */
export const MOCK_TERRITORY_SUMMARY: TerritorySummary = calculateTerritorySummary(MOCK_REGIONS);

/**
 * Get a region by ID
 */
export function getRegionById(id: string): TerritoryRegion | undefined {
  return MOCK_REGIONS.find(r => r.id === id);
}

/**
 * Get regions by macro zone
 */
export function getRegionsByZone(zone: TerritoryRegion['macroZone']): TerritoryRegion[] {
  return MOCK_REGIONS.filter(r => r.macroZone === zone);
}

/**
 * Get top regions by a specific score
 */
export function getTopRegionsByScore(
  scoreField: keyof TerritoryRegion,
  limit: number = 5
): TerritoryRegion[] {
  return [...MOCK_REGIONS]
    .sort((a, b) => (b[scoreField] as number) - (a[scoreField] as number))
    .slice(0, limit);
}

/**
 * Get regions with active surveys
 */
export function getRegionsWithActiveSurveys(): TerritoryRegion[] {
  return MOCK_REGIONS.filter(r => r.surveyScore > 50);
}

/**
 * Get regions with recent events
 */
export function getRegionsWithRecentEvents(): TerritoryRegion[] {
  return MOCK_REGIONS.filter(r => r.eventScore > 30);
}

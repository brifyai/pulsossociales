import { 
  FullAgent, 
  AgentSummary, 
  toAgentSummary, 
  getAgentDescription,
  isAgentAvailable,
  UrbanRural,
  Sex,
  EducationLevel,
  EmploymentStatus,
  HouseholdType,
  ConnectivityType,
  Mood,
} from '../types/agent';

/**
 * Mock Agents - Synthetic population for development
 * 
 * This module provides realistic mock agents aligned with the FullAgent contract.
 * In production, this will be replaced with:
 * - Supabase (profile, traits)
 * - Convex (memory, state, events)
 * 
 * Agents are distributed across Chilean regions with realistic demographics.
 * Each agent has complete data for all dimensions: profile, traits, memory, state, events.
 */

// ============================================================================
// MOCK AGENTS
// ============================================================================

export const MOCK_AGENTS: FullAgent[] = [
  // === REGIÓN METROPOLITANA ===
  {
    profile: {
      id: 'agent-001',
      name: 'María González',
      regionId: 'metropolitana',
      commune: 'Santiago',
      urbanRural: 'urban',
      sex: 'female',
      age: 34,
      educationLevel: 'university',
      employmentStatus: 'employed',
      incomeDecile: 6,
      householdSize: 3,
      householdType: 'couple',
      hasChildren: true,
      connectivityType: 'fiber',
      digitalAccessScore: 85,
      weight: 1.2,
      character: 'f1',
      description: 'Profesional de marketing, madre de un niño, muy activa en redes sociales',
    },
    traits: {
      institutionalTrust: 45,
      riskAversion: 60,
      digitalLiteracy: 90,
      patience: 70,
      civicInterest: 75,
      socialDesirability: 65,
      opennessChange: 80,
      ideologyScore: 55,
      nationalismScore: 50,
      consistencyScore: 85,
    },
    memory: {
      summary: 'María es una profesional urbana progresista que valora la educación y la tecnología. Es escéptica de las instituciones políticas tradicionales pero participativa en causas sociales.',
      salientTopics: ['educación', 'tecnología', 'medio ambiente', 'igualdad de género'],
      previousPositions: [
        { topic: 'educación pública', stance: 'a favor de más inversión', timestamp: new Date('2024-01-15'), source: 'survey' },
        { topic: 'teletrabajo', stance: 'muy positivo', timestamp: new Date('2024-02-20'), source: 'conversation' },
      ],
      contradictionScore: 15,
    },
    state: {
      fatigue: 20,
      economicStress: 30,
      mood: 'positive',
      surveySaturation: 1,
      lastActivationAt: new Date('2024-03-15'),
      isActive: true,
    },
    events: [
      {
        eventId: 'evt-001',
        exposureProbability: 90,
        exposureLevel: 85,
        interpretedStance: 'positivo',
        moodImpact: 10,
        exposedAt: new Date('2024-03-10'),
      },
    ],
  },

  {
    profile: {
      id: 'agent-002',
      name: 'Carlos Rodríguez',
      regionId: 'metropolitana',
      commune: 'Providencia',
      urbanRural: 'urban',
      sex: 'male',
      age: 52,
      educationLevel: 'postgraduate',
      employmentStatus: 'employed',
      incomeDecile: 9,
      householdSize: 2,
      householdType: 'couple',
      hasChildren: false,
      connectivityType: 'fiber',
      digitalAccessScore: 75,
      weight: 0.8,
      character: 'f4',
      description: 'Ejecutivo de empresa, conservador, preocupado por la seguridad económica',
    },
    traits: {
      institutionalTrust: 70,
      riskAversion: 80,
      digitalLiteracy: 60,
      patience: 85,
      civicInterest: 60,
      socialDesirability: 50,
      opennessChange: 40,
      ideologyScore: 75,
      nationalismScore: 70,
      consistencyScore: 90,
    },
    memory: {
      summary: 'Carlos es un ejecutivo conservador que valora la estabilidad económica y las instituciones tradicionales. Es cauteloso con los cambios rápidos y prefiere soluciones probadas.',
      salientTopics: ['economía', 'seguridad', 'orden público', 'impuestos'],
      previousPositions: [
        { topic: 'reforma tributaria', stance: 'en contra de aumentos', timestamp: new Date('2024-01-20'), source: 'survey' },
        { topic: 'inversión extranjera', stance: 'muy a favor', timestamp: new Date('2024-02-15'), source: 'survey' },
      ],
      contradictionScore: 10,
    },
    state: {
      fatigue: 45,
      economicStress: 25,
      mood: 'neutral',
      surveySaturation: 2,
      lastActivationAt: new Date('2024-03-14'),
      isActive: true,
    },
    events: [],
  },

  {
    profile: {
      id: 'agent-003',
      name: 'Lucía Fernández',
      regionId: 'metropolitana',
      commune: 'La Florida',
      urbanRural: 'urban',
      sex: 'female',
      age: 67,
      educationLevel: 'secondary',
      employmentStatus: 'retired',
      incomeDecile: 4,
      householdSize: 1,
      householdType: 'single',
      hasChildren: false,
      connectivityType: 'mobile',
      digitalAccessScore: 40,
      weight: 1.5,
      character: 'f6',
      description: 'Jubilada, vive sola, usa poco internet, muy interesada en temas de salud',
    },
    traits: {
      institutionalTrust: 55,
      riskAversion: 75,
      digitalLiteracy: 30,
      patience: 60,
      civicInterest: 70,
      socialDesirability: 70,
      opennessChange: 45,
      ideologyScore: 45,
      nationalismScore: 60,
      consistencyScore: 80,
    },
    memory: {
      summary: 'Lucía es una jubilada preocupada principalmente por temas de salud y pensiones. Valora la tradición y la familia, pero es receptiva a propuestas que mejoren su calidad de vida.',
      salientTopics: ['salud', 'pensiones', 'familia', 'seguridad ciudadana'],
      previousPositions: [
        { topic: 'sistema de salud', stance: 'necesita mejoras urgentes', timestamp: new Date('2024-02-01'), source: 'survey' },
      ],
      contradictionScore: 20,
    },
    state: {
      fatigue: 60,
      economicStress: 65,
      mood: 'neutral',
      surveySaturation: 1,
      lastActivationAt: new Date('2024-03-12'),
      isActive: true,
    },
    events: [],
  },

  // === REGIÓN DE VALPARAÍSO ===
  {
    profile: {
      id: 'agent-004',
      name: 'Diego Martínez',
      regionId: 'valparaiso',
      commune: 'Valparaíso',
      urbanRural: 'urban',
      sex: 'male',
      age: 28,
      educationLevel: 'university',
      employmentStatus: 'unemployed',
      incomeDecile: 3,
      householdSize: 4,
      householdType: 'extended',
      hasChildren: false,
      connectivityType: 'mobile',
      digitalAccessScore: 70,
      weight: 1.3,
      character: 'f3',
      description: 'Recién graduado buscando trabajo, vive con familia extendida, muy activo políticamente',
    },
    traits: {
      institutionalTrust: 25,
      riskAversion: 40,
      digitalLiteracy: 85,
      patience: 45,
      civicInterest: 90,
      socialDesirability: 55,
      opennessChange: 95,
      ideologyScore: 25,
      nationalismScore: 40,
      consistencyScore: 70,
    },
    memory: {
      summary: 'Diego es un joven graduado frustrado con la falta de oportunidades laborales. Es muy activo en redes sociales y participa en movimientos sociales. Desconfía fuertemente de las instituciones.',
      salientTopics: ['empleo', 'desigualdad', 'educación', 'corrupción'],
      previousPositions: [
        { topic: 'sistema político', stance: 'necesita cambio radical', timestamp: new Date('2024-01-10'), source: 'conversation' },
        { topic: 'protestas sociales', stance: 'apoya', timestamp: new Date('2024-02-25'), source: 'event' },
      ],
      contradictionScore: 30,
    },
    state: {
      fatigue: 35,
      economicStress: 85,
      mood: 'stressed',
      surveySaturation: 3,
      lastActivationAt: new Date('2024-03-15'),
      isActive: true,
    },
    events: [
      {
        eventId: 'evt-002',
        exposureProbability: 95,
        exposureLevel: 90,
        interpretedStance: 'negativo',
        moodImpact: -15,
        exposedAt: new Date('2024-03-08'),
      },
    ],
  },

  {
    profile: {
      id: 'agent-005',
      name: 'Ana Silva',
      regionId: 'valparaiso',
      commune: 'Viña del Mar',
      urbanRural: 'urban',
      sex: 'female',
      age: 41,
      educationLevel: 'university',
      employmentStatus: 'employed',
      incomeDecile: 7,
      householdSize: 3,
      householdType: 'single_parent',
      hasChildren: true,
      connectivityType: 'fiber',
      digitalAccessScore: 80,
      weight: 1.0,
      character: 'f7',
      description: 'Profesora universitaria, madre soltera, equilibrada, interesada en educación',
    },
    traits: {
      institutionalTrust: 50,
      riskAversion: 55,
      digitalLiteracy: 75,
      patience: 80,
      civicInterest: 80,
      socialDesirability: 60,
      opennessChange: 70,
      ideologyScore: 50,
      nationalismScore: 55,
      consistencyScore: 85,
    },
    memory: {
      summary: 'Ana es una profesora equilibrada que busca el bienestar de sus hijos y estudiantes. Tiene opiniones moderadas pero bien fundamentadas. Valora la educación por encima de todo.',
      salientTopics: ['educación', 'familia', 'cultura', 'medio ambiente'],
      previousPositions: [
        { topic: 'reforma educacional', stance: 'a favor si es bien implementada', timestamp: new Date('2024-02-10'), source: 'survey' },
      ],
      contradictionScore: 10,
    },
    state: {
      fatigue: 40,
      economicStress: 40,
      mood: 'positive',
      surveySaturation: 1,
      lastActivationAt: new Date('2024-03-13'),
      isActive: true,
    },
    events: [],
  },

  // === REGIÓN DEL BIOBÍO ===
  {
    profile: {
      id: 'agent-006',
      name: 'Roberto Soto',
      regionId: 'biobio',
      commune: 'Concepción',
      urbanRural: 'urban',
      sex: 'male',
      age: 45,
      educationLevel: 'technical',
      employmentStatus: 'employed',
      incomeDecile: 5,
      householdSize: 4,
      householdType: 'couple',
      hasChildren: true,
      connectivityType: 'cable',
      digitalAccessScore: 65,
      weight: 1.1,
      character: 'f2',
      description: 'Técnico industrial, padre de familia, pragmático, preocupado por economía regional',
    },
    traits: {
      institutionalTrust: 60,
      riskAversion: 70,
      digitalLiteracy: 55,
      patience: 75,
      civicInterest: 65,
      socialDesirability: 55,
      opennessChange: 50,
      ideologyScore: 60,
      nationalismScore: 65,
      consistencyScore: 80,
    },
    memory: {
      summary: 'Roberto es un trabajador industrial pragmático que valora la estabilidad laboral. Está preocupado por el futuro de la industria regional y la educación de sus hijos.',
      salientTopics: ['trabajo', 'industria', 'educación técnica', 'región'],
      previousPositions: [
        { topic: 'industria manufacturera', stance: 'necesita apoyo estatal', timestamp: new Date('2024-01-25'), source: 'survey' },
      ],
      contradictionScore: 15,
    },
    state: {
      fatigue: 50,
      economicStress: 55,
      mood: 'neutral',
      surveySaturation: 2,
      lastActivationAt: new Date('2024-03-14'),
      isActive: true,
    },
    events: [],
  },

  {
    profile: {
      id: 'agent-007',
      name: 'Carmen López',
      regionId: 'biobio',
      commune: 'Los Ángeles',
      urbanRural: 'rural',
      sex: 'female',
      age: 56,
      educationLevel: 'secondary',
      employmentStatus: 'inactive',
      incomeDecile: 3,
      householdSize: 5,
      householdType: 'extended',
      hasChildren: true,
      connectivityType: 'mobile',
      digitalAccessScore: 35,
      weight: 1.4,
      character: 'f5',
      description: 'Ama de casa rural, madre de tres, poco uso de tecnología, valores tradicionales',
    },
    traits: {
      institutionalTrust: 65,
      riskAversion: 80,
      digitalLiteracy: 25,
      patience: 70,
      civicInterest: 50,
      socialDesirability: 75,
      opennessChange: 35,
      ideologyScore: 70,
      nationalismScore: 75,
      consistencyScore: 85,
    },
    memory: {
      summary: 'Carmen es una ama de casa rural con valores tradicionales fuertes. Su familia es lo más importante. Tiene poco contacto con tecnología y prefiere la vida tranquila del campo.',
      salientTopics: ['familia', 'tradición', 'religión', 'campo'],
      previousPositions: [
        { topic: 'cambios sociales', stance: 'prefiere gradualidad', timestamp: new Date('2024-02-05'), source: 'conversation' },
      ],
      contradictionScore: 10,
    },
    state: {
      fatigue: 30,
      economicStress: 50,
      mood: 'positive',
      surveySaturation: 0,
      lastActivationAt: new Date('2024-03-10'),
      isActive: true,
    },
    events: [],
  },

  // === REGIÓN DE LA ARAUCANÍA ===
  {
    profile: {
      id: 'agent-008',
      name: 'Pedro Catrileo',
      regionId: 'araucania',
      commune: 'Temuco',
      urbanRural: 'semiurban',
      sex: 'male',
      age: 38,
      educationLevel: 'university',
      employmentStatus: 'employed',
      incomeDecile: 4,
      householdSize: 6,
      householdType: 'extended',
      hasChildren: true,
      connectivityType: 'dsl',
      digitalAccessScore: 55,
      weight: 1.3,
      character: 'f8',
      description: 'Trabajador social mapuche, defensor de derechos indígenas, muy comprometido',
    },
    traits: {
      institutionalTrust: 20,
      riskAversion: 50,
      digitalLiteracy: 60,
      patience: 65,
      civicInterest: 95,
      socialDesirability: 50,
      opennessChange: 75,
      ideologyScore: 30,
      nationalismScore: 30,
      consistencyScore: 90,
    },
    memory: {
      summary: 'Pedro es un activista mapuche comprometido con la causa indígena. Desconfía del estado chileno pero trabaja constructivamente por el reconocimiento de derechos.',
      salientTopics: ['derechos indígenas', 'territorio', 'cultura mapuche', 'justicia social'],
      previousPositions: [
        { topic: 'conflicto mapuche', stance: 'diálogo y reconocimiento', timestamp: new Date('2024-01-30'), source: 'event' },
        { topic: 'autonomía territorial', stance: 'derecho histórico', timestamp: new Date('2024-02-20'), source: 'conversation' },
      ],
      contradictionScore: 5,
    },
    state: {
      fatigue: 55,
      economicStress: 60,
      mood: 'stressed',
      surveySaturation: 4,
      lastActivationAt: new Date('2024-03-15'),
      isActive: true,
    },
    events: [
      {
        eventId: 'evt-003',
        exposureProbability: 100,
        exposureLevel: 95,
        interpretedStance: 'negativo',
        moodImpact: -20,
        exposedAt: new Date('2024-03-12'),
      },
    ],
  },

  // === REGIÓN DE MAGALLANES ===
  {
    profile: {
      id: 'agent-009',
      name: 'Elena Rojas',
      regionId: 'magallanes',
      commune: 'Punta Arenas',
      urbanRural: 'urban',
      sex: 'female',
      age: 29,
      educationLevel: 'university',
      employmentStatus: 'employed',
      incomeDecile: 6,
      householdSize: 2,
      householdType: 'couple',
      hasChildren: false,
      connectivityType: 'satellite',
      digitalAccessScore: 50,
      weight: 1.8,
      character: 'f1',
      description: 'Bióloga marina, apasionada por la naturaleza, preocupada por cambio climático',
    },
    traits: {
      institutionalTrust: 40,
      riskAversion: 45,
      digitalLiteracy: 70,
      patience: 75,
      civicInterest: 85,
      socialDesirability: 60,
      opennessChange: 85,
      ideologyScore: 40,
      nationalismScore: 45,
      consistencyScore: 80,
    },
    memory: {
      summary: 'Elena es una científica apasionada por la naturaleza patagónica. Su trabajo la ha hecho muy consciente del cambio climático. Es independiente y pragmática.',
      salientTopics: ['medio ambiente', 'cambio climático', 'ciencia', 'naturaleza'],
      previousPositions: [
        { topic: 'protección ambiental', stance: 'urgente y necesario', timestamp: new Date('2024-02-15'), source: 'survey' },
      ],
      contradictionScore: 10,
    },
    state: {
      fatigue: 25,
      economicStress: 35,
      mood: 'positive',
      surveySaturation: 1,
      lastActivationAt: new Date('2024-03-14'),
      isActive: true,
    },
    events: [],
  },

  {
    profile: {
      id: 'agent-010',
      name: 'José Muñoz',
      regionId: 'magallanes',
      commune: 'Puerto Natales',
      urbanRural: 'rural',
      sex: 'male',
      age: 62,
      educationLevel: 'primary',
      employmentStatus: 'retired',
      incomeDecile: 2,
      householdSize: 1,
      householdType: 'single',
      hasChildren: false,
      connectivityType: 'mobile',
      digitalAccessScore: 25,
      weight: 2.0,
      character: 'f4',
      description: 'Ex trabajador del petróleo, jubilado, vive solo, poco contacto con el mundo digital',
    },
    traits: {
      institutionalTrust: 50,
      riskAversion: 85,
      digitalLiteracy: 15,
      patience: 60,
      civicInterest: 40,
      socialDesirability: 65,
      opennessChange: 30,
      ideologyScore: 65,
      nationalismScore: 70,
      consistencyScore: 75,
    },
    memory: {
      summary: 'José es un jubilado de la industria petrolera que extraña los tiempos pasados. Vive aislado y tiene poco contacto con tecnología. Valora el trabajo duro.',
      salientTopics: ['trabajo', 'jubilación', 'industria', 'pasado'],
      previousPositions: [
        { topic: 'industria extractiva', stance: 'necesaria para la región', timestamp: new Date('2024-02-01'), source: 'conversation' },
      ],
      contradictionScore: 20,
    },
    state: {
      fatigue: 70,
      economicStress: 75,
      mood: 'negative',
      surveySaturation: 0,
      lastActivationAt: new Date('2024-03-08'),
      isActive: true,
    },
    events: [],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all agents as summaries (for lists)
 */
export function getAllAgentSummaries(): AgentSummary[] {
  return MOCK_AGENTS.map(toAgentSummary);
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): FullAgent | undefined {
  return MOCK_AGENTS.find(a => a.profile.id === id);
}

/**
 * Get agents by region
 */
export function getAgentsByRegion(regionId: string): FullAgent[] {
  return MOCK_AGENTS.filter(a => a.profile.regionId === regionId);
}

/**
 * Get agent summaries by region
 */
export function getAgentSummariesByRegion(regionId: string): AgentSummary[] {
  return getAgentsByRegion(regionId).map(toAgentSummary);
}

/**
 * Get available agents (ready for surveys)
 */
export function getAvailableAgents(): FullAgent[] {
  return MOCK_AGENTS.filter(isAgentAvailable);
}

/**
 * Get agent description for UI
 */
export function getMockAgentDescription(agentId: string): string {
  const agent = getAgentById(agentId);
  if (!agent) return 'Agente no encontrado';
  return getAgentDescription(agent);
}

/**
 * Get total agent count
 */
export function getTotalAgentCount(): number {
  return MOCK_AGENTS.length;
}

/**
 * Get agent count by region
 */
export function getAgentCountByRegion(regionId: string): number {
  return MOCK_AGENTS.filter(a => a.profile.regionId === regionId).length;
}

/**
 * Tipos TypeScript para mapeo Frontend ↔ Supabase
 * 
 * Estos tipos reflejan el schema de la base de datos Supabase
 * y permiten tipado fuerte en las consultas y respuestas.
 * 
 * Nota: Estos tipos son para la capa estructural (Supabase).
 * Los datos de runtime (posición, conversaciones) siguen en Convex.
 */

// ============================================================================
// ENUMS Y TIPOS AUXILIARES
// ============================================================================

export type TerritoryLevel = 'country' | 'region' | 'province' | 'commune';
export type MacroZone = 'norte_grande' | 'norte_chico' | 'centro' | 'sur' | 'austral';
export type AgentStatus = 'dormant' | 'activating' | 'active' | 'deactivating' | 'archived';
export type UrbanRural = 'urban' | 'rural' | 'semiurban';
export type Sex = 'male' | 'female' | 'other';
export type EducationLevel = 'none' | 'primary' | 'secondary' | 'technical' | 'university' | 'postgraduate';
export type EmploymentStatus = 'employed' | 'unemployed' | 'inactive' | 'retired' | 'student';
export type HouseholdType = 'single' | 'couple' | 'single_parent' | 'extended' | 'other';
export type ConnectivityType = 'fiber' | 'cable' | 'dsl' | 'mobile' | 'satellite' | 'none';
export type Mood = 'positive' | 'neutral' | 'negative' | 'stressed';
export type MemoryType = 'summary' | 'position' | 'topic' | 'reflection';
export type MemorySource = 'survey' | 'conversation' | 'event' | 'reflection' | 'manual';
export type BindingStatus = 'inactive' | 'activating' | 'active' | 'deactivating' | 'error';
export type ActivationReason = 'survey' | 'event' | 'manual' | 'scheduled';
export type EventCategory = 'politics' | 'economy' | 'social' | 'environment' | 'security' | 'culture' | 'sports' | 'other';
export type EventScope = 'national' | 'regional' | 'communal';
export type EventStatus = 'active' | 'archived';

// Survey types
export type SurveyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SurveyRunType = 'synthetic' | 'real' | 'hybrid';
export type SurveyRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AnswerType = 'single_choice' | 'multiple_choice' | 'scale' | 'text' | 'number' | 'boolean';

// Benchmark and Validation types
export type BenchmarkStatus = 'draft' | 'active' | 'archived' | 'deprecated';
export type BenchmarkSource = 'CEP' | 'CADEM' | 'Pulso Ciudadano' | 'Data Influye' | 'Activa' | 'Cadem' | 'Other';
export type BenchmarkTerritoryScope = 'national' | 'regional' | 'communal';
export type ValidationRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type MatchQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ============================================================================
// TABLAS PRINCIPALES
// ============================================================================

/**
 * Territory - Jerarquía territorial de Chile
 * Tabla: territories
 */
export interface Territory {
  id: string;                           // 'metropolitana', 'valparaiso'
  name: string;                         // 'Región Metropolitana de Santiago'
  short_name: string;                   // 'Metropolitana'
  parent_id: string | null;             // NULL para país, regiones para comunas
  level: TerritoryLevel;
  macro_zone: MacroZone | null;
  capital: string | null;
  population: number | null;
  area_km2: number | null;
  map_x: number | null;                 // Posición X en mapa (0-100)
  map_y: number | null;                 // Posición Y en mapa (0-140)
  map_radius: number | null;            // Tamaño del marcador
  population_score: number | null;      // 0-100
  event_score: number | null;           // 0-100
  survey_score: number | null;          // 0-100
  result_score: number | null;          // 0-100
  iso_code: string | null;              // 'CL-RM'
  ine_code: string | null;              // Código INE
  created_at: string;                   // ISO 8601
  updated_at: string;                   // ISO 8601
}

/**
 * SyntheticAgent - Registro maestro de agentes
 * Tabla: synthetic_agents
 */
export interface SyntheticAgent {
  id: string;                           // UUID
  public_id: string;                    // 'ag_001' (expuesto en APIs)
  status: AgentStatus;
  region_id: string;                    // FK a territories
  commune: string;
  urban_rural: UrbanRural | null;
  weight: number;                       // Factor de expansión
  character_sprite: string | null;      // 'f1', 'f2', etc.
  version: number;
  created_at: string;
  updated_at: string;
  generation_seed: string | null;
  generation_batch_id: string | null;   // UUID
}

/**
 * AgentProfile - Características demográficas
 * Tabla: agent_profiles
 */
export interface AgentProfile {
  agent_id: string;                     // UUID (PK, FK a synthetic_agents)
  name: string;
  sex: Sex | null;
  age: number | null;                   // 18-100
  education_level: EducationLevel | null;
  employment_status: EmploymentStatus | null;
  income_decile: number | null;         // 1-10
  household_size: number | null;        // 1-15
  household_type: HouseholdType | null;
  has_children: boolean;
  connectivity_type: ConnectivityType | null;
  digital_access_score: number | null;  // 0-100
  description: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * AgentTraits - Rasgos psicológicos
 * Tabla: agent_traits
 */
export interface AgentTraits {
  agent_id: string;                     // UUID (PK, FK a synthetic_agents)
  institutional_trust: number | null;   // 0-100
  risk_aversion: number | null;         // 0-100
  digital_literacy: number | null;      // 0-100
  patience: number | null;              // 0-100
  civic_interest: number | null;        // 0-100
  social_desirability: number | null;   // 0-100
  openness_change: number | null;       // 0-100
  ideology_score: number | null;        // 0-100 (0=left, 100=right)
  nationalism_score: number | null;     // 0-100
  consistency_score: number | null;     // 0-100
  generation_prompt: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * AgentMemory - Memoria estructurada
 * Tabla: agent_memories
 */
export interface AgentMemory {
  id: string;                           // UUID
  agent_id: string;                     // UUID (FK a synthetic_agents)
  memory_type: MemoryType;
  topic: string | null;
  content: string;
  stance: string | null;
  source: MemorySource | null;
  source_id: string | null;
  importance: number | null;            // 0-100
  confidence: number | null;            // 0-100
  created_at: string;
  last_accessed: string | null;
  convex_memory_id: string | null;      // Referencia a Convex
}

/**
 * AgentState - Estado dinámico
 * Tabla: agent_states
 */
export interface AgentState {
  agent_id: string;                     // UUID (PK, FK a synthetic_agents)
  fatigue: number | null;               // 0-100
  economic_stress: number | null;       // 0-100
  survey_saturation: number | null;     // 0-100
  mood: Mood | null;
  total_surveys_completed: number;
  total_surveys_abandoned: number;
  last_survey_at: string | null;
  last_activation_at: string | null;
  last_deactivation_at: string | null;
  convex_player_id: string | null;      // Referencia a Convex
  updated_at: string;
}

/**
 * RuntimeBinding - Puente Supabase ↔ Convex
 * Tabla: runtime_bindings
 */
export interface RuntimeBinding {
  id: string;                           // UUID
  agent_id: string;                     // UUID (FK a synthetic_agents)
  convex_agent_id: string | null;
  convex_player_id: string | null;
  convex_world_id: string | null;
  region_id: string | null;             // FK a territories
  status: BindingStatus;
  last_synced_at: string | null;
  sync_error: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  activation_reason: ActivationReason | null;
  created_at: string;
}

// ============================================================================
// VISTAS (VIEWS)
// ============================================================================

/**
 * AgentSummary - Vista resumida para listas
 * Vista: agent_summaries
 */
export interface AgentSummary {
  id: string;                           // UUID del agente
  public_id: string;                    // 'ag_001'
  region_id: string;
  commune: string;
  urban_rural: UrbanRural | null;
  character_sprite: string | null;
  status: AgentStatus;
  name: string | null;
  age: number | null;
  sex: Sex | null;
  description: string | null;
  mood: Mood | null;
  fatigue: number | null;
  survey_saturation: number | null;
  binding_status: BindingStatus | null;
  convex_player_id: string | null;
}

/**
 * FullAgent - Vista completa para detalle
 * Vista: full_agents
 */
export interface FullAgentView {
  // Identificación
  agent_id: string;
  public_id: string;
  region_id: string;
  commune: string;
  urban_rural: UrbanRural | null;
  weight: number;
  character_sprite: string | null;
  agent_status: AgentStatus;
  created_at: string;
  
  // Perfil
  name: string | null;
  sex: Sex | null;
  age: number | null;
  education_level: EducationLevel | null;
  employment_status: EmploymentStatus | null;
  income_decile: number | null;
  household_size: number | null;
  household_type: HouseholdType | null;
  has_children: boolean | null;
  connectivity_type: ConnectivityType | null;
  digital_access_score: number | null;
  description: string | null;
  
  // Rasgos
  institutional_trust: number | null;
  risk_aversion: number | null;
  digital_literacy: number | null;
  patience: number | null;
  civic_interest: number | null;
  social_desirability: number | null;
  openness_change: number | null;
  ideology_score: number | null;
  nationalism_score: number | null;
  consistency_score: number | null;
  
  // Estado
  state_fatigue: number | null;
  economic_stress: number | null;
  survey_saturation: number | null;
  mood: Mood | null;
  total_surveys_completed: number | null;
  last_activation_at: string | null;
  convex_player_id: string | null;
  
  // Binding
  binding_status: BindingStatus | null;
  convex_agent_id: string | null;
  convex_world_id: string | null;
  activated_at: string | null;
}

// ============================================================================
// TIPOS COMPUESTOS PARA EL FRONTEND
// ============================================================================

/**
 * FullAgent - Agente completo con todas sus relaciones
 * Este es el tipo que usa el frontend (similar al mock FullAgent)
 */
export interface FullAgent {
  profile: AgentProfile & {
    id: string;                         // Alias de agent_id
    public_id: string;
    region_id: string;
    commune: string;
    urban_rural: UrbanRural | null;
    weight: number;
    character_sprite: string | null;
    status: AgentStatus;
  };
  traits: AgentTraits | null;
  memory: {
    summary: string;
    salientTopics: string[];
    previousPositions: Array<{
      topic: string;
      stance: string;
      timestamp: Date;
      source: MemorySource;
    }>;
    contradictionScore: number;
  };
  state: AgentState & {
    is_active: boolean;                 // Computado de binding_status
  };
  events: AgentEventExposure[];         // Se cargan por separado
}

/**
 * AgentEventExposure - Exposición a eventos
 * Tabla: agent_event_exposures (futura)
 */
export interface AgentEventExposure {
  event_id: string;
  exposure_probability: number;         // 0-100
  exposure_level: number;               // 0-100
  interpreted_stance: string | null;
  interpretation_rationale: string | null;
  mood_impact: number | null;           // -100 a 100
  exposed_at: string;
}

// ============================================================================
// TIPOS PARA QUERIES Y MUTACIONES
// ============================================================================

/**
 * Filtros para búsqueda de agentes
 */
export interface AgentFilters {
  region_id?: string;
  commune?: string;
  urban_rural?: UrbanRural;
  status?: AgentStatus;
  min_age?: number;
  max_age?: number;
  sex?: Sex;
  education_level?: EducationLevel;
  employment_status?: EmploymentStatus;
  income_decile_min?: number;
  income_decile_max?: number;
  mood?: Mood;
  has_children?: boolean;
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Respuesta paginada
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// TABLAS DE EVENTOS
// ============================================================================

/**
 * Event - Eventos del mundo real
 * Tabla: events
 */
export interface Event {
  id: string;                           // UUID
  title: string;
  summary: string | null;
  category: EventCategory;
  intensity: number;                    // 0-10
  territory_id: string | null;          // FK a territories
  territory_scope: EventScope;
  event_date: string;                   // ISO 8601
  source_url: string | null;
  source_name: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

/**
 * AgentEventExposure - Exposición de agentes a eventos
 * Tabla: agent_event_exposures
 */
export interface AgentEventExposureRow {
  id: string;                           // UUID
  agent_id: string;                     // FK a synthetic_agents
  event_id: string;                     // FK a events
  exposure_probability: number;         // 0-100
  exposure_level: number;               // 0-100
  interpreted_stance: string | null;
  interpretation_rationale: string | null;
  mood_impact: number | null;           // -100 a 100
  exposed_at: string;
  created_at: string;
}

/**
 * EventSummary - Vista de eventos con conteo de exposiciones
 * Vista: event_summaries
 */
export interface EventSummary {
  id: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  intensity: number;
  territory_id: string | null;
  territory_scope: EventScope;
  event_date: string;
  exposure_count: number;
}

/**
 * TerritoryEvent - Vista de eventos por territorio
 * Vista: territory_events
 */
export interface TerritoryEvent {
  id: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  intensity: number;
  territory_id: string;
  event_date: string;
}

/**
 * FullEventExposure - Vista completa de exposiciones
 * Vista: full_event_exposures
 */
export interface FullEventExposure {
  id: string;
  agent_id: string;
  event_id: string;
  exposure_probability: number;
  exposure_level: number;
  interpreted_stance: string | null;
  interpretation_rationale: string | null;
  mood_impact: number | null;
  exposed_at: string;
  title: string;
  summary: string | null;
  category: EventCategory;
  intensity: number;
  event_date: string;
}

// ============================================================================
// TABLAS DE SURVEYS
// ============================================================================

/**
 * Survey - Definición de encuestas
 * Tabla: surveys
 */
export interface Survey {
  id: string;                           // UUID
  name: string;
  description: string | null;
  status: SurveyStatus;
  category: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

/**
 * SurveyQuestion - Preguntas de encuestas
 * Tabla: survey_questions
 */
export interface SurveyQuestion {
  id: string;                           // UUID
  survey_id: string;                    // FK a surveys
  code: string;
  text: string;
  answer_type: AnswerType;
  options_json: Record<string, unknown>[] | null;
  scale_config: Record<string, unknown> | null;
  validation_rules: Record<string, unknown> | null;
  order_index: number;
  category: string | null;
  weight: number;
  created_at: string;
  updated_at: string;
}

/**
 * SurveyRun - Ejecuciones de encuestas
 * Tabla: survey_runs
 */
export interface SurveyRun {
  id: string;                           // UUID
  survey_id: string;                    // FK a surveys
  territory_id: string | null;          // FK a territories
  name: string | null;
  description: string | null;
  sample_size: number;
  run_type: SurveyRunType;
  status: SurveyRunStatus;
  config_json: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
}

/**
 * SurveyResponse - Respuestas de agentes
 * Tabla: survey_responses
 */
export interface SurveyResponse {
  id: string;                           // UUID
  run_id: string;                       // FK a survey_runs
  agent_id: string;                     // FK a synthetic_agents
  question_id: string;                  // FK a survey_questions
  answer_raw: string | null;
  answer_structured_json: Record<string, unknown> | null;
  response_time_ms: number | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

/**
 * SurveyRunSummary - Vista de resumen de ejecuciones
 * Vista: survey_run_summary
 */
export interface SurveyRunSummary extends SurveyRun {
  survey_name: string;
  territory_name: string | null;
  response_count: number;
  questions_answered: number;
}

/**
 * SurveyResult - Vista de resultados agregados
 * Vista: survey_results
 */
export interface SurveyResult {
  run_id: string;
  question_id: string;
  question_code: string;
  question_text: string;
  answer_type: AnswerType;
  response_count: number;
  avg_numeric: number | null;
  mode_value: string | null;
}

// ============================================================================
// TABLAS DE BENCHMARKS Y VALIDACIÓN
// ============================================================================

/**
 * SurveyBenchmark - Fuentes de benchmark oficiales
 * Tabla: survey_benchmarks
 */
export interface SurveyBenchmark {
  id: string;                           // UUID
  name: string;
  description: string | null;
  source: string;                       // 'CEP', 'CADEM', etc.
  source_wave: string | null;           // 'Oct 2024', 'Wave 3'
  source_url: string | null;
  field_date_start: string | null;      // ISO 8601 date
  field_date_end: string | null;        // ISO 8601 date
  publication_date: string | null;      // ISO 8601 date
  sample_size: number | null;
  margin_of_error: number | null;       // e.g., 2.6 for ±2.6%
  confidence_level: number | null;      // Usually 95.0
  methodology: string | null;
  territory_scope: BenchmarkTerritoryScope;
  territory_id: string | null;          // FK a territories
  status: BenchmarkStatus;
  notes: string | null;
  created_by: string | null;            // UUID auth.users
  created_at: string;
  updated_at: string;
}

/**
 * BenchmarkDataPoint - Datos de benchmark por pregunta
 * Tabla: benchmark_data_points
 */
export interface BenchmarkDataPoint {
  id: string;                           // UUID
  benchmark_id: string;                 // FK a survey_benchmarks
  question_code: string;
  question_text: string | null;
  question_category: string | null;     // 'political', 'economic', 'social'
  answer_type: AnswerType | null;
  options_json: Record<string, unknown>[] | null;
  distribution_json: Record<string, unknown>; // Benchmark distribution
  sample_size: number | null;
  metadata_json: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ValidationRun - Ejecuciones de validación
 * Tabla: validation_runs
 */
export interface ValidationRun {
  id: string;                           // UUID
  survey_id: string;                    // FK a surveys
  survey_run_id: string | null;         // FK a survey_runs (optional)
  benchmark_id: string;                 // FK a survey_benchmarks
  territory_id: string | null;          // FK a territories
  engine_version: string;               // '2.0.0'
  engine_config_json: Record<string, unknown> | null;
  status: ValidationRunStatus;
  started_at: string | null;
  completed_at: string | null;
  average_similarity_score: number | null;  // 0-1
  average_mae: number | null;               // Mean Absolute Error
  average_rmse: number | null;              // Root Mean Square Error
  weighted_similarity_score: number | null; // Weighted by importance
  total_questions: number;
  matched_questions: number;
  synthetic_sample_size: number | null;
  benchmark_sample_size: number | null;
  summary_json: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ValidationResult - Resultados por pregunta de validación
 * Tabla: validation_results
 */
export interface ValidationResult {
  id: string;                           // UUID
  validation_run_id: string;            // FK a validation_runs
  question_code: string;
  question_text: string | null;
  question_category: string | null;
  synthetic_distribution_json: Record<string, unknown>; // Our results
  benchmark_distribution_json: Record<string, unknown>; // Benchmark data
  mae: number | null;                   // Mean Absolute Error
  rmse: number | null;                  // Root Mean Square Error
  max_absolute_error: number | null;
  similarity_score: number | null;      // 0-1, overall similarity
  cosine_similarity: number | null;
  correlation_coefficient: number | null;
  option_match_quality: number | null;  // 0-1
  best_matching_option: string | null;
  worst_matching_option: string | null;
  option_differences_json: Record<string, unknown> | null;
  chi_square_statistic: number | null;
  chi_square_p_value: number | null;
  match_quality: MatchQuality | null;   // Generated column
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ActiveBenchmark - Vista de benchmarks activos con conteo
 * Vista: active_benchmarks
 */
export interface ActiveBenchmark extends SurveyBenchmark {
  question_count: number;
  territory_name: string | null;
}

/**
 * ValidationRunSummary - Vista de resumen de validaciones
 * Vista: validation_run_summary
 */
export interface ValidationRunSummary extends ValidationRun {
  survey_name: string;
  benchmark_name: string;
  benchmark_source: string;
  benchmark_wave: string | null;
  territory_name: string | null;
  results_count: number;
  excellent_matches: number;
  good_matches: number;
  fair_matches: number;
  poor_matches: number;
  critical_matches: number;
}

/**
 * ValidationResultDetails - Vista de resultados con contexto
 * Vista: validation_result_details
 */
export interface ValidationResultDetails extends ValidationResult {
  survey_id: string;
  benchmark_id: string;
  engine_version: string;
  run_status: ValidationRunStatus;
  benchmark_name: string;
  benchmark_source: string;
}

// ============================================================================
// TIPO DATABASE PARA SUPABASE CLIENT
// ============================================================================

/**
 * Tipo Database para el cliente tipado de Supabase
 * Este tipo permite usar el cliente con tipado fuerte
 */
export interface Database {
  public: {
    Tables: {
      territories: {
        Row: Territory;
        Insert: Omit<Territory, 'created_at' | 'updated_at'>;
        Update: Partial<Territory>;
      };
      synthetic_agents: {
        Row: SyntheticAgent;
        Insert: Omit<SyntheticAgent, 'created_at' | 'updated_at'>;
        Update: Partial<SyntheticAgent>;
      };
      agent_profiles: {
        Row: AgentProfile;
        Insert: Omit<AgentProfile, 'created_at' | 'updated_at'>;
        Update: Partial<AgentProfile>;
      };
      agent_traits: {
        Row: AgentTraits;
        Insert: Omit<AgentTraits, 'created_at' | 'updated_at'>;
        Update: Partial<AgentTraits>;
      };
      agent_memories: {
        Row: AgentMemory;
        Insert: Omit<AgentMemory, 'id' | 'created_at'>;
        Update: Partial<AgentMemory>;
      };
      agent_states: {
        Row: AgentState;
        Insert: Omit<AgentState, 'updated_at'>;
        Update: Partial<AgentState>;
      };
      runtime_bindings: {
        Row: RuntimeBinding;
        Insert: Omit<RuntimeBinding, 'id' | 'created_at'>;
        Update: Partial<RuntimeBinding>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Event>;
      };
      agent_event_exposures: {
        Row: AgentEventExposureRow;
        Insert: Omit<AgentEventExposureRow, 'id' | 'created_at'>;
        Update: Partial<AgentEventExposureRow>;
      };
      surveys: {
        Row: Survey;
        Insert: Omit<Survey, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Survey>;
      };
      survey_questions: {
        Row: SurveyQuestion;
        Insert: Omit<SurveyQuestion, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<SurveyQuestion>;
      };
      survey_runs: {
        Row: SurveyRun;
        Insert: Omit<SurveyRun, 'id' | 'created_at'>;
        Update: Partial<SurveyRun>;
      };
      survey_responses: {
        Row: SurveyResponse;
        Insert: Omit<SurveyResponse, 'id' | 'created_at'>;
        Update: Partial<SurveyResponse>;
      };
      survey_benchmarks: {
        Row: SurveyBenchmark;
        Insert: Omit<SurveyBenchmark, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<SurveyBenchmark>;
      };
      benchmark_data_points: {
        Row: BenchmarkDataPoint;
        Insert: Omit<BenchmarkDataPoint, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<BenchmarkDataPoint>;
      };
      validation_runs: {
        Row: ValidationRun;
        Insert: Omit<ValidationRun, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ValidationRun>;
      };
      validation_results: {
        Row: ValidationResult;
        Insert: Omit<ValidationResult, 'id' | 'created_at' | 'updated_at' | 'match_quality'>;
        Update: Partial<ValidationResult>;
      };
    };
    Views: {
      agent_summaries: {
        Row: AgentSummary;
      };
      full_agents: {
        Row: FullAgentView;
      };
      event_summaries: {
        Row: EventSummary;
      };
      territory_events: {
        Row: TerritoryEvent;
      };
      full_event_exposures: {
        Row: FullEventExposure;
      };
      survey_run_summary: {
        Row: SurveyRunSummary;
      };
      survey_results: {
        Row: SurveyResult;
      };
      active_benchmarks: {
        Row: ActiveBenchmark;
      };
      validation_run_summary: {
        Row: ValidationRunSummary;
      };
      validation_result_details: {
        Row: ValidationResultDetails;
      };
    };
    Functions: {
      get_agent_events: {
        Args: {
          agent_uuid: string;
        };
        Returns: Array<{
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
        }>;
      };
      get_territory_recent_events: {
        Args: {
          territory_uuid: string;
          days_back: number;
        };
        Returns: Array<{
          event_id: string;
          title: string;
          summary: string | null;
          category: string;
          intensity: number;
          event_date: string;
          exposure_count: number;
        }>;
      };
    };
  };
}

// ============================================================================
// TIPOS PARA SINCRONIZACIÓN CON CONVEX
// ============================================================================

/**
 * Datos necesarios para activar un agente en Convex
 */
export interface AgentActivationData {
  agent_id: string;
  region_id: string;
  activation_reason: ActivationReason;
  // Datos del perfil para inicializar el agente en Convex
  profile: {
    name: string;
    description: string;
    character_sprite: string;
  };
}

/**
 * Resultado de activación
 */
export interface AgentActivationResult {
  binding_id: string;
  convex_agent_id: string;
  convex_player_id: string;
  convex_world_id: string;
  activated_at: string;
}

/**
 * Datos para desactivar un agente
 */
export interface AgentDeactivationData {
  agent_id: string;
  final_state?: {
    fatigue: number;
    economic_stress: number;
    mood: Mood;
  };
  memories_to_archive?: Array<{
    content: string;
    topic: string;
    importance: number;
  }>;
}

// ============================================================================
// MAPEO DE TIPOS DEL MOCK AL SCHEMA SUPABASE
// ============================================================================

/**
 * Convierte un Territory del mock al formato Supabase
 */
export function mockTerritoryToSupabase(mock: {
  id: string;
  name: string;
  shortName: string;
  capital: string;
  macroZone: MacroZone;
  x: number;
  y: number;
  radius: number;
  populationScore: number;
  eventScore: number;
  surveyScore: number;
  resultScore: number;
  isoCode: string;
  population: number;
  areaKm2: number;
}): Omit<Territory, 'created_at' | 'updated_at'> {
  return {
    id: mock.id,
    name: mock.name,
    short_name: mock.shortName,
    parent_id: null,                    // Las regiones no tienen padre
    level: 'region',
    macro_zone: mock.macroZone,
    capital: mock.capital,
    population: mock.population,
    area_km2: mock.areaKm2,
    map_x: mock.x,
    map_y: mock.y,
    map_radius: mock.radius,
    population_score: mock.populationScore,
    event_score: mock.eventScore,
    survey_score: mock.surveyScore,
    result_score: mock.resultScore,
    iso_code: mock.isoCode,
    ine_code: null,                     // Se puede agregar después
  };
}

/**
 * Convierte un FullAgent del mock al formato Supabase
 * Nota: Requiere el UUID del agente como parámetro
 */
export function mockAgentToSupabase(
  agentId: string,
  publicId: string,
  mock: {
    profile: {
      regionId: string;
      commune: string;
      urbanRural: UrbanRural;
      weight: number;
      character: string;
      name: string;
      sex: Sex;
      age: number;
      educationLevel: EducationLevel;
      employmentStatus: EmploymentStatus;
      incomeDecile: number;
      householdSize: number;
      householdType: HouseholdType;
      hasChildren: boolean;
      connectivityType: ConnectivityType;
      digitalAccessScore: number;
      description: string;
    };
    traits: {
      institutionalTrust: number;
      riskAversion: number;
      digitalLiteracy: number;
      patience: number;
      civicInterest: number;
      socialDesirability: number;
      opennessChange: number;
      ideologyScore: number;
      nationalismScore: number;
      consistencyScore: number;
    };
    state: {
      fatigue: number;
      economicStress: number;
      surveySaturation: number;
      mood: Mood;
      totalSurveysCompleted?: number;
      lastActivationAt?: Date;
    };
  }
): {
  agent: Omit<SyntheticAgent, 'created_at' | 'updated_at'>;
  profile: Omit<AgentProfile, 'created_at' | 'updated_at'>;
  traits: Omit<AgentTraits, 'created_at' | 'updated_at'>;
  agentState: Omit<AgentState, 'updated_at'>;
} {
  return {
    agent: {
      id: agentId,
      public_id: publicId,
      status: 'dormant',
      region_id: mock.profile.regionId,
      commune: mock.profile.commune,
      urban_rural: mock.profile.urbanRural,
      weight: mock.profile.weight,
      character_sprite: mock.profile.character,
      version: 1,
      generation_seed: null,
      generation_batch_id: null,
    },
    profile: {
      agent_id: agentId,
      name: mock.profile.name,
      sex: mock.profile.sex,
      age: mock.profile.age,
      education_level: mock.profile.educationLevel,
      employment_status: mock.profile.employmentStatus,
      income_decile: mock.profile.incomeDecile,
      household_size: mock.profile.householdSize,
      household_type: mock.profile.householdType,
      has_children: mock.profile.hasChildren,
      connectivity_type: mock.profile.connectivityType,
      digital_access_score: mock.profile.digitalAccessScore,
      description: mock.profile.description,
      version: 1,
    },
    traits: {
      agent_id: agentId,
      institutional_trust: mock.traits.institutionalTrust,
      risk_aversion: mock.traits.riskAversion,
      digital_literacy: mock.traits.digitalLiteracy,
      patience: mock.traits.patience,
      civic_interest: mock.traits.civicInterest,
      social_desirability: mock.traits.socialDesirability,
      openness_change: mock.traits.opennessChange,
      ideology_score: mock.traits.ideologyScore,
      nationalism_score: mock.traits.nationalismScore,
      consistency_score: mock.traits.consistencyScore,
      generation_prompt: null,
    },
    agentState: {
      agent_id: agentId,
      fatigue: mock.state.fatigue,
      economic_stress: mock.state.economicStress,
      survey_saturation: mock.state.surveySaturation,
      mood: mock.state.mood,
      total_surveys_completed: mock.state.totalSurveysCompleted ?? 0,
      total_surveys_abandoned: 0,
      last_survey_at: null,
      last_activation_at: mock.state.lastActivationAt?.toISOString() ?? null,
      last_deactivation_at: null,
      convex_player_id: null,
    },
  };
}

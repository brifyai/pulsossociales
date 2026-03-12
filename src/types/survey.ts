/**
 * Survey System Types
 * 
 * Types for the synthetic survey system including surveys, questions,
 * runs, and responses.
 */

// ============================================================================
// ENUMS
// ============================================================================

export type SurveyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SurveyRunType = 'synthetic' | 'real' | 'hybrid';
export type SurveyRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AnswerType = 'single_choice' | 'multiple_choice' | 'scale' | 'text' | 'number' | 'boolean';

// ============================================================================
// BASE TYPES (from Supabase)
// ============================================================================

export interface Survey {
  id: string;
  name: string;
  description: string | null;
  status: SurveyStatus;
  category: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  code: string;
  text: string;
  answer_type: AnswerType;
  options_json: SurveyOption[] | null;
  scale_config: ScaleConfig | null;
  validation_rules: ValidationRules | null;
  order_index: number;
  category: string | null;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface SurveyRun {
  id: string;
  survey_id: string;
  territory_id: string | null;
  name: string | null;
  description: string | null;
  sample_size: number;
  run_type: SurveyRunType;
  status: SurveyRunStatus;
  config_json: SurveyRunConfig | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SurveyResponse {
  id: string;
  run_id: string;
  agent_id: string;
  question_id: string;
  answer_raw: string | null;
  answer_structured_json: StructuredAnswer | null;
  response_time_ms: number | null;
  metadata_json: ResponseMetadata | null;
  created_at: string;
}

// ============================================================================
// JSONB TYPES
// ============================================================================

export interface SurveyOption {
  value: string;
  label: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  step: number;
  labels: Record<string, string>;
}

export interface ValidationRules {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

export interface SurveyRunConfig {
  use_llm?: boolean;
  rule_based?: boolean;
  temperature?: number;
  max_tokens?: number;
  batch_size?: number;
  delay_ms?: number;
}

export interface StructuredAnswer {
  value: string | number | boolean;
  label?: string;
  confidence?: number;
  reasoning?: string;
}

export interface ResponseMetadata {
  method: 'rule_based' | 'llm' | 'hybrid';
  factors?: string[];
  processing_time_ms?: number;
  model_used?: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface ActiveSurvey extends Survey {
  question_count: number;
}

export interface SurveyRunSummary extends SurveyRun {
  survey_name: string;
  territory_name: string | null;
  response_count: number;
  questions_answered: number;
}

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
// FUNCTION RETURN TYPES
// ============================================================================

export interface SurveyWithQuestions {
  survey_id: string;
  survey_name: string;
  survey_description: string | null;
  survey_status: SurveyStatus;
  question_id: string;
  question_code: string;
  question_text: string;
  answer_type: AnswerType;
  options_json: SurveyOption[] | null;
  order_index: number;
}

export interface RunResponse {
  response_id: string;
  agent_id: string;
  agent_name: string;
  question_id: string;
  question_code: string;
  answer_raw: string | null;
  answer_value: string | null;
  answer_label: string | null;
  confidence: number | null;
  created_at: string;
}

// ============================================================================
// INSERT TYPES (for Supabase)
// ============================================================================

export type SurveyInsert = Omit<Survey, 'id' | 'created_at' | 'updated_at'>;

export type SurveyQuestionInsert = Omit<SurveyQuestion, 'id' | 'created_at' | 'updated_at'>;

export type SurveyRunInsert = {
  survey_id: string;
  territory_id?: string | null;
  name?: string | null;
  description?: string | null;
  sample_size: number;
  run_type: SurveyRunType;
  status: SurveyRunStatus;
  config_json?: SurveyRunConfig | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_by?: string | null;
};

export type SurveyResponseInsert = {
  run_id: string;
  agent_id: string;
  question_id: string;
  answer_raw?: string | null;
  answer_structured_json?: StructuredAnswer | null;
  response_time_ms?: number | null;
  metadata_json?: ResponseMetadata | null;
};

// ============================================================================
// AGGREGATED RESULTS TYPES
// ============================================================================

export interface AggregatedResult {
  questionId: string;
  questionCode: string;
  questionText: string;
  answerType: AnswerType;
  totalResponses: number;
  totalWeight: number;
  // Distribution of responses
  distribution: DistributionItem[];
  // Weighted distribution
  weightedDistribution: DistributionItem[];
  // Statistics for numeric/scale questions
  statistics?: NumericStatistics;
  // Segment breakdowns
  segments?: SegmentBreakdown[];
}

export interface DistributionItem {
  value: string | number;
  label: string;
  count: number;
  percentage: number;
  weight: number;
  weightedPercentage: number;
}

export interface NumericStatistics {
  mean: number;
  weightedMean: number;
  median: number;
  weightedMedian: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface SegmentBreakdown {
  segmentType: 'region' | 'age_group' | 'gender' | 'income' | 'education';
  segmentValue: string;
  count: number;
  weight: number;
  avgResponse?: number;
  distribution: DistributionItem[];
}

// ============================================================================
// BENCHMARK TYPES
// ============================================================================

export interface SurveyBenchmark {
  id: string;
  surveyId: string;
  name: string;
  description: string | null;
  source: string; // e.g., 'cep', 'encuesta_real', 'expert'
  sourceUrl: string | null;
  dateCollected: string;
  sampleSize: number;
  marginOfError: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface BenchmarkDataPoint {
  benchmarkId: string;
  questionId: string;
  questionCode: string;
  // Expected distribution from benchmark
  expectedDistribution: BenchmarkDistributionItem[];
  // Expected statistics for numeric questions
  expectedStatistics?: {
    mean: number;
    median: number;
    stdDev: number | null;
  };
  // Metadata
  sampleSize: number;
  dateCollected: string;
  notes: string | null;
}

export interface BenchmarkDistributionItem {
  value: string | number;
  label: string;
  percentage: number;
  count: number | null;
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

export interface BenchmarkComparison {
  questionId: string;
  questionCode: string;
  questionText: string;
  answerType: AnswerType;
  // Synthetic results
  synthetic: AggregatedResult;
  // Benchmark data
  benchmark: BenchmarkDataPoint | null;
  // Comparison metrics
  metrics: ComparisonMetrics;
  // Option-level comparison
  optionComparisons: OptionComparison[];
}

export interface ComparisonMetrics {
  // Overall similarity (0-1, higher is better)
  similarityScore: number;
  // Mean Absolute Error for distributions
  mae: number;
  // Root Mean Square Error
  rmse: number;
  // Chi-square statistic (for categorical)
  chiSquare: number | null;
  // Kolmogorov-Smirnov statistic (for distributions)
  ksStatistic: number | null;
  // Difference in means (for numeric)
  meanDifference: number | null;
  // Percentage difference
  percentageDifference: number | null;
}

export interface OptionComparison {
  value: string | number;
  label: string;
  syntheticPercentage: number;
  benchmarkPercentage: number;
  absoluteError: number;
  relativeError: number;
}

// ============================================================================
// FRONTEND TYPES
// ============================================================================

export interface SurveyWithDetails extends Survey {
  questions: SurveyQuestion[];
}

export interface SurveyRunWithDetails extends SurveyRun {
  survey: Survey;
  territory: { id: string; name: string } | null;
  responses: SurveyResponse[];
}

export interface AgentSurveyResponse {
  agentId: string;
  agentName: string;
  responses: {
    questionId: string;
    questionCode: string;
    questionText: string;
    answer: StructuredAnswer;
    responseTimeMs: number;
  }[];
}

export interface SurveyExecutionConfig {
  surveyId: string;
  territoryId?: string;
  sampleSize: number;
  useRules: boolean;
  useLLM: boolean;
  batchSize: number;
  delayMs: number;
}

export interface SurveyExecutionProgress {
  total: number;
  completed: number;
  failed: number;
  currentAgent?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// ANSWER VALUE TYPES
// ============================================================================

export type AnswerValue = string | number | boolean | string[];

export interface ProcessedAnswer {
  questionId: string;
  questionCode: string;
  answerType: AnswerType;
  rawValue: AnswerValue;
  structuredValue: StructuredAnswer;
  confidence: number;
  processingTimeMs: number;
  method: 'rule_based' | 'llm' | 'hybrid';
}

// ============================================================================
// SURVEY ENGINE TYPES
// ============================================================================

export interface AgentContext {
  agentId: string;
  profile: {
    age: number;
    gender: string;
    education_level: string;
    occupation: string;
    income_level: string;
  };
  traits: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    political_leaning: number;
    risk_tolerance: number;
  };
  state: {
    current_mood: string;
    satisfaction: number;
    stress_level: number;
  } | null;
  events: {
    eventId: string;
    title: string;
    interpretedStance: string;
    moodImpact: number | null;
  }[];
}

export interface SurveyRule {
  id: string;
  questionCode: string;
  condition: {
    field: keyof AgentContext | string;
    operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
    value: unknown;
  };
  answer: {
    value: AnswerValue;
    label?: string;
    confidence: number;
    reasoning: string;
  };
  priority: number;
}

export interface RuleBasedEngineConfig {
  rules: SurveyRule[];
  defaultConfidence: number;
  randomVariation: number;
  useTraitsScoring: boolean;
  useEventsImpact: boolean;
}

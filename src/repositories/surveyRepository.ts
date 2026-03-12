/**
 * Survey Repository
 * 
 * Data access layer for surveys, questions, runs, and responses.
 * All operations are read-only or insert-only (no updates to preserve data integrity).
 */

import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Database } from '../types/supabase';
import {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
  SurveyWithDetails,
  SurveyRunSummary,
  SurveyResult,
  SurveyExecutionConfig,
  RunResponse,
} from '../types/survey';

// ============================================================================
// ERROR HANDLING
// ============================================================================

class SurveyRepositoryError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'SurveyRepositoryError';
  }
}

// ============================================================================
// HELPER
// ============================================================================

function getClient() {
  if (!isSupabaseConfigured()) {
    throw new SurveyRepositoryError('Supabase client not configured');
  }
  return getSupabaseClient();
}

// ============================================================================
// SURVEYS
// ============================================================================

/**
 * Get all active surveys
 */
export async function getActiveSurveys(): Promise<Survey[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('surveys')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as Survey[]) || [];
  } catch (error) {
    console.error('Error fetching active surveys:', error);
    return [];
  }
}

/**
 * Get all surveys (with optional status filter)
 */
export async function getSurveys(status?: string): Promise<Survey[]> {
  try {
    const client = getClient();
    
    let query = client.from('surveys').select('*').order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as unknown as Survey[]) || [];
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return [];
  }
}

/**
 * Get a single survey by ID
 */
export async function getSurveyById(id: string): Promise<Survey | null> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as Survey;
  } catch (error) {
    console.error('Error fetching survey:', error);
    return null;
  }
}

/**
 * Get survey with all its questions
 */
export async function getSurveyWithQuestions(id: string): Promise<SurveyWithDetails | null> {
  try {
    const client = getClient();
    
    // Get survey
    const { data: survey, error: surveyError } = await client
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (surveyError) throw surveyError;
    if (!survey) return null;

    // Get questions
    const { data: questions, error: questionsError } = await client
      .from('survey_questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true });

    if (questionsError) throw questionsError;

    return {
      ...(survey as unknown as Survey),
      questions: (questions as unknown as SurveyQuestion[]) || [],
    };
  } catch (error) {
    console.error('Error fetching survey with questions:', error);
    return null;
  }
}

// ============================================================================
// SURVEY QUESTIONS
// ============================================================================

/**
 * Get questions for a survey
 */
export async function getSurveyQuestions(surveyId: string): Promise<SurveyQuestion[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return (data as unknown as SurveyQuestion[]) || [];
  } catch (error) {
    console.error('Error fetching survey questions:', error);
    return [];
  }
}

/**
 * Get a single question by ID
 */
export async function getQuestionById(id: string): Promise<SurveyQuestion | null> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as SurveyQuestion;
  } catch (error) {
    console.error('Error fetching question:', error);
    return null;
  }
}

// ============================================================================
// SURVEY RUNS
// ============================================================================

/**
 * Get all runs for a survey
 */
export async function getSurveyRuns(surveyId: string): Promise<SurveyRun[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_runs')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as SurveyRun[]) || [];
  } catch (error) {
    console.error('Error fetching survey runs:', error);
    return [];
  }
}

/**
 * Get run summaries for a survey
 */
export async function getSurveyRunSummaries(surveyId: string): Promise<SurveyRunSummary[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_run_summary')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as SurveyRunSummary[]) || [];
  } catch (error) {
    console.error('Error fetching survey run summaries:', error);
    return [];
  }
}

/**
 * Get a single run by ID
 */
export async function getRunById(id: string): Promise<SurveyRun | null> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_runs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as unknown as SurveyRun;
  } catch (error) {
    console.error('Error fetching run:', error);
    return null;
  }
}

/**
 * Create a new survey run
 */
export async function createSurveyRun(
  surveyId: string,
  config: SurveyExecutionConfig
): Promise<SurveyRun | null> {
  try {
    const client = getClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      survey_id: surveyId,
      territory_id: config.territoryId ?? null,
      name: `Run ${new Date().toISOString()}`,
      description: null,
      sample_size: config.sampleSize,
      run_type: 'synthetic',
      status: 'pending',
      config_json: {
        use_llm: config.useLLM,
        rule_based: config.useRules,
        batch_size: config.batchSize,
        delay_ms: config.delayMs,
      },
      started_at: null,
      completed_at: null,
      created_by: null,
    };
    
    const { data, error } = await client
      .from('survey_runs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as SurveyRun;
  } catch (error) {
    console.error('Error creating survey run:', error);
    return null;
  }
}

/**
 * Update run status
 */
export async function updateRunStatus(
  runId: string,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
  startedAt?: string | null,
  completedAt?: string | null
): Promise<boolean> {
  try {
    const client = getClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { status };
    if (startedAt !== undefined) updateData.started_at = startedAt;
    if (completedAt !== undefined) updateData.completed_at = completedAt;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (client as any)
      .from('survey_runs')
      .update(updateData)
      .eq('id', runId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating run status:', error);
    return false;
  }
}

// ============================================================================
// SURVEY RESPONSES
// ============================================================================

/**
 * Get responses for a run
 */
export async function getRunResponses(runId: string): Promise<SurveyResponse[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_responses')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as SurveyResponse[]) || [];
  } catch (error) {
    console.error('Error fetching run responses:', error);
    return [];
  }
}

/**
 * Get responses with agent details for a run
 */
export async function getRunResponsesWithDetails(runId: string): Promise<RunResponse[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .rpc('get_run_responses', { run_uuid: runId } as any);

    if (error) throw error;
    return (data as unknown as RunResponse[]) || [];
  } catch (error) {
    console.error('Error fetching run responses with details:', error);
    return [];
  }
}

/**
 * Get responses for a specific agent in a run
 */
export async function getAgentResponses(
  runId: string,
  agentId: string
): Promise<SurveyResponse[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_responses')
      .select('*')
      .eq('run_id', runId)
      .eq('agent_id', agentId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as SurveyResponse[]) || [];
  } catch (error) {
    console.error('Error fetching agent responses:', error);
    return [];
  }
}

/**
 * Save a survey response
 */
export async function saveSurveyResponse(
  runId: string,
  agentId: string,
  questionId: string,
  answerRaw: string,
  answerStructured: Record<string, unknown>,
  responseTimeMs: number,
  metadata: Record<string, unknown>
): Promise<SurveyResponse | null> {
  try {
    const client = getClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertData: any = {
      run_id: runId,
      agent_id: agentId,
      question_id: questionId,
      answer_raw: answerRaw,
      answer_structured_json: answerStructured,
      response_time_ms: responseTimeMs,
      metadata_json: metadata,
    };
    
    const { data, error } = await client
      .from('survey_responses')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as SurveyResponse;
  } catch (error) {
    console.error('Error saving survey response:', error);
    return null;
  }
}

/**
 * Save multiple survey responses (batch insert)
 */
export async function saveSurveyResponsesBatch(
  responses: Array<{
    run_id: string;
    agent_id: string;
    question_id: string;
    answer_raw: string;
    answer_structured_json: Record<string, unknown>;
    response_time_ms: number;
    metadata_json: Record<string, unknown>;
  }>
): Promise<boolean> {
  try {
    const client = getClient();
    
    const { error } = await client
      .from('survey_responses')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(responses as any);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving survey responses batch:', error);
    return false;
  }
}

// ============================================================================
// SURVEY RESULTS
// ============================================================================

/**
 * Get aggregated results for a run
 */
export async function getSurveyResults(runId: string): Promise<SurveyResult[]> {
  try {
    const client = getClient();
    
    const { data, error } = await client
      .from('survey_results')
      .select('*')
      .eq('run_id', runId);

    if (error) throw error;
    return (data as unknown as SurveyResult[]) || [];
  } catch (error) {
    console.error('Error fetching survey results:', error);
    return [];
  }
}

// ============================================================================
// MOCK FALLBACK
// ============================================================================

const MOCK_SURVEYS: Survey[] = [
  {
    id: 'mock-survey-1',
    name: 'Barómetro Político Chile 2024',
    description: 'Encuesta de opinión pública sobre temas políticos y sociales',
    status: 'active',
    category: 'political',
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'mock-q1',
    survey_id: 'mock-survey-1',
    code: 'GOV_APPROVAL',
    text: '¿Cómo evalúa la gestión del gobierno actual?',
    answer_type: 'scale',
    options_json: null,
    scale_config: {
      min: 1,
      max: 7,
      step: 1,
      labels: {
        '1': 'Muy mala',
        '2': 'Mala',
        '3': 'Algo mala',
        '4': 'Regular',
        '5': 'Algo buena',
        '6': 'Buena',
        '7': 'Muy buena',
      },
    },
    validation_rules: { required: true },
    order_index: 1,
    category: 'political',
    weight: 1.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Get mock surveys (fallback)
 */
export function getMockSurveys(): Survey[] {
  return MOCK_SURVEYS;
}

/**
 * Get mock questions (fallback)
 */
export function getMockQuestions(surveyId: string): SurveyQuestion[] {
  return surveyId === 'mock-survey-1' ? MOCK_QUESTIONS : [];
}

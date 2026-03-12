/**
 * useSurveys Hook
 * 
 * React hook for survey operations with loading states and error handling.
 * Follows the same pattern as useAgents, useTerritories, and useEvents.
 */

import { useState, useEffect, useCallback } from 'react';
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
import * as surveyRepo from '../repositories/surveyRepository';

// ============================================================================
// TYPES
// ============================================================================

interface UseSurveysState {
  surveys: Survey[];
  questions: SurveyQuestion[];
  runs: SurveyRun[];
  responses: SurveyResponse[];
  results: SurveyResult[];
  currentSurvey: SurveyWithDetails | null;
  currentRun: SurveyRun | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSurveysReturn extends UseSurveysState {
  // Actions
  fetchSurveys: (status?: string) => Promise<void>;
  fetchSurvey: (id: string) => Promise<void>;
  fetchQuestions: (surveyId: string) => Promise<void>;
  fetchRuns: (surveyId: string) => Promise<void>;
  fetchRunSummaries: (surveyId: string) => Promise<void>;
  fetchRun: (id: string) => Promise<void>;
  fetchResponses: (runId: string) => Promise<void>;
  fetchResults: (runId: string) => Promise<void>;
  createRun: (surveyId: string, config: SurveyExecutionConfig) => Promise<SurveyRun | null>;
  updateRunStatus: (
    runId: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
    startedAt?: string | null,
    completedAt?: string | null
  ) => Promise<boolean>;
  saveResponse: (
    runId: string,
    agentId: string,
    questionId: string,
    answerRaw: string,
    answerStructured: Record<string, unknown>,
    responseTimeMs: number,
    metadata: Record<string, unknown>
  ) => Promise<SurveyResponse | null>;
  saveResponsesBatch: (
    responses: Array<{
      run_id: string;
      agent_id: string;
      question_id: string;
      answer_raw: string;
      answer_structured_json: Record<string, unknown>;
      response_time_ms: number;
      metadata_json: Record<string, unknown>;
    }>
  ) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UseSurveysState = {
  surveys: [],
  questions: [],
  runs: [],
  responses: [],
  results: [],
  currentSurvey: null,
  currentRun: null,
  isLoading: false,
  error: null,
};

// ============================================================================
// HOOK
// ============================================================================

export function useSurveys(): UseSurveysReturn {
  const [state, setState] = useState<UseSurveysState>(initialState);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  // -------------------------------------------------------------------------
  // Fetch Actions
  // -------------------------------------------------------------------------

  const fetchSurveys = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const surveys = await surveyRepo.getSurveys(status);
      setState((prev) => ({ ...prev, surveys, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch surveys');
    }
  }, [setLoading, setError]);

  const fetchSurvey = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const survey = await surveyRepo.getSurveyWithQuestions(id);
      setState((prev) => ({ ...prev, currentSurvey: survey, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch survey');
    }
  }, [setLoading, setError]);

  const fetchQuestions = useCallback(async (surveyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const questions = await surveyRepo.getSurveyQuestions(surveyId);
      setState((prev) => ({ ...prev, questions, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch questions');
    }
  }, [setLoading, setError]);

  const fetchRuns = useCallback(async (surveyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const runs = await surveyRepo.getSurveyRuns(surveyId);
      setState((prev) => ({ ...prev, runs, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch runs');
    }
  }, [setLoading, setError]);

  const fetchRunSummaries = useCallback(async (surveyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const summaries = await surveyRepo.getSurveyRunSummaries(surveyId);
      // Convert summaries to runs for display
      const runs: SurveyRun[] = summaries.map((s) => ({
        id: s.id,
        survey_id: s.survey_id,
        territory_id: s.territory_id,
        name: s.name,
        description: s.description,
        sample_size: s.sample_size,
        run_type: s.run_type,
        status: s.status,
        config_json: s.config_json,
        started_at: s.started_at,
        completed_at: s.completed_at,
        created_by: s.created_by,
        created_at: s.created_at,
        updated_at: s.created_at,
      }));
      setState((prev) => ({ ...prev, runs, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch run summaries');
    }
  }, [setLoading, setError]);

  const fetchRun = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const run = await surveyRepo.getRunById(id);
      setState((prev) => ({ ...prev, currentRun: run, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch run');
    }
  }, [setLoading, setError]);

  const fetchResponses = useCallback(async (runId: string) => {
    setLoading(true);
    setError(null);
    try {
      const responses = await surveyRepo.getRunResponses(runId);
      setState((prev) => ({ ...prev, responses, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch responses');
    }
  }, [setLoading, setError]);

  const fetchResults = useCallback(async (runId: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await surveyRepo.getSurveyResults(runId);
      setState((prev) => ({ ...prev, results, isLoading: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch results');
    }
  }, [setLoading, setError]);

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  const createRun = useCallback(async (
    surveyId: string,
    config: SurveyExecutionConfig
  ): Promise<SurveyRun | null> => {
    setLoading(true);
    setError(null);
    try {
      const run = await surveyRepo.createSurveyRun(surveyId, config);
      if (run) {
        setState((prev) => ({
          ...prev,
          runs: [run, ...prev.runs],
          currentRun: run,
          isLoading: false,
        }));
      }
      return run;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
      return null;
    }
  }, [setLoading, setError]);

  const updateRunStatus = useCallback(async (
    runId: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
    startedAt?: string | null,
    completedAt?: string | null
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const success = await surveyRepo.updateRunStatus(runId, status, startedAt, completedAt);
      if (success) {
        setState((prev) => ({
          ...prev,
          runs: prev.runs.map((r) =>
            r.id === runId ? { ...r, status, started_at: startedAt ?? r.started_at, completed_at: completedAt ?? r.completed_at } : r
          ),
          currentRun: prev.currentRun?.id === runId
            ? { ...prev.currentRun, status, started_at: startedAt ?? prev.currentRun.started_at, completed_at: completedAt ?? prev.currentRun.completed_at }
            : prev.currentRun,
          isLoading: false,
        }));
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update run status');
      return false;
    }
  }, [setLoading, setError]);

  const saveResponse = useCallback(async (
    runId: string,
    agentId: string,
    questionId: string,
    answerRaw: string,
    answerStructured: Record<string, unknown>,
    responseTimeMs: number,
    metadata: Record<string, unknown>
  ): Promise<SurveyResponse | null> => {
    setError(null);
    try {
      const response = await surveyRepo.saveSurveyResponse(
        runId,
        agentId,
        questionId,
        answerRaw,
        answerStructured,
        responseTimeMs,
        metadata
      );
      if (response) {
        setState((prev) => ({
          ...prev,
          responses: [...prev.responses, response],
        }));
      }
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save response');
      return null;
    }
  }, [setError]);

  const saveResponsesBatch = useCallback(async (
    responses: Array<{
      run_id: string;
      agent_id: string;
      question_id: string;
      answer_raw: string;
      answer_structured_json: Record<string, unknown>;
      response_time_ms: number;
      metadata_json: Record<string, unknown>;
    }>
  ): Promise<boolean> => {
    setError(null);
    try {
      return await surveyRepo.saveSurveyResponsesBatch(responses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save responses batch');
      return false;
    }
  }, [setError]);

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    fetchSurveys,
    fetchSurvey,
    fetchQuestions,
    fetchRuns,
    fetchRunSummaries,
    fetchRun,
    fetchResponses,
    fetchResults,
    createRun,
    updateRunStatus,
    saveResponse,
    saveResponsesBatch,
    clearError,
    reset,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for a single survey with auto-fetch
 */
export function useSurvey(surveyId: string | null) {
  const {
    currentSurvey,
    questions,
    isLoading,
    error,
    fetchSurvey,
    fetchQuestions,
    clearError,
  } = useSurveys();

  useEffect(() => {
    if (surveyId) {
      fetchSurvey(surveyId);
    }
  }, [surveyId, fetchSurvey]);

  return {
    survey: currentSurvey,
    questions: currentSurvey?.questions || questions,
    isLoading,
    error,
    refetch: () => surveyId && fetchSurvey(surveyId),
    clearError,
  };
}

/**
 * Hook for survey runs with auto-fetch
 */
export function useSurveyRuns(surveyId: string | null) {
  const {
    runs,
    isLoading,
    error,
    fetchRuns,
    fetchRunSummaries,
    createRun,
    updateRunStatus,
    clearError,
  } = useSurveys();

  useEffect(() => {
    if (surveyId) {
      fetchRunSummaries(surveyId);
    }
  }, [surveyId, fetchRunSummaries]);

  return {
    runs,
    isLoading,
    error,
    refetch: () => surveyId && fetchRunSummaries(surveyId),
    createRun: (config: SurveyExecutionConfig) =>
      surveyId ? createRun(surveyId, config) : Promise.resolve(null),
    updateRunStatus,
    clearError,
  };
}

/**
 * Hook for a single run with responses
 */
export function useSurveyRun(runId: string | null) {
  const {
    currentRun,
    responses,
    results,
    isLoading,
    error,
    fetchRun,
    fetchResponses,
    fetchResults,
    saveResponse,
    saveResponsesBatch,
    clearError,
  } = useSurveys();

  useEffect(() => {
    if (runId) {
      fetchRun(runId);
      fetchResponses(runId);
      fetchResults(runId);
    }
  }, [runId, fetchRun, fetchResponses, fetchResults]);

  return {
    run: currentRun,
    responses,
    results,
    isLoading,
    error,
    refetch: () => {
      if (runId) {
        fetchRun(runId);
        fetchResponses(runId);
        fetchResults(runId);
      }
    },
    saveResponse,
    saveResponsesBatch,
    clearError,
  };
}

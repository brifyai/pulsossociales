/**
 * useSurveyExecutionV2 Hook
 *
 * React hook for executing surveys using the V2 engine.
 * Provides full agent data access and weighted aggregation.
 */

import { useState, useCallback, useRef } from 'react';
import {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
  SurveyExecutionConfig,
} from '../types/survey';
import type { FullAgent } from '../types/agent';
import {
  SurveyEngine,
  SurveyEngineConfig,
  SurveyProgress,
  SurveyResult,
  createExecutionConfig,
  calculateWeightedSurveyStats,
  aggregateWeightedScaleResponses,
  ENGINE_VERSION,
} from '../lib/surveyEngineV2';
import * as surveyRepo from '../repositories/surveyRepository';

// ============================================================================
// TYPES
// ============================================================================

interface UseSurveyExecutionV2State {
  isExecuting: boolean;
  progress: SurveyProgress | null;
  result: SurveyResult | null;
  error: string | null;
}

interface UseSurveyExecutionV2Return extends UseSurveyExecutionV2State {
  execute: (
    survey: Survey,
    questions: SurveyQuestion[],
    agents: FullAgent[],
    config?: Partial<SurveyExecutionConfig>
  ) => Promise<SurveyResult | null>;
  abort: () => void;
  clearError: () => void;
  reset: () => void;
  // Weighted stats helpers
  getWeightedStats: (responses: SurveyResponse[], agents: FullAgent[]) => ReturnType<typeof calculateWeightedSurveyStats>;
  getWeightedScaleStats: (
    responses: SurveyResponse[],
    agents: FullAgent[],
    min: number,
    max: number
  ) => ReturnType<typeof aggregateWeightedScaleResponses>;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: UseSurveyExecutionV2State = {
  isExecuting: false,
  progress: null,
  result: null,
  error: null,
};

// ============================================================================
// HOOK
// ============================================================================

export function useSurveyExecutionV2(): UseSurveyExecutionV2Return {
  const [state, setState] = useState<UseSurveyExecutionV2State>(initialState);
  const engineRef = useRef<SurveyEngine | null>(null);

  const setExecuting = useCallback((executing: boolean) => {
    setState((prev) => ({ ...prev, isExecuting: executing }));
  }, []);

  const setProgress = useCallback((progress: SurveyProgress) => {
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const setResult = useCallback((result: SurveyResult) => {
    setState((prev) => ({ ...prev, result, isExecuting: false }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isExecuting: false }));
  }, []);

  // -------------------------------------------------------------------------
  // Execute Survey
  // -------------------------------------------------------------------------

  const execute = useCallback(
    async (
      survey: Survey,
      questions: SurveyQuestion[],
      agents: FullAgent[],
      configOverrides?: Partial<SurveyExecutionConfig>
    ): Promise<SurveyResult | null> => {
      if (state.isExecuting) {
        setError('Survey execution already in progress');
        return null;
      }

      if (!questions.length || !agents.length) {
        setError('No questions or agents provided');
        return null;
      }

      setExecuting(true);
      setError(null);

      try {
        // Create execution config
        const execConfig = createExecutionConfig({
          surveyId: survey.id,
          sampleSize: agents.length,
          useRules: true,
          useLLM: false,
          batchSize: 10,
          delayMs: 50,
          ...configOverrides,
        });

        // Create run in database
        const run = await surveyRepo.createSurveyRun(survey.id, execConfig);
        if (!run) {
          throw new Error('Failed to create survey run');
        }

        // Create engine config
        const engineConfig: SurveyEngineConfig = {
          useLLM: execConfig.useLLM ?? false,
          useRules: execConfig.useRules ?? true,
          batchSize: execConfig.batchSize ?? 10,
          delayMs: execConfig.delayMs ?? 50,
          randomVariation: 0.1, // 10% random variation
          onProgress: setProgress,
          onComplete: setResult,
          onError: (err) => setError(err.message),
        };

        // Create and run engine
        engineRef.current = new SurveyEngine(engineConfig);
        const result = await engineRef.current.execute(survey, questions, agents, run);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Survey execution failed';
        setError(errorMessage);
        return null;
      } finally {
        setExecuting(false);
        engineRef.current = null;
      }
    },
    [state.isExecuting, setExecuting, setProgress, setResult, setError]
  );

  // -------------------------------------------------------------------------
  // Abort Execution
  // -------------------------------------------------------------------------

  const abort = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.abort();
      setState((prev) => ({
        ...prev,
        isExecuting: false,
        error: 'Execution aborted',
      }));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Utilities
  // -------------------------------------------------------------------------

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const reset = useCallback(() => {
    setState(initialState);
    engineRef.current = null;
  }, []);

  const getWeightedStats = useCallback(
    (responses: SurveyResponse[], agents: FullAgent[]) => {
      return calculateWeightedSurveyStats(responses, agents);
    },
    []
  );

  const getWeightedScaleStats = useCallback(
    (
      responses: SurveyResponse[],
      agents: FullAgent[],
      min: number,
      max: number
    ) => {
      return aggregateWeightedScaleResponses(responses, agents, min, max);
    },
    []
  );

  return {
    ...state,
    execute,
    abort,
    clearError,
    reset,
    getWeightedStats,
    getWeightedScaleStats,
  };
}

// Export engine version for reference
export { ENGINE_VERSION };

/**
 * useSurveyResults Hook
 *
 * Hook for aggregating survey results and comparing with benchmarks.
 * Provides:
 * - Result aggregation with weighting
 * - Benchmark loading and comparison
 * - Segment breakdowns
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  SurveyQuestion,
  SurveyResponse,
  AggregatedResult,
  BenchmarkComparison,
  SurveyBenchmark,
} from '../types/survey';
import type { FullAgent } from '../types/agent';
import {
  aggregateQuestionResults,
  compareWithBenchmark,
  formatPercentage,
  formatNumber,
  getSimilarityColor,
  getErrorColor,
} from '../lib/surveyResultsAggregator';
import {
  getBenchmarksForSurvey,
  getBenchmarkDataForQuestion,
  initializeSampleBenchmarks,
} from '../lib/surveyBenchmark';

// ============================================================================
// TYPES
// ============================================================================

interface UseSurveyResultsReturn {
  // Aggregated results
  aggregatedResults: AggregatedResult[];
  isLoading: boolean;
  error: string | null;

  // Benchmark
  benchmarks: SurveyBenchmark[];
  selectedBenchmarkId: string | null;
  setSelectedBenchmarkId: (id: string | null) => void;
  loadSampleBenchmarks: () => void;

  // Comparisons
  comparisons: BenchmarkComparison[];
  overallSimilarity: number;

  // Utilities
  getResultForQuestion: (questionId: string) => AggregatedResult | null;
  getComparisonForQuestion: (questionId: string) => BenchmarkComparison | null;

  // Formatters
  formatPercentage: (value: number, decimals?: number) => string;
  formatNumber: (value: number, decimals?: number) => string;
  getSimilarityColor: (score: number) => string;
  getErrorColor: (error: number) => string;
}

interface UseSurveyResultsOptions {
  surveyId: string;
  questions: SurveyQuestion[];
  responses: SurveyResponse[];
  agents: FullAgent[];
}

// ============================================================================
// HOOK
// ============================================================================

export function useSurveyResults({
  surveyId,
  questions,
  responses,
  agents,
}: UseSurveyResultsOptions): UseSurveyResultsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);

  // Convert agents to AgentInfo format
  const agentInfos = useMemo(
    () =>
      agents.map((agent) => ({
        id: agent.profile.id,
        profile: agent.profile,
        region: agent.profile.regionId,
      })),
    [agents]
  );

  // Aggregate results
  const aggregatedResults = useMemo(() => {
    if (questions.length === 0 || responses.length === 0) return [];

    setIsLoading(true);
    try {
      const results = questions.map((question) =>
        aggregateQuestionResults(question, responses, agentInfos)
      );
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aggregating results');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [questions, responses, agentInfos]);

  // Get available benchmarks
  const benchmarks = useMemo(() => {
    return getBenchmarksForSurvey(surveyId);
  }, [surveyId]);

  // Load sample benchmarks
  const loadSampleBenchmarks = useCallback(() => {
    initializeSampleBenchmarks(surveyId);
    // Force re-render by updating state
    setSelectedBenchmarkId(null);
  }, [surveyId]);

  // Get selected benchmark data
  const selectedBenchmark = useMemo(() => {
    if (!selectedBenchmarkId) return null;
    return benchmarks.find((b) => b.id === selectedBenchmarkId) ?? null;
  }, [benchmarks, selectedBenchmarkId]);

  // Build comparisons
  const comparisons = useMemo(() => {
    if (!selectedBenchmarkId) {
      return aggregatedResults.map((result) =>
        compareWithBenchmark(result, null)
      );
    }

    return aggregatedResults.map((result) => {
      const benchmarkData = getBenchmarkDataForQuestion(
        selectedBenchmarkId,
        result.questionId
      );
      return compareWithBenchmark(result, benchmarkData);
    });
  }, [aggregatedResults, selectedBenchmarkId]);

  // Calculate overall similarity
  const overallSimilarity = useMemo(() => {
    if (comparisons.length === 0) return 0;
    const totalSimilarity = comparisons.reduce(
      (sum, c) => sum + c.metrics.similarityScore,
      0
    );
    return totalSimilarity / comparisons.length;
  }, [comparisons]);

  // Get result for specific question
  const getResultForQuestion = useCallback(
    (questionId: string): AggregatedResult | null => {
      return aggregatedResults.find((r) => r.questionId === questionId) ?? null;
    },
    [aggregatedResults]
  );

  // Get comparison for specific question
  const getComparisonForQuestion = useCallback(
    (questionId: string): BenchmarkComparison | null => {
      return comparisons.find((c) => c.questionId === questionId) ?? null;
    },
    [comparisons]
  );

  return {
    // Results
    aggregatedResults,
    isLoading,
    error,

    // Benchmark
    benchmarks,
    selectedBenchmarkId,
    setSelectedBenchmarkId,
    loadSampleBenchmarks,

    // Comparisons
    comparisons,
    overallSimilarity,

    // Utilities
    getResultForQuestion,
    getComparisonForQuestion,

    // Formatters
    formatPercentage,
    formatNumber,
    getSimilarityColor,
    getErrorColor,
  };
}

// ============================================================================
// ADDITIONAL UTILITIES
// ============================================================================

/**
 * Calculate summary statistics across all questions
 */
export function calculateSurveySummary(
  comparisons: BenchmarkComparison[]
): {
  totalQuestions: number;
  questionsWithBenchmark: number;
  averageSimilarity: number;
  averageMAE: number;
  bestMatch: { questionCode: string; similarity: number } | null;
  worstMatch: { questionCode: string; similarity: number } | null;
} {
  if (comparisons.length === 0) {
    return {
      totalQuestions: 0,
      questionsWithBenchmark: 0,
      averageSimilarity: 0,
      averageMAE: 0,
      bestMatch: null,
      worstMatch: null,
    };
  }

  const withBenchmark = comparisons.filter((c) => c.benchmark !== null);

  const similarities = withBenchmark.map((c) => c.metrics.similarityScore);
  const maes = withBenchmark.map((c) => c.metrics.mae);

  const averageSimilarity =
    similarities.length > 0
      ? similarities.reduce((a, b) => a + b, 0) / similarities.length
      : 0;

  const averageMAE =
    maes.length > 0 ? maes.reduce((a, b) => a + b, 0) / maes.length : 0;

  // Find best and worst matches
  let bestMatch: { questionCode: string; similarity: number } | null = null;
  let worstMatch: { questionCode: string; similarity: number } | null = null;

  for (const c of withBenchmark) {
    if (!bestMatch || c.metrics.similarityScore > bestMatch.similarity) {
      bestMatch = { questionCode: c.questionCode, similarity: c.metrics.similarityScore };
    }
    if (!worstMatch || c.metrics.similarityScore < worstMatch.similarity) {
      worstMatch = { questionCode: c.questionCode, similarity: c.metrics.similarityScore };
    }
  }

  return {
    totalQuestions: comparisons.length,
    questionsWithBenchmark: withBenchmark.length,
    averageSimilarity,
    averageMAE,
    bestMatch,
    worstMatch,
  };
}

/**
 * Export results to CSV format
 */
export function exportResultsToCSV(
  comparisons: BenchmarkComparison[],
  includeBenchmark: boolean = true
): string {
  const headers = [
    'Question Code',
    'Question Text',
    'Answer Type',
    'Total Responses',
    'Total Weight',
  ];

  if (includeBenchmark) {
    headers.push(
      'Similarity Score',
      'MAE',
      'RMSE',
      'Mean Difference',
      'Percentage Difference'
    );
  }

  const rows = comparisons.map((c) => {
    const row = [
      c.questionCode,
      `"${c.questionText.replace(/"/g, '""')}"`,
      c.answerType,
      c.synthetic.totalResponses.toString(),
      c.synthetic.totalWeight.toFixed(2),
    ];

    if (includeBenchmark) {
      row.push(
        (c.metrics.similarityScore * 100).toFixed(1) + '%',
        c.metrics.mae.toFixed(2) + '%',
        c.metrics.rmse.toFixed(2) + '%',
        c.metrics.meanDifference?.toFixed(2) ?? 'N/A',
        (c.metrics.percentageDifference?.toFixed(1) ?? 'N/A') + '%'
      );
    }

    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

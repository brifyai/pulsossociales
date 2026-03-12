/**
 * Survey Components Index
 *
 * Centralized exports for all survey-related components.
 */

// Main Components
export { SurveyPanel } from '../SurveyPanel';
export { SurveyResultsPanel } from '../SurveyResultsPanel';
export { SurveyResultsView, SurveyResultsPage } from '../SurveyResultsView';

// Re-export types for convenience
export type {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
  SurveyExecutionConfig,
  AggregatedResult,
  SurveyBenchmark,
  BenchmarkComparison,
} from '../../types/survey';

// Re-export hooks
export {
  useSurveys,
  useSurvey,
  useSurveyRuns,
} from '../../hooks/useSurveys';

export { useSurveyResults } from '../../hooks/useSurveyResults';

// Re-export utilities
export {
  aggregateQuestionResults,
  compareWithBenchmark,
  formatPercentage,
  formatNumber,
  getSimilarityColor,
  getErrorColor,
} from '../../lib/surveyResultsAggregator';

export {
  createBenchmark,
  addBenchmarkDataPoint,
  getBenchmark,
  getBenchmarksForSurvey,
  getBenchmarkDataForQuestion,
  getAllBenchmarkData,
  deleteBenchmark,
  initializeSampleBenchmarks,
  loadBenchmarkFromJSON,
  exportBenchmarkToJSON,
  exportAllBenchmarks,
  validateBenchmarkData,
  getBenchmarkValidationSummary,
} from '../../lib/surveyBenchmark';

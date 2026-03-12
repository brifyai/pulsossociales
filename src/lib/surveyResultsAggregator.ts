/**
 * Survey Results Aggregator
 *
 * Utilities for aggregating survey responses with weighted statistics.
 * Supports distribution calculations, segment breakdowns, and benchmark comparison.
 */

import type {
  SurveyResponse,
  SurveyQuestion,
  AggregatedResult,
  DistributionItem,
  NumericStatistics,
  SegmentBreakdown,
  BenchmarkDataPoint,
  BenchmarkComparison,
  ComparisonMetrics,
  OptionComparison,
  AnswerType,
} from '../types/survey';
import type { AgentProfile } from '../types/agent';

// ============================================================================
// TYPES
// ============================================================================

interface AgentInfo {
  id: string;
  profile: AgentProfile;
  region?: string;
}

interface ResponseWithAgent extends SurveyResponse {
  agentInfo?: AgentInfo;
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Aggregate responses for a single question
 */
export function aggregateQuestionResults(
  question: SurveyQuestion,
  responses: SurveyResponse[],
  agents: AgentInfo[]
): AggregatedResult {
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  // Filter responses for this question
  const questionResponses = responses.filter((r) => r.question_id === question.id);

  // Calculate total weight
  const totalWeight = questionResponses.reduce((sum, r) => {
    const agent = agentMap.get(r.agent_id);
    return sum + (agent?.profile.weight ?? 1);
  }, 0);

  // Build distribution
  const distribution = buildDistribution(question, questionResponses, agentMap);

  // Calculate statistics for numeric/scale questions
  const statistics = calculateStatistics(question, questionResponses, agentMap);

  // Build segment breakdowns
  const segments = buildSegmentBreakdowns(questionResponses, agentMap);

  return {
    questionId: question.id,
    questionCode: question.code,
    questionText: question.text,
    answerType: question.answer_type,
    totalResponses: questionResponses.length,
    totalWeight,
    distribution,
    weightedDistribution: distribution, // Same reference, already weighted
    statistics,
    segments,
  };
}

/**
 * Build distribution of responses
 */
function buildDistribution(
  question: SurveyQuestion,
  responses: SurveyResponse[],
  agentMap: Map<string, AgentInfo>
): DistributionItem[] {
  const counts = new Map<string | number, { count: number; weight: number; label: string }>();

  // Initialize with options if available
  if (question.options_json) {
    for (const opt of question.options_json) {
      counts.set(opt.value, { count: 0, weight: 0, label: opt.label });
    }
  }

  // Count responses
  for (const response of responses) {
    const value = extractValue(response);
    if (value === null) continue;

    const agent = agentMap.get(response.agent_id);
    const weight = agent?.profile.weight ?? 1;

    const existing = counts.get(value);
    if (existing) {
      existing.count++;
      existing.weight += weight;
    } else {
      const label =
        question.options_json?.find((o) => o.value === String(value))?.label ??
        String(value);
      counts.set(value, { count: 1, weight, label });
    }
  }

  // Calculate percentages
  const totalCount = responses.length;
  const totalWeight = Array.from(counts.values()).reduce((sum, c) => sum + c.weight, 0);

  return Array.from(counts.entries()).map(([value, data]) => ({
    value,
    label: data.label,
    count: data.count,
    percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
    weight: data.weight,
    weightedPercentage: totalWeight > 0 ? (data.weight / totalWeight) * 100 : 0,
  }));
}

/**
 * Extract numeric value from response
 */
function extractValue(response: SurveyResponse): string | number | null {
  if (!response.answer_structured_json?.value) return null;

  const value = response.answer_structured_json.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }
  return String(value);
}

/**
 * Calculate statistics for numeric/scale questions
 */
function calculateStatistics(
  question: SurveyQuestion,
  responses: SurveyResponse[],
  agentMap: Map<string, AgentInfo>
): NumericStatistics | undefined {
  if (question.answer_type !== 'scale' && question.answer_type !== 'number') {
    return undefined;
  }

  const values: number[] = [];
  const weightedValues: Array<{ value: number; weight: number }> = [];

  for (const response of responses) {
    const value = extractNumericValue(response);
    if (value === null) continue;

    const agent = agentMap.get(response.agent_id);
    const weight = agent?.profile.weight ?? 1;

    values.push(value);
    weightedValues.push({ value, weight });
  }

  if (values.length === 0) return undefined;

  // Sort for median
  values.sort((a, b) => a - b);
  weightedValues.sort((a, b) => a.value - b.value);

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const min = values[0];
  const max = values[values.length - 1];

  // Calculate weighted mean
  const totalWeight = weightedValues.reduce((sum, v) => sum + v.weight, 0);
  const weightedMean =
    totalWeight > 0
      ? weightedValues.reduce((sum, v) => sum + v.value * v.weight, 0) / totalWeight
      : mean;

  // Calculate medians
  const median = calculateMedian(values);
  const weightedMedian = calculateWeightedMedian(weightedValues);

  // Calculate standard deviation
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    weightedMean,
    median,
    weightedMedian,
    min,
    max,
    stdDev,
  };
}

/**
 * Extract numeric value from response
 */
function extractNumericValue(response: SurveyResponse): number | null {
  const value = response.answer_structured_json?.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return null;
}

/**
 * Calculate median
 */
function calculateMedian(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  if (n % 2 === 0) {
    return (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2;
  }
  return sortedValues[Math.floor(n / 2)];
}

/**
 * Calculate weighted median
 */
function calculateWeightedMedian(
  sortedWeightedValues: Array<{ value: number; weight: number }>
): number {
  const totalWeight = sortedWeightedValues.reduce((sum, v) => sum + v.weight, 0);
  let cumulativeWeight = 0;

  for (const { value, weight } of sortedWeightedValues) {
    cumulativeWeight += weight;
    if (cumulativeWeight >= totalWeight / 2) {
      return value;
    }
  }

  return sortedWeightedValues[0]?.value ?? 0;
}

/**
 * Build segment breakdowns
 */
function buildSegmentBreakdowns(
  responses: SurveyResponse[],
  agentMap: Map<string, AgentInfo>
): SegmentBreakdown[] {
  const segments: SegmentBreakdown[] = [];

  // Group by region
  const byRegion = groupBy(responses, (r) => {
    const agent = agentMap.get(r.agent_id);
    return agent?.region ?? 'unknown';
  });

  for (const [region, regionResponses] of Object.entries(byRegion)) {
    if (region === 'unknown') continue;

    const distribution = buildSegmentDistribution(regionResponses, agentMap);
    const avgResponse = calculateSegmentAverage(regionResponses, agentMap);

    segments.push({
      segmentType: 'region',
      segmentValue: region,
      count: regionResponses.length,
      weight: regionResponses.reduce(
        (sum, r) => sum + (agentMap.get(r.agent_id)?.profile.weight ?? 1),
        0
      ),
      avgResponse,
      distribution,
    });
  }

  // Group by age
  const byAge = groupBy(responses, (r) => {
    const agent = agentMap.get(r.agent_id);
    if (!agent) return 'unknown';
    const age = agent.profile.age;
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    return '60+';
  });

  for (const [ageGroup, ageResponses] of Object.entries(byAge)) {
    if (ageGroup === 'unknown') continue;

    const distribution = buildSegmentDistribution(ageResponses, agentMap);
    const avgResponse = calculateSegmentAverage(ageResponses, agentMap);

    segments.push({
      segmentType: 'age_group',
      segmentValue: ageGroup,
      count: ageResponses.length,
      weight: ageResponses.reduce(
        (sum, r) => sum + (agentMap.get(r.agent_id)?.profile.weight ?? 1),
        0
      ),
      avgResponse,
      distribution,
    });
  }

  // Group by sex
  const bySex = groupBy(responses, (r) => {
    const agent = agentMap.get(r.agent_id);
    return agent?.profile.sex ?? 'unknown';
  });

  for (const [sex, sexResponses] of Object.entries(bySex)) {
    if (sex === 'unknown') continue;

    const distribution = buildSegmentDistribution(sexResponses, agentMap);
    const avgResponse = calculateSegmentAverage(sexResponses, agentMap);

    segments.push({
      segmentType: 'gender',
      segmentValue: sex,
      count: sexResponses.length,
      weight: sexResponses.reduce(
        (sum, r) => sum + (agentMap.get(r.agent_id)?.profile.weight ?? 1),
        0
      ),
      avgResponse,
      distribution,
    });
  }

  return segments;
}

/**
 * Group array by key function
 */
function groupBy<T, K extends string>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

/**
 * Build distribution for segment
 */
function buildSegmentDistribution(
  responses: SurveyResponse[],
  agentMap: Map<string, AgentInfo>
): DistributionItem[] {
  const counts = new Map<string | number, { count: number; weight: number; label: string }>();

  for (const response of responses) {
    const value = extractValue(response);
    if (value === null) continue;

    const agent = agentMap.get(response.agent_id);
    const weight = agent?.profile.weight ?? 1;

    const existing = counts.get(value);
    if (existing) {
      existing.count++;
      existing.weight += weight;
    } else {
      counts.set(value, { count: 1, weight, label: String(value) });
    }
  }

  const totalCount = responses.length;
  const totalWeight = Array.from(counts.values()).reduce((sum, c) => sum + c.weight, 0);

  return Array.from(counts.entries()).map(([value, data]) => ({
    value,
    label: data.label,
    count: data.count,
    percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
    weight: data.weight,
    weightedPercentage: totalWeight > 0 ? (data.weight / totalWeight) * 100 : 0,
  }));
}

/**
 * Calculate weighted average for segment
 */
function calculateSegmentAverage(
  responses: SurveyResponse[],
  agentMap: Map<string, AgentInfo>
): number | undefined {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const response of responses) {
    const value = extractNumericValue(response);
    if (value === null) continue;

    const agent = agentMap.get(response.agent_id);
    const weight = agent?.profile.weight ?? 1;

    weightedSum += value * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return undefined;
  return weightedSum / totalWeight;
}

// ============================================================================
// BENCHMARK COMPARISON
// ============================================================================

/**
 * Compare aggregated results with benchmark
 */
export function compareWithBenchmark(
  aggregated: AggregatedResult,
  benchmark: BenchmarkDataPoint | null
): BenchmarkComparison {
  if (!benchmark) {
    return {
      questionId: aggregated.questionId,
      questionCode: aggregated.questionCode,
      questionText: aggregated.questionText,
      answerType: aggregated.answerType,
      synthetic: aggregated,
      benchmark: null,
      metrics: {
        similarityScore: 0,
        mae: 0,
        rmse: 0,
        chiSquare: null,
        ksStatistic: null,
        meanDifference: null,
        percentageDifference: null,
      },
      optionComparisons: [],
    };
  }

  // Build option comparisons
  const optionComparisons = buildOptionComparisons(
    aggregated.distribution,
    benchmark.expectedDistribution
  );

  // Calculate metrics
  const metrics = calculateComparisonMetrics(aggregated, benchmark, optionComparisons);

  return {
    questionId: aggregated.questionId,
    questionCode: aggregated.questionCode,
    questionText: aggregated.questionText,
    answerType: aggregated.answerType,
    synthetic: aggregated,
    benchmark,
    metrics,
    optionComparisons,
  };
}

/**
 * Build option-level comparisons
 */
function buildOptionComparisons(
  syntheticDistribution: DistributionItem[],
  benchmarkDistribution: Array<{ value: string | number; label: string; percentage: number }>
): OptionComparison[] {
  const comparisons: OptionComparison[] = [];

  // Create lookup for benchmark
  const benchmarkMap = new Map(
    benchmarkDistribution.map((b) => [String(b.value), b.percentage])
  );

  // Create lookup for synthetic
  const syntheticMap = new Map(
    syntheticDistribution.map((s) => [String(s.value), s.percentage])
  );

  // All unique values
  const allValues = new Set([
    ...syntheticDistribution.map((s) => String(s.value)),
    ...benchmarkDistribution.map((b) => String(b.value)),
  ]);

  for (const value of allValues) {
    const synthetic = syntheticDistribution.find((s) => String(s.value) === value);
    const benchmark = benchmarkDistribution.find((b) => String(b.value) === value);

    const syntheticPct = synthetic?.percentage ?? 0;
    const benchmarkPct = benchmark?.percentage ?? 0;
    const absoluteError = Math.abs(syntheticPct - benchmarkPct);
    const relativeError = benchmarkPct > 0 ? (absoluteError / benchmarkPct) * 100 : 0;

    comparisons.push({
      value: synthetic?.value ?? value,
      label: synthetic?.label ?? benchmark?.label ?? String(value),
      syntheticPercentage: syntheticPct,
      benchmarkPercentage: benchmarkPct,
      absoluteError,
      relativeError,
    });
  }

  return comparisons.sort((a, b) => String(a.value).localeCompare(String(b.value)));
}

/**
 * Calculate comparison metrics
 */
function calculateComparisonMetrics(
  aggregated: AggregatedResult,
  benchmark: BenchmarkDataPoint,
  optionComparisons: OptionComparison[]
): ComparisonMetrics {
  // Mean Absolute Error
  const mae =
    optionComparisons.reduce((sum, o) => sum + o.absoluteError, 0) /
    optionComparisons.length;

  // Root Mean Square Error
  const rmse = Math.sqrt(
    optionComparisons.reduce((sum, o) => sum + Math.pow(o.absoluteError, 2), 0) /
      optionComparisons.length
  );

  // Similarity score (1 - normalized MAE)
  const similarityScore = Math.max(0, 1 - mae / 100);

  // Mean difference for numeric questions
  let meanDifference: number | null = null;
  let percentageDifference: number | null = null;

  if (aggregated.statistics && benchmark.expectedStatistics) {
    meanDifference = aggregated.statistics.mean - benchmark.expectedStatistics.mean;
    percentageDifference =
      benchmark.expectedStatistics.mean !== 0
        ? (meanDifference / benchmark.expectedStatistics.mean) * 100
        : null;
  }

  // Chi-square (simplified)
  const chiSquare = calculateChiSquare(optionComparisons);

  return {
    similarityScore,
    mae,
    rmse,
    chiSquare,
    ksStatistic: null, // Would require full distribution comparison
    meanDifference,
    percentageDifference,
  };
}

/**
 * Calculate chi-square statistic
 */
function calculateChiSquare(optionComparisons: OptionComparison[]): number | null {
  // Chi-square = sum((O - E)^2 / E)
  let chiSq = 0;
  let hasExpected = false;

  for (const opt of optionComparisons) {
    const observed = opt.syntheticPercentage;
    const expected = opt.benchmarkPercentage;

    if (expected > 0) {
      hasExpected = true;
      chiSq += Math.pow(observed - expected, 2) / expected;
    }
  }

  return hasExpected ? chiSq : null;
}

// ============================================================================
// BENCHMARK VALIDATION
// ============================================================================

export interface BenchmarkValidationResult {
  isValid: boolean;
  matchPercentage: number;
  matchedOptions: string[];
  unmatchedBenchmarkOptions: string[];
  unmatchedSyntheticOptions: string[];
  warnings: string[];
}

/**
 * Validate benchmark consistency against question options
 */
export function validateBenchmarkConsistency(
  question: SurveyQuestion,
  benchmark: BenchmarkDataPoint
): BenchmarkValidationResult {
  const warnings: string[] = [];
  
  // Get option values from question
  const questionOptionValues = new Set(
    question.options_json?.map(o => String(o.value)) ?? []
  );
  
  // Get option values from benchmark
  const benchmarkOptionValues = new Set(
    benchmark.expectedDistribution.map(d => String(d.value))
  );
  
  // Find matches and mismatches
  const matchedOptions: string[] = [];
  const unmatchedBenchmarkOptions: string[] = [];
  const unmatchedSyntheticOptions: string[] = [];
  
  for (const value of benchmarkOptionValues) {
    if (questionOptionValues.has(value)) {
      matchedOptions.push(value);
    } else {
      unmatchedBenchmarkOptions.push(value);
    }
  }
  
  for (const value of questionOptionValues) {
    if (!benchmarkOptionValues.has(value)) {
      unmatchedSyntheticOptions.push(value);
    }
  }
  
  // Calculate match percentage
  const totalUniqueOptions = new Set([...questionOptionValues, ...benchmarkOptionValues]).size;
  const matchPercentage = totalUniqueOptions > 0 
    ? (matchedOptions.length / totalUniqueOptions) * 100 
    : 0;
  
  // Generate warnings
  if (unmatchedBenchmarkOptions.length > 0) {
    warnings.push(
      `Benchmark tiene ${unmatchedBenchmarkOptions.length} opciones sin correspondencia: ${unmatchedBenchmarkOptions.join(', ')}`
    );
  }
  
  if (unmatchedSyntheticOptions.length > 0) {
    warnings.push(
      `Encuesta tiene ${unmatchedSyntheticOptions.length} opciones no cubiertas por benchmark: ${unmatchedSyntheticOptions.join(', ')}`
    );
  }
  
  if (matchPercentage < 80) {
    warnings.push(
      `Match de opciones es ${matchPercentage.toFixed(1)}% (recomendado: >80%)`
    );
  }
  
  const isValid = matchPercentage >= 50; // Al menos 50% para considerarse válido
  
  return {
    isValid,
    matchPercentage,
    matchedOptions,
    unmatchedBenchmarkOptions,
    unmatchedSyntheticOptions,
    warnings,
  };
}

/**
 * Get quality indicator for benchmark match
 */
export function getBenchmarkMatchQuality(matchPercentage: number): {
  label: string;
  color: string;
} {
  if (matchPercentage >= 90) {
    return { label: 'Excelente', color: 'text-green-600' };
  }
  if (matchPercentage >= 80) {
    return { label: 'Bueno', color: 'text-green-500' };
  }
  if (matchPercentage >= 60) {
    return { label: 'Aceptable', color: 'text-yellow-600' };
  }
  if (matchPercentage >= 40) {
    return { label: 'Débil', color: 'text-orange-600' };
  }
  return { label: 'Pobre', color: 'text-red-600' };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number for display
 */
export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Get color for similarity score
 */
export function getSimilarityColor(score: number): string {
  if (score >= 0.9) return 'text-green-600';
  if (score >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get color for error
 */
export function getErrorColor(error: number): string {
  if (error <= 5) return 'text-green-600';
  if (error <= 15) return 'text-yellow-600';
  return 'text-red-600';
}

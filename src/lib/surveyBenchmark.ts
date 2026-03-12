/**
 * Survey Benchmark - Simple benchmark structure for initial validation
 *
 * This module provides:
 * - In-memory benchmark storage (no database required)
 * - Simple benchmark data loading
 * - Comparison utilities
 *
 * For production, this should be replaced with a proper database table.
 */

import type {
  SurveyBenchmark,
  BenchmarkDataPoint,
  BenchmarkDistributionItem,
} from '../types/survey';

// ============================================================================
// IN-MEMORY STORAGE (temporary until database migration)
// ============================================================================

const benchmarks: Map<string, SurveyBenchmark> = new Map();
const benchmarkData: Map<string, BenchmarkDataPoint[]> = new Map();

// ============================================================================
// BENCHMARK MANAGEMENT
// ============================================================================

/**
 * Create a new benchmark
 */
export function createBenchmark(
  surveyId: string,
  name: string,
  source: string,
  options: {
    description?: string;
    sourceUrl?: string;
    sampleSize?: number;
    marginOfError?: number;
  } = {}
): SurveyBenchmark {
  const benchmark: SurveyBenchmark = {
    id: `bench_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    surveyId,
    name,
    description: options.description ?? null,
    source,
    sourceUrl: options.sourceUrl ?? null,
    dateCollected: new Date().toISOString(),
    sampleSize: options.sampleSize ?? 0,
    marginOfError: options.marginOfError ?? null,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  benchmarks.set(benchmark.id, benchmark);
  benchmarkData.set(benchmark.id, []);

  return benchmark;
}

/**
 * Add data point to benchmark
 */
export function addBenchmarkDataPoint(
  benchmarkId: string,
  questionId: string,
  questionCode: string,
  distribution: BenchmarkDistributionItem[],
  options: {
    expectedStatistics?: { mean: number; median: number; stdDev: number | null };
    sampleSize?: number;
    notes?: string;
  } = {}
): BenchmarkDataPoint {
  const dataPoint: BenchmarkDataPoint = {
    benchmarkId,
    questionId,
    questionCode,
    expectedDistribution: distribution,
    expectedStatistics: options.expectedStatistics,
    sampleSize: options.sampleSize ?? 0,
    dateCollected: new Date().toISOString(),
    notes: options.notes ?? null,
  };

  const existing = benchmarkData.get(benchmarkId) ?? [];
  existing.push(dataPoint);
  benchmarkData.set(benchmarkId, existing);

  return dataPoint;
}

/**
 * Get benchmark by ID
 */
export function getBenchmark(benchmarkId: string): SurveyBenchmark | null {
  return benchmarks.get(benchmarkId) ?? null;
}

/**
 * Get all benchmarks for a survey
 */
export function getBenchmarksForSurvey(surveyId: string): SurveyBenchmark[] {
  return Array.from(benchmarks.values()).filter((b) => b.surveyId === surveyId);
}

/**
 * Get benchmark data for a question
 */
export function getBenchmarkDataForQuestion(
  benchmarkId: string,
  questionId: string
): BenchmarkDataPoint | null {
  const data = benchmarkData.get(benchmarkId) ?? [];
  return data.find((d) => d.questionId === questionId) ?? null;
}

/**
 * Get all data points for a benchmark
 */
export function getAllBenchmarkData(benchmarkId: string): BenchmarkDataPoint[] {
  return benchmarkData.get(benchmarkId) ?? [];
}

/**
 * Delete benchmark
 */
export function deleteBenchmark(benchmarkId: string): boolean {
  benchmarks.delete(benchmarkId);
  benchmarkData.delete(benchmarkId);
  return true;
}

// ============================================================================
// PREDEFINED BENCHMARKS
// ============================================================================

/**
 * Initialize with sample CEP-style benchmarks
 * This creates realistic benchmark data for testing
 */
export function initializeSampleBenchmarks(surveyId: string): void {
  // Clear existing
  const existing = getBenchmarksForSurvey(surveyId);
  for (const b of existing) {
    deleteBenchmark(b.id);
  }

  // Create CEP benchmark
  const cepBench = createBenchmark(surveyId, 'CEP Octubre 2024', 'cep', {
    description: 'Encuesta CEP Octubre 2024 - Resultados nacionales',
    sourceUrl: 'https://www.cepchile.cl',
    sampleSize: 1460,
    marginOfError: 3.0,
  });

  // Add sample data points (these would come from real CEP data)
  // Approval rating question
  addBenchmarkDataPoint(
    cepBench.id,
    'q_approval',
    'PRES_APROB',
    [
      { value: 'approve', label: 'Aprueba', percentage: 28.5, count: 416 },
      { value: 'disapprove', label: 'Desaprueba', percentage: 58.2, count: 850 },
      { value: 'no_opinion', label: 'No sabe/No opina', percentage: 13.3, count: 194 },
    ],
    { sampleSize: 1460, notes: 'Aprobación Presidente' }
  );

  // Economic situation
  addBenchmarkDataPoint(
    cepBench.id,
    'q_econ_situation',
    'ECON_SIT',
    [
      { value: 'much_better', label: 'Mucho mejor', percentage: 2.1, count: 31 },
      { value: 'better', label: 'Mejor', percentage: 8.5, count: 124 },
      { value: 'same', label: 'Igual', percentage: 28.3, count: 413 },
      { value: 'worse', label: 'Peor', percentage: 42.7, count: 623 },
      { value: 'much_worse', label: 'Mucho peor', percentage: 15.8, count: 231 },
      { value: 'no_opinion', label: 'No sabe/No opina', percentage: 2.6, count: 38 },
    ],
    { sampleSize: 1460, notes: 'Situación económica país' }
  );

  // Trust in institutions - Carabineros
  addBenchmarkDataPoint(
    cepBench.id,
    'q_trust_carab',
    'CONF_CARAB',
    [
      { value: 'a_lot', label: 'Mucha confianza', percentage: 18.2, count: 266 },
      { value: 'some', label: 'Algo de confianza', percentage: 42.5, count: 620 },
      { value: 'little', label: 'Poca confianza', percentage: 24.8, count: 362 },
      { value: 'none', label: 'Ninguna confianza', percentage: 12.3, count: 180 },
      { value: 'no_opinion', label: 'No sabe/No opina', percentage: 2.2, count: 32 },
    ],
    { sampleSize: 1460, notes: 'Confianza en Carabineros' }
  );

  // Political interest (scale 1-5)
  addBenchmarkDataPoint(
    cepBench.id,
    'q_pol_interest',
    'INTERES_POL',
    [
      { value: '1', label: 'Nada interesado', percentage: 18.5, count: 270 },
      { value: '2', label: 'Poco interesado', percentage: 28.3, count: 413 },
      { value: '3', label: 'Ni mucho ni poco', percentage: 26.4, count: 385 },
      { value: '4', label: 'Algo interesado', percentage: 18.8, count: 274 },
      { value: '5', label: 'Muy interesado', percentage: 8.0, count: 118 },
    ],
    {
      expectedStatistics: { mean: 2.69, median: 3, stdDev: 1.21 },
      sampleSize: 1460,
      notes: 'Interés en política (escala 1-5)',
    }
  );

  // Create another benchmark for comparison
  const cademBench = createBenchmark(surveyId, 'Cadem Octubre 2024', 'cadem', {
    description: 'Encuesta Plaza Pública Cadem Octubre 2024',
    sourceUrl: 'https://www.cadem.cl',
    sampleSize: 702,
    marginOfError: 3.7,
  });

  // Similar questions with slightly different results
  addBenchmarkDataPoint(
    cademBench.id,
    'q_approval',
    'PRES_APROB',
    [
      { value: 'approve', label: 'Aprueba', percentage: 31.2, count: 219 },
      { value: 'disapprove', label: 'Desaprueba', percentage: 55.8, count: 392 },
      { value: 'no_opinion', label: 'No sabe/No opina', percentage: 13.0, count: 91 },
    ],
    { sampleSize: 702, notes: 'Aprobación Presidente' }
  );
}

// ============================================================================
// BENCHMARK LOADING FROM JSON
// ============================================================================

/**
 * Load benchmark from JSON data
 */
export function loadBenchmarkFromJSON(
  surveyId: string,
  name: string,
  source: string,
  jsonData: {
    description?: string;
    sourceUrl?: string;
    sampleSize?: number;
    marginOfError?: number;
    dateCollected?: string;
    questions: Array<{
      questionId: string;
      questionCode: string;
      distribution: BenchmarkDistributionItem[];
      expectedStatistics?: { mean: number; median: number; stdDev: number | null };
      notes?: string;
    }>;
  }
): SurveyBenchmark {
  const benchmark = createBenchmark(surveyId, name, source, {
    description: jsonData.description,
    sourceUrl: jsonData.sourceUrl,
    sampleSize: jsonData.sampleSize,
    marginOfError: jsonData.marginOfError,
  });

  // Override date if provided
  if (jsonData.dateCollected) {
    const b = benchmarks.get(benchmark.id)!;
    b.dateCollected = jsonData.dateCollected;
  }

  // Add data points
  for (const q of jsonData.questions) {
    addBenchmarkDataPoint(
      benchmark.id,
      q.questionId,
      q.questionCode,
      q.distribution,
      {
        expectedStatistics: q.expectedStatistics,
        sampleSize: jsonData.sampleSize,
        notes: q.notes,
      }
    );
  }

  return benchmark;
}

// ============================================================================
// EXPORT/IMPORT
// ============================================================================

/**
 * Export benchmark to JSON
 */
export function exportBenchmarkToJSON(benchmarkId: string): object | null {
  const benchmark = getBenchmark(benchmarkId);
  if (!benchmark) return null;

  const data = getAllBenchmarkData(benchmarkId);

  return {
    ...benchmark,
    dataPoints: data,
  };
}

/**
 * Export all benchmarks for a survey
 */
export function exportAllBenchmarks(surveyId: string): object[] {
  const surveyBenchmarks = getBenchmarksForSurvey(surveyId);
  return surveyBenchmarks
    .map((b) => exportBenchmarkToJSON(b.id))
    .filter((b): b is object => b !== null);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate benchmark data
 */
export function validateBenchmarkData(data: BenchmarkDataPoint): string[] {
  const errors: string[] = [];

  // Check distribution sums to ~100%
  const totalPercentage = data.expectedDistribution.reduce(
    (sum, d) => sum + d.percentage,
    0
  );
  if (Math.abs(totalPercentage - 100) > 1) {
    errors.push(
      `Distribution percentages sum to ${totalPercentage.toFixed(1)}%, expected ~100%`
    );
  }

  // Check for negative percentages
  for (const d of data.expectedDistribution) {
    if (d.percentage < 0) {
      errors.push(`Negative percentage found: ${d.percentage}%`);
    }
  }

  return errors;
}

/**
 * Get validation summary for benchmark
 */
export function getBenchmarkValidationSummary(benchmarkId: string): {
  totalDataPoints: number;
  validDataPoints: number;
  errors: Array<{ questionCode: string; errors: string[] }>;
} {
  const data = getAllBenchmarkData(benchmarkId);
  const errors: Array<{ questionCode: string; errors: string[] }> = [];
  let validCount = 0;

  for (const d of data) {
    const validationErrors = validateBenchmarkData(d);
    if (validationErrors.length === 0) {
      validCount++;
    } else {
      errors.push({ questionCode: d.questionCode, errors: validationErrors });
    }
  }

  return {
    totalDataPoints: data.length,
    validDataPoints: validCount,
    errors,
  };
}

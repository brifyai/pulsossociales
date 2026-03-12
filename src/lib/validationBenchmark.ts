/**
 * Validation Benchmark - CEP Octubre 2024
 *
 * Benchmark real basado en la Encuesta CEP N° 93 (Octubre 2024)
 * Fuente: Centro de Estudios Públicos
 * URL: https://www.cepchile.cl/encuesta-cep-octubre-2024/
 *
 * Este benchmark se usa para la primera validación controlada del sistema
 * de encuestas sintéticas.
 */

import type {
  SurveyBenchmark,
  BenchmarkDataPoint,
  BenchmarkDistributionItem,
} from '../types/survey';
import {
  createBenchmark,
  addBenchmarkDataPoint,
  getBenchmarksForSurvey,
  deleteBenchmark,
} from './surveyBenchmark';

// ============================================================================
// DATOS REALES CEP OCTUBRE 2024
// ============================================================================

/**
 * Datos reales de la Encuesta CEP N° 93 - Octubre 2024
 * Muestra: 1,460 casos, error muestral: ±3.0%
 * Fecha: 30 de septiembre - 10 de octubre de 2024
 */
export const CEP_OCT_2024_DATA = {
  name: 'CEP N° 93 - Octubre 2024',
  source: 'cep',
  sourceUrl: 'https://www.cepchile.cl/encuesta-cep-octubre-2024/',
  sampleSize: 1460,
  marginOfError: 3.0,
  dateCollected: '2024-10-10',
  description: 'Encuesta Nacional de Opinión Pública CEP N° 93, realizada entre el 30 de septiembre y el 10 de octubre de 2024',

  questions: [
    {
      // Pregunta 1: Aprobación Presidente (P19 en CEP)
      questionCode: 'PRES_APPROVAL',
      questionText: '¿Cómo evalúa la gestión del Presidente Gabriel Boric?',
      distribution: [
        { value: 'approve', label: 'Aprueba', percentage: 28.5, count: 416 },
        { value: 'disapprove', label: 'Desaprueba', percentage: 58.2, count: 850 },
        { value: 'no_opinion', label: 'No sabe / No responde', percentage: 13.3, count: 194 },
      ] as BenchmarkDistributionItem[],
      notes: 'Pregunta 19 (P19) - Aprobación gestión Presidente Boric',
    },
    {
      // Pregunta 2: País en buen/mal camino (P18 en CEP)
      questionCode: 'COUNTRY_DIRECTION',
      questionText: '¿Cree usted que el país va por el camino correcto o por el camino equivocado?',
      distribution: [
        { value: 'correct', label: 'Camino correcto', percentage: 22.8, count: 333 },
        { value: 'wrong', label: 'Camino equivocado', percentage: 68.4, count: 999 },
        { value: 'no_opinion', label: 'No sabe / No responde', percentage: 8.8, count: 128 },
      ] as BenchmarkDistributionItem[],
      notes: 'Pregunta 18 (P18) - Dirección del país',
    },
    {
      // Pregunta 3: Situación económica país (P1 en CEP)
      questionCode: 'ECON_SITUATION',
      questionText: '¿Cómo calificaría la situación económica actual del país?',
      distribution: [
        { value: 'very_good', label: 'Muy buena', percentage: 0.8, count: 12 },
        { value: 'good', label: 'Buena', percentage: 8.2, count: 120 },
        { value: 'regular', label: 'Regular', percentage: 32.5, count: 475 },
        { value: 'bad', label: 'Mala', percentage: 42.7, count: 623 },
        { value: 'very_bad', label: 'Muy mala', percentage: 13.8, count: 201 },
        { value: 'no_opinion', label: 'No sabe / No responde', percentage: 2.0, count: 29 },
      ] as BenchmarkDistributionItem[],
      notes: 'Pregunta 1 (P1) - Situación económica del país',
    },
    {
      // Pregunta 4: Confianza en Carabineros (P34A en CEP)
      questionCode: 'TRUST_CARAB',
      questionText: '¿Cuánta confianza tiene en Carabineros de Chile?',
      distribution: [
        { value: 'a_lot', label: 'Mucha confianza', percentage: 18.2, count: 266 },
        { value: 'some', label: 'Algo de confianza', percentage: 42.5, count: 620 },
        { value: 'little', label: 'Poca confianza', percentage: 24.8, count: 362 },
        { value: 'none', label: 'Ninguna confianza', percentage: 12.3, count: 180 },
        { value: 'no_opinion', label: 'No sabe / No responde', percentage: 2.2, count: 32 },
      ] as BenchmarkDistributionItem[],
      notes: 'Pregunta 34A (P34A) - Confianza en Carabineros',
    },
  ],
};

// ============================================================================
// CREACIÓN DE BENCHMARK
// ============================================================================

/**
 * Inicializa el benchmark de validación CEP Octubre 2024
 * @param surveyId - ID de la encuesta sintética a asociar
 * @returns El benchmark creado
 */
export function initializeCEPValidationBenchmark(surveyId: string): SurveyBenchmark {
  // Limpiar benchmarks anteriores para esta encuesta
  const existing = getBenchmarksForSurvey(surveyId);
  for (const b of existing) {
    deleteBenchmark(b.id);
  }

  // Crear nuevo benchmark
  const benchmark = createBenchmark(
    surveyId,
    CEP_OCT_2024_DATA.name,
    CEP_OCT_2024_DATA.source,
    {
      description: CEP_OCT_2024_DATA.description,
      sourceUrl: CEP_OCT_2024_DATA.sourceUrl,
      sampleSize: CEP_OCT_2024_DATA.sampleSize,
      marginOfError: CEP_OCT_2024_DATA.marginOfError,
    }
  );

  // Sobreescribir fecha
  benchmark.dateCollected = CEP_OCT_2024_DATA.dateCollected;

  // Agregar datos de cada pregunta
  for (const q of CEP_OCT_2024_DATA.questions) {
    addBenchmarkDataPoint(
      benchmark.id,
      `q_${q.questionCode.toLowerCase()}`,
      q.questionCode,
      q.distribution,
      {
        sampleSize: CEP_OCT_2024_DATA.sampleSize,
        notes: q.notes,
      }
    );
  }

  console.log('[Validation] Benchmark CEP Oct 2024 inicializado:', benchmark.id);
  return benchmark;
}

// ============================================================================
// UTILIDADES DE VALIDACIÓN
// ============================================================================

/**
 * Obtiene los datos del benchmark para una pregunta específica
 */
export function getCEPBenchmarkData(questionCode: string): {
  questionCode: string;
  questionText: string;
  distribution: BenchmarkDistributionItem[];
  notes: string;
} | null {
  const q = CEP_OCT_2024_DATA.questions.find(q => q.questionCode === questionCode);
  if (!q) return null;

  return {
    questionCode: q.questionCode,
    questionText: q.questionText,
    distribution: q.distribution,
    notes: q.notes,
  };
}

/**
 * Lista todas las preguntas disponibles en el benchmark
 */
export function listCEPQuestions(): Array<{
  code: string;
  text: string;
  notes: string;
}> {
  return CEP_OCT_2024_DATA.questions.map(q => ({
    code: q.questionCode,
    text: q.questionText,
    notes: q.notes,
  }));
}

/**
 * Verifica si una pregunta existe en el benchmark
 */
export function isQuestionInBenchmark(questionCode: string): boolean {
  return CEP_OCT_2024_DATA.questions.some(q => q.questionCode === questionCode);
}

// ============================================================================
// MAPEO DE OPCIONES
// ============================================================================

/**
 * Mapeo de opciones entre diferentes formatos
 * Útil cuando las opciones de la encuesta sintética no coinciden exactamente
 */
export const OPTION_MAPPINGS: Record<string, Record<string, string>> = {
  PRES_APPROVAL: {
    // Mapeo desde opciones sintéticas a benchmark
    'approve': 'approve',
    'disapprove': 'disapprove',
    'no_opinion': 'no_opinion',
    'dont_know': 'no_opinion',
  },
  COUNTRY_DIRECTION: {
    'correct': 'correct',
    'wrong': 'wrong',
    'no_opinion': 'no_opinion',
    'dont_know': 'no_opinion',
  },
  ECON_SITUATION: {
    'very_good': 'very_good',
    'good': 'good',
    'regular': 'regular',
    'bad': 'bad',
    'very_bad': 'very_bad',
    'no_opinion': 'no_opinion',
  },
  TRUST_CARAB: {
    'a_lot': 'a_lot',
    'some': 'some',
    'little': 'little',
    'none': 'none',
    'no_opinion': 'no_opinion',
  },
};

/**
 * Mapea un valor de opción sintética al formato del benchmark
 */
export function mapOptionToBenchmark(
  questionCode: string,
  syntheticValue: string
): string {
  const mapping = OPTION_MAPPINGS[questionCode];
  if (!mapping) return syntheticValue;
  return mapping[syntheticValue] ?? syntheticValue;
}

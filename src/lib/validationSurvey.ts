/**
 * Validation Survey - Encuesta de Validación CEP
 *
 * Encuesta sintética diseñada específicamente para validar contra
 * el benchmark CEP Octubre 2024. Contiene 4 preguntas equivalentes.
 */

import type { Survey, SurveyQuestion, SurveyOption, SurveyInsert, SurveyQuestionInsert } from '../types/survey';

// ============================================================================
// ENCUESTA DE VALIDACIÓN
// ============================================================================

export const VALIDATION_SURVEY_ID = 'validation-cep-oct-2024';

/**
 * Encuesta de validación con preguntas equivalentes al CEP
 */
export const VALIDATION_SURVEY: SurveyInsert = {
  name: 'Validación CEP Octubre 2024',
  description: 'Encuesta sintética de validación basada en CEP N° 93 (Oct 2024). 4 preguntas: aprobación presidencial, dirección del país, situación económica, confianza en Carabineros.',
  status: 'active',
  category: 'validation',
  version: 1,
};

/**
 * Helper para crear opciones de respuesta
 */
function createOptions(options: Array<{ value: string; label: string; order: number }>): SurveyOption[] {
  return options.map(o => ({ value: o.value, label: o.label }));
}

/**
 * Preguntas de la encuesta de validación
 * Mapeadas directamente a las preguntas del benchmark CEP
 */
export function createValidationQuestions(surveyId: string): SurveyQuestionInsert[] {
  return [
    {
      // Pregunta 1: Aprobación Presidencial (P19 CEP)
      survey_id: surveyId,
      code: 'PRES_APPROVAL',
      text: '¿Cómo evalúa la gestión del Presidente Gabriel Boric?',
      answer_type: 'single_choice',
      options_json: createOptions([
        { value: 'approve', label: 'Aprueba', order: 1 },
        { value: 'disapprove', label: 'Desaprueba', order: 2 },
        { value: 'no_opinion', label: 'No sabe / No responde', order: 3 },
      ]),
      scale_config: null,
      validation_rules: { required: true },
      order_index: 1,
      category: 'political',
      weight: 1.0,
    },
    {
      // Pregunta 2: Dirección del País (P18 CEP)
      survey_id: surveyId,
      code: 'COUNTRY_DIRECTION',
      text: '¿Cree usted que el país va por el camino correcto o por el camino equivocado?',
      answer_type: 'single_choice',
      options_json: createOptions([
        { value: 'correct', label: 'Camino correcto', order: 1 },
        { value: 'wrong', label: 'Camino equivocado', order: 2 },
        { value: 'no_opinion', label: 'No sabe / No responde', order: 3 },
      ]),
      scale_config: null,
      validation_rules: { required: true },
      order_index: 2,
      category: 'political',
      weight: 1.0,
    },
    {
      // Pregunta 3: Situación Económica del País (P1 CEP)
      survey_id: surveyId,
      code: 'ECON_SITUATION',
      text: '¿Cómo calificaría la situación económica actual del país?',
      answer_type: 'single_choice',
      options_json: createOptions([
        { value: 'very_good', label: 'Muy buena', order: 1 },
        { value: 'good', label: 'Buena', order: 2 },
        { value: 'regular', label: 'Regular', order: 3 },
        { value: 'bad', label: 'Mala', order: 4 },
        { value: 'very_bad', label: 'Muy mala', order: 5 },
        { value: 'no_opinion', label: 'No sabe / No responde', order: 6 },
      ]),
      scale_config: null,
      validation_rules: { required: true },
      order_index: 3,
      category: 'economic',
      weight: 1.0,
    },
    {
      // Pregunta 4: Confianza en Carabineros (P34A CEP)
      survey_id: surveyId,
      code: 'TRUST_CARAB',
      text: '¿Cuánta confianza tiene en Carabineros de Chile?',
      answer_type: 'single_choice',
      options_json: createOptions([
        { value: 'a_lot', label: 'Mucha confianza', order: 1 },
        { value: 'some', label: 'Algo de confianza', order: 2 },
        { value: 'little', label: 'Poca confianza', order: 3 },
        { value: 'none', label: 'Ninguna confianza', order: 4 },
        { value: 'no_opinion', label: 'No sabe / No responde', order: 5 },
      ]),
      scale_config: null,
      validation_rules: { required: true },
      order_index: 4,
      category: 'institutional',
      weight: 1.0,
    },
  ];
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Lista todos los códigos de preguntas de validación
 */
export function getValidationQuestionCodes(): string[] {
  return ['PRES_APPROVAL', 'COUNTRY_DIRECTION', 'ECON_SITUATION', 'TRUST_CARAB'];
}

/**
 * Verifica si un código de pregunta es parte de la validación
 */
export function isValidationQuestion(code: string): boolean {
  return getValidationQuestionCodes().includes(code);
}

// ============================================================================
// CONFIGURACIÓN DE EJECUCIÓN
// ============================================================================

/**
 * Configuración recomendada para la ejecución de validación
 */
export const VALIDATION_CONFIG = {
  // Tamaño de muestra objetivo (igual al CEP)
  targetSampleSize: 1460,

  // Margen de error aceptable (±3% como el CEP)
  acceptableMarginOfError: 3.0,

  // Umbral de similitud mínima aceptable
  minAcceptableSimilarity: 0.7,

  // Umbral de MAE máximo aceptable
  maxAcceptableMAE: 5.0,

  // Preguntas críticas (deben tener buen ajuste)
  criticalQuestions: ['PRES_APPROVAL', 'COUNTRY_DIRECTION', 'ECON_SITUATION'],

  // Preguntas de menor prioridad
  lowerPriorityQuestions: ['TRUST_CARAB'],
};

// ============================================================================
// EXPECTATIVAS TEÓRICAS
// ============================================================================

/**
 * Expectativas teóricas basadas en el benchmark
 * Útil para documentar qué esperamos obtener
 */
export const THEORETICAL_EXPECTATIONS: Record<string, {
  expectedWinner: string;
  expectedMargin: 'small' | 'moderate' | 'significant' | 'very_significant';
  keyInsight: string;
}> = {
  PRES_APPROVAL: {
    expectedWinner: 'disapprove',
    expectedMargin: 'significant', // >20 puntos
    keyInsight: 'Desaprobación mayoritaria esperada (~58%)',
  },
  COUNTRY_DIRECTION: {
    expectedWinner: 'wrong',
    expectedMargin: 'very_significant', // >40 puntos
    keyInsight: 'Percepción negativa dominante (~68%)',
  },
  ECON_SITUATION: {
    expectedWinner: 'bad',
    expectedMargin: 'moderate',
    keyInsight: 'Mayoría percibe situación mala o muy mala (~56%)',
  },
  TRUST_CARAB: {
    expectedWinner: 'some',
    expectedMargin: 'moderate',
    keyInsight: 'Confianza moderada predominante (~43%)',
  },
};

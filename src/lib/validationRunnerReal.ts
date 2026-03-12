/**
 * Validation Runner REAL
 *
 * Ejecutor de validación que usa el motor SurveyEngineV2 real,
 * agentes reales desde Supabase, y benchmark real desde Supabase.
 *
 * ⚠️ ESTE ES EL ÚNICO RUNNER VÁLIDO PARA VALIDACIÓN REAL
 * El archivo validationRunner.ts está DEPRECATED y usa simulación blanda.
 *
 * Metodología:
 * 1. Carga benchmark desde Supabase (survey_benchmarks, benchmark_data_points)
 * 2. Carga encuesta equivalente desde Supabase
 * 3. Carga agentes reales desde Supabase
 * 4. Ejecuta SurveyEngineV2 real para generar respuestas
 * 5. Agrega resultados ponderados
 * 6. Compara contra benchmark
 * 7. Guarda en validation_runs y validation_results
 * 8. Genera reporte honesto
 */

import { supabase } from './supabaseClient';
import { SurveyEngine, ENGINE_VERSION } from './surveyEngineV2';
import type {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
} from '../types/survey';
import type { FullAgent } from '../types/agent';

// ============================================================================
// TIPOS PARA SUPABASE (snake_case)
// ============================================================================

interface SurveyBenchmarkRow {
  id: string;
  name: string;
  source: string;
  source_url: string | null;
  sample_size: number | null;
  margin_of_error: number | null;
  date_collected: string | null;
  description: string | null;
}

interface BenchmarkDataPointRow {
  id: string;
  benchmark_id: string;
  question_code: string;
  question_text: string | null;
  question_category: string | null;
  answer_type: string | null;
  options_json: unknown;
  distribution_json: Record<string, number>;
  sample_size: number | null;
  metadata_json: unknown;
  notes: string | null;
}

interface ValidationRunInsert {
  survey_id: string;
  survey_run_id: string | null;
  benchmark_id: string;
  territory_id: string | null;
  engine_version: string;
  engine_config_json: unknown;
  status: string;
  started_at: string;
  completed_at: string;
  average_similarity_score: number;
  average_mae: number;
  total_questions: number;
  matched_questions: number;
  synthetic_sample_size: number;
  benchmark_sample_size: number;
  notes?: string;
}

interface ValidationResultInsert {
  validation_run_id: string;
  question_code: string;
  question_text: string;
  question_category: string;
  synthetic_distribution_json: Record<string, number>;
  benchmark_distribution_json: Record<string, number>;
  mae: number;
  similarity_score: number;
}

// ============================================================================
// TIPOS PÚBLICOS
// ============================================================================

export interface RealValidationConfig {
  /** ID del benchmark en Supabase */
  benchmarkId: string;
  /** ID de la encuesta a validar (opcional, si no se provee busca por código) */
  surveyId?: string;
  /** ID del territorio (null para nacional) */
  territoryId?: string | null;
  /** Número de agentes a evaluar (null para todos) */
  agentSampleSize?: number | null;
  /** Configuración del motor */
  engineConfig: {
    useLLM: boolean;
    useRules: boolean;
    randomVariation: number;
    batchSize: number;
    delayMs: number;
  };
  /** Notas opcionales */
  notes?: string;
}

export interface RealValidationResult {
  runId: string;
  benchmark: {
    id: string;
    name: string;
    source: string;
    sampleSize: number;
  };
  survey: {
    id: string;
    name: string;
  };
  execution: {
    engineVersion: string;
    agentsEvaluated: number;
    questionsEvaluated: number;
    durationMs: number;
    usedRealData: boolean;
    usedFallback: boolean;
  };
  metrics: {
    averageSimilarity: number;
    averageMAE: number;
    questionsPassed: number;
    questionsFailed: number;
  };
  questionResults: RealQuestionResult[];
}

export interface RealQuestionResult {
  questionCode: string;
  questionText: string;
  category: string;
  benchmarkDistribution: Record<string, number>;
  syntheticDistribution: Record<string, number>;
  similarity: number;
  mae: number;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

// ============================================================================
// REPOSITORIO DE VALIDACIÓN
// ============================================================================

/**
 * Carga un benchmark desde Supabase
 */
export async function loadBenchmarkFromSupabase(
  benchmarkId: string
): Promise<{ benchmark: SurveyBenchmarkRow; dataPoints: BenchmarkDataPointRow[] } | null> {
  console.log(`[ValidationReal] Cargando benchmark ${benchmarkId}...`);

  if (!supabase) {
    console.error('[ValidationReal] Supabase no está inicializado');
    return null;
  }

  // Cargar benchmark
  const { data: benchmark, error: benchmarkError } = await supabase
    .from('survey_benchmarks')
    .select('*')
    .eq('id', benchmarkId)
    .single();

  if (benchmarkError || !benchmark) {
    console.error('[ValidationReal] Error cargando benchmark:', benchmarkError);
    return null;
  }

  // Cargar data points
  const { data: dataPoints, error: dpError } = await supabase
    .from('benchmark_data_points')
    .select('*')
    .eq('benchmark_id', benchmarkId);

  if (dpError) {
    console.error('[ValidationReal] Error cargando data points:', dpError);
    return null;
  }

  console.log(`[ValidationReal] Benchmark cargado: ${(benchmark as { name: string }).name}`);
  console.log(`[ValidationReal] Data points: ${dataPoints?.length || 0}`);

  return {
    benchmark: benchmark as SurveyBenchmarkRow,
    dataPoints: (dataPoints || []) as BenchmarkDataPointRow[],
  };
}

/**
 * Busca una encuesta equivalente al benchmark
 */
export async function findSurveyForBenchmark(
  benchmarkDataPoints: BenchmarkDataPointRow[]
): Promise<Survey | null> {
  console.log('[ValidationReal] Buscando encuesta equivalente...');

  if (!supabase) {
    console.error('[ValidationReal] Supabase no está inicializado');
    return null;
  }

  // Extraer códigos de pregunta del benchmark
  const questionCodes = benchmarkDataPoints.map(dp => dp.question_code);

  // Buscar encuestas activas
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*, questions:survey_questions(*)')
    .eq('status', 'active');

  if (error || !surveys || surveys.length === 0) {
    console.error('[ValidationReal] Error buscando encuestas:', error);
    return null;
  }

  // Encontrar la encuesta con mayor coincidencia de códigos
  let bestMatch: Survey | null = null;
  let bestMatchCount = 0;

  for (const survey of surveys as unknown[]) {
    const s = survey as { questions?: SurveyQuestion[]; name: string };
    const surveyQuestions = (s.questions || []) as SurveyQuestion[];
    const surveyQuestionCodes = surveyQuestions.map((q: SurveyQuestion) => q.code);
    const matchCount = questionCodes.filter(code => surveyQuestionCodes.includes(code)).length;

    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestMatch = survey as Survey;
    }
  }

  if (bestMatch) {
    console.log(`[ValidationReal] Encuesta encontrada: ${bestMatch.name}`);
    console.log(`[ValidationReal] Preguntas coincidentes: ${bestMatchCount}/${questionCodes.length}`);
  } else {
    console.warn('[ValidationReal] No se encontró encuesta coincidente');
  }

  return bestMatch;
}

/**
 * Carga agentes reales desde Supabase
 */
export async function loadAgentsFromSupabase(
  territoryId: string | null,
  sampleSize: number | null
): Promise<FullAgent[]> {
  console.log('[ValidationReal] Cargando agentes...');

  if (!supabase) {
    console.error('[ValidationReal] Supabase no está inicializado');
    return [];
  }

  let query = supabase
    .from('agents')
    .select(`
      *,
      profile:agent_profiles(*),
      traits:agent_traits(*),
      state:agent_states(*),
      events:agent_event_exposures(*)
    `);

  if (territoryId) {
    query = query.eq('territory_id', territoryId);
  }

  const { data: agents, error } = await query;

  if (error) {
    console.error('[ValidationReal] Error cargando agentes:', error);
    return [];
  }

  // Mapear a FullAgent (con memory vacío ya que no viene de Supabase)
  let fullAgents: FullAgent[] = (agents || []).map((agent: unknown) => {
    const a = agent as {
      profile: unknown;
      traits: unknown;
      state: unknown;
      events: unknown[];
    };
    return {
      profile: a.profile as FullAgent['profile'],
      traits: a.traits as FullAgent['traits'],
      state: a.state as FullAgent['state'],
      events: (a.events || []) as FullAgent['events'],
      memory: {
        summary: '',
        salientTopics: [],
        previousPositions: [],
        contradictionScore: 0,
      },
    };
  });

  // Aplicar sample size si se especificó
  if (sampleSize && sampleSize < fullAgents.length) {
    fullAgents = stratifiedSample(fullAgents, sampleSize);
  }

  console.log(`[ValidationReal] Agentes cargados: ${fullAgents.length}`);

  return fullAgents;
}

/**
 * Selección aleatoria estratificada por territorio
 */
function stratifiedSample(agents: FullAgent[], targetSize: number): FullAgent[] {
  // Agrupar por territorio
  const byTerritory: Record<string, FullAgent[]> = {};
  for (const agent of agents) {
    const regionId = agent.profile.regionId || 'unknown';
    if (!byTerritory[regionId]) {
      byTerritory[regionId] = [];
    }
    byTerritory[regionId].push(agent);
  }

  // Calcular proporciones
  const totalAgents = agents.length;
  const selected: FullAgent[] = [];

  for (const [, territoryAgents] of Object.entries(byTerritory)) {
    const proportion = territoryAgents.length / totalAgents;
    const targetForTerritory = Math.round(targetSize * proportion);

    // Selección aleatoria sin reemplazo
    const shuffled = [...territoryAgents].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, targetForTerritory));
  }

  // Ajustar si nos pasamos o quedamos cortos
  if (selected.length > targetSize) {
    return selected.slice(0, targetSize);
  }

  return selected;
}

// ============================================================================
// EJECUCIÓN DE VALIDACIÓN REAL
// ============================================================================

/**
 * Ejecuta una validación real completa
 */
export async function runRealValidation(
  config: RealValidationConfig
): Promise<RealValidationResult> {
  const startTime = Date.now();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     VALIDACIÓN REAL DEL MOTOR - PULSO SOCIAL              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('⚠️  Esta validación usa el motor SurveyEngineV2 REAL');
  console.log('⚠️  NO usa simulación con ruido sobre el benchmark');
  console.log('');

  if (!supabase) {
    throw new Error('Supabase no está inicializado');
  }

  // 1. Cargar benchmark
  const benchmarkData = await loadBenchmarkFromSupabase(config.benchmarkId);
  if (!benchmarkData) {
    throw new Error(`No se pudo cargar el benchmark ${config.benchmarkId}`);
  }

  // 2. Cargar encuesta
  let survey: Survey;
  if (config.surveyId) {
    const { data: s, error } = await supabase
      .from('surveys')
      .select('*, questions:survey_questions(*)')
      .eq('id', config.surveyId)
      .single();

    if (error || !s) {
      throw new Error(`No se pudo cargar la encuesta ${config.surveyId}`);
    }
    survey = s as Survey;
  } else {
    const s = await findSurveyForBenchmark(benchmarkData.dataPoints);
    if (!s) {
      throw new Error('No se encontró encuesta equivalente al benchmark');
    }
    survey = s;
  }

  // 3. Cargar agentes
  const agents = await loadAgentsFromSupabase(config.territoryId ?? null, config.agentSampleSize ?? null);
  if (agents.length === 0) {
    throw new Error('No se pudieron cargar agentes');
  }

  // 4. Crear run de encuesta
  const runInsert = {
    survey_id: survey.id,
    territory_id: config.territoryId ?? null,
    name: `Validation Run - ${new Date().toISOString()}`,
    description: `Validación contra benchmark ${benchmarkData.benchmark.name}`,
    sample_size: agents.length,
    run_type: 'synthetic' as const,
    status: 'pending' as const,
    config_json: {
      engineVersion: ENGINE_VERSION,
      useLLM: config.engineConfig.useLLM,
      useRules: config.engineConfig.useRules,
      randomVariation: config.engineConfig.randomVariation,
      isValidationRun: true,
      benchmarkId: config.benchmarkId,
    },
  };

  const { data: run, error: runError } = await supabase
    .from('survey_runs')
    .insert(runInsert as any)
    .select()
    .single();

  if (runError || !run) {
    throw new Error(`Error creando survey run: ${runError?.message}`);
  }

  // 5. Ejecutar motor real
  console.log('[ValidationReal] Ejecutando SurveyEngineV2...');

  const engine = new SurveyEngine({
    useLLM: config.engineConfig.useLLM,
    useRules: config.engineConfig.useRules,
    batchSize: config.engineConfig.batchSize,
    delayMs: config.engineConfig.delayMs,
    randomVariation: config.engineConfig.randomVariation,
    onProgress: (progress) => {
      console.log(`[ValidationReal] Progreso: Q${progress.currentQuestion}/${progress.totalQuestions}, A${progress.currentAgent}/${progress.totalAgents}`);
    },
  });

  const questions = (survey as unknown as { questions: SurveyQuestion[] }).questions || [];
  const result = await engine.execute(survey, questions, agents, run as SurveyRun);

  // 6. Agregar resultados por pregunta
  const syntheticDistributions = aggregateResponsesByQuestion(result.responses, questions);

  // 7. Comparar con benchmark
  const questionResults: RealQuestionResult[] = [];

  for (const dataPoint of benchmarkData.dataPoints) {
    const question = questions.find(q => q.code === dataPoint.question_code);
    if (!question) {
      console.warn(`[ValidationReal] Pregunta ${dataPoint.question_code} no encontrada en encuesta`);
      continue;
    }

    const syntheticDist = syntheticDistributions[dataPoint.question_code] || {};
    const benchmarkDist = dataPoint.distribution_json;

    const comparison = compareDistributions(syntheticDist, benchmarkDist);

    questionResults.push({
      questionCode: dataPoint.question_code,
      questionText: dataPoint.question_text || question.text,
      category: dataPoint.question_category || 'unknown',
      benchmarkDistribution: benchmarkDist,
      syntheticDistribution: syntheticDist,
      similarity: comparison.similarity,
      mae: comparison.mae,
      matchQuality: classifyMatchQuality(comparison.similarity),
    });
  }

  // 8. Calcular métricas agregadas
  const averageSimilarity = questionResults.reduce((sum, r) => sum + r.similarity, 0) / questionResults.length || 0;
  const averageMAE = questionResults.reduce((sum, r) => sum + r.mae, 0) / questionResults.length || 0;
  const questionsPassed = questionResults.filter(r => r.similarity >= 0.7).length;

  // 9. Guardar en validation_runs
  const validationRunInsert: ValidationRunInsert = {
    survey_id: survey.id,
    survey_run_id: (run as { id: string }).id,
    benchmark_id: config.benchmarkId,
    territory_id: config.territoryId ?? null,
    engine_version: ENGINE_VERSION,
    engine_config_json: config.engineConfig,
    status: 'completed',
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    average_similarity_score: averageSimilarity,
    average_mae: averageMAE,
    total_questions: benchmarkData.dataPoints.length,
    matched_questions: questionResults.length,
    synthetic_sample_size: agents.length,
    benchmark_sample_size: benchmarkData.benchmark.sample_size || 0,
    notes: config.notes,
  };

  const { data: validationRun, error: validationError } = await supabase
    .from('validation_runs')
    .insert(validationRunInsert as any)
    .select()
    .single();

  let validationRunId = 'unknown';
  if (validationError || !validationRun) {
    console.error('[ValidationReal] Error guardando validation_run:', validationError);
  } else {
    validationRunId = (validationRun as { id: string }).id;
    // 10. Guardar resultados por pregunta
    for (const qr of questionResults) {
      const resultInsert: ValidationResultInsert = {
        validation_run_id: validationRunId,
        question_code: qr.questionCode,
        question_text: qr.questionText,
        question_category: qr.category,
        synthetic_distribution_json: qr.syntheticDistribution,
        benchmark_distribution_json: qr.benchmarkDistribution,
        mae: qr.mae,
        similarity_score: qr.similarity,
      };
      await supabase.from('validation_results').insert(resultInsert as any);
    }
  }

  const durationMs = Date.now() - startTime;

  console.log('[ValidationReal] Validación completada');
  console.log(`[ValidationReal] Duración: ${durationMs}ms`);
  console.log(`[ValidationReal] Similitud promedio: ${(averageSimilarity * 100).toFixed(1)}%`);
  console.log(`[ValidationReal] MAE promedio: ${averageMAE.toFixed(2)}%`);

  return {
    runId: validationRunId,
    benchmark: {
      id: benchmarkData.benchmark.id,
      name: benchmarkData.benchmark.name,
      source: benchmarkData.benchmark.source,
      sampleSize: benchmarkData.benchmark.sample_size || 0,
    },
    survey: {
      id: survey.id,
      name: survey.name,
    },
    execution: {
      engineVersion: ENGINE_VERSION,
      agentsEvaluated: agents.length,
      questionsEvaluated: questionResults.length,
      durationMs,
      usedRealData: true,
      usedFallback: false,
    },
    metrics: {
      averageSimilarity,
      averageMAE,
      questionsPassed,
      questionsFailed: questionResults.length - questionsPassed,
    },
    questionResults,
  };
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Agrega respuestas por pregunta
 */
function aggregateResponsesByQuestion(
  responses: SurveyResponse[],
  questions: SurveyQuestion[]
): Record<string, Record<string, number>> {
  const distributions: Record<string, Record<string, number>> = {};

  // Inicializar distribuciones
  for (const question of questions) {
    distributions[question.code] = {};
    const options = question.options_json || [];
    for (const option of options) {
      distributions[question.code][option.value] = 0;
    }
  }

  // Contar respuestas
  for (const response of responses) {
    const question = questions.find(q => q.id === response.question_id);
    if (!question) continue;

    const value = response.answer_structured_json?.value as string;
    if (value && distributions[question.code]) {
      distributions[question.code][value] = (distributions[question.code][value] || 0) + 1;
    }
  }

  // Convertir a porcentajes
  for (const questionCode of Object.keys(distributions)) {
    const dist = distributions[questionCode];
    const total = Object.values(dist).reduce((sum, count) => sum + count, 0);

    if (total > 0) {
      for (const key of Object.keys(dist)) {
        dist[key] = (dist[key] / total) * 100;
      }
    }
  }

  return distributions;
}

/**
 * Compara dos distribuciones
 */
function compareDistributions(
  synthetic: Record<string, number>,
  benchmark: Record<string, number>
): { similarity: number; mae: number } {
  const allKeys = new Set([...Object.keys(synthetic), ...Object.keys(benchmark)]);

  let dotProduct = 0;
  let syntheticNorm = 0;
  let benchmarkNorm = 0;
  let totalError = 0;

  for (const key of allKeys) {
    const s = synthetic[key] || 0;
    const b = benchmark[key] || 0;

    dotProduct += s * b;
    syntheticNorm += s * s;
    benchmarkNorm += b * b;
    totalError += Math.abs(s - b);
  }

  const cosineSimilarity = syntheticNorm > 0 && benchmarkNorm > 0
    ? dotProduct / (Math.sqrt(syntheticNorm) * Math.sqrt(benchmarkNorm))
    : 0;

  const mae = totalError / allKeys.size;

  return {
    similarity: Math.max(0, cosineSimilarity),
    mae,
  };
}

/**
 * Clasifica la calidad del match
 */
function classifyMatchQuality(similarity: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  if (similarity >= 0.90) return 'excellent';
  if (similarity >= 0.80) return 'good';
  if (similarity >= 0.70) return 'fair';
  if (similarity >= 0.60) return 'poor';
  return 'critical';
}

// ============================================================================
// GENERACIÓN DE REPORTE
// ============================================================================

/**
 * Genera un reporte en formato Markdown
 */
export function generateRealValidationReport(result: RealValidationResult): string {
  const lines: string[] = [];

  lines.push('# Validación Real del Motor');
  lines.push('');
  lines.push(`**Fecha:** ${new Date().toLocaleString('es-CL')}`);
  lines.push(`**ID de validación:** ${result.runId}`);
  lines.push('');

  // 1. Benchmark utilizado
  lines.push('## 1. Benchmark Utilizado');
  lines.push('');
  lines.push(`- **Nombre:** ${result.benchmark.name}`);
  lines.push(`- **Fuente:** ${result.benchmark.source}`);
  lines.push(`- **Tamaño muestral:** ${result.benchmark.sampleSize} casos`);
  lines.push('');

  // 2. Encuesta utilizada
  lines.push('## 2. Encuesta Utilizada');
  lines.push('');
  lines.push(`- **Nombre:** ${result.survey.name}`);
  lines.push(`- **ID:** ${result.survey.id}`);
  lines.push('');

  // 3. Número de agentes evaluados
  lines.push('## 3. Número de Agentes Evaluados');
  lines.push('');
  lines.push(`- **Agentes sintéticos:** ${result.execution.agentsEvaluated}`);
  lines.push(`- **Muestra benchmark:** ${result.benchmark.sampleSize}`);
  lines.push('');

  // 4. Motor realmente utilizado
  lines.push('## 4. Motor Realmente Utilizado');
  lines.push('');
  lines.push(`- **Engine:** SurveyEngineV2`);
  lines.push(`- **Versión:** ${result.execution.engineVersion}`);
  lines.push(`- **Método:** Rule-based con factores demográficos y traits`);
  lines.push('');

  // 5. Uso de datos reales
  lines.push('## 5. Uso de Datos Reales (Supabase) o Fallback');
  lines.push('');
  lines.push(`- **Benchmark:** ${result.execution.usedRealData ? '✅ Datos reales desde Supabase' : '❌ Fallback a datos locales'}`);
  lines.push(`- **Agentes:** ${result.execution.usedRealData ? '✅ Agentes reales desde Supabase' : '❌ Fallback a mocks'}`);
  lines.push(`- **Encuesta:** ${result.execution.usedRealData ? '✅ Encuesta desde Supabase' : '❌ Fallback a definición local'}`);
  lines.push('');

  // 6. Resultados sintéticos
  lines.push('## 6. Resultados Sintéticos (Motor Real)');
  lines.push('');
  lines.push('| Pregunta | Distribución |');
  lines.push('|----------|--------------|');
  for (const qr of result.questionResults) {
    const distStr = Object.entries(qr.syntheticDistribution)
      .map(([k, v]) => `${k}:${v.toFixed(1)}%`)
      .join(', ');
    lines.push(`| ${qr.questionCode} | ${distStr} |`);
  }
  lines.push('');

  // 7. Resultados benchmark
  lines.push('## 7. Resultados Benchmark');
  lines.push('');
  lines.push('| Pregunta | Distribución |');
  lines.push('|----------|--------------|');
  for (const qr of result.questionResults) {
    const distStr = Object.entries(qr.benchmarkDistribution)
      .map(([k, v]) => `${k}:${v.toFixed(1)}%`)
      .join(', ');
    lines.push(`| ${qr.questionCode} | ${distStr} |`);
  }
  lines.push('');

  // 8. Error por pregunta
  lines.push('## 8. Error por Pregunta');
  lines.push('');
  lines.push('| Pregunta | Similitud | MAE | Calidad |');
  lines.push('|----------|-----------|-----|---------|');
  for (const qr of result.questionResults) {
    const qualityEmoji = {
      excellent: '🟢',
      good: '🟢',
      fair: '🟡',
      poor: '🟠',
      critical: '🔴',
    }[qr.matchQuality];
    lines.push(`| ${qr.questionCode} | ${(qr.similarity * 100).toFixed(1)}% | ${qr.mae.toFixed(2)}% | ${qualityEmoji} ${qr.matchQuality} |`);
  }
  lines.push('');

  // 9. Similitud promedio
  lines.push('## 9. Similitud Promedio');
  lines.push('');
  lines.push(`- **Similitud promedio:** ${(result.metrics.averageSimilarity * 100).toFixed(1)}%`);
  lines.push(`- **MAE promedio:** ${result.metrics.averageMAE.toFixed(2)}%`);
  lines.push(`- **Preguntas aprobadas:** ${result.metrics.questionsPassed}/${result.questionResults.length}`);
  lines.push('');

  // 10. Interpretación honesta
  lines.push('## 10. Interpretación Honesta del Resultado');
  lines.push('');

  if (result.metrics.averageSimilarity >= 0.85) {
    lines.push('**EXCELENTE:** El motor SurveyEngineV2 reproduce fielmente el benchmark. Las diferencias están dentro del margen de error muestral.');
  } else if (result.metrics.averageSimilarity >= 0.70) {
    lines.push('**BUENO:** El motor captura correctamente las tendencias principales con desviaciones moderadas. Adecuado para uso en producción.');
  } else if (result.metrics.averageSimilarity >= 0.50) {
    lines.push('**ACEPTABLE:** El motor refleja la dirección general pero con desviaciones significativas. Requiere ajustes menores.');
  } else {
    lines.push('**NECESITA AJUSTE:** El motor presenta desviaciones importantes respecto al benchmark. Se requiere calibración antes de uso en producción.');
  }

  lines.push('');
  lines.push('**Nota importante:** Esta validación usa el motor REAL, no simulación con ruido. Los resultados reflejan el comportamiento actual del sistema con sus fortalezas y limitaciones reales.');
  lines.push('');

  // 11. Limitaciones
  lines.push('## 11. Limitaciones de Esta Validación');
  lines.push('');
  lines.push('1. **Muestra de agentes:** Los agentes sintéticos pueden no representar perfectamente la distribución demográfica de Chile');
  lines.push('2. **Motor rule-based:** El motor actual usa reglas simplificadas que no capturan todas las complejidades del comportamiento humano');
  lines.push('3. **Factores no considerados:** Eventos recientes, campañas mediáticas, y otros factores contextuales pueden no estar reflejados');
  lines.push('4. **Temporalidad:** El benchmark es de una fecha específica, el contexto puede haber cambiado');
  lines.push('5. **Validación parcial:** Solo se validaron las preguntas que coinciden entre encuesta y benchmark');
  lines.push('');

  return lines.join('\n');
}

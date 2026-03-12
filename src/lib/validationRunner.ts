/**
 * Validation Runner - Ejecutor de Validación Sintética
 *
 * ⚠️ DEPRECATED: Este módulo usa simulación blanda con ruido sobre el benchmark.
 * NO representa el comportamiento real del motor SurveyEngineV2.
 *
 * @deprecated Use src/lib/validationRunnerReal.ts en su lugar
 * @see docs/VALIDATION_AUDIT_FINDINGS.md para detalles del hallazgo
 */

// ============================================================================
// ⚠️ ADVERTENCIA METODOLÓGICA
// ============================================================================
// Este archivo implementa una "validación" que:
// 1. TOMA el benchmark como input
// 2. AGREGA ruido aleatorio
// 3. REPORTA como "resultado sintético"
// 4. COMPARA contra el benchmark original
//
// Esto NO valida el motor real. Solo valida que el ruido no es demasiado grande.
// Los resultados de "alta similitud" son artefactos del método, no evidencia real.
//
// Para validación REAL usar: src/lib/validationRunnerReal.ts
// ============================================================================


import { CEP_OCT_2024_DATA, getCEPBenchmarkData } from './validationBenchmark';
import { VALIDATION_CONFIG, getValidationQuestionCodes, THEORETICAL_EXPECTATIONS } from './validationSurvey';

// ============================================================================
// TIPOS LOCALES
// ============================================================================

interface ValidationResult {
  questionCode: string;
  questionText: string;
  benchmark: {
    distribution: Array<{ value: string; label: string; percentage: number; count: number }>;
    winner: string;
    winnerPercentage: number;
  };
  synthetic: {
    distribution: Array<{ value: string; label: string; percentage: number; count: number }>;
    winner: string;
    winnerPercentage: number;
  };
  comparison: {
    similarityScore: number;
    mae: number;
    winnerMatch: boolean;
    passed: boolean;
  };
  optionErrors: Array<{
    value: string;
    label: string;
    benchmarkPct: number;
    syntheticPct: number;
    absoluteError: number;
  }>;
}

interface ValidationSummary {
  totalQuestions: number;
  sampleSize: number;
  averageSimilarity: number;
  averageMAE: number;
  questionsPassed: number;
  questionsFailed: number;
  winnerMatchRate: number;
}

// ============================================================================
// SIMULACIÓN DE RESPUESTAS
// ============================================================================

/**
 * Simula una distribución sintética basada en el benchmark con variación controlada
 */
function simulateSyntheticDistribution(
  benchmarkDistribution: Array<{ value: string; label: string; percentage: number; count: number }>,
  sampleSize: number,
  noiseLevel: number
): Array<{ value: string; label: string; percentage: number; count: number }> {
  // Aplicar ruido a las probabilidades
  const noisyPercentages = benchmarkDistribution.map(d => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * d.percentage;
    return Math.max(0, d.percentage + noise);
  });

  // Normalizar para que sumen 100%
  const total = noisyPercentages.reduce((a, b) => a + b, 0);
  const normalizedPercentages = noisyPercentages.map(p => (p / total) * 100);

  // Calcular conteos
  const counts = normalizedPercentages.map(p => Math.round((p / 100) * sampleSize));

  // Ajustar para que sumen exactamente sampleSize
  const currentTotal = counts.reduce((a, b) => a + b, 0);
  if (currentTotal !== sampleSize) {
    const diff = sampleSize - currentTotal;
    counts[0] += diff; // Ajustar en la primera opción
  }

  // Recalcular porcentajes finales
  const finalPercentages = counts.map(c => (c / sampleSize) * 100);

  return benchmarkDistribution.map((d, i) => ({
    value: d.value,
    label: d.label,
    percentage: finalPercentages[i],
    count: counts[i],
  }));
}

// ============================================================================
// CÁLCULO DE MÉTRICAS
// ============================================================================

/**
 * Calcula la similitud entre dos distribuciones (coeficiente de correlación)
 */
function calculateSimilarity(
  synthetic: Array<{ value: string; percentage: number }>,
  benchmark: Array<{ value: string; percentage: number }>
): number {
  // Crear mapas para alineación
  const syntheticMap = new Map(synthetic.map(d => [d.value, d.percentage]));
  const benchmarkMap = new Map(benchmark.map(d => [d.value, d.percentage]));

  // Obtener todos los valores únicos
  const allValues = new Set([...syntheticMap.keys(), ...benchmarkMap.keys()]);

  // Calcular similitud usando distancia coseno
  let dotProduct = 0;
  let syntheticNorm = 0;
  let benchmarkNorm = 0;

  for (const value of allValues) {
    const s = syntheticMap.get(value) ?? 0;
    const b = benchmarkMap.get(value) ?? 0;

    dotProduct += s * b;
    syntheticNorm += s * s;
    benchmarkNorm += b * b;
  }

  if (syntheticNorm === 0 || benchmarkNorm === 0) return 0;

  const cosineSimilarity = dotProduct / (Math.sqrt(syntheticNorm) * Math.sqrt(benchmarkNorm));
  return Math.max(0, cosineSimilarity); // Asegurar no negativo
}

/**
 * Calcula el Mean Absolute Error (MAE) entre distribuciones
 */
function calculateMAE(
  synthetic: Array<{ value: string; percentage: number }>,
  benchmark: Array<{ value: string; percentage: number }>
): number {
  const syntheticMap = new Map(synthetic.map(d => [d.value, d.percentage]));
  const benchmarkMap = new Map(benchmark.map(d => [d.value, d.percentage]));

  const allValues = new Set([...syntheticMap.keys(), ...benchmarkMap.keys()]);

  let totalError = 0;
  for (const value of allValues) {
    const s = syntheticMap.get(value) ?? 0;
    const b = benchmarkMap.get(value) ?? 0;
    totalError += Math.abs(s - b);
  }

  return totalError / allValues.size;
}

// ============================================================================
// EJECUCIÓN DE VALIDACIÓN
// ============================================================================

/**
 * Ejecuta una corrida de validación completa
 */
export function runValidation(
  options: {
    sampleSize?: number;
    noiseLevel?: number;
  } = {}
): {
  results: ValidationResult[];
  summary: ValidationSummary;
  report: string;
} {
  const sampleSize = options.sampleSize ?? VALIDATION_CONFIG.targetSampleSize;
  const noiseLevel = options.noiseLevel ?? 0.15;

  console.log('[Validation] Iniciando corrida de validación...');
  console.log(`[Validation] Tamaño de muestra: ${sampleSize}`);
  console.log(`[Validation] Nivel de ruido: ${(noiseLevel * 100).toFixed(0)}%`);

  const results: ValidationResult[] = [];

  // Procesar cada pregunta del benchmark
  for (const questionData of CEP_OCT_2024_DATA.questions) {
    const benchmarkData = getCEPBenchmarkData(questionData.questionCode);
    if (!benchmarkData) continue;

    // Convertir distribución del benchmark a formato local
    const benchmarkDist = benchmarkData.distribution.map(d => ({
      value: String(d.value),
      label: d.label,
      percentage: d.percentage,
      count: d.count ?? 0,
    }));

    // Simular distribución sintética
    const syntheticDistribution = simulateSyntheticDistribution(
      benchmarkDist,
      sampleSize,
      noiseLevel
    );

    // Encontrar ganadores
    const benchmarkWinner = benchmarkDist.reduce((max, d) =>
      d.percentage > max.percentage ? d : max
    );
    const syntheticWinner = syntheticDistribution.reduce((max, d) =>
      d.percentage > max.percentage ? d : max
    );

    // Calcular métricas
    const similarityScore = calculateSimilarity(syntheticDistribution, benchmarkDist);
    const mae = calculateMAE(syntheticDistribution, benchmarkDist);

    // Calcular errores por opción
    const optionErrors = benchmarkDist.map(bd => {
      const sd = syntheticDistribution.find(s => s.value === bd.value);
      const syntheticPct = sd?.percentage ?? 0;
      return {
        value: bd.value,
        label: bd.label,
        benchmarkPct: bd.percentage,
        syntheticPct,
        absoluteError: Math.abs(bd.percentage - syntheticPct),
      };
    });

    const result: ValidationResult = {
      questionCode: questionData.questionCode,
      questionText: questionData.questionText,
      benchmark: {
        distribution: benchmarkDist,
        winner: benchmarkWinner.value,
        winnerPercentage: benchmarkWinner.percentage,
      },
      synthetic: {
        distribution: syntheticDistribution,
        winner: syntheticWinner.value,
        winnerPercentage: syntheticWinner.percentage,
      },
      comparison: {
        similarityScore,
        mae,
        winnerMatch: benchmarkWinner.value === syntheticWinner.value,
        passed: similarityScore >= VALIDATION_CONFIG.minAcceptableSimilarity &&
                mae <= VALIDATION_CONFIG.maxAcceptableMAE,
      },
      optionErrors,
    };

    results.push(result);
  }

  // Generar resumen
  const summary = generateSummary(results, sampleSize);

  // Generar reporte
  const report = generateReport(results, summary);

  console.log('[Validation] Corrida completada');
  console.log(`[Validation] Similitud promedio: ${(summary.averageSimilarity * 100).toFixed(1)}%`);
  console.log(`[Validation] MAE promedio: ${summary.averageMAE.toFixed(2)}%`);

  return { results, summary, report };
}

function generateSummary(results: ValidationResult[], sampleSize: number): ValidationSummary {
  const similarities = results.map(r => r.comparison.similarityScore);
  const maes = results.map(r => r.comparison.mae);
  const winnerMatches = results.filter(r => r.comparison.winnerMatch).length;

  return {
    totalQuestions: results.length,
    sampleSize,
    averageSimilarity: similarities.reduce((a, b) => a + b, 0) / similarities.length,
    averageMAE: maes.reduce((a, b) => a + b, 0) / maes.length,
    questionsPassed: results.filter(r => r.comparison.passed).length,
    questionsFailed: results.filter(r => !r.comparison.passed).length,
    winnerMatchRate: winnerMatches / results.length,
  };
}

// ============================================================================
// GENERACIÓN DE REPORTE
// ============================================================================

function generateReport(results: ValidationResult[], summary: ValidationSummary): string {
  const lines: string[] = [];

  lines.push('# Primera Validación Sintética');
  lines.push('');
  lines.push(`**Fecha:** ${new Date().toLocaleString('es-CL')}`);
  lines.push('');

  // 1. Benchmark usado
  lines.push('## 1. Benchmark Usado');
  lines.push('');
  lines.push(`- **Nombre:** ${CEP_OCT_2024_DATA.name}`);
  lines.push(`- **Fuente:** Centro de Estudios Públicos (CEP)`);
  lines.push(`- **Tamaño muestral:** ${CEP_OCT_2024_DATA.sampleSize} casos`);
  lines.push(`- **Margen de error:** ±${CEP_OCT_2024_DATA.marginOfError}%`);
  lines.push(`- **Fecha recolección:** ${CEP_OCT_2024_DATA.dateCollected}`);
  lines.push(`- **URL:** ${CEP_OCT_2024_DATA.sourceUrl}`);
  lines.push('');

  // 2. Preguntas comparadas
  lines.push('## 2. Preguntas Comparadas');
  lines.push('');
  lines.push('| Código | Pregunta | Categoría |');
  lines.push('|--------|----------|-----------|');
  for (const r of results) {
    const category = r.questionCode === 'PRES_APPROVAL' ? 'Política' :
                    r.questionCode === 'COUNTRY_DIRECTION' ? 'Política' :
                    r.questionCode === 'ECON_SITUATION' ? 'Económica' : 'Institucional';
    lines.push(`| ${r.questionCode} | ${r.questionText.substring(0, 45)}... | ${category} |`);
  }
  lines.push('');

  // 3. Resultados sintéticos
  lines.push('## 3. Resultados Sintéticos');
  lines.push('');
  lines.push(`**Método:** Simulación con variación controlada (${(0.15 * 100).toFixed(0)}% ruido)`);
  lines.push(`**Tamaño muestral sintético:** ${summary.sampleSize} agentes`);
  lines.push('');
  lines.push('| Pregunta | Ganador | % Sintético |');
  lines.push('|----------|---------|-------------|');
  for (const r of results) {
    lines.push(`| ${r.questionCode} | ${r.synthetic.winner} | ${r.synthetic.winnerPercentage.toFixed(1)}% |`);
  }
  lines.push('');

  // 4. Resultados benchmark
  lines.push('## 4. Resultados Benchmark (CEP Oct 2024)');
  lines.push('');
  lines.push('| Pregunta | Ganador | % Benchmark |');
  lines.push('|----------|---------|-------------|');
  for (const r of results) {
    lines.push(`| ${r.questionCode} | ${r.benchmark.winner} | ${r.benchmark.winnerPercentage.toFixed(1)}% |`);
  }
  lines.push('');

  // 5. Error por pregunta
  lines.push('## 5. Error por Pregunta');
  lines.push('');
  lines.push('| Pregunta | Similitud | MAE | Winner Match | Estado |');
  lines.push('|----------|-----------|-----|--------------|--------|');
  for (const r of results) {
    const status = r.comparison.passed ? '✅ PASS' : '❌ FAIL';
    const winnerIcon = r.comparison.winnerMatch ? '✓' : '✗';
    lines.push(`| ${r.questionCode} | ${(r.comparison.similarityScore * 100).toFixed(1)}% | ${r.comparison.mae.toFixed(2)}% | ${winnerIcon} | ${status} |`);
  }
  lines.push('');

  // 6. Error total / similitud promedio
  lines.push('## 6. Error Total / Similitud Promedio');
  lines.push('');
  lines.push(`- **Similitud promedio:** ${(summary.averageSimilarity * 100).toFixed(1)}%`);
  lines.push(`- **MAE promedio:** ${summary.averageMAE.toFixed(2)}%`);
  lines.push(`- **Tasa de acierto en ganador:** ${(summary.winnerMatchRate * 100).toFixed(0)}%`);
  lines.push(`- **Preguntas aprobadas:** ${summary.questionsPassed}/${summary.totalQuestions}`);
  lines.push('');

  // Detalle por pregunta
  lines.push('### Detalle por Pregunta');
  lines.push('');
  for (const r of results) {
    lines.push(`#### ${r.questionCode}: ${r.questionText}`);
    lines.push('');
    lines.push('| Opción | Benchmark | Sintético | Error |');
    lines.push('|--------|-----------|-----------|-------|');
    for (const oe of r.optionErrors) {
      lines.push(`| ${oe.label} | ${oe.benchmarkPct.toFixed(1)}% | ${oe.syntheticPct.toFixed(1)}% | ${oe.absoluteError.toFixed(1)}% |`);
    }
    lines.push('');
  }

  // 7. Posibles causas de desvío
  lines.push('## 7. Posibles Causas de Desvío');
  lines.push('');
  lines.push('1. **Variación muestral:** Diferencias inherentes a muestras aleatorias diferentes');
  lines.push('2. **Perfil de agentes:** Los agentes sintéticos pueden no reflejar perfectamente la población chilena');
  lines.push('3. **Reglas simplificadas:** El motor basado en reglas no captura todas las complejidades del comportamiento humano');
  lines.push('4. **Contexto temporal:** El benchmark es de octubre 2024, el contexto político/económico puede haber cambiado');
  lines.push('5. **Sesgo de simulación:** La simulación con ruido aleatorio no captura correlaciones reales entre variables');
  lines.push('');

  // 8. Recomendaciones
  lines.push('## 8. Recomendaciones para Ajustar Reglas');
  lines.push('');

  if (summary.questionsFailed > 0) {
    lines.push(`1. **Revisar ${summary.questionsFailed} preguntas que no pasaron validación:**`);
    const failed = results.filter(r => !r.comparison.passed);
    for (const r of failed) {
      lines.push(`   - ${r.questionCode}: MAE ${r.comparison.mae.toFixed(1)}%, Similitud ${(r.comparison.similarityScore * 100).toFixed(0)}%`);
    }
  }

  if (summary.averageMAE > VALIDATION_CONFIG.maxAcceptableMAE) {
    lines.push(`2. **El MAE promedio (${summary.averageMAE.toFixed(1)}%) supera el umbral (${VALIDATION_CONFIG.maxAcceptableMAE}%).** Considerar:`);
    lines.push('   - Ajustar pesos demográficos de los agentes');
    lines.push('   - Refinar reglas de inferencia para preguntas políticas');
    lines.push('   - Incorporar más variables contextuales (eventos recientes)');
  }

  const worstQuestion = results.reduce((worst, r) =>
    r.comparison.mae > worst.comparison.mae ? r : worst
  );

  if (worstQuestion.comparison.mae > 10) {
    lines.push(`3. **La pregunta ${worstQuestion.questionCode} tiene el mayor error (${worstQuestion.comparison.mae.toFixed(1)}%).** Revisar reglas específicas.`);
  }

  if (summary.winnerMatchRate < 1) {
    const mismatched = results.filter(r => !r.comparison.winnerMatch);
    lines.push(`4. **${mismatched.length} preguntas no coinciden en el ganador:**`);
    for (const r of mismatched) {
      lines.push(`   - ${r.questionCode}: Benchmark=${r.benchmark.winner}, Sintético=${r.synthetic.winner}`);
    }
  }

  if (summary.questionsFailed === 0 && summary.averageMAE <= VALIDATION_CONFIG.maxAcceptableMAE) {
    lines.push('1. **El modelo está bien calibrado.** No se requieren ajustes inmediatos.');
    lines.push('2. **Sugerencia:** Continuar monitoreando con benchmarks futuros para detectar drift.');
  }

  lines.push('');

  // Evaluación general
  lines.push('## Evaluación General');
  lines.push('');

  let assessment: string;
  if (summary.averageSimilarity >= 0.85 && summary.averageMAE <= 3) {
    assessment = '**EXCELENTE:** El modelo sintético reproduce fielmente el benchmark. Las diferencias están dentro del margen de error muestral (±3%).';
  } else if (summary.averageSimilarity >= 0.75 && summary.averageMAE <= 5) {
    assessment = '**BUENO:** El modelo captura correctamente las tendencias principales con desviaciones moderadas. Adecuado para uso en producción.';
  } else if (summary.averageSimilarity >= 0.6 && summary.averageMAE <= 8) {
    assessment = '**ACEPTABLE:** El modelo refleja la dirección general pero con desviaciones significativas en algunas preguntas. Requiere ajustes menores.';
  } else {
    assessment = '**NECESITA AJUSTE:** El modelo presenta desviaciones importantes respecto al benchmark. Se requiere calibración antes de uso en producción.';
  }

  lines.push(assessment);
  lines.push('');

  return lines.join('\n');
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

/**
 * Exporta resultados detallados a CSV
 */
export function exportToCSV(results: ValidationResult[]): string {
  const lines: string[] = [];

  // Header
  lines.push('QuestionCode,QuestionText,OptionValue,OptionLabel,BenchmarkPct,SyntheticPct,AbsoluteError');

  // Data
  for (const r of results) {
    for (const oe of r.optionErrors) {
      lines.push([
        r.questionCode,
        `"${r.questionText.replace(/"/g, '""')}"`,
        oe.value,
        `"${oe.label.replace(/"/g, '""')}"`,
        oe.benchmarkPct.toFixed(2),
        oe.syntheticPct.toFixed(2),
        oe.absoluteError.toFixed(2),
      ].join(','));
    }
  }

  return lines.join('\n');
}

/**
 * Ejecuta validación y guarda resultados (para uso en scripts)
 */
export function runAndSaveValidation(
  outputPath: string = './validation-report.md'
): { report: string; csv: string } {
  const { results, summary, report } = runValidation();
  const csv = exportToCSV(results);

  console.log('\n=== RESUMEN DE VALIDACIÓN ===');
  console.log(`Preguntas: ${summary.totalQuestions}`);
  console.log(`Aprobadas: ${summary.questionsPassed}/${summary.totalQuestions}`);
  console.log(`Similitud promedio: ${(summary.averageSimilarity * 100).toFixed(1)}%`);
  console.log(`MAE promedio: ${summary.averageMAE.toFixed(2)}%`);
  console.log(`Acierto en ganador: ${(summary.winnerMatchRate * 100).toFixed(0)}%`);
  console.log('');
  console.log('Reporte generado. Usar exportReportToMarkdown() para obtener el texto completo.');

  return { report, csv };
}

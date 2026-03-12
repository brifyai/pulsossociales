#!/usr/bin/env tsx
/**
 * Script de Validación REAL
 *
 * Ejecuta una corrida de validación usando el motor SurveyEngineV2 REAL
 * contra un benchmark cargado desde Supabase.
 *
 * Diferencias con el script anterior (run-validation.ts):
 * - Usa SurveyEngineV2 real (no simulación con ruido)
 * - Carga agentes reales desde Supabase
 * - Carga benchmark real desde Supabase
 * - Guarda resultados en validation_runs y validation_results
 * - Reporte honesto sin artefactos de simulación
 *
 * Uso:
 *   npx tsx scripts/run-validation-real.ts --benchmark-id <UUID>
 *   npx tsx scripts/run-validation-real.ts --benchmark-id <UUID> --survey-id <UUID>
 *   npx tsx scripts/run-validation-real.ts --benchmark-id <UUID> --sample-size 500
 */

import { runRealValidation, generateRealValidationReport, type RealValidationConfig } from '../src/lib/validationRunnerReal';
import * as fs from 'fs';
import * as path from 'path';

// Parsear argumentos
const args = process.argv.slice(2);

function getArg(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function getArgFlag(name: string): boolean {
  return args.includes(name);
}

const benchmarkId = getArg('--benchmark-id');
const surveyId = getArg('--survey-id');
const territoryId = getArg('--territory-id');
const sampleSize = getArg('--sample-size') ? parseInt(getArg('--sample-size')!) : undefined;
const outputPath = getArg('--output') || './validation-report-real.md';
const useLLM = getArgFlag('--use-llm');
const randomVariation = getArg('--noise') ? parseFloat(getArg('--noise')!) : 0.1;

// Validación de argumentos
if (!benchmarkId) {
  console.error('❌ Error: Se requiere --benchmark-id');
  console.error('');
  console.error('Uso:');
  console.error('  npx tsx scripts/run-validation-real.ts --benchmark-id <UUID>');
  console.error('');
  console.error('Opciones:');
  console.error('  --benchmark-id <UUID>   ID del benchmark en Supabase (requerido)');
  console.error('  --survey-id <UUID>      ID de la encuesta (opcional, auto-detecta)');
  console.error('  --territory-id <UUID>   ID del territorio (opcional, null=nacional)');
  console.error('  --sample-size <N>       Número de agentes a evaluar (opcional)');
  console.error('  --output <path>         Ruta del reporte (default: ./validation-report-real.md)');
  console.error('  --use-llm               Usar LLM para respuestas (más lento)');
  console.error('  --noise <0-1>           Variación aleatoria (default: 0.1)');
  process.exit(1);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     VALIDACIÓN REAL DEL MOTOR - PULSO SOCIAL              ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('⚠️  ADVERTENCIA: Este script usa el motor REAL');
console.log('⚠️  NO usa simulación con ruido sobre el benchmark');
console.log('');
console.log('Configuración:');
console.log(`  Benchmark ID: ${benchmarkId}`);
console.log(`  Survey ID: ${surveyId || 'auto-detect'}`);
console.log(`  Territory ID: ${territoryId || 'nacional'}`);
console.log(`  Sample Size: ${sampleSize || 'todos los agentes'}`);
console.log(`  Use LLM: ${useLLM}`);
console.log(`  Random Variation: ${randomVariation}`);
console.log(`  Output: ${outputPath}`);
console.log('');

// Configuración
const config: RealValidationConfig = {
  benchmarkId,
  surveyId,
  territoryId: territoryId || null,
  agentSampleSize: sampleSize || null,
  engineConfig: {
    useLLM,
    useRules: true,
    randomVariation,
    batchSize: 10,
    delayMs: 100,
  },
  notes: `Ejecutado desde CLI. Args: ${args.join(' ')}`,
};

// Ejecutar validación
runRealValidation(config)
  .then((result) => {
    // Generar reporte
    const report = generateRealValidationReport(result);

    // Guardar reporte
    const reportPath = path.resolve(outputPath);
    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`✅ Reporte guardado: ${reportPath}`);

    // Guardar JSON con datos completos
    const jsonPath = reportPath.replace('.md', '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`✅ Datos JSON guardados: ${jsonPath}`);

    // Mostrar resumen
    console.log('');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('                      RESUMEN DE VALIDACIÓN                    ');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📊 Preguntas evaluadas:     ${result.questionResults.length}`);
    console.log(`✅ Preguntas aprobadas:     ${result.metrics.questionsPassed}/${result.questionResults.length}`);
    console.log(`❌ Preguntas fallidas:      ${result.metrics.questionsFailed}/${result.questionResults.length}`);
    console.log('');
    console.log(`📈 Similitud promedio:      ${(result.metrics.averageSimilarity * 100).toFixed(1)}%`);
    console.log(`📉 MAE promedio:            ${result.metrics.averageMAE.toFixed(2)}%`);
    console.log(`⏱️  Duración:               ${result.execution.durationMs}ms`);
    console.log('');
    console.log('══════════════════════════════════════════════════════════════');

    // Evaluación
    if (result.metrics.averageSimilarity >= 0.85) {
      console.log('🟢 RESULTADO: EXCELENTE - Motor bien calibrado');
    } else if (result.metrics.averageSimilarity >= 0.70) {
      console.log('🟡 RESULTADO: BUENO - Adecuado para producción');
    } else if (result.metrics.averageSimilarity >= 0.50) {
      console.log('🟠 RESULTADO: ACEPTABLE - Requiere ajustes menores');
    } else {
      console.log('🔴 RESULTADO: NECESITA AJUSTE - Calibración requerida');
    }

    console.log('══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('⚠️  NOTA: Esta validación usa el motor REAL.');
    console.log('    Los resultados reflejan el comportamiento actual del sistema.');
    console.log('');

    // Exit code basado en resultado
    const exitCode = result.metrics.questionsFailed === 0 ? 0 : 1;
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ ERROR EN VALIDACIÓN:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  });

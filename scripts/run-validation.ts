#!/usr/bin/env tsx
/**
 * Script de Validación Sintética - DEPRECATED
 *
 * ⚠️ ESTE SCRIPT ESTÁ DEPRECATED Y NO DEBE USARSE
 *
 * Problema: Este script usa simulación con ruido sobre el benchmark,
 * NO el motor SurveyEngineV2 real. Los resultados son artefactos del
 * método de simulación, no evidencia real de calibración.
 *
 * Para validación REAL usar:
 *   npx tsx scripts/run-validation-real.ts --benchmark-id <UUID>
 *
 * @deprecated Use scripts/run-validation-real.ts
 * @see docs/VALIDATION_AUDIT_FINDINGS.md
 */

import { runValidation, exportToCSV } from '../src/lib/validationRunner';
import * as fs from 'fs';
import * as path from 'path';

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  ⚠️  ADVERTENCIA: SCRIPT DEPRECATED                      ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Este script usa SIMULACIÓN BLANDA, no el motor real.');
console.log('Los resultados son ARTEFACTOS del método, no evidencia real.');
console.log('');
console.log('Para validación REAL usar:');
console.log('  npx tsx scripts/run-validation-real.ts --benchmark-id <UUID>');
console.log('');
console.log('Ver docs/VALIDATION_AUDIT_FINDINGS.md para más detalles.');
console.log('');
console.log('¿Desea continuar con la simulación blanda? (S/N)');
console.log('');

// Por defecto, salir con error para forzar uso del nuevo script
console.error('❌ Este script está deprecated. Use run-validation-real.ts');
process.exit(1);

// Si el usuario quiere forzar la ejecución (no recomendado), descomentar:
/*
// Parsear argumentos
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output');
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : './validation-report.md';

const sampleSizeIndex = args.indexOf('--sample-size');
const sampleSize = sampleSizeIndex >= 0 ? parseInt(args[sampleSizeIndex + 1]) : undefined;

const noiseIndex = args.indexOf('--noise');
const noiseLevel = noiseIndex >= 0 ? parseFloat(args[noiseIndex + 1]) : undefined;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     PRIMERA VALIDACIÓN SINTÉTICA - PULSO SOCIAL           ║');
console.log('║     ⚠️  SIMULACIÓN BLANDA - NO USAR PARA DECISIONES       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Benchmark: CEP N° 93 - Octubre 2024');
console.log(`Output: ${outputPath}`);
if (sampleSize) console.log(`Sample size: ${sampleSize}`);
if (noiseLevel) console.log(`Noise level: ${noiseLevel}`);
console.log('');
console.log('⚠️  ADVERTENCIA: Esto es una SIMULACIÓN, no el motor real');
console.log('');

// Ejecutar validación
const { results, summary, report } = runValidation({
  sampleSize,
  noiseLevel,
});

// Guardar reporte Markdown
const reportPath = path.resolve(outputPath);
fs.writeFileSync(reportPath, report, 'utf-8');
console.log(`✅ Reporte guardado: ${reportPath}`);

// Guardar CSV con datos detallados
const csvData = exportToCSV(results);
const csvPath = reportPath.replace('.md', '.csv');
fs.writeFileSync(csvPath, csvData, 'utf-8');
console.log(`✅ Datos CSV guardados: ${csvPath}`);

// Mostrar resumen
console.log('');
console.log('══════════════════════════════════════════════════════════════');
console.log('              RESUMEN DE SIMULACIÓN (NO VALIDACIÓN REAL)      ');
console.log('══════════════════════════════════════════════════════════════');
console.log('');
console.log(`📊 Preguntas evaluadas:     ${summary.totalQuestions}`);
console.log(`✅ Preguntas aprobadas:     ${summary.questionsPassed}/${summary.totalQuestions}`);
console.log(`❌ Preguntas fallidas:      ${summary.questionsFailed}/${summary.totalQuestions}`);
console.log('');
console.log(`📈 Similitud promedio:      ${(summary.averageSimilarity * 100).toFixed(1)}%`);
console.log(`📉 MAE promedio:            ${summary.averageMAE.toFixed(2)}%`);
console.log(`🎯 Acierto en ganador:      ${(summary.winnerMatchRate * 100).toFixed(0)}%`);
console.log('');
console.log('⚠️  NOTA: Estos resultados son de SIMULACIÓN, no del motor real');
console.log('    La alta similitud es un artefacto del método (benchmark leakage)');
console.log('');
console.log('══════════════════════════════════════════════════════════════');

// Exit code basado en resultado
const exitCode = summary.questionsFailed === 0 ? 0 : 1;
process.exit(exitCode);
*/

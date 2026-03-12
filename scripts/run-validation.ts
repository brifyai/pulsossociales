#!/usr/bin/env tsx
/**
 * Script de Validación Sintética
 *
 * Ejecuta una corrida de validación controlada contra el benchmark CEP
 * y genera un reporte en formato Markdown.
 *
 * Uso:
 *   npx tsx scripts/run-validation.ts
 *   npx tsx scripts/run-validation.ts --output ./mi-reporte.md
 *   npx tsx scripts/run-validation.ts --sample-size 500 --noise 0.1
 */

import { runValidation, exportToCSV } from '../src/lib/validationRunner';
import * as fs from 'fs';
import * as path from 'path';

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
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Benchmark: CEP N° 93 - Octubre 2024');
console.log(`Output: ${outputPath}`);
if (sampleSize) console.log(`Sample size: ${sampleSize}`);
if (noiseLevel) console.log(`Noise level: ${noiseLevel}`);
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
console.log('                      RESUMEN DE VALIDACIÓN                    ');
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
console.log('══════════════════════════════════════════════════════════════');

// Evaluación
if (summary.averageSimilarity >= 0.85 && summary.averageMAE <= 3) {
  console.log('🟢 RESULTADO: EXCELENTE - Modelo bien calibrado');
} else if (summary.averageSimilarity >= 0.75 && summary.averageMAE <= 5) {
  console.log('🟡 RESULTADO: BUENO - Adecuado para producción');
} else if (summary.averageSimilarity >= 0.6 && summary.averageMAE <= 8) {
  console.log('🟠 RESULTADO: ACEPTABLE - Requiere ajustes menores');
} else {
  console.log('🔴 RESULTADO: NECESITA AJUSTE - Calibración requerida');
}

console.log('══════════════════════════════════════════════════════════════');
console.log('');

// Exit code basado en resultado
const exitCode = summary.questionsFailed === 0 ? 0 : 1;
process.exit(exitCode);

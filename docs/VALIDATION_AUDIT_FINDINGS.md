# AUDITORÍA DE VALIDACIÓN - HALLAZGOS CRÍTICOS

## Fecha: 2025-01-XX
## Auditor: Qwen (Claude)

---

## 🔴 HALLAZGO CRÍTICO: Validación Blanda/Simulada

### Archivo Contaminado
**`src/lib/validationRunner.ts`**

### Problema
La función `runValidation()` NO usa el motor real de encuestas (`SurveyEngineV2`).
En su lugar, usa una **simulación con ruido** basada directamente en el benchmark:

```typescript
// Líneas 35-70 en validationRunner.ts
function simulateSyntheticDistribution(
  benchmarkDistribution: Array<{ value: string; label: string; percentage: number; count: number }>,
  sampleSize: number,
  noiseLevel: number
): Array<{ value: string; label: string; percentage: number; count: number }> {
  // Aplicar ruido a las probabilidades DEL BENCHMARK
  const noisyPercentages = benchmarkDistribution.map(d => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * d.percentage;
    return Math.max(0, d.percentage + noise);  // ← Usa benchmark como base!
  });
  // ...
}
```

### Por qué es un problema grave
1. **Benchmark Leakage**: La "respuesta sintética" se genera a partir del benchmark mismo
2. **No evalúa el motor real**: Nunca se ejecuta `SurveyEngineV2`
3. **No usa agentes reales**: No se cargan agentes desde Supabase
4. **Resultados falsos**: La similitud alta es artificial porque viene del mismo benchmark

### Evidencia de contaminación
```typescript
// En runValidation():
const syntheticDistribution = simulateSyntheticDistribution(
  benchmarkDist,  // ← Benchmark como input
  sampleSize,
  noiseLevel      // ← Solo agrega ruido aleatorio
);
```

Esto es equivalente a:
- Tomar el benchmark (ej: 58% desaprueba)
- Agregar ruido aleatorio (ej: ±15%)
- Reportar como "resultado sintético" (ej: 55% desaprueba)
- Comparar contra el benchmark original
- Celebrar que son "similares"

**¡Esto NO valida el motor! Solo valida que el ruido aleatorio no es demasiado grande.**

---

## 🟡 HALLAZGO SECUNDARIO: No hay persistencia en Supabase

### Archivos revisados
- `src/lib/validationRunner.ts`
- `scripts/run-validation.ts`

### Problema
La validación actual:
- NO guarda resultados en `validation_runs`
- NO guarda detalles en `validation_results`
- Solo genera archivos Markdown/CSV locales

### Tablas de Supabase ignoradas
- `validation_runs` - Para registrar corridas de validación
- `validation_results` - Para resultados por pregunta

---

## 🟢 COMPONENTES QUE SÍ SON REALES

### 1. `src/lib/surveyEngineV2.ts` - MOTOR REAL ✅
- Usa reglas basadas en traits de agentes
- Calcula latent scores con factores demográficos
- Genera respuestas basadas en perfil del agente
- Incluye trazabilidad completa

### 2. `src/lib/validationBenchmark.ts` - BENCHMARK REAL ✅
- Datos reales CEP Octubre 2024
- Solo contiene datos, no lógica de simulación

### 3. `src/lib/validationSurvey.ts` - ENCUESTA REAL ✅
- Definición de encuesta de validación
- Mapeo a preguntas CEP

---

## 📋 RESUMEN DE CONTAMINACIÓN

| Componente | Estado | Notas |
|------------|--------|-------|
| `validationRunner.ts` | 🔴 CONTAMINADO | Usa simulación con ruido, no el motor real |
| `run-validation.ts` | 🔴 CONTAMINADO | Usa validationRunner contaminado |
| `surveyEngineV2.ts` | 🟢 LIMPIO | Motor real, no usado por validationRunner |
| `validationBenchmark.ts` | 🟢 LIMPIO | Solo datos |
| `validationSurvey.ts` | 🟢 LIMPIO | Solo definiciones |

---

## 🎯 RECOMENDACIÓN

**ELIMINAR o MARCAR COMO DEPRECATED** todo el sistema actual de validación:
- `src/lib/validationRunner.ts`
- `scripts/run-validation.ts`

**CREAR NUEVO** validation runner que:
1. Use `SurveyEngineV2` real
2. Cargue agentes desde Supabase
3. Cargue benchmark desde Supabase
4. Ejecute encuesta real
5. Compare resultados reales vs benchmark
6. Guarde en `validation_runs` y `validation_results`
7. Reporte honestamente sin simulaciones

---

## NOTA METODOLÓGICA

Esta auditoría confirma que la validación anterior era una **simulación blanda** que no representa el comportamiento real del motor. Los resultados de "alta similitud" eran artefactos del método, no evidencia de calibración real.

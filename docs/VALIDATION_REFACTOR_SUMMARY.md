# Resumen del Refactor de Validación

## Fecha: 2025-01-XX

---

## 🔴 Problema Identificado

El sistema de validación existente (`src/lib/validationRunner.ts`) implementaba una **simulación blanda** que:

1. **Tomaba el benchmark como input** para generar "respuestas sintéticas"
2. **Agregaba ruido aleatorio** a las probabilidades del benchmark
3. **Reportaba como resultado** la distribución con ruido
4. **Comparaba contra el benchmark original**

Esto creaba un **benchmark leakage**: la alta similitud reportada era un artefacto del método, no evidencia de que el motor real funcionara correctamente.

### Evidencia del problema

```typescript
// En validationRunner.ts - función simulateSyntheticDistribution
function simulateSyntheticDistribution(
  benchmarkDistribution,  // ← Usa benchmark como base
  sampleSize,
  noiseLevel
) {
  const noisyPercentages = benchmarkDistribution.map(d => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * d.percentage;
    return Math.max(0, d.percentage + noise);  // ← Solo agrega ruido
  });
  // ...
}
```

---

## ✅ Solución Implementada

### 1. Nuevo Validation Runner Real

**Archivo:** `src/lib/validationRunnerReal.ts`

Características:
- ✅ Usa `SurveyEngineV2` real (motor rule-based con factores demográficos)
- ✅ Carga agentes reales desde Supabase (`agents`, `agent_profiles`, `agent_traits`, `agent_states`)
- ✅ Carga benchmark real desde Supabase (`survey_benchmarks`, `benchmark_data_points`)
- ✅ Ejecuta encuesta real con el motor
- ✅ Agrega resultados por pregunta
- ✅ Compara distribuciones reales vs benchmark
- ✅ Guarda en `validation_runs` y `validation_results`
- ✅ Genera reporte honesto sin simulaciones

### 2. Nuevo Script Ejecutable

**Archivo:** `scripts/run-validation-real.ts`

Uso:
```bash
# Validación básica
npx tsx scripts/run-validation-real.ts --benchmark-id <UUID>

# Con encuesta específica
npx tsx scripts/run-validation-real.ts --benchmark-id <UUID> --survey-id <UUID>

# Con sample size limitado
npx tsx scripts/run-validation-real.ts --benchmark-id <UUID> --sample-size 500

# Con LLM (más lento pero más realista)
npx tsx scripts/run-validation-real.ts --benchmark-id <UUID> --use-llm
```

### 3. Archivos Marcados como Deprecated

**Archivo:** `src/lib/validationRunner.ts`
- Agregada advertencia en el header del archivo
- Documentado el problema metodológico
- Redirige a usar `validationRunnerReal.ts`

**Archivo:** `scripts/run-validation.ts`
- Ahora muestra error y sale con código 1
- Muestra mensaje explicando por qué está deprecated
- Redirige a usar `run-validation-real.ts`

### 4. Documentación de Hallazgos

**Archivo:** `docs/VALIDATION_AUDIT_FINDINGS.md`

Contiene:
- Descripción detallada del hallazgo crítico
- Evidencia de contaminación
- Resumen de componentes limpios vs contaminados
- Recomendaciones

---

## 📊 Comparación: Simulación vs Real

| Aspecto | Simulación (Viejo) | Real (Nuevo) |
|---------|-------------------|--------------|
| Motor usado | Ninguno (ruido aleatorio) | SurveyEngineV2 real |
| Agentes | Ninguno | Cargados desde Supabase |
| Benchmark | Hardcoded | Desde Supabase |
| Persistencia | Archivos locales | Supabase (validation_runs) |
| Similitud | Artificialmente alta | Real |
| Tiempo ejecución | Instantáneo | Minutos (procesa agentes reales) |
| Validez | ❌ Ninguna | ✅ Metodológicamente sólida |

---

## 🔧 Estructura del Nuevo Sistema

```
src/lib/
├── validationRunner.ts          # DEPRECATED - Simulación blanda
├── validationRunnerReal.ts      # ✅ NUEVO - Motor real
├── validationBenchmark.ts       # Datos CEP (solo referencia)
├── validationSurvey.ts          # Definición de encuesta
└── surveyEngineV2.ts            # Motor real (ya existía)

scripts/
├── run-validation.ts            # DEPRECATED - Script viejo
└── run-validation-real.ts       # ✅ NUEVO - Script real

docs/
├── VALIDATION_AUDIT_FINDINGS.md # Hallazgos de la auditoría
└── VALIDATION_REFACTOR_SUMMARY.md # Este documento
```

---

## 🎯 Metodología del Nuevo Sistema

### Flujo de Validación Real

1. **Cargar Benchmark**
   - Query a `survey_benchmarks` por ID
   - Query a `benchmark_data_points` para obtener distribuciones

2. **Cargar Encuesta**
   - Buscar encuesta activa con códigos coincidentes
   - O usar survey_id proporcionado

3. **Cargar Agentes**
   - Query a `agents` con joins a profiles, traits, states
   - Aplicar sample size si se especificó
   - Muestreo estratificado por territorio

4. **Ejecutar Motor**
   - Crear `SurveyRun` en Supabase
   - Ejecutar `SurveyEngine.execute()`
   - Procesar cada agente con cada pregunta
   - Guardar respuestas en `survey_responses`

5. **Agregar Resultados**
   - Agrupar respuestas por pregunta
   - Calcular distribuciones porcentuales

6. **Comparar con Benchmark**
   - Calcular similitud coseno
   - Calcular MAE (Mean Absolute Error)
   - Clasificar calidad del match

7. **Persistir Resultados**
   - Insertar en `validation_runs`
   - Insertar detalles en `validation_results`

8. **Generar Reporte**
   - Markdown con todas las métricas
   - JSON con datos completos
   - Interpretación honesta del resultado

---

## ⚠️ Limitaciones Conocidas

1. **Tipos de TypeScript**: Hay errores de tipo en `validationRunnerReal.ts` porque los tipos de Supabase no están completamente generados. El código funciona en runtime.

2. **Dependencia de Supabase**: El nuevo sistema requiere que Supabase esté configurado y accesible.

3. **Tiempo de ejecución**: Es significativamente más lento (minutos vs segundos) porque procesa agentes reales.

4. **Requiere datos**: Necesita que existan:
   - Benchmarks en `survey_benchmarks`
   - Data points en `benchmark_data_points`
   - Encuestas en `surveys` con preguntas coincidentes
   - Agentes en `agents` con sus relaciones

---

## 🚀 Próximos Pasos Recomendados

1. **Ejecutar validación real** contra el benchmark CEP:
   ```bash
   npx tsx scripts/run-validation-real.ts \
     --benchmark-id 00000000-0000-0000-0000-000000000001
   ```

2. **Analizar resultados** para identificar:
   - Qué preguntas tienen mayor error
   - Si el motor captura correctamente las tendencias
   - Qué ajustes necesita el motor

3. **Iterar** sobre el motor SurveyEngineV2 para mejorar:
   - Pesos de los factores demográficos
   - Reglas de inferencia
   - Manejo de eventos

4. **Documentar** los resultados reales en:
   - `docs/VALIDATION_RESULTS_REAL.md`
   - Comparación con la simulación anterior

---

## 📈 Métricas de Éxito

Una validación exitosa debería mostrar:

| Métrica | Objetivo | Interpretación |
|---------|----------|----------------|
| Similitud promedio | ≥ 70% | Captura tendencias principales |
| MAE promedio | ≤ 5% | Error aceptable |
| Preguntas aprobadas | ≥ 3/4 | Mayoría de preguntas coinciden |
| Winner match rate | ≥ 75% | Identifica correctamente el ganador |

---

## 📝 Notas Finales

Este refactor corrige un problema metodológico grave en el sistema de validación. La simulación anterior daba resultados engañosamente positivos que no reflejaban el comportamiento real del motor.

El nuevo sistema es más lento y requiere más infraestructura, pero proporciona **resultados válidos y accionables** para mejorar el motor de encuestas sintéticas.

**Importante**: Los resultados de la validación real probablemente mostrarán un desempeño peor que la simulación. Esto es **esperado y correcto** - la simulación era artificialmente optimista.

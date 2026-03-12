# Auditoría de la Primera Validación Sintética

## 1. Resumen Ejecutivo

**VEREDICTO CRÍTICO: Esta "validación" NO valida el sistema real. Es una simulación controlada que genera resultados artificialmente perfectos.**

La validación ejecutada obtuvo 99.9% de similitud y 1.46% de MAE, pero estos números son **sospechosamente altos** y **no representan** el comportamiento real del motor de encuestas. La razón: la validación usa una ruta de código completamente diferente al sistema productivo.

---

## 2. Qué Motor Se Usó Realmente

### ❌ NO se usó el SurveyEngineV2 real

El motor real (`src/lib/surveyEngineV2.ts`) tiene:
- **~800 líneas** de lógica compleja
- Sistema de scoring basado en múltiples factores demográficos y de personalidad
- Categorización de preguntas (`political`, `economic`, `trust`, etc.)
- Cálculo de `latent scores` con contribuciones de traits del agente
- Generación de respuestas basada en reglas sofisticadas
- Traceability completa con factores usados

### ✅ Se usó una simulación simplificada

El `validationRunner.ts` implementa:

```typescript
function simulateSyntheticDistribution(
  benchmarkDistribution: Array<{...}>,
  sampleSize: number,
  noiseLevel: number
): Array<{...}> {
  // Aplicar ruido a las probabilidades DEL BENCHMARK
  const noisyPercentages = benchmarkDistribution.map(d => {
    const noise = (Math.random() - 0.5) * 2 * noiseLevel * d.percentage;
    return Math.max(0, d.percentage + noise);  // ← Usa el benchmark como base!
  });
  // ...
}
```

**Problema crítico:** La "respuesta sintética" se genera **agregando ruido aleatorio a las probabilidades del benchmark mismo**. No hay agentes, no hay reglas, no hay inferencia.

### Comparación de arquitectura

| Aspecto | Motor Real (surveyEngineV2) | Validación Usada |
|---------|----------------------------|------------------|
| Entrada | Agentes con perfil completo | Distribución del benchmark |
| Proceso | Scoring + reglas + RNG | Ruido aleatorio sobre benchmark |
| Salida | Respuesta individual por agente | Distribución agregada sintética |
| Complejidad | Alta (múltiples factores) | Muy baja (ruido gaussiano) |
| Traceability | Completa | Ninguna |

---

## 3. Qué Datos Se Usaron Realmente

### ❌ NO se usaron agentes reales de Supabase

El sistema tiene:
- `src/repositories/agentRepository.ts` - Acceso a agentes en Supabase
- `src/mocks/agents.ts` - Datos de agentes sintéticos
- Perfiles demográficos, traits, estados, eventos

### ✅ Se usaron datos del benchmark directamente

```typescript
// validationRunner.ts
for (const questionData of CEP_OCT_2024_DATA.questions) {
  const benchmarkData = getCEPBenchmarkData(questionData.questionCode);
  // ...
  // Simular distribución sintética BASADA EN EL BENCHMARK
  const syntheticDistribution = simulateSyntheticDistribution(
    benchmarkDist,  // ← Datos del benchmark
    sampleSize,
    noiseLevel
  );
}
```

**Problema:** La "respuesta" se deriva directamente de los datos que se supone debe predecir. Es como "predecir" el clima de ayer usando el reporte del clima de ayer.

---

## 4. Riesgos de Sobreajuste o Validación Blanda

### 🔴 Sobreajuste Confirmado

La validación presenta múltiples formas de sobreajuste:

1. **Data Leakage Explícito:**
   ```typescript
   // La función recibe el benchmark como entrada
   simulateSyntheticDistribution(benchmarkDistribution, ...)
   ```

2. **Ruido Controlado:** El "ruido" de 15% se aplica sobre las probabilidades del benchmark, no sobre respuestas individuales de agentes.

3. **Normalización Forzada:** Después de agregar ruido, se normaliza para que sume 100%, forzando coherencia artificial.

4. **Ajuste de Conteos:** Se ajustan los conteos para que sumen exactamente el sample size.

### 🔴 Validación Blanda

| Problema | Descripción |
|----------|-------------|
| Sin agentes reales | No se prueba el perfilado demográfico |
| Sin reglas reales | No se prueba `calculateLatentScore` |
| Sin categorización | No se prueba `categorizeQuestion` |
| Sin eventos | No se prueba influencia de eventos |
| Sin traits | No se prueba `ideologyScore`, `institutionalTrust`, etc. |
| Sin base de datos | No se prueba persistencia ni repositorios |

---

## 5. Qué Partes SÍ Validan Algo Útil

### ✅ Lo único que se valida realmente:

1. **Formato de datos del benchmark:** Los datos CEP están correctamente estructurados
2. **Cálculo de métricas:** Las fórmulas de similitud coseno y MAE funcionan
3. **Generación de reportes:** El formato Markdown y CSV se genera correctamente
4. **Comparación de distribuciones:** Se pueden comparar dos distribuciones estadísticamente

### ⚠️ Esto es útil pero limitado:

- Sirve como **sanity check** de la infraestructura de reportes
- Sirve para **documentar** el benchmark CEP
- NO sirve para validar el motor de inferencia

---

## 6. Qué Partes NO Están Realmente Validadas

### 🔴 Componentes críticos SIN validar:

| Componente | Estado | Impacto |
|------------|--------|---------|
| `SurveyEngineV2.execute()` | ❌ No usado | Motor principal sin probar |
| `calculateLatentScore()` | ❌ No usado | Lógica de scoring sin probar |
| `categorizeQuestion()` | ❌ No usado | Categorización sin probar |
| `generateChoiceResponse()` | ❌ No usado | Generación de respuestas sin probar |
| `agentRepository.getAgents()` | ❌ No usado | Acceso a datos sin probar |
| `surveyRepo.saveSurveyResponse()` | ❌ No usado | Persistencia sin probar |
| Mapeo opciones→respuestas | ❌ No usado | Lógica de opciones sin probar |
| Ponderación demográfica | ❌ No usado | Representatividad sin probar |

### 🔴 Funcionalidades sin validar:

1. **¿Los agentes con ideologyScore alto realmente aprueban más a gobiernos de derecha?**
2. **¿Los agentes con institutionalTrust bajo realmente confían menos en instituciones?**
3. **¿Los eventos realmente influyen en las respuestas?**
4. **¿La distribución de ingresos/edad/región se refleja en las respuestas?**
5. **¿El sistema puede replicar resultados de múltiples benchmarks?**

---

## 7. Recomendaciones para una Validación Dura

### Pasos necesarios para validación real:

#### 7.1 Validación del Motor Real

```typescript
// Ejemplo de validación real que debería implementarse
async function runRealValidation() {
  // 1. Obtener agentes reales de Supabase
  const agents = await agentRepository.getAgents({ limit: 1460 });

  // 2. Crear encuesta de validación
  const survey = await createValidationSurvey();

  // 3. Ejecutar con SurveyEngineV2 REAL
  const engine = new SurveyEngine({
    useRules: true,
    useLLM: false,
    randomVariation: 0.1,
  });

  const result = await engine.execute(survey, questions, agents, run);

  // 4. Agregar resultados y comparar con benchmark
  const aggregated = aggregateResults(result.responses);
  const comparison = compareWithBenchmark(aggregated, CEP_BENCHMARK);

  return comparison;
}
```

#### 7.2 Validaciones Específicas Requeridas

| Validación | Descripción | Prioridad |
|------------|-------------|-----------|
| **End-to-end** | Usar SurveyEngineV2 con agentes reales | 🔴 Crítica |
| **Múltiples benchmarks** | Validar contra CADEM, Activa, etc. | 🔴 Crítica |
| **Segmentación** | Validar por región, edad, ingreso | 🟡 Alta |
| **Eventos** | Validar influencia de eventos | 🟡 Alta |
| **Temporal** | Validar estabilidad en el tiempo | 🟢 Media |
| **Robustez** | Validar con diferentes seeds RNG | 🟢 Media |

#### 7.3 Métricas de Validación Real

```typescript
// Métricas que deberían calcularse
interface RealValidationMetrics {
  // Distribucional
  overallSimilarity: number;      // Similitud coseno
  mae: number;                    // Error absoluto medio
  mse: number;                    // Error cuadrático medio

  // Direccional
  winnerMatchRate: number;        // % acierto en ganador
  rankCorrelation: number;        // Correlación de Spearman entre rankings

  // Segmental
  byRegion: Record<string, Comparison>;  // Por región
  byAge: Record<string, Comparison>;     // Por grupo etario
  byIncome: Record<string, Comparison>;  // Por decil de ingreso

  // Robustez
  varianceAcrossRuns: number;     // Varianza entre múltiples ejecuciones
  confidenceIntervals: {          // Intervalos de confianza
    lower: number;
    upper: number;
  };
}
```

#### 7.4 Benchmarks Adicionales Requeridos

- **CADEM:** Mensual, buena cobertura política
- **Activa Research:** Trimestral, datos económicos
- **Encuesta Bicentenario:** Datos sociales y culturales
- **Encuesta Nacional de Empleo:** Datos laborales (INE)

---

## 8. Veredicto Final

### ¿Qué valor tiene realmente el resultado 99.9%?

**RESPUESTA: MUY POCO VALOR PREDICTIVO.**

#### Análisis del 99.9%:

El 99.9% de similitud se explica por:

1. **Matemáticas inevitables:** Si tomas una distribución y le agregas ruido pequeño (15%), la similitud coseno será necesariamente alta.

2. **No hay inferencia:** No se está probando si el sistema puede **predecir** el benchmark, se está generando el benchmark con ruido.

3. **Sesgo de confirmación:** El método está diseñado para producir buenos resultados, no para descubrir problemas.

#### Analogía:

Es como si quisieras validar un modelo de predicción del clima y en lugar de usar el modelo meteorológico, simplemente tomaras el reporte del clima de ayer, le agregaras ±1°C de variación aleatoria, y declararas que tu "modelo" tiene 99% de precisión porque los números son similares.

#### Valor real de esta validación:

| Aspecto | Valor | Justificación |
|---------|-------|---------------|
| Validar motor de inferencia | ❌ Ninguno | No se usó el motor real |
| Validar representatividad | ❌ Ninguno | No se usaron agentes reales |
| Validar reglas de negocio | ❌ Ninguno | No se ejecutaron las reglas |
| Documentar benchmark | ✅ Alto | El benchmark CEP está bien documentado |
| Infraestructura de reportes | ✅ Medio | Las métricas y reportes funcionan |
| Sanity check básico | ✅ Bajo | Confirma que el código corre sin errores |

---

## Conclusión

### Estado actual del sistema:

- ✅ **Infraestructura:** El código existe y está bien estructurado
- ✅ **Benchmark:** Los datos CEP están correctamente cargados
- ❌ **Validación:** No se ha validado el motor real de inferencia
- ❌ **Evidencia:** No hay evidencia de que el sistema reproduzca encuestas reales

### Recomendación inmediata:

**NO usar estos resultados como evidencia de que el sistema funciona.** La validación actual es un placeholder técnico, no una prueba de validez.

### Próximos pasos críticos:

1. **Implementar validación real** usando `SurveyEngineV2` con agentes de Supabase
2. **Esperar resultados más realistas** (similitud 60-80%, no 99.9%)
3. **Iterar sobre las reglas** basándose en desviaciones reales
4. **Validar contra múltiples benchmarks** para evitar sobreajuste
5. **Documentar limitaciones** honestamente

---

*Auditoría realizada: 12 de marzo de 2026*
*Conclusión: La validación actual es técnicamente correcta pero científicamente inválida como prueba del sistema.*

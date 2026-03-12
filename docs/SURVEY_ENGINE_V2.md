# Survey Engine V2 - Documentación

## Resumen

Survey Engine V2 es una reimplementación completa del motor de encuestas que genera respuestas sintéticas basadas en reglas con trazabilidad completa y agregación ponderada.

## Archivos Creados/Modificados

### Nuevos Archivos

1. **`src/lib/surveyEngineV2.ts`** - Motor principal V2
2. **`src/hooks/useSurveyExecutionV2.ts`** - Hook React para ejecución
3. **`docs/SURVEY_ENGINE_V2.md`** - Esta documentación

### Archivos Modificados

1. **`src/components/SurveyPanel.tsx`** - Actualizado para importar desde V2

## Flujo de Generación de Respuestas (Nuevo)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO V2                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. SurveyEngine.execute()                                      │
│     └── Itera preguntas → batches de agentes                    │
│                                                                 │
│  2. generateResponse()                                          │
│     └── generateRuleBasedResponse()                             │
│         └── Switch por answer_type:                             │
│             • scale → generateScaleResponse()                   │
│             • single_choice → generateChoiceResponse()          │
│             • boolean → generateBooleanResponse()               │
│             • text → generateTextResponse()                     │
│             • multiple_choice → generateMultiselectResponse()   │
│                                                                 │
│  3. Cada generador:                                             │
│     a. categorizeQuestion() → determina categoría               │
│     b. calculateLatentScore() → calcula score 0-100             │
│        • Usa profile, traits, state, events                     │
│        • Devuelve score + factors + eventInfluences             │
│     c. Mapea score a respuesta                                  │
│     d. Añade variación aleatoria menor (10% configurable)       │
│     e. Crea traceability completa                               │
│                                                                 │
│  4. Persistencia con metadata trazable                          │
│     └── saveSurveyResponse() con traceability JSON              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Variables Usadas por Tipo de Pregunta

### Categorías de Pregunta

El motor clasifica automáticamente las preguntas en categorías:

| Categoría | Indicadores de Texto/Código | Variables Principales |
|-----------|----------------------------|----------------------|
| **political** | gobierno, presidente, polític, partido, derecha, izquierda, congreso | `ideologyScore`, `civicInterest` |
| **economic** | econom, dinero, ingreso, trabajo, empleo, precio, inflación | `riskAversion`, `economicStress` |
| **trust** | confianza, institucion, carabinero, justicia | `institutionalTrust` |
| **digital** | internet, digital, tecnología, redes, online | `digitalLiteracy`, `digitalAccessScore` |
| **social** | social, comunidad, familia, vecino, sociedad | `socialDesirability`, `opennessChange` |
| **generic** | (default) | `patience`, `consistencyScore` |

### Variables Usadas por Dimensión

#### Profile (Demográficas)
- ✅ `incomeDecile` - Factor base (peso 0.5)
- ✅ `educationLevel` - Mapeado a valores 0-100 (peso 0.3)
- ✅ `age` - Ajuste por edad (peso 0.2)
- ✅ `digitalAccessScore` - Para categoría digital (peso 0.2)
- ✅ `weight` - Usado en agregación ponderada

#### Traits (Psicológicas)
- ✅ `ideologyScore` - Para preguntas políticas (peso 0.4)
- ✅ `civicInterest` - Para políticas (peso 0.1)
- ✅ `riskAversion` - Para económicas (peso 0.3)
- ✅ `institutionalTrust` - Para confianza (peso 0.5)
- ✅ `digitalLiteracy` - Para digitales (peso 0.4)
- ✅ `socialDesirability` - Para sociales (peso 0.2)
- ✅ `opennessChange` - Para sociales (peso 0.2)
- ✅ `patience` - Para genéricas (peso 0.1)

#### State (Dinámico)
- ✅ `fatigue` - Afecta todas las categorías (peso 0.15)
- ✅ `mood` - Afecta todas (positive: +10, neutral: 0, negative: -10, stressed: -15)
- ✅ `surveySaturation` - Afecta todas (peso 0.1)
- ✅ `economicStress` - Para económicas (peso 0.4)

#### Events (Contexto)
- ✅ `exposureLevel` - Solo si > 50
- ✅ `moodImpact` - Multiplicado por stance
- ✅ `interpretedStance` - positive/negative/neutral

## Cálculo del Score Latente

```typescript
score = 50  // Punto de partida neutral

// Factores demográficos
+ (incomeDecile - 5) * 0.5
+ (educationValue - 50) * 0.3
+ (age - 40) * 0.2

// Factores de traits (categoría-dependiente)
+ (traitValue - 50) * weight

// Factores de estado
+ (50 - fatigue) * 0.15
+ moodValue
+ (5 - surveySaturation) * 2

// Influencia de eventos
+ Σ(event.moodImpact * stanceMultiplier * 0.3)

// Clamp a 0-100
score = clamp(score, 0, 100)
```

## Trazabilidad Completa

Cada respuesta guarda metadata completa:

```typescript
interface ResponseTraceability {
  engine_version: string;      // "2.0.0"
  rng_seed: string;            // "agentId-questionId"
  factors_used: ResponseFactor[];  // Lista de factores con contribuciones
  computed_score: number;      // Score latente 0-100
  confidence: number;          // 0-1 basado en varianza de factores
  selected_option: string | number | boolean;
  event_influences: EventInfluence[];
  question_category: QuestionCategory;
  method: 'rule_based_v2';
}

interface ResponseFactor {
  name: string;        // ej: "ideology_score"
  value: number;       // ej: 75
  weight: number;      // ej: 0.4
  contribution: number; // ej: 10 (valor añadido al score)
}

interface EventInfluence {
  event_id: string;
  event_title: string;
  impact: number;      // -100 a 100
  stance: string;      // "positive" | "negative" | "neutral"
}
```

## Agregación Ponderada

### Funciones Disponibles

1. **`calculateWeightedSurveyStats()`**
   - Total de respuestas ponderado
   - Peso total de la muestra
   - Estadísticas por pregunta ponderadas
   - Tiempo de respuesta promedio ponderado

2. **`aggregateWeightedScaleResponses()`**
   - Media simple y ponderada
   - Mediana simple y ponderada
   - Distribución de frecuencias (simple y ponderada)

### Uso del Peso Muestral

```typescript
// Cada agente tiene profile.weight
// Las estadísticas ponderadas usan:
weightedMean = Σ(value * weight) / Σ(weight)

// Ejemplo:
// Agente A: valor=7, weight=1.5
// Agente B: valor=3, weight=0.8
// Media simple: (7+3)/2 = 5
// Media ponderada: (7*1.5 + 3*0.8)/(1.5+0.8) = 5.61
```

## Generadores de Respuesta por Tipo

### Scale (Escala Numérica)
- Mapea score (0-100) al rango de la escala
- Añade variación aleatoria configurable
- Devuelve valor + label

### Single Choice
- Mapea score a índice de opción
- Score bajo = opciones tempranas (negativas)
- Score alto = opciones tardías (positivas)

### Boolean
- Threshold en 50
- Score >= 50 → "Sí"
- Score < 50 → "No"
- Confianza basada en distancia al threshold

### Text
- Templates por categoría y sentimiento
- Sentimiento determinado por score:
  - > 60: positive
  - < 40: negative
  - 40-60: neutral
- Añade contexto demográfico (edad)

### Multiple Choice
- Score determina número de selecciones
- Score alto = más selecciones
- Score determina bias de selección (inicio/fin de lista)

## Hook useSurveyExecutionV2

```typescript
const {
  isExecuting,
  progress,
  result,
  error,
  execute,
  abort,
  getWeightedStats,
  getWeightedScaleStats,
} = useSurveyExecutionV2();

// Ejecutar encuesta
const result = await execute(survey, questions, agents, {
  batchSize: 10,
  delayMs: 50,
});

// Obtener estadísticas ponderadas
const stats = getWeightedStats(responses, agents);
const scaleStats = getWeightedScaleStats(responses, agents, 1, 7);
```

## Comparación V1 vs V2

| Aspecto | V1 | V2 |
|---------|-----|-----|
| **Variables usadas** | ~5% (solo income, education) | ~80% (profile, traits, state, events) |
| **Aleatoriedad** | Principal motor | Variación menor (10%) |
| **Categorías** | Ninguna | 6 categorías con reglas específicas |
| **Trazabilidad** | Básica (método, timestamp) | Completa (factors, score, confidence, events) |
| **Agregación** | Simple | Ponderada por weight |
| **Respuestas text** | 5 genéricas | Templates contextuales por categoría |
| **Eventos** | Ignorados | Integrados en score |
| **Reproducibilidad** | Parcial | Completa (seed determinístico) |

## Limitaciones Restantes Antes de Benchmark

### Limitaciones Conocidas

1. **Eventos**: Se usan los eventos del agente pero no se valida que sean relevantes para la pregunta específica
2. **Texto**: Las respuestas de texto son templates, no generación real de lenguaje
3. **Categorización**: Es basada en palabras clave, podría necesitar clasificación manual para precisión
4. **Pesos de traits**: Los pesos son heurísticos, no calibrados contra datos reales
5. **Interacciones**: No hay interacciones entre variables (ej: age × education)

### Recomendaciones para Benchmark

1. **Validar categorización** de preguntas contra expertos
2. **Calibrar pesos** de traits usando datos de encuestas reales
3. **Validar distribuciones** de respuestas por segmento demográfico
4. **Probar con eventos** específicos para ver impacto
5. **Comparar medias ponderadas** vs no ponderadas

## Uso Recomendado

```typescript
import { useSurveyExecutionV2 } from '../hooks/useSurveyExecutionV2';
import { useAgents } from '../hooks/useAgents'; // Necesita FullAgent

function SurveyExecutor() {
  const { execute, isExecuting, progress, result } = useSurveyExecutionV2();
  const { agents } = useAgents(); // Debe devolver FullAgent[]

  const handleExecute = async () => {
    const result = await execute(survey, questions, agents, {
      batchSize: 10,
      delayMs: 50,
      randomVariation: 0.1, // 10% variación aleatoria
    });

    if (result) {
      console.log('Weighted stats:', result.weightedStats);
      console.log('Total responses:', result.totalResponses);
    }
  };

  return (
    <div>
      {progress && (
        <div>
          Question {progress.currentQuestion}/{progress.totalQuestions}
          Agent {progress.currentAgent}/{progress.totalAgents}
        </div>
      )}
      <button onClick={handleExecute} disabled={isExecuting}>
        Execute Survey
      </button>
    </div>
  );
}
```

## Notas de Implementación

- El engine V2 es **backwards compatible** con la estructura de datos existente
- Las respuestas se guardan en el mismo formato que V1
- La trazabilidad se guarda en `metadata_json`
- El engine V1 sigue disponible en `src/lib/surveyEngine.ts` para referencia

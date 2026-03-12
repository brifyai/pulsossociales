# Implementación de Visualización de Resultados de Encuestas

## Resumen

Se ha implementado un sistema completo para la visualización de resultados de encuestas con capacidad de comparación contra benchmarks.

## Componentes Creados

### 1. SurveyResultsPanel (`src/components/SurveyResultsPanel.tsx`)
Panel principal para visualizar resultados agregados de encuestas.

**Características:**
- Visualización de resultados por pregunta
- Comparación con benchmarks
- Indicador de similitud global
- Exportación a CSV
- Soporte para múltiples tipos de respuestas (escala, opción múltiple, booleano)

**Props:**
```typescript
interface SurveyResultsPanelProps {
  results: AggregatedResult[];
  comparisons: BenchmarkComparison[];
  benchmarks: SurveyBenchmark[];
  selectedBenchmarkId: string | null;
  onSelectBenchmark: (id: string | null) => void;
  onLoadSampleBenchmarks: () => void;
  overallSimilarity: number;
}
```

### 2. SurveyResultsView (`src/components/SurveyResultsView.tsx`)
Vista standalone para visualizar resultados de una encuesta específica.

**Características:**
- Selector de ejecuciones (runs)
- Integración con hooks existentes
- Carga automática de respuestas
- Soporte para múltiples territorios

**Props:**
```typescript
interface SurveyResultsViewProps {
  surveyId: string;
  territoryId?: string;
  agents: FullAgent[];
}
```

### 3. SurveyPanel Actualizado (`src/components/SurveyPanel.tsx`)
Panel simplificado para ejecución de encuestas.

**Características:**
- Lista de encuestas disponibles
- Vista previa de preguntas
- Ejecución de encuestas
- Historial de ejecuciones

## Hooks Creados

### useSurveyResults (`src/hooks/useSurveyResults.ts`)
Hook para agregar y comparar resultados de encuestas.

**Retorna:**
```typescript
{
  aggregatedResults: AggregatedResult[];
  comparisons: BenchmarkComparison[];
  benchmarks: SurveyBenchmark[];
  selectedBenchmarkId: string | null;
  setSelectedBenchmarkId: (id: string | null) => void;
  loadSampleBenchmarks: () => void;
  overallSimilarity: number;
  isLoading: boolean;
}
```

## Utilidades

### surveyResultsAggregator (`src/lib/surveyResultsAggregator.ts`)
Funciones para agregar resultados de encuestas:
- `aggregateQuestionResults()` - Agrega resultados por pregunta
- `compareWithBenchmark()` - Compara resultados con benchmark
- `formatPercentage()` - Formatea porcentajes
- `formatNumber()` - Formatea números
- `getSimilarityColor()` - Obtiene color según similitud
- `getErrorColor()` - Obtiene color según error

### surveyBenchmark (`src/lib/surveyBenchmark.ts`)
Sistema de gestión de benchmarks:
- `createBenchmark()` - Crea un nuevo benchmark
- `addBenchmarkDataPoint()` - Agrega punto de datos
- `getBenchmark()` - Obtiene benchmark por ID
- `getBenchmarksForSurvey()` - Obtiene benchmarks de una encuesta
- `initializeSampleBenchmarks()` - Inicializa benchmarks de ejemplo
- `loadBenchmarkFromJSON()` - Carga benchmark desde JSON
- `exportBenchmarkToJSON()` - Exporta benchmark a JSON

## Tipos Extendidos

Se agregaron los siguientes tipos a `src/types/survey.ts`:

```typescript
interface AggregatedResult {
  questionId: string;
  questionText: string;
  answerType: string;
  totalResponses: number;
  scale?: { average: number; median: number; stdDev: number; min: number; max: number };
  multipleChoice?: { [option: string]: number };
  boolean?: { true: number; false: number };
  demographicBreakdown: { [key: string]: { [value: string]: number } };
}

interface SurveyBenchmark {
  id: string;
  surveyId: string;
  name: string;
  description?: string;
  source: 'casen' | 'ene' | 'custom';
  year: number;
  territoryId?: string;
  demographicFilters?: { [key: string]: string };
  createdAt: string;
  updatedAt: string;
}

interface BenchmarkComparison {
  questionId: string;
  benchmarkId: string;
  similarityScore: number;
  differences: { [key: string]: number };
}
```

## Uso

### Visualizar Resultados

```tsx
import { SurveyResultsView } from './components/surveys';

function ResultsPage() {
  return (
    <SurveyResultsView
      surveyId="survey-123"
      territoryId="region-metropolitana"
      agents={fullAgents}
    />
  );
}
```

### Usar el Hook Directamente

```tsx
import { useSurveyResults } from './hooks/useSurveyResults';

function CustomResultsView({ surveyId, questions, responses, agents }) {
  const {
    aggregatedResults,
    comparisons,
    benchmarks,
    overallSimilarity,
  } = useSurveyResults({
    surveyId,
    questions,
    responses,
    agents,
  });

  // Renderizar resultados...
}
```

### Exportar a CSV

```tsx
import { exportToCSV } from './components/surveys';

const csv = exportToCSV(results, comparisons);
// Guardar o descargar el CSV...
```

## Integración con Sistema Existente

Los componentes se integran con:
- **useSurveys**: Para obtener encuestas y ejecuciones
- **useAgents**: Para obtener datos demográficos de agentes
- **surveyRepository**: Para cargar respuestas
- **Supabase**: Para persistencia de datos

## Próximos Pasos

1. **Conectar con datos reales**: Actualmente usa datos de ejemplo
2. **Agregar gráficos**: Integrar biblioteca de visualización (Recharts, Chart.js)
3. **Filtros avanzados**: Permitir filtrar por demografía
4. **Comparación temporal**: Comparar resultados entre diferentes ejecuciones
5. **Benchmarks CASEN/ENE**: Cargar datos reales de fuentes oficiales

## Archivos Modificados/Creados

- `src/types/survey.ts` - Tipos extendidos
- `src/lib/surveyResultsAggregator.ts` - Utilidades de agregación
- `src/lib/surveyBenchmark.ts` - Sistema de benchmarks
- `src/hooks/useSurveyResults.ts` - Hook de resultados
- `src/components/SurveyResultsPanel.tsx` - Panel de resultados
- `src/components/SurveyResultsView.tsx` - Vista de resultados
- `src/components/SurveyPanel.tsx` - Panel de encuestas (actualizado)
- `src/components/surveys/index.ts` - Índice de exportaciones
- `docs/SURVEY_RESULTS_IMPLEMENTATION.md` - Este documento

# Integración con Supabase

Este documento describe la arquitectura de integración con Supabase para datos de territorios y agentes.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
├─────────────────────────────────────────────────────────────────┤
│  Components (ChileMapView, RegionSceneView, AgentInspector)    │
│         ↓                                                       │
│  Hooks (useTerritories, useAgents)                             │
│         ↓                                                       │
│  Repositories (territoryRepository, agentRepository)           │
│         ↓                                                       │
│  Supabase Client (src/lib/supabaseClient.ts)                   │
│         ↓                                                       │
│  SUPABASE (PostgreSQL) ── FALLBACK ──> MOCKS                   │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Componentes
Los componentes UI usan hooks para obtener datos:

```tsx
// ChileMapView.tsx
const { regions, loading, error } = useTerritories();

// RegionSceneView.tsx
const { agents, loading, error } = useAgentSummariesByRegion(region.id);

// MapRoot.tsx
const { agent: selectedAgent } = useAgentById(selectedAgentId);
```

### 2. Hooks
Los hooks manejan el estado de carga y errores:

- `useTerritories()` - Obtiene todas las regiones y resumen
- `useRegion(id)` - Obtiene una región específica
- `useAgentSummariesByRegion(regionId)` - Obtiene agentes de una región
- `useAgentById(id)` - Obtiene un agente completo
- `useAllAgentSummaries()` - Obtiene todos los agentes

### 3. Repositories
Los repositorios implementan la lógica de acceso a datos:

- `territoryRepository.ts` - Queries de territorios
- `agentRepository.ts` - Queries de agentes

Cada repositorio:
1. Intenta leer de Supabase
2. Si falla o no está configurado, usa mocks
3. Mapea datos de Supabase al formato del frontend

### 4. Cliente Supabase
El cliente (`src/lib/supabaseClient.ts`) es un singleton que:
- Lee credenciales de variables de entorno
- Valida configuración
- Provee manejo de errores

## Configuración

### Variables de Entorno

Agregar a `.env.local`:

```bash
# Para desarrollo local con Docker
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para producción (Supabase Cloud)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Fallback Automático

Si las variables no están configuradas, el sistema:
1. Muestra advertencia en consola
2. Usa automáticamente los mocks
3. La aplicación funciona sin cambios

## Archivos Creados

### Cliente
- `src/lib/supabaseClient.ts` - Cliente singleton de Supabase

### Repositorios
- `src/repositories/territoryRepository.ts` - Acceso a datos de territorios
- `src/repositories/agentRepository.ts` - Acceso a datos de agentes
- `src/repositories/eventRepository.ts` - Acceso a datos de eventos

### Hooks
- `src/hooks/useTerritories.ts` - Hooks para territorios
- `src/hooks/useAgents.ts` - Hooks para agentes
- `src/hooks/useEvents.ts` - Hooks para eventos

### Tipos
- `src/types/supabase.ts` - Tipos de Supabase (tablas, vistas, enums)
- `src/types/event.ts` - Tipos de eventos para el frontend
- `src/types/territory.ts` - Tipos de territorios para el frontend
- `src/types/agent.ts` - Tipos de agentes para el frontend

## Componentes Actualizados

- `src/components/ChileMapView.tsx` - Ahora usa `useTerritories()` y `useTerritoryEvents()`
- `src/components/RegionSceneView.tsx` - Ahora usa `useAgentSummariesByRegion()`
- `src/components/MapRoot.tsx` - Ahora usa `useAgentById()`
- `src/components/AgentInspectorPanel.tsx` - Ahora usa `useAgentEventsForDisplay()`

## Hooks de Eventos

Los hooks de eventos proporcionan acceso a datos de eventos sociales:

```tsx
// Obtener eventos de un territorio
const { events, loading, error } = useEventsByTerritory('metropolitana');

// Obtener exposiciones de eventos de un agente
const { exposures, loading } = useAgentEventExposures('agent-123');

// Obtener estadísticas de eventos de un territorio
const { stats, loading } = useTerritoryEventStats('metropolitana');

// Obtener eventos formateados para display
const { events, loading } = useEventsForDisplay('metropolitana');

// Obtener eventos de agente formateados para display
const { events, loading } = useAgentEventsForDisplay('agent-123');
```

## Mocks

Los mocks existentes se mantienen como fallback:
- `src/mocks/territories.ts` - Datos de regiones de Chile
- `src/mocks/agents.ts` - Datos de agentes sintéticos

## Migración de Datos

Para migrar los mocks a Supabase:

```typescript
import { syncMockTerritoriesToSupabase } from './repositories/territoryRepository';

// Sincronizar territorios
const result = await syncMockTerritoriesToSupabase();
console.log(`Insertados: ${result.inserted}, Errores: ${result.errors.length}`);
```

## Vistas de Supabase

El sistema usa estas vistas:

### Agentes
- `agent_summaries` - Resumen de agentes (para listas)
- `full_agents` - Agente completo con perfil, traits y estado

### Eventos
- `event_summaries` - Resumen de eventos con conteos de exposición
- `full_event_exposures` - Exposiciones de eventos con detalles del evento
- `territory_events` - Eventos agregados por territorio

## Tablas Principales

### Territorios y Agentes
- `territories` - Regiones y comunas de Chile
- `synthetic_agents` - Agentes sintéticos
- `agent_profiles` - Perfiles demográficos
- `agent_traits` - Rasgos psicológicos
- `agent_memories` - Memorias y posiciones
- `agent_states` - Estados dinámicos
- `runtime_bindings` - Vinculación con Convex

### Eventos
- `events` - Eventos sociales y noticias
- `agent_event_exposures` - Relación agente-evento con interpretación

## Funciones RPC

Funciones almacenadas para queries complejas:

- `get_agent_events(agent_uuid)` - Obtiene eventos de un agente
- `get_territory_recent_events(territory_uuid, days_back)` - Obtiene eventos recientes de un territorio

## Notas

- Convex sigue manejando el runtime de AI Town
- Supabase maneja datos estructurados de territorios y agentes
- La arquitectura permite cambiar la fuente de datos sin modificar componentes

## Encuestas (Nuevo)

El sistema ahora incluye soporte para encuestas con agentes sintéticos.

### Tablas de Encuestas

- `surveys` - Definición de encuestas
- `survey_questions` - Preguntas de las encuestas
- `survey_runs` - Ejecuciones de encuestas
- `survey_responses` - Respuestas de agentes

### Tipos de Preguntas Soportados

- `single_choice` - Selección única
- `multiple_choice` - Selección múltiple
- `scale` - Escala (ej: 1-7)
- `text` - Respuesta libre
- `number` - Valor numérico
- `boolean` - Sí/No

### Hooks de Encuestas

```tsx
// Obtener todas las encuestas
const { surveys, loading } = useSurveys();

// Obtener una encuesta específica con preguntas
const { survey, questions, loading } = useSurvey(surveyId);

// Obtener runs de una encuesta
const { runs, createRun, loading } = useSurveyRuns(surveyId);
```

### Componente SurveyPanel

```tsx
import { SurveyPanel } from './components/SurveyPanel';

// En tu componente padre
<SurveyPanel territoryId="metropolitana" />
```

### Survey Engine

El `SurveyEngine` en `src/lib/surveyEngine.ts` proporciona:

- Generación de respuestas basada en reglas (usando perfil del agente)
- Soporte para generación con LLM (placeholder)
- Procesamiento por lotes con callbacks de progreso
- Estadísticas de respuestas

```typescript
import { SurveyEngine, createExecutionConfig } from './lib/surveyEngine';

const engine = new SurveyEngine({
  useLLM: false,
  useRules: true,
  batchSize: 10,
  delayMs: 100,
  onProgress: (progress) => console.log(progress.message),
  onComplete: (result) => console.log('Completed!', result),
});

await engine.execute(survey, questions, agents, run);
```

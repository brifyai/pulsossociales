# Backend Estructural Supabase

## Resumen

Implementación inicial del backend estructural en Supabase para el proyecto Pulso Social. Esta capa almacena la fuente de verdad estructural de agentes sintéticos, territorios y sus relaciones.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Supabase    │  │   Convex     │  │   Composed   │      │
│  │  (Read)      │  │  (Runtime)   │  │   Views      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Supabase   │     │    Convex    │     │   Bridge     │
│ (Postgres)   │◄────│   (Runtime)  │────►│  (Binding)   │
│  Estructural │     │   Tiempo Real│     │  Sync Queue  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Estructura de Archivos

```
supabase/
├── migrations/
│   └── 001_init.sql          # Migración inicial con todas las tablas
├── seeds/
│   └── 001_seed_minimal.sql  # Datos de prueba (3 territorios, 10 agentes)
└── README.md                 # Este archivo

src/types/
└── supabase.ts               # Tipos TypeScript para mapeo frontend
```

## Tablas Creadas

### 1. `territories`
Jerarquía territorial de Chile (regiones, comunas futuras).

**Campos clave:**
- `id`: Identificador único ('metropolitana', 'valparaiso')
- `map_x`, `map_y`, `map_radius`: Coordenadas para visualización
- `population_score`, `event_score`, `survey_score`, `result_score`: Scores para UI

### 2. `synthetic_agents`
Registro maestro de agentes sintéticos.

**Campos clave:**
- `id`: UUID interno
- `public_id`: ID expuesto en APIs ('ag_001')
- `status`: Estado del agente (dormant, activating, active, deactivating, archived)
- `region_id`, `commune`: Ubicación territorial
- `weight`: Factor de expansión para representatividad
- `character_sprite`: Referencia al sprite ('f1', 'f2', etc.)

### 3. `agent_profiles`
Características demográficas y socioeconómicas.

**Campos clave:**
- `name`, `sex`, `age`: Demografía básica
- `education_level`, `employment_status`, `income_decile`: Socioeconómico
- `household_size`, `household_type`, `has_children`: Hogar
- `connectivity_type`, `digital_access_score`: Conectividad
- `description`: Descripción generada para UI

### 4. `agent_traits`
Rasgos psicológicos y comportamentales (0-100).

**Campos clave:**
- `institutional_trust`, `risk_aversion`, `digital_literacy`
- `patience`, `civic_interest`, `social_desirability`
- `openness_change`, `ideology_score` (0=left, 100=right)
- `nationalism_score`, `consistency_score`

### 5. `agent_memories`
Memoria estructurada del agente.

**Campos clave:**
- `memory_type`: summary, position, topic, reflection
- `topic`, `content`, `stance`: Contenido de la memoria
- `source`: survey, conversation, event, reflection, manual
- `importance`, `confidence`: Métricas de calidad
- `convex_memory_id`: Referencia a memoria en Convex

### 6. `agent_states`
Estado dinámico del agente.

**Campos clave:**
- `fatigue`, `economic_stress`, `survey_saturation`: Estado emocional
- `mood`: positive, neutral, negative, stressed
- `total_surveys_completed`, `total_surveys_abandoned`: Métricas
- `convex_player_id`: Referencia a player en Convex

### 7. `runtime_bindings`
Puente entre Supabase y Convex.

**Campos clave:**
- `agent_id`: Referencia a synthetic_agents
- `convex_agent_id`, `convex_player_id`, `convex_world_id`: IDs en Convex
- `status`: inactive, activating, active, deactivating, error
- `activation_reason`: survey, event, manual, scheduled

## Vistas Creadas

### `agent_summaries`
Vista resumida para listas y mapas.

```sql
SELECT 
    sa.id, sa.public_id, sa.region_id, sa.commune,
    ap.name, ap.age, ap.sex, ap.description,
    ast.mood, ast.fatigue, ast.survey_saturation,
    rb.status as binding_status, rb.convex_player_id
FROM synthetic_agents sa
LEFT JOIN agent_profiles ap ON sa.id = ap.agent_id
LEFT JOIN agent_states ast ON sa.id = ast.agent_id
LEFT JOIN runtime_bindings rb ON sa.id = rb.agent_id 
    AND rb.status IN ('activating', 'active');
```

### `full_agents`
Vista completa para detalle e inspección.

Incluye todos los campos de agentes, perfiles, rasgos, estados y bindings.

## Seeds Incluidos

### Territorios (3)
- **metropolitana**: Región Metropolitana de Santiago
- **valparaiso**: Región de Valparaíso
- **biobio**: Región del Biobío

### Agentes (10)
Distribuidos entre las 3 regiones:

| ID | Nombre | Región | Perfil |
|----|--------|--------|--------|
| ag_001 | María González | Metropolitana | Profesional, progresista |
| ag_002 | Carlos Rodríguez | Metropolitana | Ejecutivo, conservador |
| ag_003 | Lucía Fernández | Metropolitana | Jubilada, moderada |
| ag_004 | Diego Martínez | Valparaíso | Joven graduado, activista |
| ag_005 | Ana Silva | Valparaíso | Profesora, equilibrada |
| ag_006 | Roberto Soto | Biobío | Técnico industrial |
| ag_007 | Carmen López | Biobío | Ama de casa rural |
| ag_008 | Pedro Catrileo | Biobío | Activista mapuche |
| ag_009 | Elena Rojas | Metropolitana | Ingeniera de software |
| ag_010 | José Muñoz | Valparaíso | Jubilado portuario |

## Instalación

### 1. Crear proyecto en Supabase
```bash
# Opción A: Via CLI de Supabase
supabase login
supabase init

# Opción B: Via dashboard web
# Ir a https://supabase.com/dashboard y crear proyecto
```

### 2. Ejecutar migración
```bash
# Via SQL Editor en el dashboard
# Copiar contenido de migrations/001_init.sql

# O via CLI
supabase db reset
```

### 3. Ejecutar seeds
```bash
# Via SQL Editor
# Copiar contenido de seeds/001_seed_minimal.sql
```

### 4. Configurar variables de entorno
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Uso desde el Frontend

### Ejemplo: Obtener territorios
```typescript
import { createClient } from '@supabase/supabase-js';
import { Territory } from '../types/supabase';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Obtener todas las regiones
const { data: territories } = await supabase
  .from('territories')
  .select('*')
  .eq('level', 'region');
```

### Ejemplo: Obtener agentes de una región
```typescript
import { AgentSummary } from '../types/supabase';

const { data: agents } = await supabase
  .from('agent_summaries')
  .select('*')
  .eq('region_id', 'metropolitana');
```

### Ejemplo: Obtener agente completo
```typescript
import { FullAgentView } from '../types/supabase';

const { data: agent } = await supabase
  .from('full_agents')
  .select('*')
  .eq('agent_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11')
  .single();
```

## Decisiones de Diseño

### 1. Separación de Responsabilidades
- **Supabase**: Datos estructurales, históricos, analíticos
- **Convex**: Runtime, estado transitorio, tiempo real
- **Frontend**: Composición de vistas, caché local

### 2. Modelo de Agente Dual
Cada agente existe en dos planos:
- **Estructural (Supabase)**: Quién es el agente (perfil, rasgos, historial)
- **Runtime (Convex)**: Qué está haciendo ahora (posición, conversación)

### 3. Estados del Agente
```
DORMIDO → ACTIVANDO → ACTIVO → DESACTIVANDO → DORMIDO
   ↑___________________________________________|
```

### 4. Convenciones de Nomenclatura
- Tablas: snake_case, plural (`synthetic_agents`)
- Columnas: snake_case (`created_at`)
- Tipos TypeScript: PascalCase (`SyntheticAgent`)
- IDs públicos: prefijo + número (`ag_001`)

### 5. Tipos de Datos
- IDs internos: UUID (`gen_random_uuid()`)
- Timestamps: TIMESTAMPTZ con zona horaria
- Scores: INTEGER con CHECK constraints (0-100)
- Enums: TEXT con CHECK constraints

## Discrepancias con DATABASE_SCHEMA.md

| Aspecto | Documento | Implementación | Razón |
|---------|-----------|----------------|-------|
| Tablas de eventos | Incluidas | **✅ Implementadas** | Migración 002_events.sql |
| Tablas de encuestas | Incluidas | **✅ Implementadas** | Migración 003_surveys.sql |
| Tablas de benchmarks | Incluidas | **Excluidas** | Fase posterior |
| `sync_queue` | Incluida | **Excluida** | Fase posterior |
| Territorios | 16 regiones | **3 regiones** | Seeds mínimos |
| Agentes | 100+ | **10 agentes** | Seeds mínimos |

## Migraciones Implementadas

### 001_init.sql - Base de datos inicial
- `territories` - Jerarquía territorial
- `synthetic_agents` - Registro maestro de agentes
- `agent_profiles` - Perfiles demográficos
- `agent_traits` - Rasgos psicológicos
- `agent_memories` - Memoria estructurada
- `agent_states` - Estado dinámico
- `runtime_bindings` - Puente con Convex

### 002_events.sql - Sistema de eventos
- `events` - Catálogo de eventos sociales
- `agent_event_exposures` - Exposiciones de agentes a eventos
- Vistas: `event_summaries`, `full_event_exposures`, `territory_events`

### 003_surveys.sql - Sistema de encuestas
- `surveys` - Definición de encuestas
- `survey_questions` - Preguntas de encuestas
- `survey_runs` - Ejecuciones de encuestas
- `survey_responses` - Respuestas de agentes
- Vistas: `survey_summaries`, `survey_run_summaries`

## Próximos Pasos

### Fase 4: Benchmarks y Calibración
- [ ] Tablas `benchmarks`, `benchmark_results`, `calibration_runs`
- [ ] Carga de benchmarks externos
- [ ] Comparación agentes vs reales
- [ ] Calibración automática de agentes

### Fase 5: Optimización
- [ ] Tabla `sync_queue` para cola de cambios
- [ ] Sincronización de memoria desde Convex
- [ ] Actualización de estado post-encuesta
- [ ] Índices y vistas materializadas

## Componentes de Encuestas

### Survey Engine
El `SurveyEngine` en `src/lib/surveyEngine.ts` proporciona:
- Generación de respuestas basada en reglas (usando perfil del agente)
- Soporte para generación con LLM (placeholder)
- Procesamiento por lotes con callbacks de progreso
- Estadísticas de respuestas

### Hooks de Encuestas
- `useSurveys()` - Obtener todas las encuestas
- `useSurvey(id)` - Obtener una encuesta con preguntas
- `useSurveyRuns(surveyId)` - Obtener runs de una encuesta

### Componente SurveyPanel
```tsx
import { SurveyPanel } from './components/SurveyPanel';

<SurveyPanel territoryId="metropolitana" />
```

### Tipos de Preguntas Soportados
- `single_choice` - Selección única
- `multiple_choice` - Selección múltiple
- `scale` - Escala (ej: 1-7)
- `text` - Respuesta libre
- `number` - Valor numérico
- `boolean` - Sí/No

## Notas de Implementación

### Convex Intacto
- No se modificó ningún archivo de Convex
- Los agentes en Convex continúan funcionando normalmente
- El binding se hará en fase posterior

### Compatibilidad
- Los mocks (`src/mocks/agents.ts`, `src/mocks/territories.ts`) siguen funcionando
- El frontend puede migrar gradualmente de mocks a Supabase
- Las vistas (`agent_summaries`, `full_agents`) facilitan la transición

### Seguridad
- RLS habilitado en todas las tablas
- Políticas de lectura para usuarios autenticados
- Políticas de escritura pendientes (fase de activación)

## Referencias

- [DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) - Diseño completo del schema
- [CONVEX_SUPABASE_COEXISTENCE.md](../docs/CONVEX_SUPABASE_COEXISTENCE.md) - Estrategia de coexistencia
- [src/types/supabase.ts](../src/types/supabase.ts) - Tipos TypeScript

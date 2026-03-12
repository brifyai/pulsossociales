# Auditoría de Cobertura de Supabase

## 1. Tablas que YA Existen Realmente en Supabase

### Migración 001_init.sql (Estructura Base)

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| `territories` | ✅ Implementada | Jerarquía territorial de Chile |
| `synthetic_agents` | ✅ Implementada | Registro maestro de agentes |
| `agent_profiles` | ✅ Implementada | Características demográficas |
| `agent_traits` | ✅ Implementada | Rasgos psicológicos |
| `agent_memories` | ✅ Implementada | Memoria estructurada |
| `agent_states` | ✅ Implementada | Estado dinámico |
| `runtime_bindings` | ✅ Implementada | Puente con Convex |

### Migración 002_events.sql (Sistema de Eventos)

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| `events` | ✅ Implementada | Eventos del mundo real |
| `agent_event_exposures` | ✅ Implementada | Exposición de agentes a eventes |

**✅ BUG CORREGIDO:** La migración ahora usa correctamente `synthetic_agents` en lugar de `agents`.

### Migración 003_surveys.sql (Sistema de Encuestas)

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| `surveys` | ✅ Implementada | Definiciones de encuestas |
| `survey_questions` | ✅ Implementada | Preguntas individuales |
| `survey_runs` | ✅ Implementada | Ejecuciones de encuestas |
| `survey_responses` | ✅ Implementada | Respuestas de agentes |

### Vistas Implementadas

| Vista | Fuente | Estado |
|-------|--------|--------|
| `agent_summaries` | 001_init.sql | ✅ |
| `full_agents` | 001_init.sql | ✅ |
| `event_summaries` | 002_events.sql | ✅ |
| `full_event_exposures` | 002_events.sql | ✅ |
| `territory_events` | 002_events.sql | ✅ |
| `active_surveys` | 003_surveys.sql | ✅ |
| `survey_run_summary` | 003_surveys.sql | ✅ |
| `survey_results` | 003_surveys.sql | ✅ |

### Funciones Implementadas

| Función | Fuente | Estado |
|---------|--------|--------|
| `update_updated_at_column()` | 001_init.sql | ✅ |
| `get_agent_events(agent_uuid TEXT)` | 002_events.sql | ✅ |
| `get_territory_recent_events(territory_uuid TEXT, days_back INTEGER)` | 002_events.sql | ✅ |
| `get_survey_with_questions(survey_uuid UUID)` | 003_surveys.sql | ✅ |
| `get_run_responses(run_uuid UUID)` | 003_surveys.sql | ✅ |

---

## 2. Entidades del Producto que YA Existen en Código

### Core Entities (Dominio Principal)

| Entidad | Archivo Principal | Estado en Código |
|---------|-------------------|------------------|
| **Territories** | `src/types/territory.ts` | ✅ Completo |
| **Agents** | `src/types/agent.ts` | ✅ Completo |
| **Events** | `src/types/event.ts` | ✅ Completo |
| **Surveys** | `src/types/survey.ts` | ✅ Completo |

### Sub-entidades de Agentes

| Entidad | Archivo | Estado |
|---------|---------|--------|
| AgentProfile | `src/types/agent.ts` | ✅ |
| AgentTraits | `src/types/agent.ts` | ✅ |
| AgentMemory | `src/types/agent.ts` | ✅ |
| AgentState | `src/types/agent.ts` | ✅ |
| AgentEventExposure | `src/types/agent.ts` | ✅ |

### Sistema de Encuestas

| Entidad | Archivo | Estado |
|---------|---------|--------|
| Survey | `src/types/survey.ts` | ✅ |
| SurveyQuestion | `src/types/survey.ts` | ✅ |
| SurveyRun | `src/types/survey.ts` | ✅ |
| SurveyResponse | `src/types/survey.ts` | ✅ |
| AggregatedResult | `src/types/survey.ts` | ✅ |

### Benchmark y Validación

| Entidad | Archivo | Estado |
|---------|---------|--------|
| SurveyBenchmark | `src/types/survey.ts` | ✅ Solo en código/localStorage |
| BenchmarkDataPoint | `src/types/survey.ts` | ✅ Solo en código/localStorage |
| BenchmarkComparison | `src/types/survey.ts` | ✅ Solo en código |
| ValidationConfig | `src/lib/validationSurvey.ts` | ✅ Solo en código |

### Engine y Procesamiento

| Componente | Archivo | Estado |
|------------|---------|--------|
| SurveyEngineV2 | `src/lib/surveyEngineV2.ts` | ✅ Completo (~800 líneas) |
| SurveyResultsAggregator | `src/lib/surveyResultsAggregator.ts` | ✅ Completo |
| ValidationRunner | `src/lib/validationRunner.ts` | ⚠️ Simulación, no motor real |

---

## 3. Mapeo Entre Entidades del Producto y Tablas Reales

### ✅ Territories - COMPLETAMENTE MAPEADO

| Campo Producto | Campo Supabase | Tabla | Estado |
|----------------|----------------|-------|--------|
| `id` | `id` | territories | ✅ |
| `name` | `name` | territories | ✅ |
| `type` | `level` | territories | ✅ |
| `parentId` | `parent_id` | territories | ✅ |
| `population` | `population` | territories | ✅ |
| `scores.*` | `*_score` | territories | ✅ |

### ✅ Agents - COMPLETAMENTE MAPEADO

| Campo Producto | Campo Supabase | Tabla | Estado |
|----------------|----------------|-------|--------|
| `profile.id` | `id` / `public_id` | synthetic_agents | ✅ |
| `profile.name` | `name` | agent_profiles | ✅ |
| `profile.regionId` | `region_id` | synthetic_agents | ✅ |
| `profile.age` | `age` | agent_profiles | ✅ |
| `profile.sex` | `sex` | agent_profiles | ✅ |
| `profile.incomeDecile` | `income_decile` | agent_profiles | ✅ |
| `profile.weight` | `weight` | synthetic_agents | ✅ |
| `traits.ideologyScore` | `ideology_score` | agent_traits | ✅ |
| `traits.institutionalTrust` | `institutional_trust` | agent_traits | ✅ |
| `state.fatigue` | `fatigue` | agent_states | ✅ |
| `state.mood` | `mood` | agent_states | ✅ |
| `memory.summary` | `content` (type='summary') | agent_memories | ✅ |

### ✅ Events - COMPLETAMENTE MAPEADO

| Campo Producto | Campo Supabase | Tabla | Estado |
|----------------|----------------|-------|--------|
| `id` | `id` | events | ✅ |
| `title` | `title` | events | ✅ |
| `category` | `category` | events | ✅ |
| `intensity` | `intensity` | events | ✅ |
| `exposure.agentId` | `agent_id` | agent_event_exposures | ✅ |
| `exposure.eventId` | `event_id` | agent_event_exposures | ✅ |
| `exposure.interpretedStance` | `interpreted_stance` | agent_event_exposures | ✅ |

**✅ BUG CORREGIDO:** `agent_id UUID NOT NULL REFERENCES synthetic_agents(id)`

### ✅ Surveys - COMPLETAMENTE MAPEADO

| Campo Producto | Campo Supabase | Tabla | Estado |
|----------------|----------------|-------|--------|
| `id` | `id` | surveys | ✅ |
| `name` | `name` | surveys | ✅ |
| `status` | `status` | surveys | ✅ |
| `questions` | - | survey_questions | ✅ (relación 1:N) |
| `runs` | - | survey_runs | ✅ (relación 1:N) |
| `responses` | - | survey_responses | ✅ (relación 1:N) |

### ❌ Benchmarks - NO MAPEADO A SUPABASE

| Campo Producto | Campo Supabase | Estado |
|----------------|----------------|--------|
| `SurveyBenchmark` | ❌ No existe tabla | Solo localStorage |
| `BenchmarkDataPoint` | ❌ No existe tabla | Solo localStorage |
| `expectedDistribution` | ❌ No existe tabla | Solo localStorage |

**Implementación actual:** `src/lib/surveyBenchmark.ts` usa:
- `Map<string, SurveyBenchmark>` en memoria
- `localStorage` para persistencia
- No hay tabla en Supabase

### ❌ Validación - NO MAPEADO A SUPABASE

| Campo Producto | Campo Supabase | Estado |
|----------------|----------------|--------|
| `ValidationRun` | ❌ No existe tabla | Solo en código |
| `ValidationResult` | ❌ No existe tabla | Solo en código |
| `ComparisonMetrics` | ❌ No existe tabla | Solo en código |

---

## 4. Tablas o Estructuras FALTANTES en Supabase

### 🔴 CRÍTICAS - Necesarias para validación real

| Tabla | Descripción | Justificación |
|-------|-------------|---------------|
| `survey_benchmarks` | Benchmarks de encuestas reales | Necesario para validar contra CEP/CADEM |
| `benchmark_data_points` | Datos específicos por pregunta | Necesario para comparación distribucional |
| `validation_runs` | Ejecuciones de validación | Necesario para trackear validaciones |
| `validation_results` | Resultados de comparación | Necesario para métricas históricas |

### 🟡 IMPORTANTES - Mejorarían el sistema

| Tabla | Descripción | Justificación |
|-------|-------------|---------------|
| `survey_calibration` | Parámetros de calibración | Ajustar pesos de reglas del engine |
| `agent_response_history` | Historial de respuestas por agente | Consistencia temporal |
| `survey_segments` | Definición de segmentos | Análisis por grupos demográficos |

### 🟢 OPCIONALES - Nice to have

| Tabla | Descripción | Justificación |
|-------|-------------|---------------|
| `benchmark_sources` | Metadatos de fuentes (CEP, CADEM) | Normalización de fuentes |
| `validation_metrics` | Métricas históricas de validación | Tendencias de calidad |
| `survey_rules` | Reglas del engine en BD | Configuración dinámica |

---

## 5. Prioridad de Implementación

### 🔴 CRÍTICA - Implementar ANTES de validación real

1. **✅ Corregir bug en 002_events.sql** - **COMPLETADO**
   - Cambiado `agent_id TEXT REFERENCES agents(id)` → `agent_id UUID REFERENCES synthetic_agents(id)`
   - Actualizado seed 002_seed_events.sql para usar `synthetic_agents`

2. **Crear tabla `survey_benchmarks`**
   - Almacenar metadatos de benchmarks (CEP, CADEM, etc.)
   - Relacionar con surveys

3. **Crear tabla `benchmark_data_points`**
   - Almacenar distribuciones esperadas por pregunta
   - Permitir comparación con resultados sintéticos

### 🟡 ALTA - Implementar DESPUÉS de validación básica

4. **Crear tabla `validation_runs`**
   - Trackear ejecuciones de validación
   - Guardar configuración usada

5. **Crear tabla `validation_results`**
   - Guardar métricas de comparación
   - Permitir análisis histórico

6. **Crear tabla `survey_calibration`**
   - Parámetros ajustables del engine
   - Pesos por categoría de pregunta

### 🟢 MEDIA - Implementar en fase de maduración

7. **Vistas de análisis segmentado**
   - Resultados por región/edad/ingreso
   - Comparaciones demográficas

8. **Funciones de agregación avanzada**
   - Cálculo de intervalos de confianza
   - Tests estadísticos

---

## 6. Recomendación Final

### Próximo Bloque a Implementar: **Benchmarks en Supabase**

**Justificación:**
- La validación actual usa localStorage (no es robusto)
- Necesitamos persistencia real para comparar contra CEP/CADEM
- Es prerequisito para validación automática

**Estructura propuesta:**

```sql
-- survey_benchmarks
CREATE TABLE survey_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID REFERENCES surveys(id),
    name TEXT NOT NULL,
    source TEXT NOT NULL, -- 'cep', 'cadem', 'activa'
    source_url TEXT,
    date_collected DATE NOT NULL,
    sample_size INTEGER,
    margin_of_error NUMERIC(4,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- benchmark_data_points
CREATE TABLE benchmark_data_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_id UUID REFERENCES survey_benchmarks(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id),
    question_code TEXT NOT NULL,
    distribution_json JSONB NOT NULL, -- [{value, label, percentage, count}]
    expected_statistics JSONB, -- {mean, median, std_dev}
    sample_size INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migración de datos:**
- Migrar datos de `src/lib/validationBenchmark.ts` (CEP Oct 2024)
- Migrar datos de `src/lib/surveyBenchmark.ts` (samples)

---

## 7. Resumen de Estado

| Componente | Supabase | Código | Sincronizado |
|------------|----------|--------|--------------|
| Territories | ✅ | ✅ | ✅ Sí |
| Agents | ✅ | ✅ | ✅ Sí |
| Events | ✅ | ✅ | ✅ Sí |
| Surveys | ✅ | ✅ | ✅ Sí |
| Benchmarks | ❌ | ✅ | ❌ No |
| Validación | ❌ | ✅ | ❌ No |
| Calibration | ❌ | ✅ | ❌ No |

**Conclusión:** El 80% del modelo de datos está implementado en Supabase. Los componentes críticos faltantes son **benchmarks** y **validación**, que actualmente viven solo en código/localStorage.

**Acción inmediata recomendada:**
1. ✅ Corregir el bug de tipos en `002_events.sql` - **COMPLETADO**
2. Crear migración para tablas de benchmarks
3. Migrar datos CEP existentes a Supabase

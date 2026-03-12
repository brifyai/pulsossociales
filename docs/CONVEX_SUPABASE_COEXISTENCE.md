# Estrategia de convivencia Convex + Supabase

## 1. Principio general

**Convex sigue siendo el runtime del mundo. Supabase es la fuente de verdad estructural.**

- **NO** eliminar tablas de Convex en esta etapa
- **NO** modificar el engine de simulación
- **NO** cambiar la lógica de agentes/conversaciones
- **SÍ** agregar capa de binding/puente donde sea necesario
- **SÍ** migrar datos de descripción/perfil a Supabase gradualmente

El objetivo es que el juego siga funcionando exactamente igual, pero con la capacidad de:
1. Persistir datos estructurales en Supabase
2. Activar/desactivar agentes según necesidad
3. Consultar perfiles desde Supabase en lugar de mocks

---

## 2. Tablas actuales de Convex clasificadas

### 2.1 Tablas del motor de juego (NO TOCAR)

| Tabla | Propósito | Clasificación | Riesgo de modificación |
|-------|-----------|---------------|------------------------|
| `worlds` | Estado del mundo (players, conversations, agents) | **MANTENER INTACTA** | CRÍTICO - Rompe el engine |
| `worldStatus` | Estado de ejecución (running/stopped) | **MANTENER INTACTA** | CRÍTICO - Control del mundo |
| `maps` | Datos del mapa (tilemap, colisiones) | **MANTENER INTACTA** | CRÍTICO - Navegación |
| `inputs` | Cola de inputs del engine | **MANTENER INTACTA** | CRÍTICO - Game loop |
| `engines` | Estado de los engines | **MANTENER INTACTA** | CRÍTICO - Simulación |

**Nota**: Estas tablas son el corazón del runtime. Cualquier cambio rompe la simulación.

### 2.2 Tablas de descripción (ADAPTAR A FUTURO)

| Tabla | Propósito actual | Clasificación | Equivalente Supabase |
|-------|------------------|---------------|---------------------|
| `playerDescriptions` | Nombre, personaje, descripción del player | **ADAPTAR A FUTURO** | `agent_profiles` (parcial) |
| `agentDescriptions` | Descripción del agente para LLM | **ADAPTAR A FUTURO** | `agent_profiles` + `agent_memories` |

**Estrategia**: Mantener por ahora, pero la descripción generada debe venir de Supabase en el futuro.

### 2.3 Tablas de archivo (MANTENER, CONSIDERAR OBSOLETA)

| Tabla | Propósito | Clasificación | Notas |
|-------|-----------|---------------|-------|
| `archivedPlayers` | Players que salieron del juego | **MANTENER, OBSOLETA A FUTURO** | Reemplazable por `agent_states` en Supabase |
| `archivedConversations` | Conversaciones terminadas | **MANTENER, OBSOLETA A FUTURO** | Reemplazable por tabla de conversaciones en Supabase |
| `archivedAgents` | Agents archivados | **MANTENER, OBSOLETA A FUTURO** | Reemplazable por `synthetic_agents` con status='archived' |

**Estrategia**: Mantener por compatibilidad, pero no agregar más lógica de archivo. En el futuro, el "archivo" es desactivar en Convex y marcar en Supabase.

### 2.4 Tablas de memoria y conversación (MANTENER Y EXTENDER)

| Tabla | Propósito | Clasificación | Notas |
|-------|-----------|---------------|-------|
| `memories` | Memoria semántica de agentes | **MANTENER Y EXTENDER** | Agregar referencia a Supabase |
| `memoryEmbeddings` | Embeddings para búsqueda vectorial | **MANTENER INTACTA** | Solo Convex, no se migra |
| `messages` | Mensajes de conversaciones | **MANTENER Y EXTENDER** | Agregar sync a Supabase |
| `participatedTogether` | Grafo de interacciones | **MANTENER INTACTA** | Runtime only |

**Estrategia**: Mantener funcionamiento actual, agregar sincronización opcional a Supabase.

### 2.5 Tablas auxiliares (MANTENER)

| Tabla | Propósito | Clasificación |
|-------|-----------|---------------|
| `embeddingsCache` | Cache de embeddings | **MANTENER INTACTA** |
| `music` | Configuración de música | **MANTENER INTACTA** |

---

## 3. Tablas que deben mantenerse intactas por ahora

### Lista de NO TOCAR (riesgo CRÍTICO)

```
❌ worlds
❌ worldStatus
❌ maps
❌ inputs
❌ engines
❌ memoryEmbeddings
❌ participatedTogether
❌ embeddingsCache
```

**Razón**: Son el motor de simulación. Cualquier cambio rompe el juego.

### Lista de NO ELIMINAR (riesgo ALTO)

```
⚠️ playerDescriptions
⚠️ agentDescriptions
⚠️ archivedPlayers
⚠️ archivedConversations
⚠️ archivedAgents
⚠️ memories
⚠️ messages
```

**Razón**: Se usan activamente. Se pueden adaptar pero no eliminar.

---

## 4. Tablas que podrían adaptarse en el futuro

### 4.1 playerDescriptions → agent_profiles (parcial)

**Actual en Convex:**
```typescript
playerDescriptions: {
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  name: v.string(),
  character: v.string(),
  description: v.string(),
}
```

**Futuro:**
- `name`, `character` → siguen en Convex (runtime)
- `description` → viene de Supabase `agent_profiles.description`
- Datos demográficos → Supabase `agent_profiles`

**Adaptación:**
```typescript
// En el futuro, cuando se crea un player:
// 1. Crear player en Convex (name, character)
// 2. Buscar/crear agent en Supabase
// 3. La descripción se carga desde Supabase
```

### 4.2 agentDescriptions → agent_profiles + agent_memories

**Actual en Convex:**
```typescript
agentDescriptions: {
  worldId: v.id('worlds'),
  agentId: v.id('agents'),
  name: v.string(),
  character: v.string(),
  description: v.string(), // Prompt para LLM
}
```

**Futuro:**
- `name`, `character` → Convex
- `description` → generada desde Supabase (`agent_profiles` + `agent_traits` + `agent_memories`)

### 4.3 memories → Dual (Convex + Supabase)

**Actual:** Solo Convex, memoria semántica con embeddings.

**Futuro:**
- Convex: `memories` + `memoryEmbeddings` (runtime, búsqueda rápida)
- Supabase: `agent_memories` (persistencia, análisis)
- Sincronización: Resúmenes de memoria se guardan en Supabase

---

## 5. Posibles tablas puente nuevas en Convex

### Opción A: Agregar campos a tablas existentes (RECOMENDADA)

En lugar de crear tablas nuevas, agregar campos opcionales a tablas existentes:

```typescript
// En playerDescriptions, agregar:
playerDescriptions: defineTable({
  worldId: v.id('worlds'),
  playerId: v.id('players'),
  name: v.string(),
  character: v.string(),
  description: v.string(),
  // NUEVO: Referencia a Supabase
  supabaseAgentId: v.optional(v.string()), // UUID de synthetic_agents
})
```

```typescript
// En agentDescriptions, agregar:
agentDescriptions: defineTable({
  worldId: v.id('worlds'),
  agentId: v.id('agents'),
  name: v.string(),
  character: v.string(),
  description: v.string(),
  // NUEVO: Referencia a Supabase
  supabaseAgentId: v.optional(v.string()),
})
```

```typescript
// En memories, agregar:
memories: defineTable({
  ...memoryFields,
  // NUEVO: Referencia a memoria estructural
  supabaseMemoryId: v.optional(v.string()),
})
```

**Ventajas:**
- No cambia la estructura de datos existente
- Campo opcional, no rompe nada
- Fácil de implementar

### Opción B: Tabla puente dedicada (ALTERNATIVA)

Crear tabla `supabaseBindings` en Convex:

```typescript
supabaseBindings: defineTable({
  convexEntityType: v.union(
    v.literal('player'),
    v.literal('agent'),
    v.literal('memory'),
    v.literal('conversation'),
  ),
  convexEntityId: v.string(),
  supabaseEntityId: v.string(),
  supabaseTable: v.string(),
  createdAt: v.number(),
})
.index('byConvex', ['convexEntityType', 'convexEntityId'])
.index('bySupabase', ['supabaseTable', 'supabaseEntityId'])
```

**Desventajas:**
- Más compleja
- Requiere joins adicionales
- Overkill para el MVP

**Recomendación**: Opción A (campos opcionales en tablas existentes).

---

## 6. Qué debe vivir solo en Supabase

### Datos que NUNCA deben ir a Convex

| Categoría | Tablas Supabase | Razón |
|-----------|-----------------|-------|
| **Territorio** | `territories` | Datos estáticos, no necesitan runtime |
| **Perfil demográfico** | `agent_profiles` | Datos censales, no cambian en runtime |
| **Rasgos psicológicos** | `agent_traits` | Configuración, no estado |
| **Eventos** | `events`, `agent_event_exposures` | Catálogo externo |
| **Encuestas** | `surveys`, `survey_questions`, `survey_runs`, `survey_responses` | Resultados permanentes |
| **Benchmarks** | `benchmarks`, `benchmark_results`, `calibration_runs` | Validación externa |
| **Bindings** | `runtime_bindings`, `sync_queue` | Control de puente |

### Datos que pueden ir a Supabase (opcional)

| Categoría | Tabla Convex | Tabla Supabase | Estrategia |
|-----------|--------------|----------------|------------|
| **Memoria resumida** | `memories` | `agent_memories` | Sync de resúmenes |
| **Conversaciones** | `messages` | (tabla futura) | Archivo opcional |
| **Estado del agente** | `archivedAgents` | `agent_states` | Reemplazo gradual |

---

## 7. Qué adapters o mappers harán falta

### 7.1 Adapter: SupabaseAgent → ConvexPlayer

**Propósito**: Crear un player en Convex a partir de un agente de Supabase.

```typescript
// src/adapters/agentToPlayer.ts
interface SupabaseAgent {
  id: string;                    // UUID de synthetic_agents
  public_id: string;             // 'ag_xxx'
  profile: {
    name: string;
    age: number;
    sex: string;
    description: string;
  };
  traits: {
    institutional_trust: number;
    // ... otros rasgos
  };
}

interface ConvexPlayerInput {
  name: string;                  // profile.name
  character: string;             // 'f1', 'f2', etc.
  description: string;           // profile.description
  // Opcional: referencia a Supabase
  supabaseAgentId?: string;      // agent.id
}

function createPlayerFromAgent(
  agent: SupabaseAgent,
  characterSprite: string
): ConvexPlayerInput {
  return {
    name: agent.profile.name,
    character: characterSprite,
    description: agent.profile.description,
    supabaseAgentId: agent.id,
  };
}
```

### 7.2 Adapter: ConvexPlayer → SupabaseAgentState

**Propósito**: Actualizar estado del agente en Supabase después de la simulación.

```typescript
// src/adapters/playerToAgentState.ts
interface ConvexPlayerOutput {
  id: string;                    // playerId
  supabaseAgentId?: string;      // referencia opcional
  activity?: {
    description: string;
    until: number;
  };
  // ... otros datos de runtime
}

interface SupabaseAgentStateUpdate {
  agent_id: string;
  last_activation_at: string;
  fatigue: number;               // Calcular desde activity
  // ... otros estados
}

function extractAgentState(
  player: ConvexPlayerOutput
): SupabaseAgentStateUpdate | null {
  if (!player.supabaseAgentId) return null;
  
  return {
    agent_id: player.supabaseAgentId,
    last_activation_at: new Date().toISOString(),
    fatigue: calculateFatigue(player.activity),
    // ...
  };
}
```

### 7.3 Mapper: AgentMemory ↔ ConvexMemory

**Propósito**: Sincronizar memoria entre sistemas.

```typescript
// src/mappers/memoryMapper.ts
function convexMemoryToSupabase(
  convexMemory: ConvexMemory,
  supabaseAgentId: string
): SupabaseMemoryInput {
  return {
    agent_id: supabaseAgentId,
    memory_type: mapMemoryType(convexMemory.data.type),
    content: convexMemory.description,
    importance: convexMemory.importance,
    // ...
  };
}
```

### 7.4 Service: ActivationService

**Propósito**: Orquestar activación/desactivación de agentes.

```typescript
// src/services/agentActivation.ts
class AgentActivationService {
  async activateAgent(supabaseAgentId: string): Promise<string> {
    // 1. Obtener agente de Supabase
    const agent = await supabase.getAgent(supabaseAgentId);
    
    // 2. Crear player en Convex
    const playerInput = createPlayerFromAgent(agent, agent.character_sprite);
    const convexPlayerId = await convex.mutation(api.players.join, playerInput);
    
    // 3. Crear binding
    await supabase.createBinding({
      agent_id: supabaseAgentId,
      convex_player_id: convexPlayerId,
      status: 'active',
    });
    
    return convexPlayerId;
  }
  
  async deactivateAgent(supabaseAgentId: string): Promise<void> {
    // 1. Obtener binding
    const binding = await supabase.getBinding(supabaseAgentId);
    
    // 2. Archivar estado en Supabase
    const playerState = await convex.query(api.players.get, binding.convex_player_id);
    await supabase.updateAgentState(supabaseAgentId, playerState);
    
    // 3. Hacer leave en Convex
    await convex.mutation(api.players.leave, binding.convex_player_id);
    
    // 4. Actualizar binding
    await supabase.updateBinding(supabaseAgentId, { status: 'inactive' });
  }
}
```

---

## 8. Recomendación final antes de implementar cambios

### 8.1 Orden de implementación seguro

```
FASE 0: Preparación (ahora)
├── Crear tablas en Supabase (sin afectar Convex)
├── Migrar mocks de territories a Supabase
├── Migrar mocks de agents a Supabase
└── Verificar que el juego sigue funcionando

FASE 1: Binding opcional (semana 1)
├── Agregar campo opcional supabaseAgentId a playerDescriptions
├── Agregar campo opcional supabaseAgentId a agentDescriptions
├── Crear runtime_bindings en Supabase
└── Verificar que el juego sigue funcionando

FASE 2: Activación manual (semana 2)
├── Crear endpoint para activar agente desde Supabase
├── Crear endpoint para desactivar agente
├── Probar con 1-2 agentes manualmente
└── Verificar que el juego sigue funcionando

FASE 3: Integración UI (semana 3)
├── Modificar AgentInspectorPanel para leer de Supabase
├── Modificar RegionSceneView para usar agentes de Supabase
├── Mantener fallback a mocks si no hay binding
└── Verificar que el juego sigue funcionando

FASE 4: Memoria y estado (semana 4+)
├── Sincronizar memories a Supabase
├── Archivar estado al desactivar
└── Verificar que el juego sigue funcionando
```

### 8.2 Checklist de seguridad

Antes de cada cambio, verificar:

- [ ] El juego inicia sin errores
- [ ] Los agentes se mueven y conversan
- [ ] Los humanos pueden unirse
- [ ] Las conversaciones funcionan
- [ ] No hay errores en consola de Convex
- [ ] Los cambios son backward compatible

### 8.3 Rollback plan

Si algo falla:

1. **Fase 0-1**: Simplemente no usar los campos nuevos
2. **Fase 2**: Desactivar endpoints de activación
3. **Fase 3**: Volver a usar mocks en UI
4. **Fase 4**: Ignorar sincronización de memoria

### 8.4 Decisiones inmediatas requeridas

#### D1: ¿Agregar campo supabaseAgentId ahora?

**Recomendación**: SÍ, es seguro y necesario.

- Es un campo opcional (`v.optional(v.string())`)
- No afecta el funcionamiento actual
- Permite empezar a hacer bindings

#### D2: ¿Crear runtime_bindings en Supabase ahora?

**Recomendación**: SÍ, pero no es urgente.

- No afecta Convex
- Permite trackear bindings
- Se puede poblar manualmente para pruebas

#### D3: ¿Migrar territories a Supabase ahora?

**Recomendación**: SÍ, es independiente.

- No afecta Convex
- El frontend puede leer de Supabase o mocks
- Bajo riesgo

#### D4: ¿Migrar agents a Supabase ahora?

**Recomendación**: SÍ, pero mantener mocks como fallback.

- Crear tablas en Supabase
- Poblar con datos de mocks
- UI puede leer de Supabase o mocks (fallback)
- No afecta Convex todavía

---

## 9. Resumen ejecutivo

### Qué hacer AHORA (bajo riesgo)

1. ✅ Crear tablas en Supabase (no afecta Convex)
2. ✅ Migrar territories a Supabase
3. ✅ Migrar agents a Supabase (con mocks como fallback)
4. ✅ Agregar campo opcional `supabaseAgentId` a `playerDescriptions` y `agentDescriptions`

### Qué hacer DESPUÉS (medio riesgo)

5. ⏳ Crear runtime_bindings en Supabase
6. ⏳ Implementar ActivationService
7. ⏳ Modificar UI para leer de Supabase

### Qué NO hacer TODAVÍA (alto riesgo)

- ❌ Eliminar tablas de Convex
- ❌ Modificar `worlds`, `worldStatus`, `maps`, `inputs`, `engines`
- ❌ Cambiar lógica de agentes
- ❌ Modificar `memoryEmbeddings` o `participatedTogether`

### Tablas de Convex: resumen de acción

| Tabla | Acción |
|-------|--------|
| `worlds` | NO TOCAR |
| `worldStatus` | NO TOCAR |
| `maps` | NO TOCAR |
| `inputs` | NO TOCAR |
| `engines` | NO TOCAR |
| `memoryEmbeddings` | NO TOCAR |
| `participatedTogether` | NO TOCAR |
| `embeddingsCache` | NO TOCAR |
| `music` | NO TOCAR |
| `messages` | EXTENDER (agregar supabaseAgentId opcional) |
| `memories` | EXTENDER (agregar supabaseMemoryId opcional) |
| `playerDescriptions` | EXTENDER (agregar supabaseAgentId opcional) |
| `agentDescriptions` | EXTENDER (agregar supabaseAgentId opcional) |
| `archivedPlayers` | MANTENER (obsoleta a futuro) |
| `archivedConversations` | MANTENER (obsoleta a futuro) |
| `archivedAgents` | MANTENER (obsoleta a futuro) |

---

**Documento versión**: 1.0  
**Última actualización**: 2024-01-XX  
**Estado**: Listo para implementación Fase 0-1

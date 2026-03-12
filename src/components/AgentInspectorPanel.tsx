import { FullAgent } from '../types/agent';
import { TerritoryRegion } from '../types/territory';
import { useAgentEventsForDisplay } from '../hooks/useEvents';
import { 
  getEventCategoryColor, 
  getStanceColor, 
  getStanceLabel,
  formatRelativeTime,
  getIntensityLabel,
  getIntensityColor,
  AgentEventForDisplay 
} from '../types/event';

/**
 * AgentInspectorPanel - Agent detail panel (overlay on region view)
 * 
 * Architecture:
 * - Opens as overlay on top of region view (not separate screen)
 * - Shows detailed agent information using FullAgent contract
 * - Can be closed to return to region view
 * - Fetches real event data from Supabase via useAgentEventsForDisplay hook
 * 
 * Design:
 * - Slide-in panel from right
 * - Semi-transparent backdrop
 * - Organized sections matching agent data model:
 *   - Profile (demographics)
 *   - Traits (psychological)
 *   - Memory (learned positions)
 *   - State (current condition)
 *   - Events (exposure history from Supabase)
 * 
 * Data Structure:
 * - FullAgent with all dimensions: profile, traits, memory, state
 * - Events fetched separately from Supabase agent_event_exposures table
 * - Aligned with production architecture (Supabase + Convex)
 */
interface AgentInspectorPanelProps {
  agent: FullAgent;
  region: TerritoryRegion;
  onClose: () => void;
}

/**
 * AgentInspectorPanel Component
 * 
 * Displays detailed information about a selected agent.
 * Opens as an overlay panel on the region view.
 * Fetches real event exposures from Supabase.
 */
export default function AgentInspectorPanel({ agent, region, onClose }: AgentInspectorPanelProps) {
  const { profile, traits, memory, state } = agent;
  
  // Fetch real event exposures from Supabase
  const { events: agentEvents, loading: eventsLoading, error: eventsError } = useAgentEventsForDisplay(profile.id);

  return (
    <>
      {/* Backdrop - closes panel when clicked */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel - slides in from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-brown-800/95 backdrop-blur-md border-l border-brown-700 z-50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brown-700">
          <h2 className="text-xl font-display text-white/90">Agente</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-brown-700/50 transition-colors"
            aria-label="Cerrar panel"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Profile Section */}
          <ProfileSection profile={profile} region={region} />

          {/* State Section */}
          <StateSection state={state} />

          {/* Traits Section */}
          <TraitsSection traits={traits} />

          {/* Memory Section */}
          <MemorySection memory={memory} />

          {/* Events Section - with real data from Supabase */}
          <EventsSection 
            events={agentEvents} 
            loading={eventsLoading} 
            error={eventsError} 
          />
        </div>
      </div>
    </>
  );
}

/**
 * Profile Section - Demographics and basic info
 */
interface ProfileSectionProps {
  profile: FullAgent['profile'];
  region: TerritoryRegion;
}

function ProfileSection({ profile, region }: ProfileSectionProps) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brown-700 flex items-center justify-center text-2xl">
          {profile.sex === 'female' ? '👩' : profile.sex === 'male' ? '👨' : '👤'}
        </div>
        <div>
          <h3 className="text-lg font-medium text-white/90">{profile.name}</h3>
          <p className="text-sm text-white/50">
            {profile.age} años • {region.shortName}
          </p>
          <p className="text-xs text-white/40">
            {profile.commune} • {getUrbanRuralLabel(profile.urbanRural)}
          </p>
        </div>
      </div>
      
      {profile.description && (
        <p className="mt-3 text-sm text-white/70 leading-relaxed">
          {profile.description}
        </p>
      )}

      {/* Quick stats */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatBadge label="Educación" value={getEducationLabel(profile.educationLevel)} />
        <StatBadge label="Trabajo" value={getEmploymentLabel(profile.employmentStatus)} />
        <StatBadge label="Hogar" value={`${profile.householdSize} personas`} />
        <StatBadge label="Ingreso" value={`Decil ${profile.incomeDecile}`} />
      </div>
    </section>
  );
}

/**
 * State Section - Current condition
 */
interface StateSectionProps {
  state: FullAgent['state'];
}

function StateSection({ state }: StateSectionProps) {
  return (
    <section className="border-t border-brown-700/50 pt-4">
      <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
        Estado Actual
      </h4>
      
      <div className="space-y-3">
        <TraitBar label="Fatiga" value={state.fatigue} color="orange" />
        <TraitBar label="Estrés Económico" value={state.economicStress} color="red" />
        <TraitBar label="Saturación Encuestas" value={state.surveySaturation * 10} color="blue" />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs text-white/50">Estado de ánimo:</span>
        <MoodBadge mood={state.mood} />
        <span className="text-xs text-white/40">
          {state.isActive ? '• Activo' : '• Inactivo'}
        </span>
      </div>
    </section>
  );
}

/**
 * Traits Section - Psychological characteristics
 */
interface TraitsSectionProps {
  traits: FullAgent['traits'];
}

function TraitsSection({ traits }: TraitsSectionProps) {
  return (
    <section className="border-t border-brown-700/50 pt-4">
      <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
        Rasgos de Personalidad
      </h4>
      
      <div className="space-y-2">
        <TraitBar label="Confianza Institucional" value={traits.institutionalTrust} color="blue" />
        <TraitBar label="Aversión al Riesgo" value={traits.riskAversion} color="orange" />
        <TraitBar label="Alfabetización Digital" value={traits.digitalLiteracy} color="green" />
        <TraitBar label="Interés Cívico" value={traits.civicInterest} color="purple" />
        <TraitBar label="Deseabilidad Social" value={traits.socialDesirability} color="yellow" />
        <TraitBar label="Apertura al Cambio" value={traits.opennessChange} color="teal" />
        <TraitBar label="Ideología (0=izq, 100=der)" value={traits.ideologyScore} color="indigo" />
        <TraitBar label="Nacionalismo" value={traits.nationalismScore} color="red" />
        <TraitBar label="Consistencia" value={traits.consistencyScore} color="emerald" />
      </div>
    </section>
  );
}

/**
 * Memory Section - Learned positions and beliefs
 */
interface MemorySectionProps {
  memory: FullAgent['memory'];
}

function MemorySection({ memory }: MemorySectionProps) {
  const hasMemoryData = memory.summary || memory.salientTopics.length > 0 || memory.previousPositions.length > 0;
  
  return (
    <section className="border-t border-brown-700/50 pt-4">
      <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
        Memoria
      </h4>
      
      {!hasMemoryData ? (
        <div className="bg-brown-900/30 rounded-lg p-4 text-center">
          <p className="text-sm text-white/40 italic">
            Sin memorias registradas
          </p>
          <p className="text-xs text-white/30 mt-1">
            El agente aún no ha participado en encuestas ni conversaciones
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
          {memory.summary && (
            <div className="bg-brown-900/50 rounded-lg p-3 mb-3">
              <p className="text-sm text-white/70 leading-relaxed">
                {memory.summary}
              </p>
            </div>
          )}

          {/* Salient Topics */}
          {memory.salientTopics.length > 0 && (
            <div className="mb-3">
              <span className="text-xs text-white/50">Temas importantes:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {memory.salientTopics.map((topic) => (
                  <span 
                    key={topic}
                    className="px-2 py-0.5 bg-brown-700/50 rounded text-xs text-white/70"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Previous Positions */}
          {memory.previousPositions.length > 0 && (
            <div>
              <span className="text-xs text-white/50">Posiciones previas:</span>
              <div className="space-y-1.5 mt-1">
                {memory.previousPositions.slice(0, 3).map((pos, idx) => (
                  <div key={idx} className="text-xs text-white/60 pl-2 border-l-2 border-brown-600">
                    <span className="text-white/70">{pos.topic}:</span> {pos.stance}
                    <span className="text-white/40 ml-1">({getSourceLabel(pos.source)})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contradiction Score */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-white/50">Consistencia interna:</span>
            <div className="flex-1 h-1.5 bg-brown-900/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${memory.contradictionScore > 50 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${100 - memory.contradictionScore}%` }}
              />
            </div>
            <span className="text-xs text-white/40">{100 - memory.contradictionScore}%</span>
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Events Section - Event exposure history from Supabase
 */
interface EventsSectionProps {
  events: AgentEventForDisplay[];
  loading: boolean;
  error: Error | null;
}

function EventsSection({ events, loading, error }: EventsSectionProps) {
  // Loading state
  if (loading) {
    return (
      <section className="border-t border-brown-700/50 pt-4">
        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
          Exposición a Eventos
        </h4>
        <div className="bg-brown-900/30 rounded-lg p-4 text-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="h-4 w-32 bg-brown-700/50 rounded"></div>
            <div className="h-3 w-24 bg-brown-700/50 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="border-t border-brown-700/50 pt-4">
        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
          Exposición a Eventos
        </h4>
        <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
          <p className="text-sm text-red-300">
            Error al cargar eventos
          </p>
          <p className="text-xs text-red-400/70 mt-1">
            {error.message}
          </p>
        </div>
      </section>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <section className="border-t border-brown-700/50 pt-4">
        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-3">
          Exposición a Eventos
        </h4>
        <div className="bg-brown-900/30 rounded-lg p-4 text-center">
          <p className="text-sm text-white/40 italic">
            Sin eventos registrados
          </p>
          <p className="text-xs text-white/30 mt-1">
            El agente aún no ha sido expuesto a eventos
          </p>
        </div>
      </section>
    );
  }

  // Events list
  return (
    <section className="border-t border-brown-700/50 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white/50 uppercase tracking-wider">
          Exposición a Eventos
        </h4>
        <span className="text-xs text-white/40">
          {events.length} evento{events.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {events.map((event) => (
          <EventCard key={event.exposureId} event={event} />
        ))}
      </div>
    </section>
  );
}

/**
 * Event Card - Individual event display
 */
interface EventCardProps {
  event: AgentEventForDisplay;
}

function EventCard({ event }: EventCardProps) {
  const categoryColor = getEventCategoryColor(event.category);
  const stanceColor = getStanceColor(event.interpretedStance);
  const intensityColor = getIntensityColor(event.intensity);
  
  return (
    <div className="bg-brown-900/30 rounded-lg p-3 hover:bg-brown-900/50 transition-colors">
      {/* Header: Title and Date */}
      <div className="flex items-start justify-between gap-2">
        <h5 className="text-sm font-medium text-white/80 leading-tight flex-1">
          {event.title}
        </h5>
        <span className="text-xs text-white/40 whitespace-nowrap">
          {formatRelativeTime(event.exposedAt)}
        </span>
      </div>
      
      {/* Category and Intensity */}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span 
          className="px-1.5 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: `${categoryColor}30`,
            color: categoryColor 
          }}
        >
          {event.categoryLabel}
        </span>
        
        <span 
          className="px-1.5 py-0.5 rounded text-xs"
          style={{ 
            backgroundColor: `${intensityColor}20`,
            color: intensityColor 
          }}
        >
          Intensidad {event.intensity}/10
        </span>
      </div>
      
      {/* Exposure and Stance */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">
            Exposición:
          </span>
          <div className="flex items-center gap-1">
            <div className="w-12 h-1.5 bg-brown-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${event.exposureLevel}%` }}
              />
            </div>
            <span className="text-xs text-white/70">
              {Math.round(event.exposureLevel)}%
            </span>
          </div>
        </div>
        
        <span 
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ 
            backgroundColor: `${stanceColor}25`,
            color: stanceColor 
          }}
        >
          {event.stanceLabel}
        </span>
      </div>
      
      {/* Mood Impact (if present) */}
      {event.moodImpact !== null && event.moodImpact !== undefined && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-white/50">Impacto en ánimo:</span>
          <span className={`text-xs ${event.moodImpact > 0 ? 'text-green-400' : event.moodImpact < 0 ? 'text-red-400' : 'text-white/60'}`}>
            {event.moodImpact > 0 ? '+' : ''}{event.moodImpact}
          </span>
        </div>
      )}
      
      {/* Summary (if present) */}
      {event.summary && (
        <p className="mt-2 text-xs text-white/50 line-clamp-2">
          {event.summary}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Stat Badge - Small stat display
 */
interface StatBadgeProps {
  label: string;
  value: string;
}

function StatBadge({ label, value }: StatBadgeProps) {
  return (
    <div className="bg-brown-900/50 rounded px-2 py-1">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/80 ml-1">{value}</span>
    </div>
  );
}

/**
 * Trait Bar - Visual bar for trait scores
 */
interface TraitBarProps {
  label: string;
  value: number;
  color: string;
}

function TraitBar({ label, value, color }: TraitBarProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    orange: 'bg-orange-600',
    yellow: 'bg-yellow-600',
    purple: 'bg-purple-600',
    teal: 'bg-teal-600',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
  };

  return (
    <div>
      <div className="flex justify-between text-xs text-white/60 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 bg-brown-900/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color] || 'bg-brown-600'} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Mood Badge - Display mood with color
 */
interface MoodBadgeProps {
  mood: string;
}

function MoodBadge({ mood }: MoodBadgeProps) {
  const moodClasses: Record<string, string> = {
    positive: 'bg-green-900/50 text-green-300',
    negative: 'bg-red-900/50 text-red-300',
    neutral: 'bg-blue-900/50 text-blue-300',
    stressed: 'bg-orange-900/50 text-orange-300',
  };

  const moodLabels: Record<string, string> = {
    positive: 'Positivo',
    negative: 'Negativo',
    neutral: 'Neutral',
    stressed: 'Estresado',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${moodClasses[mood] || moodClasses.neutral}`}>
      {moodLabels[mood] || mood}
    </span>
  );
}

// ============================================================================
// LABEL HELPERS
// ============================================================================

function getUrbanRuralLabel(value: string): string {
  const labels: Record<string, string> = {
    urban: 'Urbano',
    rural: 'Rural',
    semiurban: 'Semiurbano',
  };
  return labels[value] || value;
}

function getEducationLabel(value: string): string {
  const labels: Record<string, string> = {
    none: 'Sin estudios',
    primary: 'Básica',
    secondary: 'Media',
    technical: 'Técnica',
    university: 'Universitaria',
    postgraduate: 'Postgrado',
  };
  return labels[value] || value;
}

function getEmploymentLabel(value: string): string {
  const labels: Record<string, string> = {
    employed: 'Empleado',
    unemployed: 'Desempleado',
    inactive: 'Inactivo',
    retired: 'Jubilado',
    student: 'Estudiante',
  };
  return labels[value] || value;
}

function getSourceLabel(value: string): string {
  const labels: Record<string, string> = {
    survey: 'encuesta',
    conversation: 'conversación',
    event: 'evento',
  };
  return labels[value] || value;
}

import Game from './Game';
import { TerritoryRegion } from '../types/territory';
import { AgentSummary } from '../types/agent';
import { useAgentSummariesByRegion } from '../hooks/useAgents';
import { useEventsByTerritory } from '../hooks/useEvents';

/**
 * RegionSceneView - Local scene view for a specific region
 * 
 * Architecture:
 * - Wraps the AI Town Game component
 * - Adds region-specific header with agent quick-select
 * - Provides context about the current region
 * - Uses AgentSummary for lightweight agent lists
 * - Fetches agents from Supabase with fallback to mocks
 * - Fetches events from Supabase with fallback to mocks
 * 
 * Design:
 * - Full-screen game view
 * - Floating header with region info
 * - Agent quick-select buttons
 * - Event indicators in header
 * - Consistent with AI Town visual style
 * 
 * Data Flow:
 * 1. useAgentSummariesByRegion hook fetches from Supabase (with fallback to mocks)
 * 2. useEventsByRegion hook fetches events from Supabase (with fallback to mocks)
 * 3. Agents are displayed in quick-select buttons
 * 4. Events are shown as indicators in the header
 * 5. Clicking an agent triggers onAgentSelect callback
 * 
 * Props:
 * - region: The selected territory region
 * - onAgentSelect: Callback when an agent is selected (by ID)
 */
interface RegionSceneViewProps {
  region: TerritoryRegion;
  onAgentSelect: (agentId: string) => void;
}

/**
 * RegionSceneView Component
 * 
 * Displays the AI Town world for the selected region.
 * Includes a header with region information, agent quick-select, and event indicators.
 * Agents and events are loaded from Supabase with automatic fallback to mocks.
 */
export default function RegionSceneView({ region, onAgentSelect }: RegionSceneViewProps) {
  // Get agents for this region from Supabase (with fallback to mocks)
  const { agents, loading: agentsLoading, error: agentsError } = useAgentSummariesByRegion(region.id);
  
  // Get events for this region from Supabase (with fallback to mocks)
  const { events, loading: eventsLoading, error: eventsError } = useEventsByTerritory(region.id);
  
  // Check if there are active events
  const hasActiveEvents = events.length > 0;

  return (
    <div className="relative w-full h-full">
      {/* Region Header - floating overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="flex items-center justify-between bg-brown-800/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-brown-700 shadow-lg">
          {/* Region Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brown-700 flex items-center justify-center text-lg">
              🏘️
            </div>
            <div>
              <h2 className="text-lg font-display text-white/90 leading-tight">
                {region.shortName}
              </h2>
              <p className="text-xs text-white/50">
                {region.population?.toLocaleString('es-CL')} habitantes
              </p>
              {(agentsError || eventsError) && (
                <p className="text-xs text-yellow-500/80">
                  ⚠️ Usando datos locales
                </p>
              )}
            </div>
          </div>

          {/* Agent Quick Select */}
          <div className="flex items-center gap-2">
            {agentsLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                <span className="text-xs text-white/40">Cargando...</span>
              </div>
            ) : agents.length > 0 ? (
              <>
                <span className="text-xs text-white/40 hidden sm:inline">Agentes:</span>
                <div className="flex gap-1.5">
                  {agents.map((agent) => (
                    <AgentQuickButton
                      key={agent.id}
                      agent={agent}
                      onClick={() => onAgentSelect(agent.id)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <span className="text-xs text-white/40">Sin agentes</span>
            )}
          </div>
        </div>
      </div>

      {/* Game World - full screen */}
      <div className="w-full h-full">
        <Game />
      </div>
    </div>
  );
}

/**
 * AgentQuickButton - Individual agent button in quick select
 */
interface AgentQuickButtonProps {
  agent: AgentSummary;
  onClick: () => void;
}

function AgentQuickButton({ agent, onClick }: AgentQuickButtonProps) {
  // Get mood color
  const moodColor = getMoodColor(agent.mood);
  
  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-full 
        flex items-center justify-center text-sm font-medium
        transition-all duration-150
        border-2 
        ${agent.isActive 
          ? `bg-brown-600 ${moodColor} hover:bg-brown-500 hover:scale-110` 
          : 'bg-brown-800 border-brown-600 text-white/40 cursor-not-allowed'
        }
      `}
      title={`${agent.name} (${agent.age} años) - ${getMoodLabel(agent.mood)}`}
      disabled={!agent.isActive}
    >
      {agent.name.charAt(0)}
    </button>
  );
}

/**
 * Get color class for mood indicator
 */
function getMoodColor(mood: string): string {
  switch (mood) {
    case 'positive': return 'border-green-500 text-green-100';
    case 'negative': return 'border-red-500 text-red-100';
    case 'stressed': return 'border-orange-500 text-orange-100';
    default: return 'border-blue-500 text-blue-100';
  }
}

/**
 * Get human-readable mood label
 */
function getMoodLabel(mood: string): string {
  switch (mood) {
    case 'positive': return 'positivo';
    case 'negative': return 'negativo';
    case 'stressed': return 'estresado';
    default: return 'neutral';
  }
}

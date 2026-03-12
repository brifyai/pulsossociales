import Game from './Game';
import { TerritoryRegion } from '../types/territory';
import { AgentSummary } from '../types/agent';
import { useAgentSummariesByRegion } from '../hooks/useAgents';
import { useEventsByTerritory } from '../hooks/useEvents';
import { useState } from 'react';

/**
 * RegionSceneView - Premium local scene view for a specific region
 * 
 * Design Philosophy:
 * - Immersive, centered game world as the focal point
 * - Clean, floating header with essential context
 * - Better use of vertical space - no more "stuck to top" feeling
 * - Premium finish with subtle shadows and glassmorphism
 * - Maintains AI Town visual identity
 * 
 * Layout:
 * - Full viewport utilization
 * - Centered game world with breathing room
 * - Floating header overlay (not pushing content down)
 * - Agent quick-access in header
 * - Event indicators integrated elegantly
 */
interface RegionSceneViewProps {
  region: TerritoryRegion;
  onAgentSelect: (agentId: string) => void;
}

/**
 * RegionSceneView Component
 * 
 * Displays the AI Town world for the selected region with premium layout.
 * The game world is centered and immersive, using available space efficiently.
 */
export default function RegionSceneView({ region, onAgentSelect }: RegionSceneViewProps) {
  const { agents, loading: agentsLoading, error: agentsError } = useAgentSummariesByRegion(region.id);
  const { events, loading: eventsLoading, error: eventsError } = useEventsByTerritory(region.id);
  const [showAllAgents, setShowAllAgents] = useState(false);
  
  const hasActiveEvents = events.length > 0;
  const displayAgents = showAllAgents ? agents : agents.slice(0, 6);

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col">
      {/* Premium Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between bg-slate-800/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/10 shadow-2xl">
            {/* Region Info - Left */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center text-2xl border border-amber-500/20">
                🏘️
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white leading-tight">
                  {region.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-white/50">
                  <span>{region.population?.toLocaleString('es-CL')} habitantes</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" />
                  <span className="capitalize">{region.macroZone.replace('_', ' ')}</span>
                </div>
                {(agentsError || eventsError) && (
                  <p className="text-xs text-amber-400/80 flex items-center gap-1 mt-0.5">
                    <span>⚠️</span> Usando datos locales
                  </p>
                )}
              </div>
            </div>

            {/* Agent Quick Select - Center/Right */}
            <div className="flex items-center gap-3">
              {agentsLoading ? (
                <div className="flex items-center gap-2 px-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/50" />
                  <span className="text-xs text-white/40">Cargando agentes...</span>
                </div>
              ) : agents.length > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 hidden sm:inline">
                    {agents.length} agentes
                  </span>
                  <div className="flex gap-1.5">
                    {displayAgents.map((agent) => (
                      <AgentQuickButton
                        key={agent.id}
                        agent={agent}
                        onClick={() => onAgentSelect(agent.id)}
                      />
                    ))}
                    {agents.length > 6 && !showAllAgents && (
                      <button
                        onClick={() => setShowAllAgents(true)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/50 transition-colors"
                        title={`Ver ${agents.length - 6} agentes más`}
                      >
                        +{agents.length - 6}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-white/40 px-3">Sin agentes</span>
              )}
              
              {/* Event Indicator */}
              {hasActiveEvents && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20">
                  <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-xs text-pink-300">{events.length} eventos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Game World Container - Centered and immersive */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20 pb-16">
        <div className="relative w-full h-full max-w-7xl max-h-[calc(100vh-140px)]">
          {/* Game wrapper with premium styling */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
              }}
            />
            
            {/* Game Component */}
            <div className="absolute inset-0">
              <Game />
            </div>
          </div>
        </div>
      </main>

      {/* Context Bar - Bottom */}
      <div className="absolute bottom-16 left-0 right-0 z-30 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-6 bg-slate-800/60 backdrop-blur-md rounded-full px-6 py-2 border border-white/5">
            <ContextItem icon="👥" label="Agentes" value={agents.length} />
            <ContextItem icon="📅" label="Eventos" value={events.length} />
            <ContextItem icon="📊" label="Encuestas" value={region.surveyScore > 0 ? 'Activas' : 'Inactivas'} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ContextItem - Small context indicator
 */
interface ContextItemProps {
  icon: string;
  label: string;
  value: string | number;
}

function ContextItem({ icon, label, value }: ContextItemProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-medium text-white">{value}</span>
    </div>
  );
}

/**
 * AgentQuickButton - Enhanced agent button
 */
interface AgentQuickButtonProps {
  agent: AgentSummary;
  onClick: () => void;
}

function AgentQuickButton({ agent, onClick }: AgentQuickButtonProps) {
  const moodColor = getMoodColor(agent.mood);
  
  return (
    <button
      onClick={onClick}
      className={`
        w-9 h-9 rounded-full 
        flex items-center justify-center text-sm font-medium
        transition-all duration-200
        border-2 
        ${agent.isActive 
          ? `bg-slate-700 ${moodColor} hover:bg-slate-600 hover:scale-110 shadow-lg` 
          : 'bg-slate-800 border-slate-600 text-white/30 cursor-not-allowed'
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
    case 'positive': return 'border-green-400 text-green-100 shadow-green-500/20';
    case 'negative': return 'border-red-400 text-red-100 shadow-red-500/20';
    case 'stressed': return 'border-orange-400 text-orange-100 shadow-orange-500/20';
    default: return 'border-blue-400 text-blue-100 shadow-blue-500/20';
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

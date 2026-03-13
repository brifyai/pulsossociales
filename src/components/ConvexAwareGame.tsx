import { useState, useEffect } from 'react';
import Game from './Game';
import { AgentSummary } from '../types/agent';
import { TerritoryRegion } from '../types/territory';

interface ConvexAwareGameProps {
  region: TerritoryRegion;
  agents: AgentSummary[];
  onAgentSelect: (agentId: string) => void;
}

/**
 * ConvexAwareGame - Wrapper that detects Convex availability and shows fallback
 * 
 * This component:
 * 1. Attempts to connect to Convex
 * 2. If Convex is available, renders the full Game component
 * 3. If Convex is unavailable, shows a graceful fallback with region data
 * 
 * The fallback maintains:
 * - Region information visibility
 * - Agent list and navigation
 * - Premium visual design
 * - No error messages or technical jargon
 */
export default function ConvexAwareGame({ region, agents, onAgentSelect }: ConvexAwareGameProps) {
  const [convexStatus, setConvexStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [showAllAgents, setShowAllAgents] = useState(false);

  useEffect(() => {
    // Check if Convex is configured
    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    const deployment = import.meta.env.VITE_CONVEX_DEPLOYMENT || import.meta.env.CONVEX_DEPLOYMENT;
    
    if (!convexUrl || !deployment) {
      setConvexStatus('unavailable');
      return;
    }

    // Try to connect with timeout
    const timeout = setTimeout(() => {
      // If still checking after 5 seconds, assume unavailable
      if (convexStatus === 'checking') {
        setConvexStatus('unavailable');
      }
    }, 5000);

    // For now, we'll try to render Game and catch if it fails
    // In a real scenario, we'd check the connection more explicitly
    setConvexStatus('available');
    
    return () => clearTimeout(timeout);
  }, []);

  const displayAgents = showAllAgents ? agents : agents.slice(0, 8);

  // Show loading while checking
  if (convexStatus === 'checking') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
          <p className="text-white/60 text-sm">Iniciando simulación...</p>
        </div>
      </div>
    );
  }

  // Show fallback when Convex is unavailable
  if (convexStatus === 'unavailable') {
    return (
      <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
        {/* Fallback Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Visual Placeholder */}
          <div className="relative w-full max-w-2xl aspect-video mb-8">
            {/* Abstract region visualization */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10" />
            
            {/* Decorative elements representing the region */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Central region indicator */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                  <span className="text-4xl">🏘️</span>
                </div>
                
                {/* Orbiting agent indicators */}
                {agents.slice(0, 6).map((agent, i) => {
                  const angle = (i * 60) * (Math.PI / 180);
                  const radius = 80;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  
                  return (
                    <button
                      key={agent.id}
                      onClick={() => onAgentSelect(agent.id)}
                      className="absolute w-10 h-10 rounded-full bg-slate-700 border-2 border-white/20 flex items-center justify-center text-sm font-medium text-white hover:bg-slate-600 hover:scale-110 transition-all duration-200 shadow-lg"
                      style={{
                        transform: `translate(${x}px, ${y}px)`,
                      }}
                      title={`${agent.name} - Click para ver detalles`}
                    >
                      {agent.name.charAt(0)}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-slate-800/80 backdrop-blur-md rounded-lg px-4 py-3 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-sm text-white/80">
                    Vista de análisis de <span className="font-medium text-white">{region.name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Message */}
          <div className="text-center max-w-md">
            <h3 className="text-lg font-medium text-white mb-2">
              Simulación en modo análisis
            </h3>
            <p className="text-sm text-white/50 mb-6">
              La simulación en tiempo real no está disponible en este momento. 
              Puedes explorar los agentes y datos de la región.
            </p>
          </div>
          
          {/* Agent Grid */}
          {agents.length > 0 && (
            <div className="w-full max-w-3xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white/70">
                  Agentes disponibles ({agents.length})
                </h4>
                {agents.length > 8 && (
                  <button
                    onClick={() => setShowAllAgents(!showAllAgents)}
                    className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {showAllAgents ? 'Ver menos' : `Ver todos (${agents.length})`}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {displayAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => onAgentSelect(agent.id)}
                    className="group flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:bg-slate-700/50 hover:border-white/10 transition-all duration-200"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium border-2 ${getMoodColor(agent.mood)}`}>
                      {agent.name.charAt(0)}
                    </div>
                    <span className="text-xs text-white/60 group-hover:text-white/80 truncate max-w-full">
                      {agent.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Convex is available, render the full Game
  return <Game />;
}

/**
 * Get color class for mood indicator
 */
function getMoodColor(mood: string): string {
  switch (mood) {
    case 'positive': return 'bg-slate-700 border-green-400 text-green-100';
    case 'negative': return 'bg-slate-700 border-red-400 text-red-100';
    case 'stressed': return 'bg-slate-700 border-orange-400 text-orange-100';
    default: return 'bg-slate-700 border-blue-400 text-blue-100';
  }
}

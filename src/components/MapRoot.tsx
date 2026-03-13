import { useAppStore, getCurrentViewLevel } from '../store/appStore';
import { TerritoryRegion } from '../types/territory';
import { useAgentById } from '../hooks/useAgents';
import { useState, useEffect } from 'react';
import ChileMapView from './ChileMapView';
import RegionSceneView from './RegionSceneView';
import AgentInspectorPanel from './AgentInspectorPanel';
import TerritoryBreadcrumbs from './TerritoryBreadcrumbs';
import MapLayerSwitcher from './MapLayerSwitcher';

/**
 * MapRoot - Main application shell with 3-level navigation
 * 
 * Architecture:
 * - Common shell: header (breadcrumbs + layer switcher) + main content area
 * - View switching: country map vs region scene (mutually exclusive)
 * - Agent panel: overlay that opens on top of region view (not a separate screen)
 * 
 * Navigation levels (UX concept):
 * 1. Country: Shows ChileMapView
 * 2. Region: Shows RegionSceneView with the AI Town world
 * 3. Agent: RegionSceneView + AgentInspectorPanel as overlay
 * 
 * State management:
 * - selectedRegion: null = country view, set = region view
 * - selectedAgentId: null = no agent, set = agent selected
 * - isAgentPanelOpen: true = show agent panel overlay
 * 
 * Data flow:
 * - Store holds IDs only (selectedRegion, selectedAgentId)
 * - Components fetch full data from Supabase via hooks (with fallback to mocks)
 * - This enables easy transition to real data sources
 */
export default function MapRoot() {
  const { 
    selectedRegion, 
    selectedAgentId, 
    isAgentPanelOpen,
    isNavigating,
    navigationTarget,
    navigateToCountry,
    navigateToRegion,
    selectAgent,
    closeAgentPanel,
    setIsNavigating,
  } = useAppStore();
  
  // Derive current view level from state
  const currentViewLevel = getCurrentViewLevel({ selectedRegion, isAgentPanelOpen });
  
  // Fetch full agent data from Supabase (with fallback to mocks)
  const { agent: selectedAgent, loading: agentLoading } = useAgentById(selectedAgentId);

  // Handler: Navigate to country level
  const handleNavigateToCountry = () => {
    navigateToCountry();
  };

  // Handler: Navigate to region level with transition
  const handleNavigateToRegion = (region: TerritoryRegion) => {
    // Start navigation transition
    setIsNavigating(true, region);
    
    // Simulate a brief transition delay for better UX
    setTimeout(() => {
      navigateToRegion(region);
      setIsNavigating(false, null);
    }, 400);
  };

  // Handler: Select agent by ID
  const handleSelectAgent = (agentId: string) => {
    selectAgent(agentId);
  };

  // Handler: Close agent panel
  const handleCloseAgentPanel = () => {
    closeAgentPanel();
  };

  return (
    <div className="relative w-full h-screen flex flex-col bg-brown-900">
      {/* Common Header - always visible */}
      <header className="flex items-center justify-between px-4 py-3 bg-brown-800 border-b border-brown-700 z-50">
        <TerritoryBreadcrumbs />
        <MapLayerSwitcher />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Navigation Transition Overlay */}
        {isNavigating && navigationTarget && (
          <div className="absolute inset-0 bg-slate-900 z-50 flex items-center justify-center">
            <div className="text-center">
              {/* Region icon */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-4xl mb-6 mx-auto animate-pulse">
                🏘️
              </div>
              
              {/* Loading spinner */}
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-4" />
              
              {/* Transition message */}
              <h3 className="text-xl font-semibold text-white mb-2">
                Entrando a {navigationTarget.name}
              </h3>
              <p className="text-sm text-white/50">
                Cargando agentes, eventos y estudios...
              </p>
              
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Level 1: Country View - shown when no region selected */}
        {currentViewLevel === 'country' && !isNavigating && (
          <ChileMapView 
            onRegionSelect={handleNavigateToRegion}
          />
        )}

        {/* Level 2 & 3: Region View - shown when region selected */}
        {/* Agent panel opens as overlay, region stays visible underneath */}
        {(currentViewLevel === 'region' || currentViewLevel === 'agent') && selectedRegion && !isNavigating && (
          <RegionSceneView 
            region={selectedRegion}
            onAgentSelect={handleSelectAgent}
          />
        )}

        {/* Agent Inspector Panel - overlay on top of region view */}
        {/* Only visible when agent panel is open and we have agent data */}
        {isAgentPanelOpen && selectedRegion && (
          <>
            {/* Loading state */}
            {agentLoading && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
                  <p className="text-white/60 text-sm">Cargando agente...</p>
                </div>
              </div>
            )}
            
            {/* Agent panel when data is loaded */}
            {!agentLoading && selectedAgent && (
              <AgentInspectorPanel 
                agent={selectedAgent}
                region={selectedRegion}
                onClose={handleCloseAgentPanel}
              />
            )}
            
            {/* Error state - no agent found */}
            {!agentLoading && !selectedAgent && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
                <div className="text-center p-6 bg-brown-800/90 rounded-lg border border-red-500/30 max-w-sm">
                  <p className="text-red-400 text-sm mb-2">Agente no encontrado</p>
                  <p className="text-white/50 text-xs mb-4">No se pudo cargar la información del agente seleccionado.</p>
                  <button
                    onClick={handleCloseAgentPanel}
                    className="px-4 py-2 bg-brown-700 hover:bg-brown-600 rounded text-sm text-white/80 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

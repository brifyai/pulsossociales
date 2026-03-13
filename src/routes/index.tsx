import { createBrowserRouter, Navigate, Outlet, useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useRegion } from '../hooks/useTerritories';
import ChileMapView from '../components/ChileMapView';
import RegionSceneView from '../components/RegionSceneView';
import AgentInspectorPanel from '../components/AgentInspectorPanel';
import TerritoryBreadcrumbs from '../components/TerritoryBreadcrumbs';
import MapLayerSwitcher from '../components/MapLayerSwitcher';
import { useAgentById } from '../hooks/useAgents';
import { TerritoryRegion } from '../types/territory';

/**
 * AppLayout - Common layout wrapper for all routes
 * 
 * Provides the common shell: header with breadcrumbs and layer switcher
 */
function AppLayout() {
  return (
    <div className="relative w-full h-screen flex flex-col bg-brown-900">
      {/* Common Header - always visible */}
      <header className="flex items-center justify-between px-4 py-3 bg-brown-800 border-b border-brown-700 z-50">
        <TerritoryBreadcrumbs />
        <MapLayerSwitcher />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

/**
 * CountryView - Root route showing Chile map
 * URL: /
 */
function CountryView() {
  const navigate = useNavigate();
  const { navigateToRegion } = useAppStore();

  const handleRegionSelect = (region: TerritoryRegion) => {
    navigateToRegion(region);
    navigate(`/region/${region.id}`);
  };

  return <ChileMapView onRegionSelect={handleRegionSelect} />;
}

/**
 * RegionView - Region detail route
 * URL: /region/:regionId
 * 
 * Syncs URL params with store state
 */
function RegionView() {
  const { regionId } = useParams<{ regionId: string }>();
  const navigate = useNavigate();
  const { 
    selectedRegion, 
    navigateToRegion, 
    selectAgent 
  } = useAppStore();
  
  // Fetch region data from URL param
  const { region, loading, error } = useRegion(regionId || '');

  // Sync URL with store state
  useEffect(() => {
    if (region && (!selectedRegion || selectedRegion.id !== region.id)) {
      navigateToRegion(region);
    }
  }, [region, selectedRegion, navigateToRegion]);

  // Handle agent selection - navigate to agent route
  const handleAgentSelect = (agentId: string) => {
    selectAgent(agentId);
    navigate(`/region/${regionId}/agent/${agentId}`);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
          <p className="text-white/60 text-sm">Cargando región...</p>
        </div>
      </div>
    );
  }

  if (error || !region) {
    // Region not found, redirect to country
    return <Navigate to="/" replace />;
  }

  return (
    <RegionSceneView 
      region={region}
      onAgentSelect={handleAgentSelect}
    />
  );
}

/**
 * AgentView - Agent detail route (opens panel over region)
 * URL: /region/:regionId/agent/:agentId
 * 
 * Shows region view with agent panel overlay
 */
function AgentView() {
  const { regionId, agentId } = useParams<{ regionId: string; agentId: string }>();
  const navigate = useNavigate();
  const { 
    selectedRegion, 
    selectedAgentId,
    navigateToRegion, 
    selectAgent,
    closeAgentPanel 
  } = useAppStore();

  // Fetch region and agent data
  const { region, loading: regionLoading } = useRegion(regionId || '');
  const { agent: selectedAgent, loading: agentLoading } = useAgentById(agentId || '');

  // Sync URL with store state
  useEffect(() => {
    if (region && (!selectedRegion || selectedRegion.id !== region.id)) {
      navigateToRegion(region);
    }
    if (agentId && selectedAgentId !== agentId) {
      selectAgent(agentId);
    }
  }, [region, agentId, selectedRegion, selectedAgentId, navigateToRegion, selectAgent]);

  // Handle agent selection
  const handleAgentSelect = (newAgentId: string) => {
    selectAgent(newAgentId);
    navigate(`/region/${regionId}/agent/${newAgentId}`);
  };

  // Handle closing agent panel
  const handleCloseAgentPanel = () => {
    closeAgentPanel();
    navigate(`/region/${regionId}`);
  };

  if (regionLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
          <p className="text-white/60 text-sm">Cargando región...</p>
        </div>
      </div>
    );
  }

  if (!region) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* Region view underneath */}
      <RegionSceneView 
        region={region}
        onAgentSelect={handleAgentSelect}
      />

      {/* Agent panel overlay */}
      {agentLoading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
            <p className="text-white/60 text-sm">Cargando agente...</p>
          </div>
        </div>
      )}
      
      {!agentLoading && selectedAgent && (
        <AgentInspectorPanel 
          agent={selectedAgent}
          region={region}
          onClose={handleCloseAgentPanel}
        />
      )}
      
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
  );
}

/**
 * React Router configuration
 * 
 * Routes:
 * - /                    → CountryView (Chile map)
 * - /region/:regionId    → RegionView (AI Town world)
 * - /region/:regionId/agent/:agentId → AgentView (Region + Agent panel)
 * 
 * All routes share the AppLayout (header with breadcrumbs)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <CountryView />,
      },
      {
        path: 'region/:regionId',
        element: <RegionView />,
      },
      {
        path: 'region/:regionId/agent/:agentId',
        element: <AgentView />,
      },
      // Catch-all: redirect to country
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;

import { createBrowserRouter, Navigate, Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { SurveysPage } from '../components/SurveysPage';
import { ResultsPage } from '../components/ResultsPage';
import { ValidationPage } from '../components/ValidationPage';
import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useRegion } from '../hooks/useTerritories';
import ChileMapView from '../components/ChileMapView';
import RegionSceneView from '../components/RegionSceneView';
import AgentInspectorPanel from '../components/AgentInspectorPanel';
import { MapToolbar } from '../components/MapToolbar';
import { MainNavigation } from '../components/MainNavigation';
import { useAgentById } from '../hooks/useAgents';
import { TerritoryRegion } from '../types/territory';
import { ToastContainer } from 'react-toastify';
import ReactModal from 'react-modal';
import MusicButton from '../components/buttons/MusicButton.tsx';
import Button from '../components/buttons/Button.tsx';
import InteractButton from '../components/buttons/InteractButton.tsx';
import FreezeButton from '../components/FreezeButton.tsx';
import starImg from '/assets/star.svg';
import helpImg from '/assets/help.svg';
import { MAX_HUMAN_PLAYERS } from '../../convex/constants.ts';

/**
 * GameFooter - Footer with AI Town controls
 * Hidden on country view (/) to avoid overlapping with map
 */
function GameFooter({ onHelpClick }: { onHelpClick: () => void }) {
  const location = useLocation();
  const isCountryView = location.pathname === '/';
  
  // Hide footer on country view to prevent visual overlap with map
  if (isCountryView) {
    return null;
  }
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 flex items-center gap-3 p-4 flex-wrap pointer-events-none z-50 bg-gradient-to-t from-black/50 to-transparent">
      <div className="flex gap-4 flex-grow pointer-events-auto">
        <FreezeButton />
        <MusicButton />
        <Button href="https://github.com/a16z-infra/ai-town" imgUrl={starImg}>
          Star
        </Button>
        <InteractButton />
        <Button imgUrl={helpImg} onClick={onHelpClick}>
          Help
        </Button>
      </div>
    </footer>
  );
}

/**
 * HelpModal - Help dialog content
 */
function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Help modal"
      ariaHideApp={false}
    >
      <div className="font-body">
        <h1 className="text-center text-6xl font-bold font-display game-title">Ayuda</h1>
        <p className="mt-4">
          Bienvenido a Pulso Social. Esta plataforma permite realizar encuestas sintéticas
          con agentes de IA distribuidos por regiones de Chile.
        </p>
        <h2 className="text-4xl mt-6">Navegación</h2>
        <p className="mt-2">
          La aplicación tiene 3 niveles de navegación:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li><strong>Nivel País (/):</strong> Mapa de Chile con todas las regiones. Haz click en una región para explorarla.</li>
          <li><strong>Nivel Región (/region/:regionId):</strong> Vista del mundo AI Town para la región seleccionada. Observa a los agentes interactuar.</li>
          <li><strong>Nivel Agente (/region/:regionId/agent/:agentId):</strong> Panel de inspección detallada de un agente específico. Se abre como panel lateral.</li>
        </ul>
        <h2 className="text-4xl mt-6">URLs Compartibles</h2>
        <p className="mt-2">
          Ahora puedes compartir enlaces directos:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-1">
          <li><code>/</code> - Vista país completa</li>
          <li><code>/region/metropolitana</code> - Región específica</li>
          <li><code>/region/metropolitana/agent/agent-123</code> - Agente específico</li>
        </ul>
        <h2 className="text-4xl mt-6">Interactividad</h2>
        <p className="mt-2">
          En la vista de región, haz click en los agentes (botones circulares en el header)
          para ver sus detalles. Usa los breadcrumbs para navegar entre niveles.
        </p>
        <p className="mt-4 text-brown-400">
          Pulso Social soporta hasta {MAX_HUMAN_PLAYERS} humanos simultáneos.
        </p>
      </div>
    </ReactModal>
  );
}

const modalStyles = {
  overlay: {
    backgroundColor: 'rgb(0, 0, 0, 75%)',
    zIndex: 100,
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    maxWidth: '80%',
    maxHeight: '80%',
    overflow: 'auto',
    border: '10px solid rgb(23, 20, 33)',
    borderRadius: '0',
    background: 'rgb(35, 38, 58)',
    color: 'white',
    fontFamily: '"Upheaval Pro", "sans-serif"',
  },
};

/**
 * AppLayout - Common layout wrapper for all routes
 * 
 * Jerarquía de navegación:
 * 1. MainNavigation - Barra principal del producto (siempre visible)
 * 2. MapToolbar - Barra contextual del mapa (solo en vistas de mapa)
 * 
 * Esto establece claramente:
 * - MainNavigation = Navegación GLOBAL entre módulos
 * - MapToolbar = Contexto LOCAL del mapa (breadcrumb + capas)
 */
function AppLayout() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const location = useLocation();
  
  // Determinar si estamos en una página de mapa (vs módulos de encuestas)
  const isMapPage = location.pathname === '/' || 
                    location.pathname.startsWith('/region');
  
  return (
    <div className="relative w-full h-screen flex flex-col bg-slate-900">
      {/* 
        NIVEL 1: MainNavigation 
        Navegación principal del producto - siempre visible
        Módulos: Mapa, Encuestas, Resultados, Validación
      */}
      <MainNavigation />
      
      {/* 
        NIVEL 2: MapToolbar (solo en páginas de mapa)
        Barra contextual secundaria - más ligera
        Proporciona: breadcrumb de ubicación + selector de capas
      */}
      {isMapPage && <MapToolbar />}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
      
      {/* Footer - hidden on country view */}
      <GameFooter onHelpClick={() => setHelpModalOpen(true)} />
      
      {/* Help Modal */}
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      
      {/* Toast Container */}
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
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
    console.log('[CountryView] Region selected:', region.id, region.name);
    navigateToRegion(region);
    const url = `/region/${region.id}`;
    console.log('[CountryView] Navigating to:', url);
    navigate(url);
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
      // Survey routes
      {
        path: 'surveys',
        element: <SurveysPage />,
      },
      {
        path: 'results',
        element: <ResultsPage />,
      },
      {
        path: 'validation',
        element: <ValidationPage />,
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

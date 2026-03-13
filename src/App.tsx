import { RouterProvider, useLocation } from 'react-router-dom';
import { router } from './routes';
import { ToastContainer } from 'react-toastify';
import starImg from '/assets/star.svg';
import helpImg from '/assets/help.svg';
import { useState } from 'react';
import ReactModal from 'react-modal';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import { MAX_HUMAN_PLAYERS } from '../convex/constants.ts';

/**
 * Footer component that conditionally renders based on route
 * Hidden on country view (/) to avoid overlapping with map
 * Shown on region and agent views where game controls make sense
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
 * App - Main entry point for Pulso Social (formerly AI Town)
 * 
 * Architecture:
 * - React Router handles navigation with real URLs
 * - Routes defined in src/routes/index.tsx
 * - Store syncs with URL for state persistence
 * - Footer: Original AI Town controls (preserved for compatibility)
 * - Modal: Help dialog
 * 
 * Layout:
 * - RouterProvider wraps the entire app
 * - Fixed footer overlay for game controls
 * - Modal overlays everything when open
 * 
 * 3-Level Navigation (handled by React Router):
 * 1. Country (/): ChileMapView - Map of Chile with clickable regions
 * 2. Region (/region/:regionId): RegionSceneView - AI Town world for selected region
 * 3. Agent (/region/:regionId/agent/:agentId): AgentInspectorPanel - Overlay panel on top of region view
 */
/**
 * Inner app component that has access to router context
 */
function AppContent() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  return (
    <>
      {/* 
        RouterProvider - Main application router
        Handles all navigation with real URLs
      */}
      <RouterProvider router={router} />

      {/* 
        Footer - Original AI Town controls
        Fixed at bottom, overlays the router content
        Hidden on country view (/) to prevent map overlap
        Shown on region/agent views where game controls make sense
      */}
      <GameFooter onHelpClick={() => setHelpModalOpen(true)} />

      {/* Help Modal */}
      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
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
      
      <ToastContainer position="bottom-right" autoClose={2000} closeOnClick theme="dark" />
    </>
  );
}

export default function App() {
  return (
    <div className="relative min-h-screen font-body game-background overflow-hidden">
      <AppContent />
    </div>
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

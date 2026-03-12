import MapRoot from './components/MapRoot';
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
 * App - Main entry point for Pulso Social (formerly AI Town)
 * 
 * Architecture:
 * - MapRoot: Handles 3-level navigation (country → region → agent)
 * - Footer: Original AI Town controls (preserved for compatibility)
 * - Modal: Help dialog
 * 
 * Layout:
 * - Full-screen MapRoot with its own internal header
 * - Fixed footer overlay for game controls
 * - Modal overlays everything when open
 * 
 * 3-Level Navigation (handled by MapRoot):
 * 1. Country: ChileMapView - Map of Chile with clickable regions
 * 2. Region: RegionSceneView - AI Town world for selected region
 * 3. Agent: AgentInspectorPanel - Overlay panel on top of region view
 */
export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  return (
    <div className="relative min-h-screen font-body game-background overflow-hidden">
      {/* 
        MapRoot - Main application shell
        Handles all 3-level navigation internally
        Takes full viewport height
      */}
      <MapRoot />

      {/* 
        Footer - Original AI Town controls
        Fixed at bottom, overlays MapRoot
        Preserved for backward compatibility
      */}
      <footer className="fixed bottom-0 left-0 right-0 flex items-center gap-3 p-4 flex-wrap pointer-events-none z-50 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex gap-4 flex-grow pointer-events-auto">
          <FreezeButton />
          <MusicButton />
          <Button href="https://github.com/a16z-infra/ai-town" imgUrl={starImg}>
            Star
          </Button>
          <InteractButton />
          <Button imgUrl={helpImg} onClick={() => setHelpModalOpen(true)}>
            Help
          </Button>
        </div>
      </footer>

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
            <li><strong>Nivel País:</strong> Mapa de Chile con todas las regiones. Haz click en una región para explorarla.</li>
            <li><strong>Nivel Región:</strong> Vista del mundo AI Town para la región seleccionada. Observa a los agentes interactuar.</li>
            <li><strong>Nivel Agente:</strong> Panel de inspección detallada de un agente específico. Se abre como panel lateral.</li>
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

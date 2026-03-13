/**
 * MapToolbar Component
 *
 * TOOLBAR CONTEXTUAL DEL MAPA
 * ===========================
 * Esta es una barra SECUNDARIA y CONTEXTUAL que solo aparece en la vista del mapa.
 * Proporciona navegación dentro del contexto del mapa (breadcrumb) y
 * control de visualización de capas (layer switcher).
 *
 * Jerarquía visual:
 * - Barra secundaria, más ligera y compacta
 * - Fondo translúcido para no competir con MainNavigation
 * - Altura reducida (h-10) para indicar menor importancia
 * - Ubicada justo debajo de MainNavigation
 *
 * Diferencia semántica con MainNavigation:
 * - MainNavigation = Navegación entre MÓDULOS del producto (global)
 * - MapToolbar = Contexto y visualización del MAPA (local al módulo Mapa)
 *
 * Secciones:
 * 1. Breadcrumb: Muestra ubicación actual (Chile > Región > Agente)
 * 2. Layer Switcher: Controla qué capa de datos se visualiza en el mapa
 *
 * NOTA: Los labels de capas usan terminología diferente a los módulos:
 * - "Población" (capa) vs "Encuestas" (módulo)
 * - "Eventos" (capa) vs "Resultados" (módulo)
 * Esto evita confusión entre capas de visualización y módulos funcionales.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { MapLayer, LAYER_CONFIGS } from '../types/territory';
import { useAppStore } from '../store/appStore';
import { useRegion } from '../hooks/useTerritories';
import { useAgentById } from '../hooks/useAgents';

interface MapToolbarProps {
  /** Si se debe mostrar el selector de capas (solo en nivel país) */
  showLayerSwitcher?: boolean;
}

/**
 * MapToolbar - Barra contextual del mapa
 *
 * Combina breadcrumb de ubicación + selector de capas de visualización.
 * Diseño ligero y compacto para no competir con MainNavigation.
 */
export function MapToolbar({ showLayerSwitcher = true }: MapToolbarProps) {
  const navigate = useNavigate();
  const { regionId, agentId } = useParams<{ regionId: string; agentId: string }>();
  const { selectedRegion, selectedAgentId, navigateToCountry, navigateToRegion, setActiveLayer, activeLayer } = useAppStore();

  // Fetch data for display
  const { region: urlRegion } = useRegion(regionId || '');
  const displayRegion = selectedRegion || urlRegion;
  const displayAgentId = selectedAgentId || agentId;

  const currentLevel = agentId ? 'agent' : regionId ? 'region' : 'country';

  // Handlers
  const handleNavigateToCountry = () => {
    navigateToCountry();
    navigate('/');
  };

  const handleNavigateToRegion = () => {
    if (displayRegion) {
      navigateToRegion(displayRegion);
      navigate(`/region/${displayRegion.id}`);
    }
  };

  const layers: MapLayer[] = ['population', 'events', 'survey', 'results'];

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Left: Breadcrumb Navigation */}
          <nav className="flex items-center gap-1 text-sm">
            {/* Chile (Country) */}
            <BreadcrumbItem
              label="Chile"
              isActive={currentLevel === 'country'}
              isClickable={currentLevel !== 'country'}
              onClick={currentLevel !== 'country' ? handleNavigateToCountry : undefined}
            />

            {/* Separator */}
            {currentLevel !== 'country' && <ChevronRight />}

            {/* Region */}
            {currentLevel !== 'country' && displayRegion && (
              <BreadcrumbItem
                label={displayRegion.shortName}
                isActive={currentLevel === 'region'}
                isClickable={currentLevel === 'agent'}
                onClick={currentLevel === 'agent' ? handleNavigateToRegion : undefined}
              />
            )}

            {/* Separator */}
            {currentLevel === 'agent' && <ChevronRight />}

            {/* Agent */}
            {currentLevel === 'agent' && displayAgentId && (
              <BreadcrumbItem
                label="Agente"
                isActive={true}
                isClickable={false}
              />
            )}
          </nav>

          {/* Right: Layer Switcher (only at country level) */}
          {showLayerSwitcher && currentLevel === 'country' && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">Capa:</span>
              <div className="flex items-center gap-0.5 bg-slate-900/50 rounded-lg p-0.5">
                {layers.map((layer) => {
                  const config = LAYER_CONFIGS[layer];
                  const isActive = activeLayer === layer;

                  return (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer)}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded-md
                        text-xs transition-all duration-150
                        ${isActive
                          ? 'bg-slate-600 text-white'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }
                      `}
                      title={config.description}
                    >
                      <span>{config.icon}</span>
                      <span className="hidden sm:inline">{config.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * BreadcrumbItem - Item individual del breadcrumb
 */
interface BreadcrumbItemProps {
  label: string;
  isActive: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

function BreadcrumbItem({ label, isActive, isClickable, onClick }: BreadcrumbItemProps) {
  const baseClasses = 'px-2 py-0.5 rounded text-sm transition-colors duration-150';

  if (isClickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} text-slate-400 hover:text-white hover:bg-slate-700/50 cursor-pointer`}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={`${baseClasses} ${
        isActive
          ? 'text-white font-medium bg-slate-700/50'
          : 'text-slate-500'
      }`}
    >
      {label}
    </span>
  );
}

/**
 * ChevronRight - Separador del breadcrumb
 */
function ChevronRight() {
  return (
    <svg
      className="w-3 h-3 text-slate-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

export default MapToolbar;

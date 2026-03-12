import { MapLayer, LAYER_CONFIGS } from '../types/territory';
import { useAppStore } from '../store/appStore';

/**
 * MapLayerSwitcher - Layer selection control for the country map
 * 
 * Architecture:
 * - Reads activeLayer from store
 * - Uses LAYER_CONFIGS for consistent layer definitions
 * - Only visible at country level (enforced by parent)
 * 
 * Design:
 * - Compact button group
 * - Icons + short labels for space efficiency
 * - Active state clearly indicated
 * 
 * Layers:
 * - population: Population density
 * - events: Recent events
 * - survey: Active surveys
 * - results: Completed survey results
 */
export default function MapLayerSwitcher() {
  const { activeLayer, setActiveLayer } = useAppStore();
  
  const layers: MapLayer[] = ['population', 'events', 'survey', 'results'];

  return (
    <div className="flex items-center gap-1 bg-brown-800/80 backdrop-blur-sm rounded-lg p-1 border border-brown-700">
      {layers.map((layer) => {
        const config = LAYER_CONFIGS[layer];
        const isActive = activeLayer === layer;
        
        return (
          <button
            key={layer}
            onClick={() => setActiveLayer(layer)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-md
              text-xs font-medium transition-all duration-150
              ${isActive 
                ? 'bg-brown-600 text-white shadow-sm' 
                : 'text-white/60 hover:text-white/80 hover:bg-brown-700/50'
              }
            `}
            title={config.description}
          >
            <span className="text-sm">{config.icon}</span>
            <span className="hidden sm:inline">{config.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

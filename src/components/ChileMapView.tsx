import { TerritoryRegion, MapLayer, LAYER_CONFIGS, getScoreOpacity } from '../types/territory';
import { useAppStore } from '../store/appStore';
import { useTerritories, useTerritoriesWithEvents } from '../hooks/useTerritories';

/**
 * ChileMapView - Country-level strategic map
 * 
 * Architecture:
 * - Data-driven: fetches regions from Supabase via useTerritories hook, uses activeLayer from store
 * - Layer visualization: shows different data dimensions (population, events, surveys, results)
 * - Interactive: regions are clickable to navigate to region view
 * - Responsive: uses percentage-based positioning for flexible layout
 * - Fallback: uses mocks if Supabase is not configured or fails
 * - Event-aware: when layer is 'events', fetches real event statistics from Supabase
 * 
 * Design decisions:
 * - Simplified vertical layout (not geographic projection) for clarity
 * - Color intensity represents data values (opacity-based)
 * - No heavy GeoJSON or mapping libraries (kept lightweight)
 * 
 * Data Flow:
 * 1. useTerritories or useTerritoriesWithEvents hook fetches from Supabase (with fallback to mocks)
 * 2. Regions are rendered as interactive markers
 * 3. Clicking a region triggers onRegionSelect callback
 * 4. When events layer is active, eventScore is calculated from real database events
 */
interface ChileMapViewProps {
  /** Callback when a region is selected */
  onRegionSelect: (region: TerritoryRegion) => void;
}

/**
 * ChileMapView Component
 * 
 * Displays all Chilean regions as interactive markers on a simplified map.
 * Visual appearance changes based on the active layer from the store.
 * Data is loaded from Supabase with automatic fallback to mocks.
 * When the events layer is active, fetches real event statistics from Supabase.
 */
export default function ChileMapView({ onRegionSelect }: ChileMapViewProps) {
  const { activeLayer } = useAppStore();
  
  // Use different hooks based on active layer
  // For events layer, use hook that fetches real event statistics
  const territoriesData = activeLayer === 'events' 
    ? useTerritoriesWithEvents()
    : useTerritories();
  
  const { regions, loading, error } = territoriesData;
  
  // Get layer configuration for current active layer
  const layerConfig = LAYER_CONFIGS[activeLayer];

  // Show loading state
  if (loading) {
    return (
      <div className="relative w-full h-full bg-brown-900 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
          <p className="text-white/60 text-sm">Cargando territorios...</p>
        </div>
      </div>
    );
  }

  // Show error state (but still render with available data)
  const hasError = error && regions.length === 0;

  return (
    <div className="relative w-full h-full bg-brown-900 overflow-hidden">
      {/* Map Title */}
      <div className="absolute top-4 left-4 z-10">
        <h2 className="text-2xl font-display text-white/90">Chile</h2>
        <p className="text-sm text-white/60 mt-1">
          {layerConfig.description}
        </p>
        {error && (
          <p className="text-xs text-yellow-500/80 mt-1">
            ⚠️ Usando datos locales
          </p>
        )}
      </div>

      {/* Map Container - uses padding to create map area */}
      <div className="relative w-full h-full p-8 pt-20">
        {/* Map Background - subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Error State - No data available */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-6 bg-brown-800/80 rounded-lg border border-red-500/30">
              <p className="text-red-400 text-sm mb-2">Error al cargar datos</p>
              <p className="text-white/50 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Region Markers */}
        <div className="relative w-full h-full">
          {regions.map((region) => (
            <RegionMarker
              key={region.id}
              region={region}
              activeLayer={activeLayer}
              onClick={() => onRegionSelect(region)}
            />
          ))}
        </div>

        {/* Legend */}
        <MapLegend activeLayer={activeLayer} />
      </div>
    </div>
  );
}

/**
 * RegionMarker - Individual region marker on the map
 * 
 * Props:
 * - region: Territory data
 * - activeLayer: Current visualization layer
 * - onClick: Click handler
 */
interface RegionMarkerProps {
  region: TerritoryRegion;
  activeLayer: MapLayer;
  onClick: () => void;
}

function RegionMarker({ region, activeLayer, onClick }: RegionMarkerProps) {
  // Get the score for the current layer
  const score = region[layerScoreField[activeLayer]] as number;
  const opacity = getScoreOpacity(score);
  const layerConfig = LAYER_CONFIGS[activeLayer];

  // Calculate position (convert percentage to CSS)
  // Note: y is stretched to accommodate Chile's long shape
  const left = `${region.x}%`;
  const top = `${(region.y / 180) * 100}%`;
  const size = `${region.radius * 8}px`;

  return (
    <button
      onClick={onClick}
      className={`
        absolute rounded-full 
        transition-all duration-200 ease-out
        hover:scale-110 hover:z-10
        focus:outline-none focus:ring-2 focus:ring-white/50
        ${layerConfig.color}
        ${opacity}
      `}
      style={{
        left,
        top,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
      }}
      title={`${region.name} - ${layerConfig.label}: ${score}`}
    >
      {/* Inner content - region short name on larger markers */}
      {region.radius >= 4 && (
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/90 truncate px-1">
          {region.shortName}
        </span>
      )}
      
      {/* Pulse animation for high activity */}
      {score >= 80 && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-white" />
      )}
    </button>
  );
}

/**
 * MapLegend - Shows the legend for the current layer
 */
interface MapLegendProps {
  activeLayer: MapLayer;
}

function MapLegend({ activeLayer }: MapLegendProps) {
  const layerConfig = LAYER_CONFIGS[activeLayer];
  
  return (
    <div className="absolute bottom-4 right-4 bg-brown-800/90 backdrop-blur-sm rounded-lg p-3 border border-brown-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{layerConfig.icon}</span>
        <span className="text-sm font-medium text-white/90">{layerConfig.label}</span>
      </div>
      
      {/* Intensity scale */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-white/50">Bajo</span>
        <div className="flex gap-0.5">
          {[20, 40, 60, 80, 100].map((score) => (
            <div
              key={score}
              className={`w-4 h-4 rounded-sm ${layerConfig.color} ${getScoreOpacity(score)}`}
            />
          ))}
        </div>
        <span className="text-xs text-white/50">Alto</span>
      </div>
    </div>
  );
}

/**
 * Mapping from layer to score field
 * Centralizes which field to read for each layer
 */
const layerScoreField: Record<MapLayer, keyof TerritoryRegion> = {
  population: 'populationScore',
  events: 'eventScore',
  survey: 'surveyScore',
  results: 'resultScore',
};

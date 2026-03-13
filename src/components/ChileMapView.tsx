import { TerritoryRegion, MapLayer, LAYER_CONFIGS, getScoreOpacity, MacroZone } from '../types/territory';
import { useAppStore } from '../store/appStore';
import { useTerritories, useTerritoriesWithEvents } from '../hooks/useTerritories';
import { useAgentCountByRegion } from '../hooks/useAgents';
import { useEventsByTerritory } from '../hooks/useEvents';
import { useState, useMemo, useCallback } from 'react';

/**
 * ChileMapView - Premium country-level strategic map
 * 
 * Design Philosophy:
 * - Clean, premium UI inspired by Google/Data visualization
 * - Clear geographic representation of Chile's unique shape
 * - Macrozone visual guides for better orientation
 * - High contrast, accessible labels
 * - Smooth interactions and clear visual feedback
 * - Product-quality finish, not prototype/debug feel
 * 
 * Architecture:
 * - Data-driven: fetches regions from Supabase via useTerritories hook
 * - Layer visualization: shows different data dimensions
 * - Interactive: regions are clickable with clear hover states
 * - Responsive: percentage-based positioning optimized for Chile's shape
 * - Macrozone bands: subtle visual guides for north/centro/sur/austral
 */
interface ChileMapViewProps {
  /** Callback when a region is selected */
  onRegionSelect: (region: TerritoryRegion) => void;
}

/**
 * Macrozone configuration for visual bands
 */
const MACROZONE_CONFIG: Record<MacroZone, { label: string; color: string; yStart: number; yEnd: number }> = {
  norte_grande: { label: 'Norte Grande', color: 'from-amber-500/5', yStart: 0, yEnd: 35 },
  norte_chico: { label: 'Norte Chico', color: 'from-yellow-500/5', yStart: 35, yEnd: 60 },
  centro: { label: 'Zona Central', color: 'from-green-500/5', yStart: 60, yEnd: 105 },
  sur: { label: 'Zona Sur', color: 'from-blue-500/5', yStart: 105, yEnd: 155 },
  austral: { label: 'Zona Austral', color: 'from-purple-500/5', yStart: 155, yEnd: 185 },
};

/**
 * ChileMapView Component
 * 
 * Displays all Chilean regions as an elegant, premium territorial visualization.
 * Features macrozone guides, improved typography, and clear visual hierarchy.
 */
export default function ChileMapView({ onRegionSelect }: ChileMapViewProps) {
  const { activeLayer } = useAppStore();
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ region: TerritoryRegion; x: number | undefined; y: number | undefined } | null>(null);
  
  // Use different hooks based on active layer
  const territoriesData = activeLayer === 'events' 
    ? useTerritoriesWithEvents()
    : useTerritories();
  
  const { regions, loading, error } = territoriesData;
  
  // Get layer configuration
  const layerConfig = LAYER_CONFIGS[activeLayer];

  // Group regions by macrozone for rendering
  const regionsByZone = useMemo(() => {
    const grouped: Record<MacroZone, TerritoryRegion[]> = {
      norte_grande: [],
      norte_chico: [],
      centro: [],
      sur: [],
      austral: [],
    };
    regions.forEach(r => {
      grouped[r.macroZone].push(r);
    });
    return grouped;
  }, [regions]);

  if (loading) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/50 mx-auto mb-4" />
          <p className="text-white/60 text-sm font-medium">Cargando territorios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Premium Header - Now part of top panel */}
      <div className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-light text-white tracking-tight">
              República de <span className="font-semibold">Chile</span>
            </h1>
            <p className="text-sm text-white/50 mt-1 max-w-md">
              {layerConfig.description}
            </p>
            {error && (
              <p className="text-xs text-amber-400/80 mt-2 flex items-center gap-1">
                <span>⚠️</span> Usando datos locales
              </p>
            )}
          </div>
          
          {/* Active Layer Indicator */}
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
            <span className="text-lg">{layerConfig.icon}</span>
            <div className="text-right">
              <p className="text-xs text-white/40 uppercase tracking-wider">Capa activa</p>
              <p className="text-sm font-medium text-white">{layerConfig.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split Layout */}
      <div className="flex w-full h-full pt-20">
        {/* Left Side: Map Area (takes most space) */}
        <div className="flex-1 h-full px-4 pb-4">
          {/* Chile Shape Container - optimized for vertical layout */}
          <div className="relative w-full h-full max-w-3xl mx-auto">
            
            {/* Macrozone Background Bands */}
            {Object.entries(MACROZONE_CONFIG).map(([zone, config]) => (
              <MacrozoneBand
                key={zone}
                zone={zone as MacroZone}
                config={config}
                regions={regionsByZone[zone as MacroZone]}
              />
            ))}

            {/* Subtle Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, white 1px, transparent 1px),
                  linear-gradient(to bottom, white 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />

            {/* Region Markers - Clean, no overlays */}
            <div className="relative w-full h-full">
              {regions.map((region) => (
                <RegionMarker
                  key={region.id}
                  region={region}
                  activeLayer={activeLayer}
                  isHovered={hoveredRegion === region.id}
                  isSelected={false}
                  onHover={(isHovered) => {
                    setHoveredRegion(isHovered ? region.id : null);
                  }}
                  onTooltip={(region, x, y) => setTooltip(region ? { region, x, y } : null)}
                  onClick={() => onRegionSelect(region)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Context Panel (separate from map) */}
        <div className="w-72 h-full p-4 flex flex-col gap-4">
          {/* Legend Panel */}
          <MapLegend activeLayer={activeLayer} />
          
          {/* Additional context can go here */}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.x !== undefined && tooltip.y !== undefined && (
        <RegionTooltip
          region={tooltip.region}
          activeLayer={activeLayer}
          x={tooltip.x}
          y={tooltip.y}
        />
      )}
      
      {/* Guide Text - Bottom overlay */}
      <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center pointer-events-none">
        <div className="bg-slate-800/80 backdrop-blur-md rounded-full px-6 py-3 border border-white/10 shadow-xl">
          <p className="text-sm text-white/70 flex items-center gap-2">
            <span className="text-lg">👆</span>
            <span>Haz click en una región para explorar <span className="text-white font-medium">agentes</span>, <span className="text-white font-medium">eventos</span> y <span className="text-white font-medium">estudios</span></span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * MacrozoneBand - Visual band for each macrozone
 */
interface MacrozoneBandProps {
  zone: MacroZone;
  config: { label: string; color: string; yStart: number; yEnd: number };
  regions: TerritoryRegion[];
}

function MacrozoneBand({ zone, config, regions }: MacrozoneBandProps) {
  const top = `${(config.yStart / 185) * 100}%`;
  const height = `${((config.yEnd - config.yStart) / 185) * 100}%`;
  
  return (
    <div
      className={`absolute left-0 right-0 bg-gradient-to-r ${config.color} to-transparent pointer-events-none`}
      style={{ top, height }}
    >
      {/* Zone Label */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <span className="text-[10px] uppercase tracking-widest text-white/20 font-medium writing-mode-vertical">
          {config.label}
        </span>
      </div>
      
      {/* Region count indicator */}
      {regions.length > 0 && (
        <div className="absolute right-2 top-2">
          <span className="text-[10px] text-white/30">
            {regions.length} reg.{regions.length > 1 ? '' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * RegionMarker - Enhanced individual region marker with clear affordance
 * 
 * Features:
 * - Clear cursor pointer on hover
 * - Visual feedback on click (scale down briefly)
 * - Enhanced glow effect
 * - Always visible labels with better contrast
 */
interface RegionMarkerProps {
  region: TerritoryRegion;
  activeLayer: MapLayer;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (isHovered: boolean) => void;
  onTooltip: (region: TerritoryRegion | null, x?: number, y?: number) => void;
  onClick: () => void;
}

function RegionMarker({ 
  region, 
  activeLayer, 
  isHovered, 
  isSelected,
  onHover, 
  onTooltip,
  onClick 
}: RegionMarkerProps) {
  const [isPressed, setIsPressed] = useState(false);
  const score = region[layerScoreField[activeLayer]] as number;
  const opacity = getScoreOpacity(score);
  const layerConfig = LAYER_CONFIGS[activeLayer];

  // Calculate position - optimized for Chile's vertical shape
  const left = `${region.x}%`;
  const top = `${(region.y / 185) * 100}%`;
  
  // Size based on population/importance
  const baseSize = region.radius * 10;
  const size = isHovered ? baseSize * 1.3 : baseSize;

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    onClick();
  };

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        left,
        top,
        transform: 'translate(-50%, -50%)',
        zIndex: isHovered ? 50 : 10,
      }}
      onMouseEnter={(e) => {
        onHover(true);
        onTooltip(region, e.clientX, e.clientY);
      }}
      onMouseLeave={() => {
        onHover(false);
        onTooltip(null);
      }}
      onMouseMove={(e) => onTooltip(region, e.clientX, e.clientY)}
    >
      {/* Outer glow ring - enhanced on hover */}
      <div 
        className={`
          absolute rounded-full transition-all duration-300
          ${isHovered || isSelected ? `${layerConfig.color} opacity-40 animate-pulse` : 'opacity-0'}
        `}
        style={{
          width: isHovered ? size * 2 : size * 1.5,
          height: isHovered ? size * 2 : size * 1.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Secondary glow ring */}
      <div 
        className={`
          absolute rounded-full transition-all duration-300
          ${isHovered ? 'bg-white/10 opacity-100' : 'opacity-0'}
        `}
        style={{
          width: size * 2.5,
          height: size * 2.5,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Main marker button */}
      <button
        onClick={handleClick}
        className={`
          relative rounded-full cursor-pointer
          transition-all duration-150 ease-out
          focus:outline-none focus:ring-2 focus:ring-white/50
          ${layerConfig.color}
          ${opacity}
          ${isHovered ? 'scale-110 shadow-lg shadow-white/30' : 'hover:scale-105'}
          ${isPressed ? 'scale-95' : ''}
          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
        `}
        style={{
          width: size,
          height: size,
        }}
        aria-label={`Explorar ${region.name}`}
      >
        {/* Inner highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        
        {/* Click ripple effect */}
        {isPressed && (
          <span className="absolute inset-0 rounded-full bg-white/50 animate-ping" />
        )}
        
        {/* Pulse for high activity */}
        {score >= 80 && !isHovered && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-white" />
        )}
      </button>
      
      {/* Label - always visible with better styling */}
      <div 
        className={`
          absolute left-1/2 -translate-x-1/2 mt-2
          transition-all duration-200 pointer-events-none
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-0'}
        `}
        style={{ top: size / 2 }}
      >
        <span className={`
          text-xs font-semibold whitespace-nowrap px-2 py-0.5 rounded-full
          ${isHovered 
            ? 'text-white bg-slate-900/80 shadow-lg' 
            : 'text-white/90 bg-slate-900/60'}
          backdrop-blur-sm
          transition-all duration-200
        `}>
          {region.shortName}
        </span>
      </div>
      
      {/* Click hint on hover */}
      {isHovered && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 -mt-6 pointer-events-none"
          style={{ top: -size / 2 }}
        >
          <span className="text-[10px] text-white/60 bg-slate-900/80 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm">
            Click para explorar
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * RegionTooltip - Floating tooltip on hover
 */
interface RegionTooltipProps {
  region: TerritoryRegion;
  activeLayer: MapLayer;
  x: number;
  y: number;
}

function RegionTooltip({ region, activeLayer, x, y }: RegionTooltipProps) {
  const layerConfig = LAYER_CONFIGS[activeLayer];
  const score = region[layerScoreField[activeLayer]] as number;
  
  // Position tooltip near cursor but keep on screen
  const tooltipX = Math.min(x + 16, window.innerWidth - 200);
  const tooltipY = Math.min(y + 16, window.innerHeight - 120);
  
  return (
    <div 
      className="fixed z-50 bg-slate-800/95 backdrop-blur-md rounded-lg p-3 border border-white/10 shadow-xl pointer-events-none"
      style={{ left: tooltipX, top: tooltipY }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{layerConfig.icon}</span>
        <span className="font-semibold text-white">{region.name}</span>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-white/50">{layerConfig.label}</span>
          <span className="font-medium text-white">{score}/100</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/50">Población</span>
          <span className="text-white/70">{region.population?.toLocaleString('es-CL')}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-white/50">Capital</span>
          <span className="text-white/70">{region.capital}</span>
        </div>
      </div>
      
      {/* Score bar */}
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${layerConfig.color} opacity-100`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

/**
 * MapLegend - Enhanced legend for the current layer
 * Now positioned in a side panel, not floating over the map
 */
interface MapLegendProps {
  activeLayer: MapLayer;
}

function MapLegend({ activeLayer }: MapLegendProps) {
  const layerConfig = LAYER_CONFIGS[activeLayer];
  
  return (
    <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg ${layerConfig.color} opacity-80 flex items-center justify-center text-xl`}>
          {layerConfig.icon}
        </div>
        <div>
          <p className="font-semibold text-white">{layerConfig.label}</p>
          <p className="text-xs text-white/50">Intensidad visual</p>
        </div>
      </div>
      
      {/* Intensity scale */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">Bajo</span>
        <div className="flex gap-1">
          {[20, 40, 60, 80, 100].map((score) => (
            <div
              key={score}
              className={`w-6 h-6 rounded-md ${layerConfig.color} ${getScoreOpacity(score)}`}
            />
          ))}
        </div>
        <span className="text-xs text-white/40">Alto</span>
      </div>
      
      {/* Macrozone guide */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-xs text-white/40 mb-2">Macrozonas</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MACROZONE_CONFIG).map(([zone, config]) => (
            <span 
              key={zone}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50"
            >
              {config.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Mapping from layer to score field
 */
const layerScoreField: Record<MapLayer, keyof TerritoryRegion> = {
  population: 'populationScore',
  events: 'eventScore',
  survey: 'surveyScore',
  results: 'resultScore',
};

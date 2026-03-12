import { create } from 'zustand';
import { TerritoryRegion, MapLayer } from '../types/territory';

// Re-export territory types for convenience
export type { TerritoryRegion, MapLayer } from '../types/territory';

// Re-export agent types for convenience
export type { 
  FullAgent, 
  AgentSummary, 
  AgentProfile,
  AgentTraits,
  AgentMemory,
  AgentState,
  AgentEventExposure,
} from '../types/agent';

/**
 * AppState - Global application state
 * 
 * Responsibilities:
 * - Navigation state (selected region, agent panel visibility)
 * - UI state (active map layer)
 * - Selection state (single source of truth)
 * 
 * Non-responsibilities:
 * - Territory data (lives in mocks/territories.ts or API)
 * - Agent data (lives in mocks/agents.ts or Convex/Supabase)
 * - Survey data (lives in survey engine)
 * 
 * Design decisions:
 * - Store only IDs, not full objects (better for serialization, easier to sync)
 * - Agent data fetched by ID when needed
 * - No embedded mocks - all data comes from external sources
 */
interface AppState {
  // === Core Selection State ===
  /** Currently selected region (null = country level) */
  selectedRegion: TerritoryRegion | null;
  /** Currently selected agent ID (null = no agent selected) */
  selectedAgentId: string | null;
  /** Whether agent panel is open (overlay on region view) */
  isAgentPanelOpen: boolean;
  
  // === UI State ===
  /** Active visualization layer for country map */
  activeLayer: MapLayer;

  // === Actions ===
  /** Navigate to country level (clear all selections) */
  navigateToCountry: () => void;
  /** Navigate to region level (set region, clear agent) */
  navigateToRegion: (region: TerritoryRegion) => void;
  /** Select an agent by ID (opens panel) */
  selectAgent: (agentId: string | null) => void;
  /** Close agent panel (keep region) */
  closeAgentPanel: () => void;
  /** Set active map layer */
  setActiveLayer: (layer: MapLayer) => void;
}

/**
 * Zustand store for global application state
 * 
 * Design principles:
 * - Minimal state (only what's needed for navigation)
 * - Store IDs not objects (better serialization)
 * - Actions are pure state updates (no side effects)
 * - Data fetching happens in components/hooks
 */
export const useAppStore = create<AppState>((set) => ({
  // === Initial State ===
  selectedRegion: null,
  selectedAgentId: null,
  isAgentPanelOpen: false,
  activeLayer: 'population',

  // === Actions ===
  navigateToCountry: () => set({
    selectedRegion: null,
    selectedAgentId: null,
    isAgentPanelOpen: false,
  }),

  navigateToRegion: (region: TerritoryRegion) => set({
    selectedRegion: region,
    selectedAgentId: null,
    isAgentPanelOpen: false,
  }),

  selectAgent: (agentId: string | null) => set({
    selectedAgentId: agentId,
    isAgentPanelOpen: agentId !== null,
  }),

  closeAgentPanel: () => set({
    selectedAgentId: null,
    isAgentPanelOpen: false,
  }),

  setActiveLayer: (layer: MapLayer) => set({ activeLayer: layer }),
}));

/**
 * Derived state helpers
 * Use these in components instead of duplicating logic
 */

/** Current view level based on selection state */
export type ViewLevel = 'country' | 'region' | 'agent';

/**
 * Get current view level from state
 * - country: no region selected
 * - region: region selected, no agent panel
 * - agent: region selected, agent panel open
 */
export function getCurrentViewLevel(state: {
  selectedRegion: TerritoryRegion | null;
  isAgentPanelOpen: boolean;
}): ViewLevel {
  if (state.isAgentPanelOpen && state.selectedRegion) return 'agent';
  if (state.selectedRegion) return 'region';
  return 'country';
}

/**
 * Hook to get current view level
 * Usage: const viewLevel = useViewLevel()
 */
export function useViewLevel(): ViewLevel {
  const { selectedRegion, isAgentPanelOpen } = useAppStore();
  return getCurrentViewLevel({ selectedRegion, isAgentPanelOpen });
}

import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore, getCurrentViewLevel } from '../store/appStore';
import { useRegion } from '../hooks/useTerritories';
import { useAgentById } from '../hooks/useAgents';

/**
 * TerritoryBreadcrumbs - Navigation breadcrumbs for territory hierarchy
 * 
 * Architecture:
 * - Shows current position in hierarchy: Chile > Region > Agent
 * - Each level is clickable to navigate up
 * - Uses React Router for navigation (real URLs)
 * - Syncs with URL params and store state
 * 
 * Hierarchy:
 * - Level 1: Chile (country) - always visible, clickable when at region/agent level
 * - Level 2: Region name - visible when region selected, clickable when at agent level
 * - Level 3: Agent name - visible when agent panel open
 * 
 * Design:
 * - Clean, minimal breadcrumb style
 * - Chevron separators
 * - Current level highlighted
 * - Router-based navigation for shareable URLs
 */
export default function TerritoryBreadcrumbs() {
  const navigate = useNavigate();
  const { regionId, agentId } = useParams<{ regionId: string; agentId: string }>();
  const { selectedRegion, selectedAgentId, isAgentPanelOpen, navigateToCountry, navigateToRegion, closeAgentPanel } = useAppStore();
  
  // Determine current level from URL
  const currentLevel = agentId ? 'agent' : regionId ? 'region' : 'country';
  
  // Fetch region data for display name
  const { region: urlRegion } = useRegion(regionId || '');
  const displayRegion = selectedRegion || urlRegion;
  
  // Fetch agent data for display name
  const { agent: urlAgent } = useAgentById(agentId || '');
  const displayAgentId = selectedAgentId || agentId;

  // Handler: Navigate to country level
  const handleNavigateToCountry = () => {
    navigateToCountry();
    navigate('/');
  };

  // Handler: Navigate to region level
  const handleNavigateToRegion = () => {
    if (displayRegion) {
      navigateToRegion(displayRegion);
      navigate(`/region/${displayRegion.id}`);
    }
  };

  return (
    <nav className="flex items-center gap-2 text-sm">
      {/* Level 1: Chile (Country) */}
      <BreadcrumbItem
        label="Chile"
        isActive={currentLevel === 'country'}
        isClickable={currentLevel !== 'country'}
        onClick={currentLevel !== 'country' ? handleNavigateToCountry : undefined}
      />

      {/* Separator */}
      {currentLevel !== 'country' && (
        <ChevronRight />
      )}

      {/* Level 2: Region */}
      {currentLevel !== 'country' && displayRegion && (
        <BreadcrumbItem
          label={displayRegion.shortName}
          isActive={currentLevel === 'region'}
          isClickable={currentLevel === 'agent'}
          onClick={currentLevel === 'agent' ? handleNavigateToRegion : undefined}
        />
      )}

      {/* Separator */}
      {currentLevel === 'agent' && (
        <ChevronRight />
      )}

      {/* Level 3: Agent */}
      {currentLevel === 'agent' && displayAgentId && (
        <BreadcrumbItem
          label="Agente"
          isActive={true}
          isClickable={false}
        />
      )}
    </nav>
  );
}

/**
 * BreadcrumbItem - Individual breadcrumb item
 */
interface BreadcrumbItemProps {
  label: string;
  isActive: boolean;
  isClickable: boolean;
  onClick?: () => void;
}

function BreadcrumbItem({ label, isActive, isClickable, onClick }: BreadcrumbItemProps) {
  const baseClasses = 'px-2 py-1 rounded transition-colors duration-150';
  
  if (isClickable && onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} text-white/70 hover:text-white hover:bg-brown-700/50 cursor-pointer`}
      >
        {label}
      </button>
    );
  }

  return (
    <span
      className={`${baseClasses} ${
        isActive 
          ? 'text-white font-medium bg-brown-700/30' 
          : 'text-white/50'
      }`}
    >
      {label}
    </span>
  );
}

/**
 * ChevronRight - Separator icon
 */
function ChevronRight() {
  return (
    <svg 
      className="w-4 h-4 text-white/30" 
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

import { useAppStore, getCurrentViewLevel } from '../store/appStore';
import { getAgentById } from '../mocks/agents';

/**
 * TerritoryBreadcrumbs - Navigation breadcrumbs for territory hierarchy
 * 
 * Architecture:
 * - Shows current position in hierarchy: Chile > Region > Agent
 * - Each level is clickable to navigate up
 * - Uses derived state from store (no duplicate state)
 * - Fetches agent name from mocks using selectedAgentId
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
 */
export default function TerritoryBreadcrumbs() {
  const { selectedRegion, selectedAgentId, isAgentPanelOpen, navigateToCountry, navigateToRegion } = useAppStore();
  const currentLevel = getCurrentViewLevel({ selectedRegion, isAgentPanelOpen });
  
  // Fetch agent name from mocks when needed
  const selectedAgentName = selectedAgentId 
    ? getAgentById(selectedAgentId)?.profile.name 
    : null;

  return (
    <nav className="flex items-center gap-2 text-sm">
      {/* Level 1: Chile (Country) */}
      <BreadcrumbItem
        label="Chile"
        isActive={currentLevel === 'country'}
        isClickable={currentLevel !== 'country'}
        onClick={currentLevel !== 'country' ? navigateToCountry : undefined}
      />

      {/* Separator */}
      {currentLevel !== 'country' && (
        <ChevronRight />
      )}

      {/* Level 2: Region */}
      {currentLevel !== 'country' && selectedRegion && (
        <BreadcrumbItem
          label={selectedRegion.shortName}
          isActive={currentLevel === 'region'}
          isClickable={currentLevel === 'agent'}
          onClick={currentLevel === 'agent' ? () => navigateToRegion(selectedRegion) : undefined}
        />
      )}

      {/* Separator */}
      {currentLevel === 'agent' && (
        <ChevronRight />
      )}

      {/* Level 3: Agent */}
      {currentLevel === 'agent' && selectedAgentName && (
        <BreadcrumbItem
          label={selectedAgentName}
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

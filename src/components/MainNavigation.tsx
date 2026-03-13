/**
 * MainNavigation Component
 *
 * Navigation principal visible para toda la aplicación.
 * Expone claramente los módulos principales: Mapa, Encuestas, Resultados, Validación.
 *
 * Design:
 * - Tabs visibles en la parte superior
 * - Estilo consistente con el diseño del juego
 * - Indicador de sección activa
 * - Responsive y accesible
 */

import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'map',
    label: 'Mapa',
    path: '/',
    icon: '🗺️',
    description: 'Explora regiones y agentes',
  },
  {
    id: 'surveys',
    label: 'Encuestas',
    path: '/surveys',
    icon: '📋',
    description: 'Gestiona y ejecuta encuestas',
  },
  {
    id: 'results',
    label: 'Resultados',
    path: '/results',
    icon: '📊',
    description: 'Visualiza resultados agregados',
  },
  {
    id: 'validation',
    label: 'Validación',
    path: '/validation',
    icon: '✅',
    description: 'Valida calidad de datos',
  },
];

/**
 * MainNavigation - Barra de navegación principal
 *
 * Visible desde el inicio de la app, permite acceder a todos los módulos.
 */
export function MainNavigation() {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Determinar si un item está activo
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-lg shadow-lg">
              🏘️
            </div>
            <span className="font-semibold text-white text-lg hidden sm:block">
              Pulso Social
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const isHovered = hoveredItem === item.id;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    relative px-4 py-2 rounded-lg transition-all duration-200
                    flex items-center gap-2
                    ${active 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }
                  `}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium text-sm hidden md:block">{item.label}</span>
                  
                  {/* Tooltip on hover */}
                  {isHovered && !active && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50">
                      {item.description}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-slate-700 rotate-45" />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Help Button */}
          <button
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Ayuda"
          >
            <span className="text-lg">❓</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default MainNavigation;

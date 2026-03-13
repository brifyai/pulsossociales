/**
 * MainNavigation Component
 *
 * NAVEGACIÓN PRINCIPAL DEL PRODUCTO
 * ================================
 * Esta es la navegación global de la aplicación.
 * Permite acceder a los 4 módulos principales: Mapa, Encuestas, Resultados, Validación.
 *
 * Jerarquía visual:
 * - Barra superior dominante con fondo oscuro sólido
 * - Altura prominente (h-16) para establecer autoridad visual
 * - Logo "Pulso Social" como marca principal
 * - Tabs con indicador claro de sección activa
 *
 * NOTA: Esta navegación es GLOBAL y diferente de la toolbar contextual del mapa.
 * - MainNavigation = Módulos del producto (navegación entre páginas)
 * - MapToolbar = Contexto del mapa (breadcrumb + capas de visualización)
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
    description: 'Explora regiones y agentes de Chile',
  },
  {
    id: 'surveys',
    label: 'Encuestas',
    path: '/surveys',
    icon: '📋',
    description: 'Gestiona y ejecuta encuestas sintéticas',
  },
  {
    id: 'results',
    label: 'Resultados',
    path: '/results',
    icon: '📊',
    description: 'Analiza resultados agregados',
  },
  {
    id: 'validation',
    label: 'Validación',
    path: '/validation',
    icon: '✅',
    description: 'Valida calidad de datos y encuestas',
  },
];

/**
 * MainNavigation - Barra de navegación principal del producto
 *
 * Características:
 * - Fondo sólido oscuro (bg-slate-900) para máximo contraste
 * - Altura prominente (h-16) para establecer jerarquía
 * - Sombra sutil para separación del contenido
 * - Indicador de sección activa con estilo ámbar
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
    <nav className="bg-slate-900 border-b-2 border-slate-700 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand - Más prominente */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow">
              🏘️
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-white text-xl tracking-tight">
                Pulso Social
              </span>
              <span className="text-xs text-slate-500 ml-2 hidden lg:inline">
                Encuestas Sintéticas
              </span>
            </div>
          </NavLink>

          {/* Navigation Tabs - Más prominentes */}
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const isHovered = hoveredItem === item.id;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`
                    relative px-5 py-2.5 rounded-xl transition-all duration-200
                    flex items-center gap-2
                    ${active 
                      ? 'bg-amber-500 text-slate-900 font-semibold shadow-lg shadow-amber-500/25' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  title={item.description}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium hidden md:block">{item.label}</span>
                  
                  {/* Tooltip on hover */}
                  {isHovered && !active && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 px-4 py-2 bg-slate-800 text-white text-sm rounded-xl shadow-2xl border border-slate-600 whitespace-nowrap z-50">
                      {item.description}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-l border-t border-slate-600 rotate-45" />
                    </div>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Help Button - Más sutil */}
          <button
            className="p-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
            title="Ayuda y documentación"
          >
            <span className="text-xl">❓</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default MainNavigation;

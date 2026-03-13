/**
 * SurveysPage Component
 *
 * Vista principal de Encuestas - accesible desde la navegación principal.
 * Permite gestionar y ejecutar encuestas en cualquier región.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyPanel } from './SurveyPanel';
import { useTerritories } from '../hooks/useTerritories';
import type { TerritoryRegion } from '../types/territory';

export function SurveysPage() {
  const navigate = useNavigate();
  const { regions, loading: territoriesLoading } = useTerritories();
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');

  const selectedRegion = regions.find((t: TerritoryRegion) => t.id === selectedRegionId);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📋 Encuestas
          </h1>
          <p className="text-slate-400">
            Gestiona y ejecuta encuestas sintéticas con agentes de IA en las regiones de Chile.
          </p>
        </div>

        {/* Region Selector */}
        <div className="mb-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selecciona una región
          </label>
          <select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            disabled={territoriesLoading}
          >
            <option value="">-- Todas las regiones --</option>
            {regions.map((region: TerritoryRegion) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {territoriesLoading && (
            <p className="text-sm text-slate-500 mt-2">Cargando regiones...</p>
          )}
        </div>

        {/* Survey Panel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h2 className="text-lg font-semibold text-white">
              {selectedRegion ? `Encuestas en ${selectedRegion.name}` : 'Todas las encuestas'}
            </h2>
          </div>
          <div className="p-4">
            <SurveyPanel territoryId={selectedRegionId || undefined} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon="🗺️"
            title="Ver Mapa"
            description="Explora las regiones y agentes disponibles"
            onClick={() => navigate('/')}
          />
          <QuickActionCard
            icon="📊"
            title="Ver Resultados"
            description="Analiza los resultados de encuestas anteriores"
            onClick={() => navigate('/results')}
          />
          <QuickActionCard
            icon="✅"
            title="Validación"
            description="Revisa la calidad de los datos recopilados"
            onClick={() => navigate('/validation')}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionCard({ icon, title, description, onClick }: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 text-left transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
        <div>
          <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default SurveysPage;

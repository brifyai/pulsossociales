/**
 * ResultsPage Component
 *
 * Vista principal de Resultados - accesible desde la navegación principal.
 * Permite visualizar resultados agregados de encuestas con comparación de benchmarks.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyResultsView } from './SurveyResultsView';
import { useSurveys } from '../hooks/useSurveys';
import { useAgentSummariesByRegion } from '../hooks/useAgents';
import type { FullAgent, AgentProfile, AgentTraits, AgentMemory, AgentState } from '../types/agent';

export function ResultsPage() {
  const navigate = useNavigate();
  const { surveys, isLoading: surveysLoading } = useSurveys();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');

  // Get agents for the selected region
  const { agents, loading: agentsLoading } = useAgentSummariesByRegion(selectedRegionId || null);

  // Convert AgentSummary to FullAgent
  const fullAgents: FullAgent[] = agents.map(agent => {
    const profile: AgentProfile = {
      id: agent.id,
      name: agent.name,
      regionId: agent.regionId,
      commune: '',
      urbanRural: 'urban',
      sex: agent.sex,
      age: agent.age,
      educationLevel: 'secondary',
      employmentStatus: 'employed',
      incomeDecile: 5,
      householdSize: 3,
      householdType: 'couple',
      hasChildren: false,
      connectivityType: 'fiber',
      digitalAccessScore: 70,
      weight: 1,
      character: agent.character,
    };

    const traits: AgentTraits = {
      institutionalTrust: 50,
      riskAversion: 50,
      digitalLiteracy: 50,
      patience: 50,
      civicInterest: 50,
      socialDesirability: 50,
      opennessChange: 50,
      ideologyScore: 50,
      nationalismScore: 50,
      consistencyScore: 50,
    };

    const memory: AgentMemory = {
      summary: '',
      salientTopics: [],
      previousPositions: [],
      contradictionScore: 0,
    };

    const state: AgentState = {
      fatigue: 0,
      economicStress: 0,
      mood: agent.mood,
      surveySaturation: 0,
      isActive: agent.isActive,
    };

    return {
      profile,
      traits,
      memory,
      state,
      events: [],
    };
  });

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📊 Resultados
          </h1>
          <p className="text-slate-400">
            Visualiza y analiza los resultados de encuestas sintéticas con comparación de benchmarks.
          </p>
        </div>

        {/* Survey Selector */}
        <div className="mb-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selecciona una encuesta
          </label>
          <select
            value={selectedSurveyId}
            onChange={(e) => setSelectedSurveyId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            disabled={surveysLoading}
          >
            <option value="">-- Selecciona una encuesta --</option>
            {surveys.map((survey) => (
              <option key={survey.id} value={survey.id}>
                {survey.name}
              </option>
            ))}
          </select>
          {surveysLoading && (
            <p className="text-sm text-slate-500 mt-2">Cargando encuestas...</p>
          )}
        </div>

        {/* Region Selector (optional) */}
        <div className="mb-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Filtrar por región (opcional)
          </label>
          <select
            value={selectedRegionId}
            onChange={(e) => setSelectedRegionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Todas las regiones --</option>
            <option value="metropolitana">Metropolitana</option>
            <option value="valparaiso">Valparaíso</option>
            <option value="biobio">Biobío</option>
            <option value="araucania">Araucanía</option>
          </select>
        </div>

        {/* Results View */}
        {selectedSurveyId ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <h2 className="text-lg font-semibold text-white">
                {selectedSurvey?.name || 'Resultados'}
              </h2>
            </div>
            <div className="p-4">
              {agentsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
                  <p className="text-slate-400">Cargando agentes...</p>
                </div>
              ) : (
                <SurveyResultsView
                  surveyId={selectedSurveyId}
                  territoryId={selectedRegionId || undefined}
                  agents={fullAgents}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Selecciona una encuesta
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Elige una encuesta del menú desplegable arriba para ver los resultados agregados,
              comparaciones con benchmarks y análisis detallado.
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            icon="🗺️"
            title="Ver Mapa"
            description="Explora las regiones y agentes disponibles"
            onClick={() => navigate('/')}
          />
          <QuickActionCard
            icon="📋"
            title="Gestionar Encuestas"
            description="Crea y ejecuta nuevas encuestas"
            onClick={() => navigate('/surveys')}
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

export default ResultsPage;

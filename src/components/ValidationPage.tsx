/**
 * ValidationPage Component
 *
 * Vista principal de Validación - accesible desde la navegación principal.
 * Permite revisar la calidad de los datos y validar resultados de encuestas.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSurveys, useSurveyRuns } from '../hooks/useSurveys';

export function ValidationPage() {
  const navigate = useNavigate();
  const { surveys, isLoading: surveysLoading } = useSurveys();
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');

  const { runs, isLoading: runsLoading } = useSurveyRuns(selectedSurveyId || null);

  const selectedSurvey = surveys.find(s => s.id === selectedSurveyId);

  // Calculate validation metrics
  const completedRuns = runs.filter(r => r.status === 'completed').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const totalRuns = runs.length;
  const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            ✅ Validación
          </h1>
          <p className="text-slate-400">
            Revisa la calidad de los datos y valida los resultados de las encuestas sintéticas.
          </p>
        </div>

        {/* Survey Selector */}
        <div className="mb-6 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selecciona una encuesta para validar
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

        {/* Validation Dashboard */}
        {selectedSurveyId ? (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                icon="📊"
                label="Total Ejecuciones"
                value={totalRuns.toString()}
                color="blue"
              />
              <MetricCard
                icon="✅"
                label="Completadas"
                value={completedRuns.toString()}
                color="green"
              />
              <MetricCard
                icon="❌"
                label="Fallidas"
                value={failedRuns.toString()}
                color="red"
              />
              <MetricCard
                icon="📈"
                label="Tasa de Éxito"
                value={`${successRate}%`}
                color="amber"
              />
            </div>

            {/* Runs List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-lg font-semibold text-white">
                  Ejecuciones de {selectedSurvey?.name}
                </h2>
              </div>
              <div className="p-4">
                {runsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4" />
                    <p className="text-slate-400">Cargando ejecuciones...</p>
                  </div>
                ) : runs.length > 0 ? (
                  <div className="space-y-3">
                    {runs.map((run) => (
                      <RunValidationCard key={run.id} run={run} onNavigate={() => navigate('/results')} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400">
                      No hay ejecuciones para esta encuesta.
                    </p>
                    <button
                      onClick={() => navigate('/surveys')}
                      className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                    >
                      Ir a Encuestas
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Validation Guidelines */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                📋 Guías de Validación
              </h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Las ejecuciones completadas deben tener respuestas consistentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Verifica que la muestra sea representativa de la población</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Compara con benchmarks conocidos para validar resultados</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Revisa la distribución demográfica de los respondentes</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Selecciona una encuesta
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Elige una encuesta del menú desplegable arriba para ver las métricas de validación,
              ejecuciones completadas y guías de calidad.
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
            icon="📊"
            title="Ver Resultados"
            description="Analiza los resultados de encuestas anteriores"
            onClick={() => navigate('/results')}
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'red' | 'amber';
}

function MetricCard({ icon, label, value, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  };

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface RunValidationCardProps {
  run: {
    id: string;
    name: string | null;
    status: string;
    created_at: string;
    completed_at: string | null;
  };
  onNavigate: () => void;
}

function RunValidationCard({ run, onNavigate }: RunValidationCardProps) {
  const statusColors: Record<string, string> = {
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
    running: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    failed: 'bg-red-500/20 text-red-300 border-red-500/30',
    pending: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Completada',
    running: 'En ejecución',
    failed: 'Fallida',
    pending: 'Pendiente',
  };

  return (
    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[run.status] || statusColors.pending}`}>
          {statusLabels[run.status] || run.status}
        </div>
        <div>
          <p className="font-medium text-white">
            {run.name || `Ejecución ${run.id.slice(0, 8)}`}
          </p>
          <p className="text-sm text-slate-400">
            Creada: {new Date(run.created_at).toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>
      {run.status === 'completed' && (
        <button
          onClick={onNavigate}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-sm transition-colors"
        >
          Ver Resultados
        </button>
      )}
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

export default ValidationPage;

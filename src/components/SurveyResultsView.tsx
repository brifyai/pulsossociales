/**
 * SurveyResultsView Component
 *
 * Standalone view for displaying survey results with benchmark comparison.
 * Can be used independently or integrated into other panels.
 */

import React, { useState, useEffect } from 'react';
import { useSurvey, useSurveyRuns } from '../hooks/useSurveys';
import { useSurveyResults } from '../hooks/useSurveyResults';
import { SurveyResultsPanel } from './SurveyResultsPanel';
import { getRunResponses } from '../repositories/surveyRepository';
import type { SurveyResponse } from '../types/survey';
import type { FullAgent } from '../types/agent';

// ============================================================================
// TYPES
// ============================================================================

interface SurveyResultsViewProps {
  surveyId: string;
  territoryId?: string;
  agents: FullAgent[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SurveyResultsView({
  surveyId,
  territoryId,
  agents,
}: SurveyResultsViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  const { survey, questions, isLoading: surveyLoading } = useSurvey(surveyId);
  const { runs, isLoading: runsLoading } = useSurveyRuns(surveyId);

  // Results aggregation hook
  const {
    aggregatedResults,
    comparisons,
    benchmarks,
    selectedBenchmarkId,
    setSelectedBenchmarkId,
    loadSampleBenchmarks,
    overallSimilarity,
    isLoading: resultsLoading,
  } = useSurveyResults({
    surveyId,
    questions,
    responses,
    agents,
  });

  // Load responses when run is selected
  useEffect(() => {
    if (!selectedRunId) {
      setResponses([]);
      return;
    }

    const loadResponses = async () => {
      setIsLoadingResponses(true);
      try {
        const runResponses = await getRunResponses(selectedRunId);
        setResponses(runResponses);
      } catch (error) {
        console.error('Error loading responses:', error);
      } finally {
        setIsLoadingResponses(false);
      }
    };

    loadResponses();
  }, [selectedRunId]);

  // Auto-select first completed run
  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      const completedRun = runs.find((r) => r.status === 'completed');
      if (completedRun) {
        setSelectedRunId(completedRun.id);
      }
    }
  }, [runs, selectedRunId]);

  if (surveyLoading || runsLoading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">Cargando encuesta...</p>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">Encuesta no encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-semibold">{survey.name}</h2>
        <p className="text-gray-600 text-sm">{survey.description}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>{questions.length} preguntas</span>
          <span>•</span>
          <span>{runs.length} ejecuciones</span>
          <span>•</span>
          <span>{agents.length} agentes</span>
        </div>
      </div>

      {/* Run Selector */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Ejecución:</label>
          <select
            value={selectedRunId ?? ''}
            onChange={(e) => setSelectedRunId(e.target.value || null)}
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="">-- Seleccionar ejecución --</option>
            {runs
              .filter((r) => r.status === 'completed')
              .map((run) => (
                <option key={run.id} value={run.id}>
                  {run.name || `Ejecución ${run.id.slice(0, 8)}`} (
                  {new Date(run.created_at).toLocaleDateString()})
                </option>
              ))}
          </select>
          {isLoadingResponses && (
            <span className="text-sm text-gray-500">Cargando respuestas...</span>
          )}
        </div>

        {runs.filter((r) => r.status === 'completed').length === 0 && (
          <p className="mt-2 text-sm text-yellow-600">
            No hay ejecuciones completadas. Ejecuta la encuesta primero.
          </p>
        )}
      </div>

      {/* Results Panel */}
      {selectedRunId ? (
        resultsLoading || isLoadingResponses ? (
          <div className="p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-center">Procesando resultados...</p>
          </div>
        ) : (
          <SurveyResultsPanel
            results={aggregatedResults}
            comparisons={comparisons}
            benchmarks={benchmarks}
            selectedBenchmarkId={selectedBenchmarkId}
            onSelectBenchmark={setSelectedBenchmarkId}
            onLoadSampleBenchmarks={loadSampleBenchmarks}
            overallSimilarity={overallSimilarity}
          />
        )
      ) : (
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">Selecciona una ejecución para ver los resultados</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STANDALONE PAGE COMPONENT
// ============================================================================

/**
 * Standalone page for viewing survey results
 * Can be used as a route or modal
 */
export function SurveyResultsPage() {
  const [surveyId, setSurveyId] = useState<string>('');
  const [territoryId, setTerritoryId] = useState<string>('');
  const [agents, setAgents] = useState<FullAgent[]>([]);

  // This would typically come from context or props
  // For now, it's a simple wrapper

  if (!surveyId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Resultados de Encuestas</h1>
        <p className="text-gray-600">
          Selecciona una encuesta para ver los resultados agregados y comparación con
          benchmarks.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <SurveyResultsView surveyId={surveyId} territoryId={territoryId} agents={agents} />
    </div>
  );
}

/**
 * SurveyResultsPanel Component
 *
 * Displays aggregated survey results with:
 * - Distribution charts
 * - Weighted statistics
 * - Segment breakdowns
 * - Benchmark comparison
 */

import React, { useState } from 'react';
import type {
  AggregatedResult,
  BenchmarkComparison,
  DistributionItem,
  SegmentBreakdown,
} from '../types/survey';
import {
  formatPercentage,
  formatNumber,
  getSimilarityColor,
  getErrorColor,
} from '../lib/surveyResultsAggregator';
import { calculateSurveySummary } from '../hooks/useSurveyResults';

// ============================================================================
// TYPES
// ============================================================================

interface SurveyResultsPanelProps {
  results: AggregatedResult[];
  comparisons: BenchmarkComparison[];
  benchmarks: Array<{ id: string; name: string; source: string }>;
  selectedBenchmarkId: string | null;
  onSelectBenchmark: (id: string | null) => void;
  onLoadSampleBenchmarks: () => void;
  overallSimilarity: number;
}

type ViewMode = 'overview' | 'details' | 'comparison' | 'segments';

// ============================================================================
// COMPONENT
// ============================================================================

export function SurveyResultsPanel({
  results,
  comparisons,
  benchmarks,
  selectedBenchmarkId,
  onSelectBenchmark,
  onLoadSampleBenchmarks,
  overallSimilarity,
}: SurveyResultsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  const summary = calculateSurveySummary(comparisons);

  if (results.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">No hay resultados para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resultados de la Encuesta</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {results.length} preguntas • {results[0]?.totalResponses ?? 0} respuestas
          </span>
        </div>
      </div>

      {/* Benchmark Selector */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Benchmark:</label>
          <select
            value={selectedBenchmarkId ?? ''}
            onChange={(e) => onSelectBenchmark(e.target.value || null)}
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Sin benchmark</option>
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.source})
              </option>
            ))}
          </select>
          {benchmarks.length === 0 && (
            <button
              onClick={onLoadSampleBenchmarks}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Cargar benchmarks de ejemplo
            </button>
          )}
        </div>

        {selectedBenchmarkId && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                Similitud promedio:
                <span className={getSimilarityColor(overallSimilarity)}>
                  {(overallSimilarity * 100).toFixed(1)}%
                </span>
                <span 
                  className="text-gray-400 cursor-help" 
                  title="Promedio simple de similitudes por pregunta. No pondera por importancia. Revise comparaciones individuales."
                >
                  ⓘ
                </span>
              </span>
              <span className="text-gray-400">|</span>
              <span>
                Preguntas con benchmark: {summary.questionsWithBenchmark}/{summary.totalQuestions}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Nota: La similitud promedio es una métrica simple. Para validación, revise las comparaciones individuales de cada pregunta.
            </p>
          </div>
        )}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'details', 'comparison', 'segments'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === mode
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {mode === 'overview' && 'Resumen'}
            {mode === 'details' && 'Detalles'}
            {mode === 'comparison' && 'Comparación'}
            {mode === 'segments' && 'Segmentos'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border">
        {viewMode === 'overview' && (
          <OverviewView results={results} comparisons={comparisons} summary={summary} />
        )}
        {viewMode === 'details' && (
          <DetailsView
            results={results}
            comparisons={comparisons}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={setSelectedQuestionId}
          />
        )}
        {viewMode === 'comparison' && (
          <ComparisonView comparisons={comparisons} />
        )}
        {viewMode === 'segments' && (
          <SegmentsView results={results} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OverviewView({
  results,
  comparisons,
  summary,
}: {
  results: AggregatedResult[];
  comparisons: BenchmarkComparison[];
  summary: ReturnType<typeof calculateSurveySummary>;
}) {
  return (
    <div className="p-4 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Preguntas"
          value={summary.totalQuestions.toString()}
          subtitle="en la encuesta"
        />
        <SummaryCard
          title="Respuestas"
          value={results[0]?.totalResponses.toString() ?? '0'}
          subtitle="totales"
        />
        <SummaryCard
          title="Peso Total"
          value={formatNumber(results[0]?.totalWeight ?? 0, 0)}
          subtitle="muestral"
        />
        {summary.questionsWithBenchmark > 0 && (
          <SummaryCard
            title="Similitud Promedio"
            value={formatPercentage(summary.averageSimilarity * 100, 1)}
            subtitle="vs benchmark"
            valueClass={getSimilarityColor(summary.averageSimilarity)}
          />
        )}
      </div>

      {/* Best/Worst Matches */}
      {summary.bestMatch && summary.worstMatch && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Mejor coincidencia</p>
            <p className="text-lg font-semibold text-green-800">
              {summary.bestMatch.questionCode}
            </p>
            <p className="text-sm text-green-600">
              {formatPercentage(summary.bestMatch.similarity * 100, 1)} similitud
            </p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Peor coincidencia</p>
            <p className="text-lg font-semibold text-red-800">
              {summary.worstMatch.questionCode}
            </p>
            <p className="text-sm text-red-600">
              {formatPercentage(summary.worstMatch.similarity * 100, 1)} similitud
            </p>
          </div>
        </div>
      )}

      {/* Quick Results Table */}
      <div>
        <h3 className="text-sm font-medium mb-3">Resultados por Pregunta</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Tipo</th>
                <th className="px-3 py-2 text-right">Respuestas</th>
                <th className="px-3 py-2 text-right">Media</th>
                {summary.questionsWithBenchmark > 0 && (
                  <th className="px-3 py-2 text-right">Similitud</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((result, i) => {
                const comparison = comparisons[i];
                return (
                  <tr key={result.questionId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{result.questionCode}</td>
                    <td className="px-3 py-2 text-gray-600">{result.answerType}</td>
                    <td className="px-3 py-2 text-right">{result.totalResponses}</td>
                    <td className="px-3 py-2 text-right">
                      {result.statistics
                        ? formatNumber(result.statistics.weightedMean, 2)
                        : '-'}
                    </td>
                    {summary.questionsWithBenchmark > 0 && comparison && (
                      <td className="px-3 py-2 text-right">
                        <span className={getSimilarityColor(comparison.metrics.similarityScore)}>
                          {formatPercentage(comparison.metrics.similarityScore * 100, 0)}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DetailsView({
  results,
  comparisons,
  selectedQuestionId,
  onSelectQuestion,
}: {
  results: AggregatedResult[];
  comparisons: BenchmarkComparison[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string | null) => void;
}) {
  const selectedResult = results.find((r) => r.questionId === selectedQuestionId);
  const selectedComparison = comparisons.find((c) => c.questionId === selectedQuestionId);

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Question List */}
        <div className="col-span-1 border-r pr-4">
          <h3 className="text-sm font-medium mb-2">Preguntas</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.questionId}
                onClick={() => onSelectQuestion(result.questionId)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedQuestionId === result.questionId
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <p className="font-medium">{result.questionCode}</p>
                <p className="text-xs text-gray-500 truncate">{result.questionText}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question Details */}
        <div className="col-span-2">
          {selectedResult ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedResult.questionCode}</h3>
                <p className="text-gray-600">{selectedResult.questionText}</p>
              </div>

              {/* Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">Distribución</h4>
                <DistributionChart distribution={selectedResult.distribution} />
              </div>

              {/* Statistics */}
              {selectedResult.statistics && (
                <div className="grid grid-cols-3 gap-4">
                  <StatBox
                    label="Media Simple"
                    value={formatNumber(selectedResult.statistics.mean, 2)}
                  />
                  <StatBox
                    label="Media Ponderada"
                    value={formatNumber(selectedResult.statistics.weightedMean, 2)}
                  />
                  <StatBox
                    label="Desv. Estándar"
                    value={formatNumber(selectedResult.statistics.stdDev, 2)}
                  />
                </div>
              )}

              {/* Benchmark Comparison */}
              {selectedComparison?.benchmark && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Comparación con Benchmark</h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Similitud</p>
                      <p className={getSimilarityColor(selectedComparison.metrics.similarityScore)}>
                        {formatPercentage(selectedComparison.metrics.similarityScore * 100, 1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">MAE</p>
                      <p>{formatNumber(selectedComparison.metrics.mae, 1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">RMSE</p>
                      <p>{formatNumber(selectedComparison.metrics.rmse, 1)}%</p>
                    </div>
                    {selectedComparison.metrics.meanDifference !== null && (
                      <div>
                        <p className="text-gray-500">Dif. Media</p>
                        <p>{formatNumber(selectedComparison.metrics.meanDifference, 2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Selecciona una pregunta para ver detalles
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonView({ comparisons }: { comparisons: BenchmarkComparison[] }) {
  const withBenchmark = comparisons.filter((c) => c.benchmark !== null);

  if (withBenchmark.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No hay benchmark seleccionado para comparar</p>
        <p className="text-sm text-gray-400 mt-1">
          Selecciona un benchmark arriba para ver la comparación
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {withBenchmark.map((comparison) => (
        <div key={comparison.questionId} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">{comparison.questionCode}</h4>
              <p className="text-sm text-gray-600">{comparison.questionText}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${getSimilarityColor(comparison.metrics.similarityScore)}`}>
                {formatPercentage(comparison.metrics.similarityScore * 100, 1)}
              </p>
              <p className="text-xs text-gray-500">similitud</p>
            </div>
          </div>

          {/* Option Comparison */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Opción</th>
                  <th className="px-3 py-2 text-right">Sintético</th>
                  <th className="px-3 py-2 text-right">Benchmark</th>
                  <th className="px-3 py-2 text-right">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.optionComparisons.map((opt) => (
                  <tr key={String(opt.value)}>
                    <td className="px-3 py-2">{opt.label}</td>
                    <td className="px-3 py-2 text-right">
                      {formatPercentage(opt.syntheticPercentage, 1)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatPercentage(opt.benchmarkPercentage, 1)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className={getErrorColor(opt.absoluteError)}>
                        {formatNumber(opt.absoluteError, 1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentsView({ results }: { results: AggregatedResult[] }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    results[0]?.questionId ?? null
  );

  const selectedResult = results.find((r) => r.questionId === selectedQuestionId);

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="text-sm font-medium mr-2">Pregunta:</label>
        <select
          value={selectedQuestionId ?? ''}
          onChange={(e) => setSelectedQuestionId(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm"
        >
          {results.map((r) => (
            <option key={r.questionId} value={r.questionId}>
              {r.questionCode}
            </option>
          ))}
        </select>
      </div>

      {selectedResult?.segments && selectedResult.segments.length > 0 ? (
        <div className="space-y-4">
          {['region', 'age_group', 'gender'].map((segmentType) => {
            const segments = selectedResult.segments!.filter(
              (s) => s.segmentType === segmentType
            );
            if (segments.length === 0) return null;

            return (
              <div key={segmentType}>
                <h4 className="text-sm font-medium mb-2 capitalize">
                  {segmentType === 'age_group' ? 'Grupo Etario' : segmentType}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {segments.map((segment) => (
                    <SegmentCard key={segment.segmentValue} segment={segment} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No hay datos de segmentación disponibles
        </p>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function SummaryCard({
  title,
  value,
  subtitle,
  valueClass = '',
}: {
  title: string;
  value: string;
  subtitle: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-xs text-gray-500 uppercase">{title}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DistributionChart({ distribution }: { distribution: DistributionItem[] }) {
  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <div className="space-y-2">
      {distribution.map((item) => (
        <div key={String(item.value)} className="flex items-center gap-3">
          <div className="w-32 text-sm truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
            />
          </div>
          <div className="w-24 text-right text-sm">
            <span className="font-medium">{item.count}</span>
            <span className="text-gray-500 ml-1">({formatPercentage(item.percentage, 0)})</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SegmentCard({ segment }: { segment: SegmentBreakdown }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-sm font-medium capitalize">{segment.segmentValue}</p>
      <p className="text-xs text-gray-500">n={segment.count}</p>
      {segment.avgResponse !== undefined && (
        <p className="text-sm text-blue-600">media: {formatNumber(segment.avgResponse, 1)}</p>
      )}
    </div>
  );
}

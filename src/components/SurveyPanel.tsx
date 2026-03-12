/**
 * SurveyPanel Component
 *
 * A minimal UI for managing and executing surveys.
 * Displays available surveys, allows creating runs, and shows results.
 */

import React, { useState, useEffect } from 'react';
import { useSurveys, useSurvey, useSurveyRuns } from '../hooks/useSurveys';
import { useAgentSummariesByRegion } from '../hooks/useAgents';
import { createExecutionConfig } from '../lib/surveyEngineV2';
import type { Survey, SurveyRun, SurveyExecutionConfig } from '../types/survey';

interface SurveyPanelProps {
  territoryId?: string;
}

export function SurveyPanel({ territoryId }: SurveyPanelProps) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState<string>('');

  const { surveys, fetchSurveys, isLoading: surveysLoading } = useSurveys();
  const { survey, questions, isLoading: surveyLoading } = useSurvey(selectedSurveyId);
  const { runs, refetch: fetchRunSummaries, createRun, isLoading: runsLoading } = useSurveyRuns(selectedSurveyId);
  const { agents, loading: agentsLoading } = useAgentSummariesByRegion(territoryId || null);

  useEffect(() => {
    fetchSurveys('active');
  }, [fetchSurveys]);

  const handleExecuteSurvey = async () => {
    if (!survey || !questions.length || !agents.length) return;

    setIsExecuting(true);
    setExecutionProgress('Creating run...');

    try {
      // Create a new run
      const config: SurveyExecutionConfig = createExecutionConfig({
        surveyId: survey.id,
        territoryId,
        sampleSize: Math.min(agents.length, 50),
        useRules: true,
        useLLM: false,
        batchSize: 10,
        delayMs: 100,
      });

      const run = await createRun(config);
      if (!run) {
        throw new Error('Failed to create run');
      }

      setExecutionProgress('Run created successfully!');
      setIsExecuting(false);
      fetchRunSummaries();
      
      // Note: Actual survey execution would be done via a separate service
      // that has access to FullAgent data
    } catch (error) {
      setExecutionProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExecuting(false);
    }
  };

  if (surveysLoading) {
    return <div className="p-4 text-gray-600">Loading surveys...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-2xl">
      <h2 className="text-xl font-bold mb-4">Surveys</h2>

      {/* Survey List */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Survey
        </label>
        <select
          value={selectedSurveyId || ''}
          onChange={(e) => setSelectedSurveyId(e.target.value || null)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isExecuting}
        >
          <option value="">-- Select a survey --</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Survey Details */}
      {survey && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-semibold">{survey.name}</h3>
          <p className="text-sm text-gray-600">{survey.description}</p>
          <p className="text-sm text-gray-500 mt-1">
            {questions.length} questions • {survey.status}
          </p>
        </div>
      )}

      {/* Questions Preview */}
      {questions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Questions</h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {questions.map((q, index) => (
              <li key={q.id} className="text-sm p-2 bg-gray-50 rounded">
                <span className="font-medium">{index + 1}.</span> {q.text}
                <span className="text-gray-500 ml-2">({q.answer_type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Previous Runs */}
      {runs.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Previous Runs</h4>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {runs.map((run) => (
              <li key={run.id} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                <span>{run.name || `Run ${run.id.slice(0, 8)}`}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  run.status === 'completed' ? 'bg-green-100 text-green-800' :
                  run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                  run.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {run.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Execute Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleExecuteSurvey}
          disabled={!survey || !agents.length || isExecuting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isExecuting ? 'Executing...' : 'Execute Survey'}
        </button>
        
        {agents.length > 0 && (
          <span className="text-sm text-gray-600">
            {agents.length} agents available
          </span>
        )}
      </div>

      {/* Progress */}
      {executionProgress && (
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          {executionProgress}
        </div>
      )}
    </div>
  );
}

export default SurveyPanel;

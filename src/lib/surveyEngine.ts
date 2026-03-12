/**
 * Survey Engine
 * 
 * Core engine for executing surveys with synthetic agents.
 * Supports both rule-based and LLM-based response generation.
 */

import type {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
  SurveyExecutionConfig,
  ScaleConfig,
} from '../types/survey';
import type { FullAgent } from '../types/agent';
import * as surveyRepo from '../repositories/surveyRepository';

// ============================================================================
// TYPES
// ============================================================================

export interface SurveyEngineConfig {
  /** Use LLM for response generation */
  useLLM: boolean;
  /** Use rule-based fallback */
  useRules: boolean;
  /** Batch size for processing */
  batchSize: number;
  /** Delay between requests (ms) */
  delayMs: number;
  /** Callback for progress updates */
  onProgress?: (progress: SurveyProgress) => void;
  /** Callback for completion */
  onComplete?: (result: SurveyResult) => void;
  /** Callback for errors */
  onError?: (error: Error) => void;
}

export interface SurveyProgress {
  /** Current question index */
  currentQuestion: number;
  /** Total questions */
  totalQuestions: number;
  /** Current agent index */
  currentAgent: number;
  /** Total agents */
  totalAgents: number;
  /** Current run ID */
  runId: string;
  /** Status message */
  message: string;
}

export interface SurveyResult {
  /** Run ID */
  runId: string;
  /** Total responses generated */
  totalResponses: number;
  /** Success count */
  successCount: number;
  /** Error count */
  errorCount: number;
  /** Duration in ms */
  durationMs: number;
  /** Generated responses */
  responses: SurveyResponse[];
}

export interface AgentResponse {
  /** Agent ID */
  agentId: string;
  /** Question ID */
  questionId: string;
  /** Raw answer text */
  answerRaw: string;
  /** Structured answer data */
  answerStructured: Record<string, unknown>;
  /** Response time in ms */
  responseTimeMs: number;
  /** Metadata */
  metadata: Record<string, unknown>;
}

// ============================================================================
// SURVEY ENGINE CLASS
// ============================================================================

export class SurveyEngine {
  private config: SurveyEngineConfig;
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(config: SurveyEngineConfig) {
    this.config = {
      ...config,
    };
  }

  /**
   * Execute a survey run
   */
  async execute(
    survey: Survey,
    questions: SurveyQuestion[],
    agents: FullAgent[],
    run: SurveyRun
  ): Promise<SurveyResult> {
    if (this.isRunning) {
      throw new Error('Survey engine is already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    const startTime = Date.now();

    const result: SurveyResult = {
      runId: run.id,
      totalResponses: 0,
      successCount: 0,
      errorCount: 0,
      durationMs: 0,
      responses: [],
    };

    try {
      // Update run status to running
      await surveyRepo.updateRunStatus(run.id, 'running', new Date().toISOString());

      // Process each question
      for (let qIndex = 0; qIndex < questions.length; qIndex++) {
        const question = questions[qIndex];

        // Process agents in batches
        for (let i = 0; i < agents.length; i += this.config.batchSize) {
          const batch = agents.slice(i, i + this.config.batchSize);
          
          // Process batch
          const batchResponses = await this.processBatch(
            run.id,
            question,
            batch,
            qIndex,
            questions.length,
            i,
            agents.length
          );

          result.responses.push(...batchResponses);
          result.successCount += batchResponses.length;
          result.totalResponses += batch.length;

          // Report progress
          this.reportProgress({
            currentQuestion: qIndex + 1,
            totalQuestions: questions.length,
            currentAgent: Math.min(i + batch.length, agents.length),
            totalAgents: agents.length,
            runId: run.id,
            message: `Processing question ${qIndex + 1}/${questions.length}, agent ${Math.min(i + batch.length, agents.length)}/${agents.length}`,
          });

          // Delay between batches
          if (this.config.delayMs > 0) {
            await this.delay(this.config.delayMs);
          }

          // Check for abort
          if (this.abortController?.signal.aborted) {
            throw new Error('Survey execution aborted');
          }
        }
      }

      // Update run status to completed
      await surveyRepo.updateRunStatus(
        run.id,
        'completed',
        undefined,
        new Date().toISOString()
      );

      result.durationMs = Date.now() - startTime;
      this.config.onComplete?.(result);

      return result;
    } catch (error) {
      result.errorCount = result.totalResponses - result.successCount;
      result.durationMs = Date.now() - startTime;

      // Update run status to failed
      await surveyRepo.updateRunStatus(
        run.id,
        'failed',
        undefined,
        new Date().toISOString()
      );

      const err = error instanceof Error ? error : new Error(String(error));
      this.config.onError?.(err);
      throw err;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  /**
   * Abort the current execution
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Check if the engine is running
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  private async processBatch(
    runId: string,
    question: SurveyQuestion,
    agents: FullAgent[],
    questionIndex: number,
    totalQuestions: number,
    agentOffset: number,
    totalAgents: number
  ): Promise<SurveyResponse[]> {
    const responses: SurveyResponse[] = [];

    for (const agent of agents) {
      try {
        const response = await this.generateResponse(runId, question, agent);
        if (response) {
          responses.push(response);
        }
      } catch (error) {
        console.error(`Error generating response for agent ${agent.profile.id}:`, error);
      }
    }

    return responses;
  }

  private async generateResponse(
    runId: string,
    question: SurveyQuestion,
    agent: FullAgent
  ): Promise<SurveyResponse | null> {
    const startTime = Date.now();

    try {
      let answerRaw: string;
      let answerStructured: Record<string, unknown>;

      if (this.config.useLLM) {
        // TODO: Implement LLM-based response generation
        // For now, fall back to rules
        const result = this.generateRuleBasedResponse(question, agent);
        answerRaw = result.answerRaw;
        answerStructured = result.answerStructured;
      } else if (this.config.useRules) {
        const result = this.generateRuleBasedResponse(question, agent);
        answerRaw = result.answerRaw;
        answerStructured = result.answerStructured;
      } else {
        throw new Error('No response generation method configured');
      }

      const responseTimeMs = Date.now() - startTime;

      // Save response to database
      const savedResponse = await surveyRepo.saveSurveyResponse(
        runId,
        agent.profile.id,
        question.id,
        answerRaw,
        answerStructured,
        responseTimeMs,
        {
          method: this.config.useLLM ? 'llm' : 'rules',
          agent_profile: agent.profile,
        }
      );

      return savedResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }

  private generateRuleBasedResponse(
    question: SurveyQuestion,
    agent: FullAgent
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    const profile = agent.profile;
    const rng = this.createRNG(agent.profile.id + question.id);

    switch (question.answer_type) {
      case 'scale':
        return this.generateScaleResponse(question, profile, rng);
      case 'single_choice':
        return this.generateChoiceResponse(question, profile, rng);
      case 'text':
        return this.generateTextResponse(question, profile, rng);
      case 'multiple_choice':
        return this.generateMultiselectResponse(question, profile, rng);
      case 'number':
        return this.generateScaleResponse(question, profile, rng);
      case 'boolean':
        return this.generateChoiceResponse(question, profile, rng);
      default:
        return {
          answerRaw: '',
          answerStructured: { value: null },
        };
    }
  }

  private generateScaleResponse(
    question: SurveyQuestion,
    profile: FullAgent['profile'],
    rng: () => number
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    const scale = question.scale_config;
    if (!scale) {
      return { answerRaw: '', answerStructured: { value: null } };
    }

    // Base value from income decile (1-10)
    let baseValue = Math.ceil(profile.incomeDecile / 10 * (scale.max - scale.min) + scale.min);
    
    // Adjust based on education
    if (profile.educationLevel === 'university' || profile.educationLevel === 'postgraduate') {
      baseValue += 1;
    }

    // Add randomness
    const variance = Math.floor(rng() * 3) - 1; // -1, 0, 1
    const value = Math.max(scale.min, Math.min(scale.max, baseValue + variance));

    const label = scale.labels?.[value.toString()] || value.toString();

    return {
      answerRaw: `${value} - ${label}`,
      answerStructured: { value, label },
    };
  }

  private generateChoiceResponse(
    question: SurveyQuestion,
    profile: FullAgent['profile'],
    rng: () => number
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    const options = question.options_json || [];
    if (options.length === 0) {
      return { answerRaw: '', answerStructured: { value: null } };
    }

    // Simple random selection for now
    // TODO: Add bias based on profile
    const index = Math.floor(rng() * options.length);
    const selected = options[index];

    return {
      answerRaw: selected.label,
      answerStructured: { value: selected.value, label: selected.label },
    };
  }

  private generateTextResponse(
    question: SurveyQuestion,
    profile: FullAgent['profile'],
    rng: () => number
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    // Generate a simple text response based on profile
    const responses = [
      'Creo que es un tema importante que requiere más atención.',
      'Depende del contexto específico.',
      'Tengo una opinión mixta sobre esto.',
      'Es complejo, pero creo que se puede mejorar.',
      'No estoy seguro, necesito más información.',
    ];

    const index = Math.floor(rng() * responses.length);
    return {
      answerRaw: responses[index],
      answerStructured: { text: responses[index] },
    };
  }

  private generateMultiselectResponse(
    question: SurveyQuestion,
    profile: FullAgent['profile'],
    rng: () => number
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    const options = question.options_json || [];
    if (options.length === 0) {
      return { answerRaw: '', answerStructured: { values: [] } };
    }

    // Select 1-3 random options
    const numSelections = Math.floor(rng() * 3) + 1;
    const selected: Array<{ value: string; label: string }> = [];
    const used = new Set<number>();

    for (let i = 0; i < numSelections && used.size < options.length; i++) {
      let index = Math.floor(rng() * options.length);
      while (used.has(index)) {
        index = (index + 1) % options.length;
      }
      used.add(index);
      selected.push({ value: options[index].value, label: options[index].label });
    }

    return {
      answerRaw: selected.map((s) => s.label).join(', '),
      answerStructured: { values: selected.map((s) => s.value) },
    };
  }

  private generateRankingResponse(
    question: SurveyQuestion,
    profile: FullAgent['profile'],
    rng: () => number
  ): { answerRaw: string; answerStructured: Record<string, unknown> } {
    const options = question.options_json || [];
    if (options.length === 0) {
      return { answerRaw: '', answerStructured: { ranking: [] } };
    }

    // Shuffle options
    const shuffled = [...options].sort(() => rng() - 0.5);
    const ranking = shuffled.map((opt, index) => ({
      value: opt.value,
      label: opt.label,
      rank: index + 1,
    }));

    return {
      answerRaw: ranking.map((r) => `${r.rank}. ${r.label}`).join('; '),
      answerStructured: { ranking },
    };
  }

  private createRNG(seed: string): () => number {
    // Simple seeded random number generator
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return () => {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private reportProgress(progress: SurveyProgress): void {
    this.config.onProgress?.(progress);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a survey execution config from defaults
 */
export function createExecutionConfig(
  overrides: Partial<SurveyExecutionConfig> = {}
): SurveyExecutionConfig {
  return {
    surveyId: '',
    territoryId: undefined,
    sampleSize: 100,
    useLLM: false,
    useRules: true,
    batchSize: 10,
    delayMs: 100,
    ...overrides,
  };
}

/**
 * Calculate survey statistics
 */
export function calculateSurveyStats(responses: SurveyResponse[]): {
  total: number;
  byQuestion: Record<string, number>;
  byAgent: Record<string, number>;
  avgResponseTimeMs: number;
} {
  const byQuestion: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  let totalResponseTime = 0;

  for (const response of responses) {
    byQuestion[response.question_id] = (byQuestion[response.question_id] || 0) + 1;
    byAgent[response.agent_id] = (byAgent[response.agent_id] || 0) + 1;
    totalResponseTime += response.response_time_ms ?? 0;
  }

  return {
    total: responses.length,
    byQuestion,
    byAgent,
    avgResponseTimeMs: responses.length > 0 ? totalResponseTime / responses.length : 0,
  };
}

/**
 * Aggregate scale responses
 */
export function aggregateScaleResponses(
  responses: SurveyResponse[],
  min: number,
  max: number
): {
  mean: number;
  median: number;
  distribution: Record<number, number>;
} {
  const values: number[] = [];
  const distribution: Record<number, number> = {};

  for (let i = min; i <= max; i++) {
    distribution[i] = 0;
  }

  for (const response of responses) {
    const value = response.answer_structured_json?.value as number;
    if (typeof value === 'number' && value >= min && value <= max) {
      values.push(value);
      distribution[value] = (distribution[value] || 0) + 1;
    }
  }

  values.sort((a, b) => a - b);
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const median = values.length > 0
    ? values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)]
    : 0;

  return { mean, median, distribution };
}

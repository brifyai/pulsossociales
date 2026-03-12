/**
 * Survey Engine V2
 *
 * Core engine for executing surveys with synthetic agents.
 * Rule-based response generation with full traceability.
 *
 * Changes from V1:
 * - Uses profile, traits, state, and events for response generation
 * - Calculates latent scores instead of random selection
 * - Full traceability: seed, factors, score, confidence
 * - Weighted aggregation for population representativeness
 * - Question categories for targeted rule selection
 */

import type {
  Survey,
  SurveyQuestion,
  SurveyRun,
  SurveyResponse,
  SurveyExecutionConfig,
  ScaleConfig,
  SurveyOption,
} from '../types/survey';
import type { FullAgent, AgentTraits, AgentState, AgentEventExposure } from '../types/agent';
import * as surveyRepo from '../repositories/surveyRepository';

// ============================================================================
// CONSTANTS
// ============================================================================

export const ENGINE_VERSION = '2.0.0';

export type QuestionCategory =
  | 'political'
  | 'economic'
  | 'social'
  | 'digital'
  | 'trust'
  | 'generic';

// Map question codes/text patterns to categories
export function categorizeQuestion(question: SurveyQuestion): QuestionCategory {
  const text = question.text.toLowerCase();
  const code = question.code.toLowerCase();

  // Political indicators
  if (
    text.includes('gobierno') ||
    text.includes('presidente') ||
    text.includes('polític') ||
    text.includes('partido') ||
    text.includes('derecha') ||
    text.includes('izquierda') ||
    text.includes('congreso') ||
    code.includes('gov') ||
    code.includes('pol') ||
    code.includes('ideology')
  ) {
    return 'political';
  }

  // Economic indicators
  if (
    text.includes('econom') ||
    text.includes('dinero') ||
    text.includes('ingreso') ||
    text.includes('trabajo') ||
    text.includes('empleo') ||
    text.includes('precio') ||
    text.includes('inflación') ||
    code.includes('econ') ||
    code.includes('income') ||
    code.includes('employment')
  ) {
    return 'economic';
  }

  // Digital indicators
  if (
    text.includes('internet') ||
    text.includes('digital') ||
    text.includes('tecnología') ||
    text.includes('redes') ||
    text.includes('online') ||
    code.includes('digital') ||
    code.includes('tech')
  ) {
    return 'digital';
  }

  // Trust indicators
  if (
    text.includes('confianza') ||
    text.includes('confía') ||
    text.includes('institucion') ||
    text.includes('carabinero') ||
    text.includes('justicia') ||
    code.includes('trust') ||
    code.includes('conf')
  ) {
    return 'trust';
  }

  // Social indicators
  if (
    text.includes('social') ||
    text.includes('comunidad') ||
    text.includes('familia') ||
    text.includes('vecino') ||
    text.includes('sociedad') ||
    code.includes('social')
  ) {
    return 'social';
  }

  return 'generic';
}

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
  /** Random variation amount (0-1) */
  randomVariation: number;
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
  /** Weighted statistics */
  weightedStats: WeightedSurveyStats;
}

export interface WeightedSurveyStats {
  /** Total responses */
  total: number;
  /** Sum of weights */
  totalWeight: number;
  /** Responses by question (weighted) */
  byQuestion: Record<string, { count: number; weight: number }>;
  /** Average response time (weighted) */
  avgResponseTimeMs: number;
}

export interface ResponseTraceability {
  /** Engine version */
  engine_version: string;
  /** RNG seed used */
  rng_seed: string;
  /** Factors used in calculation */
  factors_used: ResponseFactor[];
  /** Computed latent score (0-100) */
  computed_score: number;
  /** Confidence in response (0-1) */
  confidence: number;
  /** Selected option value */
  selected_option: string | number | boolean;
  /** Event influences */
  event_influences: EventInfluence[];
  /** Question category */
  question_category: QuestionCategory;
  /** Method used */
  method: 'rule_based_v2';
}

export interface ResponseFactor {
  /** Factor name */
  name: string;
  /** Factor value */
  value: number;
  /** Weight in calculation */
  weight: number;
  /** Contribution to final score */
  contribution: number;
}

export interface EventInfluence {
  /** Event ID */
  event_id: string;
  /** Event title */
  event_title: string;
  /** Impact on score (-100 to 100) */
  impact: number;
  /** Interpreted stance */
  stance: string;
}

export interface ComputedResponse {
  /** Raw answer text */
  answerRaw: string;
  /** Structured answer data */
  answerStructured: Record<string, unknown>;
  /** Traceability metadata */
  traceability: ResponseTraceability;
  /** Response time in ms */
  responseTimeMs: number;
}

// ============================================================================
// SCORING SYSTEM
// ============================================================================

/**
 * Calculate latent score based on agent characteristics and question category
 * Returns score 0-100 where higher = more positive/agreement
 */
export function calculateLatentScore(
  agent: FullAgent,
  category: QuestionCategory,
  events: AgentEventExposure[]
): { score: number; factors: ResponseFactor[]; eventInfluences: EventInfluence[] } {
  const factors: ResponseFactor[] = [];
  const { profile, traits, state } = agent;

  // Base score from demographics
  let score = 50; // Neutral starting point

  // Factor 1: Income (higher income = slightly more conservative/positive)
  const incomeFactor = profile.incomeDecile * 2; // 2-20
  const incomeContribution = (incomeFactor - 10) * 0.5; // -4 to +5
  score += incomeContribution;
  factors.push({
    name: 'income_decile',
    value: profile.incomeDecile,
    weight: 0.5,
    contribution: incomeContribution,
  });

  // Factor 2: Education
  const educationValues: Record<string, number> = {
    none: 0,
    primary: 20,
    secondary: 40,
    technical: 60,
    university: 80,
    postgraduate: 100,
  };
  const eduValue = educationValues[profile.educationLevel] ?? 50;
  const eduContribution = (eduValue - 50) * 0.3; // -15 to +15
  score += eduContribution;
  factors.push({
    name: 'education_level',
    value: eduValue,
    weight: 0.3,
    contribution: eduContribution,
  });

  // Factor 3: Age (older = slightly more conservative)
  const ageContribution = (profile.age - 40) * 0.2; // -8 to +12 for ages 18-100
  score += ageContribution;
  factors.push({
    name: 'age',
    value: profile.age,
    weight: 0.2,
    contribution: ageContribution,
  });

  // Category-specific trait factors
  let traitContribution = 0;

  switch (category) {
    case 'political':
      // ideologyScore: 0=left, 100=right
      // For approval questions, right-leaning agents approve more of right-leaning gov
      traitContribution = (traits.ideologyScore - 50) * 0.4;
      factors.push({
        name: 'ideology_score',
        value: traits.ideologyScore,
        weight: 0.4,
        contribution: traitContribution,
      });

      // Civic interest affects engagement/approval
      const civicContribution = (traits.civicInterest - 50) * 0.1;
      traitContribution += civicContribution;
      factors.push({
        name: 'civic_interest',
        value: traits.civicInterest,
        weight: 0.1,
        contribution: civicContribution,
      });
      break;

    case 'economic':
      // Risk aversion affects economic optimism
      const riskContribution = (50 - traits.riskAversion) * 0.3; // Inverse
      traitContribution += riskContribution;
      factors.push({
        name: 'risk_aversion',
        value: traits.riskAversion,
        weight: 0.3,
        contribution: riskContribution,
      });

      // Economic stress directly affects economic questions
      const stressContribution = (50 - state.economicStress) * 0.4; // Inverse
      traitContribution += stressContribution;
      factors.push({
        name: 'economic_stress',
        value: state.economicStress,
        weight: 0.4,
        contribution: stressContribution,
      });
      break;

    case 'trust':
      // Institutional trust is primary factor
      const trustContribution = (traits.institutionalTrust - 50) * 0.5;
      traitContribution += trustContribution;
      factors.push({
        name: 'institutional_trust',
        value: traits.institutionalTrust,
        weight: 0.5,
        contribution: trustContribution,
      });
      break;

    case 'digital':
      // Digital literacy is primary factor
      const digitalContribution = (traits.digitalLiteracy - 50) * 0.4;
      traitContribution += digitalContribution;
      factors.push({
        name: 'digital_literacy',
        value: traits.digitalLiteracy,
        weight: 0.4,
        contribution: digitalContribution,
      });

      // Digital access score also matters
      const accessContribution = (profile.digitalAccessScore - 50) * 0.2;
      traitContribution += accessContribution;
      factors.push({
        name: 'digital_access',
        value: profile.digitalAccessScore,
        weight: 0.2,
        contribution: accessContribution,
      });
      break;

    case 'social':
      // Social desirability affects social questions
      const socialContribution = (traits.socialDesirability - 50) * 0.2;
      traitContribution += socialContribution;
      factors.push({
        name: 'social_desirability',
        value: traits.socialDesirability,
        weight: 0.2,
        contribution: socialContribution,
      });

      // Openness to change
      const opennessContribution = (traits.opennessChange - 50) * 0.2;
      traitContribution += opennessContribution;
      factors.push({
        name: 'openness_change',
        value: traits.opennessChange,
        weight: 0.2,
        contribution: opennessContribution,
      });
      break;

    case 'generic':
      // Use patience and consistency for generic questions
      const patienceContribution = (traits.patience - 50) * 0.1;
      traitContribution += patienceContribution;
      factors.push({
        name: 'patience',
        value: traits.patience,
        weight: 0.1,
        contribution: patienceContribution,
      });
      break;
  }

  score += traitContribution;

  // State factors (apply to all categories)
  // Fatigue reduces engagement/positive responses
  const fatigueContribution = (50 - state.fatigue) * 0.15; // Inverse
  score += fatigueContribution;
  factors.push({
    name: 'fatigue',
    value: state.fatigue,
    weight: 0.15,
    contribution: fatigueContribution,
  });

  // Mood affects responses
  const moodValues: Record<string, number> = {
    positive: 10,
    neutral: 0,
    negative: -10,
    stressed: -15,
  };
  const moodContribution = moodValues[state.mood] ?? 0;
  score += moodContribution;
  factors.push({
    name: 'mood',
    value: moodValues[state.mood] ?? 0,
    weight: 0.15,
    contribution: moodContribution,
  });

  // Survey saturation reduces engagement
  const saturationContribution = (5 - state.surveySaturation) * 2; // -10 to +10
  score += saturationContribution;
  factors.push({
    name: 'survey_saturation',
    value: state.surveySaturation,
    weight: 0.1,
    contribution: saturationContribution,
  });

  // Event influences
  const eventInfluences: EventInfluence[] = [];
  let eventContribution = 0;

  for (const event of events) {
    // Only consider recent and significant exposures
    if (event.exposureLevel > 50) {
      const impact = event.moodImpact ?? 0;
      const stanceMultiplier = event.interpretedStance === 'positive' ? 1 : event.interpretedStance === 'negative' ? -1 : 0;
      const eventImpact = impact * stanceMultiplier * 0.3;

      eventContribution += eventImpact;
      eventInfluences.push({
        event_id: event.eventId,
        event_title: event.eventId, // Would need to fetch actual title
        impact: eventImpact,
        stance: event.interpretedStance,
      });
    }
  }

  score += eventContribution;

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  return { score, factors, eventInfluences };
}

// ============================================================================
// RESPONSE GENERATORS
// ============================================================================

function generateScaleResponse(
  question: SurveyQuestion,
  agent: FullAgent,
  events: AgentEventExposure[],
  rng: () => number,
  config: SurveyEngineConfig
): ComputedResponse {
  const startTime = Date.now();
  const scale = question.scale_config;

  if (!scale) {
    return {
      answerRaw: '',
      answerStructured: { value: null },
      traceability: createEmptyTraceability('generic'),
      responseTimeMs: Date.now() - startTime,
    };
  }

  const category = categorizeQuestion(question);
  const { score, factors, eventInfluences } = calculateLatentScore(agent, category, events);

  // Map score (0-100) to scale range
  const scaleRange = scale.max - scale.min;
  const normalizedScore = score / 100; // 0-1

  // Add small random variation
  const variation = (rng() - 0.5) * 2 * config.randomVariation; // -variation to +variation
  const adjustedScore = Math.max(0, Math.min(1, normalizedScore + variation));

  // Map to scale value
  const scaleValue = Math.round(scale.min + adjustedScore * scaleRange);
  const clampedValue = Math.max(scale.min, Math.min(scale.max, scaleValue));

  // Get label if available
  const label = scale.labels?.[clampedValue.toString()] || clampedValue.toString();

  // Calculate confidence based on factor consistency
  const factorVariances = factors.map((f) => Math.abs(f.contribution));
  const avgVariance = factorVariances.reduce((a, b) => a + b, 0) / factorVariances.length;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - avgVariance / 50));

  const responseTimeMs = Date.now() - startTime;

  return {
    answerRaw: `${clampedValue} - ${label}`,
    answerStructured: {
      value: clampedValue,
      label,
      score,
      normalized_score: adjustedScore,
    },
    traceability: {
      engine_version: ENGINE_VERSION,
      rng_seed: `${agent.profile.id}-${question.id}`,
      factors_used: factors,
      computed_score: score,
      confidence,
      selected_option: clampedValue,
      event_influences: eventInfluences,
      question_category: category,
      method: 'rule_based_v2',
    },
    responseTimeMs,
  };
}

function generateChoiceResponse(
  question: SurveyQuestion,
  agent: FullAgent,
  events: AgentEventExposure[],
  rng: () => number,
  config: SurveyEngineConfig
): ComputedResponse {
  const startTime = Date.now();
  const options = question.options_json || [];

  if (options.length === 0) {
    return {
      answerRaw: '',
      answerStructured: { value: null },
      traceability: createEmptyTraceability('generic'),
      responseTimeMs: Date.now() - startTime,
    };
  }

  const category = categorizeQuestion(question);
  const { score, factors, eventInfluences } = calculateLatentScore(agent, category, events);

  // Map score (0-100) to option index
  // Lower score = earlier options (usually more negative)
  // Higher score = later options (usually more positive)
  const normalizedScore = score / 100; // 0-1

  // Add random variation
  const variation = (rng() - 0.5) * 2 * config.randomVariation;
  const adjustedScore = Math.max(0, Math.min(0.999, normalizedScore + variation));

  // Select option based on score
  const optionIndex = Math.floor(adjustedScore * options.length);
  const selectedOption = options[Math.min(optionIndex, options.length - 1)];

  // Calculate confidence
  const factorVariances = factors.map((f) => Math.abs(f.contribution));
  const avgVariance = factorVariances.reduce((a, b) => a + b, 0) / factorVariances.length;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - avgVariance / 50));

  const responseTimeMs = Date.now() - startTime;

  return {
    answerRaw: selectedOption.label,
    answerStructured: {
      value: selectedOption.value,
      label: selectedOption.label,
      score,
      option_index: optionIndex,
    },
    traceability: {
      engine_version: ENGINE_VERSION,
      rng_seed: `${agent.profile.id}-${question.id}`,
      factors_used: factors,
      computed_score: score,
      confidence,
      selected_option: selectedOption.value,
      event_influences: eventInfluences,
      question_category: category,
      method: 'rule_based_v2',
    },
    responseTimeMs,
  };
}

function generateBooleanResponse(
  question: SurveyQuestion,
  agent: FullAgent,
  events: AgentEventExposure[],
  rng: () => number,
  config: SurveyEngineConfig
): ComputedResponse {
  const startTime = Date.now();
  const options = question.options_json || [
    { value: 'true', label: 'Sí' },
    { value: 'false', label: 'No' },
  ];

  const category = categorizeQuestion(question);
  const { score, factors, eventInfluences } = calculateLatentScore(agent, category, events);

  // For boolean, use threshold at 50
  // Add random variation
  const variation = (rng() - 0.5) * 2 * config.randomVariation * 100;
  const adjustedScore = score + variation;

  // Select based on threshold
  const isPositive = adjustedScore >= 50;
  const selectedOption = isPositive
    ? options.find((o) => o.value === 'true') || options[0]
    : options.find((o) => o.value === 'false') || options[1];

  // Confidence is higher when score is far from threshold
  const distanceFromThreshold = Math.abs(adjustedScore - 50);
  const confidence = Math.max(0.3, Math.min(0.95, distanceFromThreshold / 50));

  const responseTimeMs = Date.now() - startTime;

  return {
    answerRaw: selectedOption.label,
    answerStructured: {
      value: selectedOption.value === 'true',
      label: selectedOption.label,
      score,
      adjusted_score: adjustedScore,
    },
    traceability: {
      engine_version: ENGINE_VERSION,
      rng_seed: `${agent.profile.id}-${question.id}`,
      factors_used: factors,
      computed_score: score,
      confidence,
      selected_option: selectedOption.value,
      event_influences: eventInfluences,
      question_category: category,
      method: 'rule_based_v2',
    },
    responseTimeMs,
  };
}

function generateTextResponse(
  question: SurveyQuestion,
  agent: FullAgent,
  events: AgentEventExposure[],
  rng: () => number,
  config: SurveyEngineConfig
): ComputedResponse {
  const startTime = Date.now();

  const category = categorizeQuestion(question);
  const { score, factors, eventInfluences } = calculateLatentScore(agent, category, events);

  // Generate contextual text response based on score and category
  const isPositive = score > 60;
  const isNegative = score < 40;
  const isNeutral = !isPositive && !isNegative;

  // Templates based on category and sentiment
  const templates: Record<QuestionCategory, Record<string, string[]>> = {
    political: {
      positive: [
        'Creo que la gestión está yendo por buen camino.',
        'Tengo una opinión favorable sobre cómo se están manejando las cosas.',
        'Me parece que están haciendo un trabajo adecuado.',
      ],
      neutral: [
        'Tengo una opinión mixta, hay cosas buenas y malas.',
        'Depende del tema específico, no es blanco o negro.',
        'Es complejo, hay aspectos positivos y negativos.',
      ],
      negative: [
        'No estoy satisfecho con la dirección que están tomando.',
        'Creo que podrían hacer las cosas mejor.',
        'Tengo preocupaciones sobre la gestión actual.',
      ],
    },
    economic: {
      positive: [
        'Me siento optimista sobre la situación económica.',
        'Creo que las cosas van a mejorar.',
        'Tengo confianza en la estabilidad económica.',
      ],
      neutral: [
        'La situación es incierta, hay factores positivos y negativos.',
        'Depende de varios factores que están en juego.',
        'Es difícil predecir con certeza.',
      ],
      negative: [
        'Tengo preocupaciones sobre la situación económica.',
        'Me preocupa el futuro económico.',
        'Creo que hay desafíos importantes por delante.',
      ],
    },
    trust: {
      positive: [
        'Confío en que están actuando correctamente.',
        'Tengo confianza en estas instituciones.',
        'Me parecen confiables y responsables.',
      ],
      neutral: [
        'Tengo reservas, pero no descarto que puedan mejorar.',
        'Depende del contexto específico.',
        'Hay aspectos que me generan dudas.',
      ],
      negative: [
        'Tengo serias dudas sobre su confiabilidad.',
        'No me generan confianza.',
        'Creo que necesitan ganarse la confianza de la gente.',
      ],
    },
    digital: {
      positive: [
        'Me siento cómodo con la tecnología y el acceso digital.',
        'Creo que el avance digital es positivo.',
        'Tengo buen acceso y me manejo bien.',
      ],
      neutral: [
        'Hay ventajas y desventajas en la transformación digital.',
        'Depende de cómo se implemente.',
        'Es un tema con matices importantes.',
      ],
      negative: [
        'Tengo dificultades con el acceso o uso de tecnología.',
        'Me preocupa la brecha digital.',
        'Creo que no todos tienen las mismas oportunidades.',
      ],
    },
    social: {
      positive: [
        'Creo que hay buena cohesión social en mi comunidad.',
        'Me siento parte de una comunidad fuerte.',
        'Hay buenos lazos sociales.',
      ],
      neutral: [
        'Hay aspectos positivos y negativos en la cohesión social.',
        'Depende del contexto específico.',
        'Es un tema complejo.',
      ],
      negative: [
        'Siento que hay fragmentación en la sociedad.',
        'Me preocupa la falta de cohesión.',
        'Creo que nos falta más unión como sociedad.',
      ],
    },
    generic: {
      positive: [
        'Tengo una visión positiva sobre esto.',
        'Me parece algo bueno en general.',
        'Veo aspectos favorables.',
      ],
      neutral: [
        'Tengo una opinión mixta.',
        'Depende del contexto.',
        'Hay pros y contras.',
      ],
      negative: [
        'Tengo reservas sobre esto.',
        'Me genera cierta preocupación.',
        'Veo aspectos problemáticos.',
      ],
    },
  };

  const sentiment = isPositive ? 'positive' : isNegative ? 'negative' : 'neutral';
  const categoryTemplates = templates[category] || templates.generic;
  const templateOptions = categoryTemplates[sentiment];
  const selectedText = templateOptions[Math.floor(rng() * templateOptions.length)];

  // Add demographic context for more personalization
  const ageContext = agent.profile.age > 60 ? 'como persona mayor' : agent.profile.age < 30 ? 'como joven' : '';
  const finalText = ageContext ? `${selectedText} ${ageContext}.` : selectedText;

  // Confidence based on score distance from neutral
  const distanceFromNeutral = Math.abs(score - 50);
  const confidence = Math.max(0.3, Math.min(0.9, distanceFromNeutral / 50));

  const responseTimeMs = Date.now() - startTime;

  return {
    answerRaw: finalText,
    answerStructured: {
      text: finalText,
      score,
      sentiment,
      category,
    },
    traceability: {
      engine_version: ENGINE_VERSION,
      rng_seed: `${agent.profile.id}-${question.id}`,
      factors_used: factors,
      computed_score: score,
      confidence,
      selected_option: finalText,
      event_influences: eventInfluences,
      question_category: category,
      method: 'rule_based_v2',
    },
    responseTimeMs,
  };
}

function generateMultiselectResponse(
  question: SurveyQuestion,
  agent: FullAgent,
  events: AgentEventExposure[],
  rng: () => number,
  config: SurveyEngineConfig
): ComputedResponse {
  const startTime = Date.now();
  const options = question.options_json || [];

  if (options.length === 0) {
    return {
      answerRaw: '',
      answerStructured: { values: [] },
      traceability: createEmptyTraceability('generic'),
      responseTimeMs: Date.now() - startTime,
    };
  }

  const category = categorizeQuestion(question);
  const { score, factors, eventInfluences } = calculateLatentScore(agent, category, events);

  // For multiselect, use score to determine number of selections
  // Higher score = more selections (more engagement/positivity)
  const minSelections = 1;
  const maxSelections = Math.min(3, options.length);
  const normalizedScore = score / 100;

  const numSelections = Math.max(
    minSelections,
    Math.min(maxSelections, Math.ceil(normalizedScore * maxSelections))
  );

  // Select options based on score distribution
  // Higher score = prefer later options (if ordered positive->negative)
  const selected: Array<{ value: string; label: string }> = [];
  const used = new Set<number>();

  for (let i = 0; i < numSelections && used.size < options.length; i++) {
    // Bias selection based on score
    // High score = select from end of list
    // Low score = select from beginning
    let index: number;
    if (score > 60) {
      // Prefer higher indices
      index = Math.floor(options.length - 1 - rng() * (options.length * 0.6));
    } else if (score < 40) {
      // Prefer lower indices
      index = Math.floor(rng() * (options.length * 0.6));
    } else {
      // Random
      index = Math.floor(rng() * options.length);
    }

    // Ensure unique
    while (used.has(index)) {
      index = (index + 1) % options.length;
    }
    used.add(index);
    selected.push({ value: options[index].value, label: options[index].label });
  }

  // Confidence decreases with more selections (more uncertainty)
  const confidence = Math.max(0.3, 0.9 - selected.length * 0.15);

  const responseTimeMs = Date.now() - startTime;

  return {
    answerRaw: selected.map((s) => s.label).join(', '),
    answerStructured: {
      values: selected.map((s) => s.value),
      labels: selected.map((s) => s.label),
      score,
      num_selected: selected.length,
    },
    traceability: {
      engine_version: ENGINE_VERSION,
      rng_seed: `${agent.profile.id}-${question.id}`,
      factors_used: factors,
      computed_score: score,
      confidence,
      selected_option: selected.map((s) => s.value).join(','),
      event_influences: eventInfluences,
      question_category: category,
      method: 'rule_based_v2',
    },
    responseTimeMs,
  };
}

function createEmptyTraceability(category: QuestionCategory): ResponseTraceability {
  return {
    engine_version: ENGINE_VERSION,
    rng_seed: '',
    factors_used: [],
    computed_score: 50,
    confidence: 0,
    selected_option: '',
    event_influences: [],
    question_category: category,
    method: 'rule_based_v2',
  };
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
      randomVariation: config.randomVariation ?? 0.1, // 10% variation by default
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
      weightedStats: {
        total: 0,
        totalWeight: 0,
        byQuestion: {},
        avgResponseTimeMs: 0,
      },
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

          // Update weighted stats
          this.updateWeightedStats(result.weightedStats, batchResponses, batch);

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
    try {
      const rng = this.createRNG(agent.profile.id + question.id);

      let computedResponse: ComputedResponse;

      if (this.config.useLLM) {
        // TODO: Implement LLM-based response generation
        // For now, fall back to rules
        computedResponse = this.generateRuleBasedResponse(question, agent, rng);
      } else if (this.config.useRules) {
        computedResponse = this.generateRuleBasedResponse(question, agent, rng);
      } else {
        throw new Error('No response generation method configured');
      }

      // Save response to database with full traceability
      const savedResponse = await surveyRepo.saveSurveyResponse(
        runId,
        agent.profile.id,
        question.id,
        computedResponse.answerRaw,
        computedResponse.answerStructured,
        computedResponse.responseTimeMs,
        computedResponse.traceability as unknown as Record<string, unknown>
      );

      return savedResponse;
    } catch (error) {
      console.error('Error generating response:', error);
      return null;
    }
  }

  private generateRuleBasedResponse(
    question: SurveyQuestion,
    agent: FullAgent,
    rng: () => number
  ): ComputedResponse {
    // Get events for this agent (would need to be passed in or fetched)
    // For now, use empty array
    const events: AgentEventExposure[] = agent.events || [];

    switch (question.answer_type) {
      case 'scale':
        return generateScaleResponse(question, agent, events, rng, this.config);
      case 'single_choice':
        return generateChoiceResponse(question, agent, events, rng, this.config);
      case 'boolean':
        return generateBooleanResponse(question, agent, events, rng, this.config);
      case 'text':
        return generateTextResponse(question, agent, events, rng, this.config);
      case 'multiple_choice':
        return generateMultiselectResponse(question, agent, events, rng, this.config);
      case 'number':
        return generateScaleResponse(question, agent, events, rng, this.config);
      default:
        return {
          answerRaw: '',
          answerStructured: { value: null },
          traceability: createEmptyTraceability('generic'),
          responseTimeMs: 0,
        };
    }
  }

  private updateWeightedStats(
    stats: WeightedSurveyStats,
    responses: SurveyResponse[],
    agents: FullAgent[]
  ): void {
    // Create agent lookup for weights
    const agentWeights = new Map(agents.map((a) => [a.profile.id, a.profile.weight]));

    for (const response of responses) {
      const weight = agentWeights.get(response.agent_id) ?? 1;

      stats.total++;
      stats.totalWeight += weight;

      const qid = response.question_id;
      if (!stats.byQuestion[qid]) {
        stats.byQuestion[qid] = { count: 0, weight: 0 };
      }
      stats.byQuestion[qid].count++;
      stats.byQuestion[qid].weight += weight;

      stats.avgResponseTimeMs =
        (stats.avgResponseTimeMs * (stats.total - 1) + (response.response_time_ms ?? 0)) /
        stats.total;
    }
  }

  private createRNG(seed: string): () => number {
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
 * Calculate weighted survey statistics
 */
export function calculateWeightedSurveyStats(
  responses: SurveyResponse[],
  agents: FullAgent[]
): WeightedSurveyStats {
  const agentWeights = new Map(agents.map((a) => [a.profile.id, a.profile.weight]));

  const byQuestion: Record<string, { count: number; weight: number }> = {};
  let totalResponseTime = 0;
  let totalWeight = 0;

  for (const response of responses) {
    const weight = agentWeights.get(response.agent_id) ?? 1;
    totalWeight += weight;

    const qid = response.question_id;
    if (!byQuestion[qid]) {
      byQuestion[qid] = { count: 0, weight: 0 };
    }
    byQuestion[qid].count++;
    byQuestion[qid].weight += weight;

    totalResponseTime += response.response_time_ms ?? 0;
  }

  return {
    total: responses.length,
    totalWeight,
    byQuestion,
    avgResponseTimeMs: responses.length > 0 ? totalResponseTime / responses.length : 0,
  };
}

/**
 * Aggregate scale responses with weights
 */
export function aggregateWeightedScaleResponses(
  responses: SurveyResponse[],
  agents: FullAgent[],
  min: number,
  max: number
): {
  mean: number;
  weightedMean: number;
  median: number;
  weightedMedian: number;
  distribution: Record<number, number>;
  weightedDistribution: Record<number, number>;
} {
  const agentWeights = new Map(agents.map((a) => [a.profile.id, a.profile.weight]));

  const values: number[] = [];
  const weightedValues: Array<{ value: number; weight: number }> = [];
  const distribution: Record<number, number> = {};
  const weightedDistribution: Record<number, number> = {};

  // Initialize distributions
  for (let i = min; i <= max; i++) {
    distribution[i] = 0;
    weightedDistribution[i] = 0;
  }

  for (const response of responses) {
    const value = response.answer_structured_json?.value as number;
    if (typeof value === 'number' && value >= min && value <= max) {
      const weight = agentWeights.get(response.agent_id) ?? 1;

      values.push(value);
      weightedValues.push({ value, weight });

      distribution[value] = (distribution[value] || 0) + 1;
      weightedDistribution[value] = (weightedDistribution[value] || 0) + weight;
    }
  }

  // Calculate means
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const weightedMean =
    weightedValues.length > 0
      ? weightedValues.reduce((sum, { value, weight }) => sum + value * weight, 0) /
        weightedValues.reduce((sum, { weight }) => sum + weight, 0)
      : 0;

  // Calculate medians
  values.sort((a, b) => a - b);
  const median =
    values.length > 0
      ? values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)]
      : 0;

  // Weighted median
  weightedValues.sort((a, b) => a.value - b.value);
  let cumulativeWeight = 0;
  const halfWeight = weightedValues.reduce((sum, { weight }) => sum + weight, 0) / 2;
  let weightedMedian = 0;
  for (const { value, weight } of weightedValues) {
    cumulativeWeight += weight;
    if (cumulativeWeight >= halfWeight) {
      weightedMedian = value;
      break;
    }
  }

  return {
    mean,
    weightedMean,
    median,
    weightedMedian,
    distribution,
    weightedDistribution,
  };
}

// ENGINE_VERSION ya está exportado al inicio del archivo

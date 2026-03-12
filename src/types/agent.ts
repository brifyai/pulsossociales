/**
 * Agent Types - Core domain models for synthetic agents
 * 
 * This module defines the complete contract for agent entities in the system.
 * Aligned with the final product architecture and designed to work with:
 * - Convex (agent data, memory, state)
 * - Supabase (profile, traits, survey history)
 * - Event Engine (event exposure)
 * 
 * The agent model is designed to support:
 * - Synthetic population representation
 * - Survey participation
 * - Event reaction simulation
 * - Memory and consistency tracking
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type UrbanRural = 'urban' | 'rural' | 'semiurban';
export type Sex = 'male' | 'female' | 'other';
export type EducationLevel = 'none' | 'primary' | 'secondary' | 'technical' | 'university' | 'postgraduate';
export type EmploymentStatus = 'employed' | 'unemployed' | 'inactive' | 'retired' | 'student';
export type HouseholdType = 'single' | 'couple' | 'single_parent' | 'extended' | 'other';
export type ConnectivityType = 'fiber' | 'cable' | 'dsl' | 'mobile' | 'satellite' | 'none';
export type Mood = 'positive' | 'neutral' | 'negative' | 'stressed';

// ============================================================================
// AGENT PROFILE
// ============================================================================

/**
 * AgentProfile - Demographic and socioeconomic characteristics
 * 
 * This represents the "census" data of the agent.
 * Used for:
 * - Population stratification
 * - Survey weighting
 * - Representativeness analysis
 * - Benchmark comparisons
 */
export interface AgentProfile {
  /** Unique identifier (matches Convex player ID) */
  readonly id: string;
  
  /** Display name */
  readonly name: string;
  
  /** Region ID (links to TerritoryRegion) */
  readonly regionId: string;
  
  /** Commune name within region */
  readonly commune: string;
  
  /** Urban/rural classification */
  readonly urbanRural: UrbanRural;
  
  /** Sex */
  readonly sex: Sex;
  
  /** Age in years */
  readonly age: number;
  
  /** Education level attained */
  readonly educationLevel: EducationLevel;
  
  /** Current employment status */
  readonly employmentStatus: EmploymentStatus;
  
  /** Income decile (1-10, relative to national distribution) */
  readonly incomeDecile: number;
  
  /** Number of people in household */
  readonly householdSize: number;
  
  /** Household composition type */
  readonly householdType: HouseholdType;
  
  /** Whether has children under 18 */
  readonly hasChildren: boolean;
  
  /** Primary internet connectivity type */
  readonly connectivityType: ConnectivityType;
  
  /** Digital access score (0-100) */
  readonly digitalAccessScore: number;
  
  /** Survey weight for population representativeness */
  readonly weight: number;
  
  /** Optional: character sprite for AI Town visualization */
  readonly character?: string;
  
  /** Optional: description for UI display */
  readonly description?: string;
}

// ============================================================================
// AGENT TRAITS
// ============================================================================

/**
 * AgentTraits - Psychological and behavioral characteristics
 * 
 * These traits influence how the agent responds to:
 * - Survey questions
 * - Events
 * - Other agents
 * 
 * All scores are 0-100 where higher = more of the trait.
 */
export interface AgentTraits {
  /** Trust in institutions (government, media, etc.) */
  readonly institutionalTrust: number;
  
  /** Risk aversion in decision making */
  readonly riskAversion: number;
  
  /** Digital literacy and tech comfort */
  readonly digitalLiteracy: number;
  
  /** Patience in survey completion */
  readonly patience: number;
  
  /** Interest in civic/political matters */
  readonly civicInterest: number;
  
  /** Tendency to give socially desirable answers */
  readonly socialDesirability: number;
  
  /** Openness to change and new ideas */
  readonly opennessChange: number;
  
  /** Political ideology score (0=left, 100=right) */
  readonly ideologyScore: number;
  
  /** Nationalism/patriotism level */
  readonly nationalismScore: number;
  
  /** Consistency in responses over time */
  readonly consistencyScore: number;
}

// ============================================================================
// AGENT MEMORY
// ============================================================================

/**
 * AgentMemory - Long-term memory and learning
 * 
 * Represents what the agent "remembers" from:
 * - Previous surveys
 * - Conversations with other agents
 * - Events experienced
 * 
 * Used for:
 * - Consistency checking
 * - Contextual responses
 * - Contradiction detection
 */
export interface AgentMemory {
  /** Summary of agent's learned positions and beliefs */
  readonly summary: string;
  
  /** Topics the agent has strong opinions on */
  readonly salientTopics: string[];
  
  /** Previous stated positions on key issues */
  readonly previousPositions: Array<{
    topic: string;
    stance: string;
    timestamp: Date;
    source: 'survey' | 'conversation' | 'event' | 'reflection' | 'manual';
  }>;
  
  /** Score indicating internal contradictions (0=consistent, 100=highly contradictory) */
  readonly contradictionScore: number;
}

// ============================================================================
// AGENT STATE
// ============================================================================

/**
 * AgentState - Dynamic, time-varying state
 * 
 * Represents the agent's current condition.
 * Changes over time based on:
 * - Survey participation
 * - Events
 * - Time since last activation
 */
export interface AgentState {
  /** Survey fatigue level (0=fresh, 100=exhausted) */
  readonly fatigue: number;
  
  /** Economic stress level (0=stable, 100=severe) */
  readonly economicStress: number;
  
  /** Current emotional mood */
  readonly mood: Mood;
  
  /** Survey saturation (how many surveys recently) */
  readonly surveySaturation: number;
  
  /** Last time agent was activated (optional) */
  readonly lastActivationAt?: Date;
  
  /** Current activity status */
  readonly isActive: boolean;
}

// ============================================================================
// AGENT EVENT EXPOSURE
// ============================================================================

/**
 * AgentEventExposure - Event impact on agent
 * 
 * Represents how an event affects this specific agent.
 * Different agents may have different exposure levels to the same event.
 */
export interface AgentEventExposure {
  /** Reference to the event */
  readonly eventId: string;
  
  /** Probability of being exposed (0-100) */
  readonly exposureProbability: number;
  
  /** Actual exposure level experienced (0-100) */
  readonly exposureLevel: number;
  
  /** How the agent interpreted the event (e.g., "positive", "negative", "neutral") */
  readonly interpretedStance: string;
  
  /** Impact on agent's mood */
  readonly moodImpact: number;
  
  /** When the exposure occurred */
  readonly exposedAt: Date;
}

// ============================================================================
// FULL AGENT
// ============================================================================

/**
 * FullAgent - Complete agent representation
 * 
 * This is the main type used throughout the frontend.
 * Combines all agent dimensions into a single coherent structure.
 * 
 * Note: In production, different parts may come from different sources:
 * - profile: Supabase (demographics)
 * - traits: Supabase (psychological)
 * - memory: Convex (conversational)
 * - state: Convex (real-time)
 * - events: Event Engine (exposure tracking)
 */
export interface FullAgent {
  readonly profile: AgentProfile;
  readonly traits: AgentTraits;
  readonly memory: AgentMemory;
  readonly state: AgentState;
  readonly events: AgentEventExposure[];
}

// ============================================================================
// AGENT SUMMARY (for lists)
// ============================================================================

/**
 * AgentSummary - Lightweight agent representation for lists
 * 
 * Used when displaying many agents (e.g., in region view).
 * Contains only essential fields to minimize data transfer.
 */
export interface AgentSummary {
  readonly id: string;
  readonly name: string;
  readonly regionId: string;
  readonly age: number;
  readonly sex: Sex;
  readonly character?: string;
  readonly isActive: boolean;
  readonly mood: Mood;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert FullAgent to AgentSummary
 */
export function toAgentSummary(agent: FullAgent): AgentSummary {
  return {
    id: agent.profile.id,
    name: agent.profile.name,
    regionId: agent.profile.regionId,
    age: agent.profile.age,
    sex: agent.profile.sex,
    character: agent.profile.character,
    isActive: agent.state.isActive,
    mood: agent.state.mood,
  };
}

/**
 * Get agent's display description
 */
export function getAgentDescription(agent: FullAgent): string {
  const { profile, traits } = agent;
  const parts: string[] = [];
  
  parts.push(`${profile.age} años`);
  parts.push(profile.sex === 'male' ? 'hombre' : profile.sex === 'female' ? 'mujer' : 'otro');
  parts.push(profile.commune);
  
  if (traits.civicInterest > 70) parts.push('muy interesado en política');
  if (traits.institutionalTrust < 30) parts.push('desconfía de instituciones');
  if (traits.digitalLiteracy > 70) parts.push('muy digital');
  
  return parts.join(', ');
}

/**
 * Check if agent is available for surveys
 */
export function isAgentAvailable(agent: FullAgent): boolean {
  return (
    agent.state.isActive &&
    agent.state.fatigue < 80 &&
    agent.state.surveySaturation < 5
  );
}

/**
 * Calculate agent's survey priority (higher = more important to survey)
 */
export function calculateSurveyPriority(agent: FullAgent): number {
  const { profile, state } = agent;
  
  // Base priority from population weight
  let priority = profile.weight;
  
  // Reduce priority if fatigued
  priority *= (1 - state.fatigue / 100);
  
  // Reduce priority if saturated
  priority *= (1 - state.surveySaturation / 10);
  
  return priority;
}

/**
 * Physics Knowledge Layer Type Definitions
 * Tailored for Class 11-12 Mechanics (Newton's Laws of Motion & Friction)
 */

export type ConceptId =
  | 'fbd-force-identification'
  | 'newtons-second-law'
  | 'friction-direction'
  | 'inclined-plane'
  | 'connected-bodies-pulleys';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * Representation of a core mathematical equation governing a concept
 */
export interface CoreEquation {
  id: string;
  label: string;
  latex: string;
  explanation: string;
  variables: Record<string, string>;
}

/**
 * Deep structural invariant elements of a physics concept
 * Defines what fundamentally remains true regardless of problem surface dressing
 */
export interface DeepStructure {
  governingLaws: string[];
  invariants: string[];
  coordinateSystemStrategy: string;
  causalMechanisms: string[];
}

/**
 * Rules and boundaries for generating conceptual twin problems
 * Distinguishes what can change (surface features) from what must remain invariant (deep structure)
 */
export interface TwinGenerationConstraints {
  invariableElements: string[];
  variableSurfaceFeatures: string[];
  numericalRanges: Record<
    string,
    {
      min: number;
      max: number;
      unit: string;
      step?: number;
    }
  >;
  forbiddenCombinations?: string[];
}

/**
 * Main representation of a Physics Concept in ConceptTwin
 */
export interface PhysicsConcept {
  conceptId: ConceptId;
  name: string;
  description: string;
  deepPrinciple: string;
  prerequisites: string[];
  coreEquations: CoreEquation[];
  commonMisconceptions: string[];
  surfaceFeatures: string[];
  deepStructure: DeepStructure;
  twinGenerationConstraints: TwinGenerationConstraints;
}

/**
 * Verified seed problem representation
 */
export interface SeedProblem {
  problemId: string;
  conceptId: ConceptId;
  difficulty: DifficultyLevel;
  question: string;
  expectedApproach: string;
  correctAnswer: number | string;
  unit: string;
  reasoning: string;
  commonMistakes: string[];
  givenData?: Record<string, number | string>;
  targetVariable?: string;
}

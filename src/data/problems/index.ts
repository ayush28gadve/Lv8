import { ConceptId, SeedProblem } from '@/types/physics';

/**
 * 10 Verified Seed Problems (2 per Concept Cluster)
 * Standard Class 11-12 Physics (Newton's Laws of Motion & Friction)
 * All numerical values use standard g = 10 m/s² with exact, verified solutions.
 * 
 * Each has been enriched with pyqMetadata mapping to adaptively modeled JEE Main archives.
 */
export const SEED_PROBLEMS: SeedProblem[] = [
  // =========================================================================
  // CONCEPT 1: Free-Body Diagrams & Force Identification
  // =========================================================================
  {
    problemId: 'prob-fbd-01',
    conceptId: 'fbd-force-identification',
    difficulty: 'easy',
    question:
      'A book of mass 2 kg rests on a horizontal table inside an elevator that is accelerating upwards at 2 m/s². Taking g = 10 m/s², calculate the magnitude of the normal force exerted by the table on the book.',
    expectedApproach:
      'Isolate the book. Identify real vertical forces: downward gravity (W = mg) and upward normal reaction (N). Set up Newton’s Second Law along the vertical axis: N - mg = m * a_y, then solve for N = m(g + a_y).',
    correctAnswer: 24,
    unit: 'N',
    reasoning:
      'In an inertial frame of reference, the two vertical forces acting on the book are downward gravitational force W = mg = 2 kg * 10 m/s² = 20 N and upward normal force N from the table. Applying Newton’s Second Law: N - mg = m * a => N = 20 N + 2 kg * 2 m/s² = 24 N. The apparent weight increases due to upward acceleration.',
    commonMistakes: [
      'Assuming the normal force is always equal to the static weight mg (20 N).',
      'Subtracting acceleration instead of adding: N = m(g - a) = 16 N (which applies to downward acceleration).',
      'Adding a pseudo-force in the same direction as upward acceleration without setting up an inertial frame.',
    ],
    givenData: {
      mass: 2,
      acceleration: 2,
      gravity: 10,
    },
    targetVariable: 'Normal Force (N)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2021,
      source: 'JEE Mechanics Archives'
    }
  },
  {
    problemId: 'prob-fbd-02',
    conceptId: 'fbd-force-identification',
    difficulty: 'medium',
    question:
      'A horizontal pushing force of F = 30 N is applied to press a block of mass 2 kg against a rough vertical wall, keeping the block stationary. Taking g = 10 m/s², determine the magnitude of the normal force exerted by the wall on the block.',
    expectedApproach:
      'Isolate horizontal and vertical force components separately. The normal force acts strictly perpendicular to the contact interface (horizontally). For horizontal equilibrium (a_x = 0): N = F_applied.',
    correctAnswer: 30,
    unit: 'N',
    reasoning:
      'The contact interface is vertical, meaning the normal force acts horizontally (perpendicular to the wall). In the horizontal direction, the only forces are the applied force F to the right and the normal force N from the wall to the left. Since the block has no horizontal acceleration (a_x = 0), N = F = 30 N. The weight of the block (mg = 20 N) is balanced vertically by static friction, not by the normal force.',
    commonMistakes: [
      'Confusing vertical and horizontal force components and setting N = mg = 20 N.',
      'Combining the applied force and gravitational force into a vector resultant for normal force: sqrt(30² + 20²).',
      'Thinking the normal force must balance gravity on a vertical wall.',
    ],
    givenData: {
      appliedForce: 30,
      mass: 2,
      gravity: 10,
    },
    targetVariable: 'Normal Force (N)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2020,
      source: 'JEE Mechanics Archives'
    }
  },

  // =========================================================================
  // CONCEPT 2: Newton's Second Law / Net Force
  // =========================================================================
  {
    problemId: 'prob-nl2-01',
    conceptId: 'newtons-second-law',
    difficulty: 'easy',
    question:
      'A constant horizontal force of 50 N acts on a crate of mass 10 kg resting on a frictionless horizontal surface. If the crate starts from rest, calculate its speed after 4 seconds.',
    expectedApproach:
      'Use Newton’s Second Law to calculate acceleration: a = F_net / m. Then apply the linear kinematic equation for constant acceleration starting from rest: v = u + at.',
    correctAnswer: 20,
    unit: 'm/s',
    reasoning:
      'Since the horizontal floor is frictionless, the net horizontal force acting on the crate is F_net = 50 N. By Newton’s Second Law, the acceleration is a = F_net / m = 50 N / 10 kg = 5 m/s². Starting from rest (u = 0 m/s) with constant acceleration for t = 4 s, the final speed is v = u + at = 0 + (5 m/s² * 4 s) = 20 m/s.',
    commonMistakes: [
      'Confusing force directly with velocity and calculating v = F * t = 200 m/s.',
      'Forgetting to divide the force by the mass to find acceleration first.',
      'Using the work-energy or displacement formula incorrectly instead of v = u + at.',
    ],
    givenData: {
      appliedForce: 50,
      mass: 10,
      time: 4,
      initialVelocity: 0,
    },
    targetVariable: 'Final Speed (m/s)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2019,
      source: 'JEE Mechanics Archives'
    }
  },
  {
    problemId: 'prob-nl2-02',
    conceptId: 'newtons-second-law',
    difficulty: 'easy',
    question:
      'Two horizontal forces F₁ = 18 N (acting due East) and F₂ = 6 N (acting due West) act simultaneously on a 3 kg object placed on a smooth horizontal floor. Calculate the magnitude of the object’s acceleration.',
    expectedApproach:
      'Determine net horizontal force by finding the vector sum of opposing collinear forces: F_net = F₁ - F₂. Then apply Newton’s Second Law: a = F_net / m.',
    correctAnswer: 4,
    unit: 'm/s²',
    reasoning:
      'The forces act along the same line in opposite directions. The net horizontal force is the vector resultant: F_net = 18 N - 6 N = 12 N (directed East). By Newton’s Second Law: a = F_net / m = 12 N / 3 kg = 4 m/s².',
    commonMistakes: [
      'Adding opposing collinear forces scalar-wise without respecting signs: F_net = 18 + 6 = 24 N => a = 8 m/s².',
      'Dividing each force by mass independently and subtracting them without conceptual clarity.',
      'Multiplying net force by mass instead of dividing.',
    ],
    givenData: {
      force1: 18,
      force2: 6,
      mass: 3,
    },
    targetVariable: 'Acceleration Magnitude (m/s²)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2022,
      source: 'JEE Mechanics Archives'
    }
  },

  // =========================================================================
  // CONCEPT 3: Friction & Direction of Friction
  // =========================================================================
  {
    problemId: 'prob-frc-01',
    conceptId: 'friction-direction',
    difficulty: 'medium',
    question:
      'A block of mass 4 kg rests on a horizontal floor. The coefficient of static friction is μ_s = 0.5 and the coefficient of kinetic friction is μ_k = 0.4. A horizontal pulling force of 15 N is applied to the block. Taking g = 10 m/s², determine the magnitude of the friction force acting on the block.',
    expectedApproach:
      'Calculate the maximum limiting static friction: f_s_max = μ_s * N, where N = mg. Compare the applied pulling force F with f_s_max. If F < f_s_max, the block remains stationary and static friction equals the applied force: f = F.',
    correctAnswer: 15,
    unit: 'N',
    reasoning:
      'The normal force is N = mg = 4 kg * 10 m/s² = 40 N. The maximum available static friction is f_s_max = μ_s * N = 0.5 * 40 N = 20 N. Since the applied pulling force (15 N) is strictly less than 20 N, the block does not overcome static friction and remains at rest (a = 0). Therefore, static friction is self-adjusting and exactly balances the applied force: f_s = 15 N.',
    commonMistakes: [
      'Assuming the friction force is always equal to the maximum static friction: f = 0.5 * 40 = 20 N.',
      'Prematurely applying kinetic friction formula: f = μ_k * N = 0.4 * 40 = 16 N even though the block has not moved.',
      'Claiming friction is zero because the block does not move.',
    ],
    givenData: {
      mass: 4,
      mu_s: 0.5,
      mu_k: 0.4,
      appliedForce: 15,
      gravity: 10,
    },
    targetVariable: 'Actual Friction Force (N)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2021,
      source: 'JEE Friction Archives'
    }
  },
  {
    problemId: 'prob-frc-02',
    conceptId: 'friction-direction',
    difficulty: 'easy',
    question:
      'A 5 kg block slides along a rough horizontal floor with an initial speed of 6 m/s. The coefficient of kinetic friction between the block and the floor is μ_k = 0.2. Taking g = 10 m/s², find the magnitude of the deceleration of the block.',
    expectedApproach:
      'Calculate normal reaction N = mg. Compute kinetic friction force f_k = μ_k * N. Apply Newton’s Second Law: a = f_k / m = μ_k * g.',
    correctAnswer: 2,
    unit: 'm/s²',
    reasoning:
      'For a block sliding on a level horizontal surface, normal force N = mg = 5 kg * 10 m/s² = 50 N. Kinetic friction opposing motion is f_k = μ_k * N = 0.2 * 50 N = 10 N. The net retarding force is 10 N. By Newton’s Second Law, deceleration magnitude is a = f_k / m = 10 N / 5 kg = 2 m/s² (equivalent to a = μ_k * g = 0.2 * 10 = 2 m/s², independent of mass).',
    commonMistakes: [
      'Injecting the initial speed (6 m/s) into the force or acceleration formula.',
      'Using static friction coefficient if both are provided.',
      'Confusing deceleration magnitude with velocity or stopping distance.',
    ],
    givenData: {
      mass: 5,
      initialSpeed: 6,
      mu_k: 0.2,
      gravity: 10,
    },
    targetVariable: 'Deceleration Magnitude (m/s²)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2018,
      source: 'JEE Friction Archives'
    }
  },

  // =========================================================================
  // CONCEPT 4: Inclined Plane Problems
  // =========================================================================
  {
    problemId: 'prob-inc-01',
    conceptId: 'inclined-plane',
    difficulty: 'easy',
    question:
      'A block of mass 6 kg slides down a smooth (frictionless) inclined plane tilted at an angle of 30° to the horizontal. Taking g = 10 m/s² and sin(30°) = 0.5, calculate the magnitude of the block’s acceleration down the incline.',
    expectedApproach:
      'Decompose the gravitational force along the incline: F_parallel = mg * sin(θ). Since there is no friction, the net downhill force is mg * sin(θ). By Newton’s Second Law, a = (mg * sin(θ)) / m = g * sin(θ).',
    correctAnswer: 5,
    unit: 'm/s²',
    reasoning:
      'In a coordinate system rotated parallel to the incline, the downhill component of gravity is F_parallel = mg * sin(30°). With zero friction on a smooth surface, F_net = mg * sin(30°). Applying Newton’s Second Law gives a = F_net / m = g * sin(30°) = 10 m/s² * 0.5 = 5 m/s². The mass of the block cancels out.',
    commonMistakes: [
      'Using cos(30°) instead of sin(30°) for the downhill component (a = g * cos 30° ≈ 8.66 m/s²).',
      'Multiplying by mass again and stating the force (30 N) as the acceleration.',
      'Assuming acceleration on an incline is always g (10 m/s²).',
    ],
    givenData: {
      mass: 6,
      angle: 30,
      gravity: 10,
      sin30: 0.5,
    },
    targetVariable: 'Downhill Acceleration (m/s²)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2023,
      source: 'JEE Incline Archives'
    }
  },
  {
    problemId: 'prob-inc-02',
    conceptId: 'inclined-plane',
    difficulty: 'medium',
    question:
      'A block of mass 4 kg slides down a rough incline inclined at 37° to the horizontal (sin 37° = 0.6, cos 37° = 0.8). The coefficient of kinetic friction is μ_k = 0.25. Taking g = 10 m/s², determine the magnitude of the block’s downhill acceleration.',
    expectedApproach:
      'Calculate normal force N = mg * cos(37°). Compute kinetic friction f_k = μ_k * N = μ_k * mg * cos(37°). Calculate downhill driving gravity F_down = mg * sin(37°). Compute net force F_net = F_down - f_k and acceleration a = F_net / m = g(sin 37° - μ_k * cos 37°).',
    correctAnswer: 4,
    unit: 'm/s²',
    reasoning:
      'Normal reaction perpendicular to the incline is N = mg * cos(37°) = 4 kg * 10 m/s² * 0.8 = 32 N. Kinetic friction opposing downhill motion is f_k = μ_k * N = 0.25 * 32 N = 8 N. Downhill gravitational force component is F_down = mg * sin(37°) = 4 kg * 10 m/s² * 0.6 = 24 N. The net downhill force is F_net = 24 N - 8 N = 16 N. The resulting acceleration is a = F_net / m = 16 N / 4 kg = 4 m/s² (or a = g(sin 37° - μ_k * cos 37°) = 10 * (0.6 - 0.25 * 0.8) = 10 * 0.4 = 4 m/s²).',
    commonMistakes: [
      'Using standard flat-ground normal force N = mg = 40 N, yielding f_k = 10 N and wrong acceleration.',
      'Swapping sin(37°) and cos(37°).',
      'Adding friction to the gravitational component instead of subtracting it.',
    ],
    givenData: {
      mass: 4,
      angle: 37,
      sin37: 0.6,
      cos37: 0.8,
      mu_k: 0.25,
      gravity: 10,
    },
    targetVariable: 'Downhill Acceleration (m/s²)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2021,
      source: 'JEE Incline Archives'
    }
  },

  // =========================================================================
  // CONCEPT 5: Connected Bodies / Pulley Systems
  // =========================================================================
  {
    problemId: 'prob-pul-01',
    conceptId: 'connected-bodies-pulleys',
    difficulty: 'medium',
    question:
      'In an ideal Atwood machine, two masses m₁ = 3 kg and m₂ = 2 kg are connected by a light inextensible string passing over a frictionless massless pulley. Taking g = 10 m/s², calculate the magnitude of the acceleration of the system.',
    expectedApproach:
      'Treat the two masses as a single coupled system along the string constraint. Net driving force is the difference in weights: (m₁ - m₂) * g. Total inertia is m₁ + m₂. Acceleration is a = ((m₁ - m₂) * g) / (m₁ + m₂).',
    correctAnswer: 2,
    unit: 'm/s²',
    reasoning:
      'The unbalanced external gravitational force driving the system is F_net = (m₁ - m₂) * g = (3 kg - 2 kg) * 10 m/s² = 10 N. The total accelerated mass of the system is m_total = m₁ + m₂ = 3 kg + 2 kg = 5 kg. The acceleration of each mass is a = F_net / m_total = 10 N / 5 kg = 2 m/s².',
    commonMistakes: [
      'Dividing net force by only one mass (e.g. 10 N / 3 kg or 10 N / 2 kg) rather than the combined total mass.',
      'Subtracting masses in the denominator: a = (m₁ - m₂)g / (m₁ - m₂).',
      'Ignoring the opposing mass and assuming free-fall acceleration g = 10 m/s².',
    ],
    givenData: {
      mass1: 3,
      mass2: 2,
      gravity: 10,
    },
    targetVariable: 'System Acceleration (m/s²)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2020,
      source: 'JEE Pulley Systems Archives'
    }
  },
  {
    problemId: 'prob-pul-02',
    conceptId: 'connected-bodies-pulleys',
    difficulty: 'hard',
    question:
      'A block of mass m_A = 3 kg resting on a smooth frictionless horizontal table is connected by a light string over a frictionless pulley to a hanging mass m_B = 2 kg. Taking g = 10 m/s², determine the tension T in the string while the system accelerates.',
    expectedApproach:
      'First calculate system acceleration: a = (m_B * g) / (m_A + m_B). Then write the horizontal equation of motion for block A: T = m_A * a (or for hanging block B: m_B * g - T = m_B * a), and solve for T.',
    correctAnswer: 12,
    unit: 'N',
    reasoning:
      'The sole external force driving horizontal and vertical motion is the weight of hanging block B: F_driving = m_B * g = 2 kg * 10 m/s² = 20 N. Total system mass is m_A + m_B = 3 kg + 2 kg = 5 kg. The system acceleration is a = 20 N / 5 kg = 4 m/s². For block A on the frictionless table, the tension T is the only horizontal force: T = m_A * a = 3 kg * 4 m/s² = 12 N. (Verification on block B: m_B * g - T = m_B * a => 20 N - 12 N = 2 kg * 4 m/s² = 8 N, which is consistent).',
    commonMistakes: [
      'Assuming tension equals the static weight of the hanging mass: T = m_B * g = 20 N (ignoring acceleration).',
      'Setting tension equal to the weight of the table block: T = m_A * g = 30 N.',
      'Adding weights together to estimate tension: T = (m_A + m_B) * g = 50 N.',
    ],
    givenData: {
      massA: 3,
      massB: 2,
      gravity: 10,
    },
    targetVariable: 'String Tension (N)',
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Practice)',
      year: 2022,
      source: 'JEE Pulley Systems Archives'
    }
  },
];

/**
 * Helper to get all seed problems
 */
export function getAllProblems(): SeedProblem[] {
  return SEED_PROBLEMS;
}

/**
 * Helper to query a problem by ID
 */
export function getProblemById(problemId: string): SeedProblem | undefined {
  return SEED_PROBLEMS.find((p) => p.problemId === problemId);
}

/**
 * Helper to get all problems under a specific concept cluster
 */
export function getProblemsByConcept(conceptId: ConceptId): SeedProblem[] {
  return SEED_PROBLEMS.filter((p) => p.conceptId === conceptId);
}

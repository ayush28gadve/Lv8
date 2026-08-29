import { ConceptId, SeedProblem } from '@/types/physics';

/**
 * exactly 5 high-quality Laws of Motion diagnostic seed problems (1 per concept cluster).
 * Standard Class 11 Physics (Newton's Laws of Motion & Friction).
 * All numerical values are deterministic and verified.
 */
export const SEED_PROBLEMS: SeedProblem[] = [
  // =========================================================================
  // CONCEPT 1: Free-Body Diagrams & Force Identification
  // =========================================================================
  {
    problemId: 'prob-fbd-01',
    conceptId: 'fbd-force-identification',
    difficulty: 'medium',
    question:
      'A uniform solid sphere of mass 6 kg rests in static equilibrium nested inside a smooth V-shaped trough. The trough walls make angles of 30° and 60° with the horizontal. Taking g = 10 m/s², calculate the magnitude of the normal reaction force (in Newtons) exerted on the sphere by the steeper 60° side of the trough.',
    expectedApproach:
      'Identify coplanar forces acting on the sphere: gravity (mg) vertically down, normal reaction N₁ perpendicular to the 30° wall, and normal reaction N₂ perpendicular to the 60° wall. Set up force balance equations along axes aligned with the trough surfaces, or resolve horizontally and vertically.',
    correctAnswer: 30,
    unit: 'N',
    reasoning:
      'Since the sides of the trough are perpendicular (30° + 60° = 90°), we can choose coordinate axes parallel to the normal forces. Normal reaction force N₁ (from the 30° slope) acts at 30° to the vertical, and N₂ (from the 60° slope) acts at 60° to the vertical. Resolving forces along the normal N₂ direction: N₂ = mg * cos(60°) = 6 kg * 10 m/s² * 0.5 = 30 N. Normal force N₁ is mg * sin(60°) = 30√3 N.',
    commonMistakes: [
      'Stating that the normal force on either side is simply equal to the weight mg = 60 N.',
      'Swapping the trigonometric angles and calculating N₂ = mg * sin(60°) ≈ 52 N.',
      'Adding the normal forces scalar-wise rather than vectorially.',
    ],
    givenData: {
      mass: 6,
      angleLeft: 30,
      angleRight: 60,
      gravity: 10,
    },
    targetVariable: 'Normal reaction from 60° side (N)',
    fbdExpectations: [
      'Downward gravitational force vector (mg = 60 N)',
      'Normal reaction force N1 perpendicular to 30° inclined wall',
      'Normal reaction force N2 perpendicular to 60° inclined wall',
    ],
    governingEquations: [
      'N2 = mg * cos(60°)',
      'N1 = mg * sin(60°)',
      'ΣFx = 0, ΣFy = 0',
    ],
    conceptTags: ['Static Equilibrium', 'Normal Force', 'Coplanar Vectors'],
    diagramMetadata: {
      hasDiagram: true,
      description: 'A uniform sphere of mass 6 kg nested inside a symmetric V-shaped trough. The left wall of the trough is inclined at 30° to the horizontal, and the right wall is inclined at 60° to the horizontal.',
    },
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Archive)',
      year: 2021,
      source: 'JEE Mechanics Section A',
    },
  },

  // =========================================================================
  // CONCEPT 2: Newton's Second Law / Net Force
  // =========================================================================
  {
    problemId: 'prob-nl2-01',
    conceptId: 'newtons-second-law',
    difficulty: 'medium',
    question:
      'A block of mass 5 kg is placed on a smooth horizontal table and is initially at rest. At t = 0, a time-dependent horizontal pulling force F(t) = 4t (where F is in Newtons and t is in seconds) is applied to the block. Determine the magnitude of the velocity (in m/s) of the block at t = 5 seconds.',
    expectedApproach:
      'Express acceleration as a function of time: a(t) = F(t)/m. Integrate acceleration with respect to time from t = 0 to t = 5 to find the velocity: v(t) = ∫ a(t) dt.',
    correctAnswer: 10,
    unit: 'm/s',
    reasoning:
      'Since the horizontal surface is smooth, the net horizontal force is F(t) = 4t. According to Newton’s Second Law, acceleration is a(t) = F(t)/m = (4/5)t = 0.8t m/s². The velocity is found by integrating acceleration: v(t) = ∫[0 to t] 0.8t dt = 0.4t² m/s. Substituting t = 5 s: v(5) = 0.4 * 5² = 0.4 * 25 = 10 m/s.',
    commonMistakes: [
      'Using the kinematic equation v = u + at assuming constant acceleration, using final force F(5) = 20 N.',
      'Forgetting to divide the force by mass, calculating v = ∫ 4t dt = 2t² = 50 m/s.',
      'Integrating incorrectly or forgetting to evaluate the integration bounds.',
    ],
    givenData: {
      mass: 5,
      forceRate: 4,
      time: 5,
    },
    targetVariable: 'Final velocity (m/s)',
    fbdExpectations: [
      'Downward gravity force (mg = 50 N)',
      'Upward normal reaction force (N = 50 N)',
      'Time-varying horizontal force F(t) = 4t to the right',
    ],
    governingEquations: [
      'a(t) = F(t) / m',
      'v(t) = ∫ a(t) dt',
    ],
    conceptTags: ['Variable Acceleration', 'Integration', 'Newton’s Second Law'],
    diagramMetadata: {
      hasDiagram: false,
      description: 'A block on a flat surface pulled horizontally by a time-varying force F(t) = 4t.',
    },
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Archive)',
      year: 2020,
      source: 'JEE Mechanics Section A',
    },
  },

  // =========================================================================
  // CONCEPT 3: Friction & Direction of Friction
  // =========================================================================
  {
    problemId: 'prob-frc-01',
    conceptId: 'friction-direction',
    difficulty: 'hard',
    question:
      'A block of mass 3 kg is pressed against a rough vertical wall by a horizontal force of F = 80 N. The coefficient of static friction is μs = 0.5 and the coefficient of kinetic friction is μk = 0.3. Taking g = 10 m/s², find the magnitude of the friction force (in Newtons) acting on the block.',
    expectedApproach:
      'Calculate the horizontal normal force N = F. Compute the limiting static friction force: fs,max = μs * N. Compare the downward gravitational force (mg) with fs,max to check if the block slides. If mg < fs,max, the block remains stationary and static friction equals weight.',
    correctAnswer: 30,
    unit: 'N',
    reasoning:
      'In the horizontal direction, the net force is zero, so normal reaction N = F = 80 N. The maximum static friction that can act is fs,max = μs * N = 0.5 * 80 N = 40 N. The downward force trying to slide the block is its weight W = mg = 3 kg * 10 m/s² = 30 N. Since W (30 N) < fs,max (40 N), the block is stationary. Static friction balances the weight: f = W = 30 N.',
    commonMistakes: [
      'Assuming friction equals the limiting value: f = fs,max = 40 N.',
      'Using the kinetic friction coefficient to calculate friction: f = μk * N = 24 N.',
      'Setting normal force equal to weight: N = mg = 30 N.',
    ],
    givenData: {
      mass: 3,
      appliedHorizontalForce: 80,
      mu_s: 0.5,
      mu_k: 0.3,
      gravity: 10,
    },
    targetVariable: 'Actual Friction Force (N)',
    fbdExpectations: [
      'Horizontal applied force F = 80 N to the right',
      'Normal reaction force N = 80 N to the left',
      'Downward gravitational force W = mg = 30 N',
      'Upward static friction force f balancing the weight',
    ],
    governingEquations: [
      'N = F',
      'fs,max = μs * N',
      'f = mg (if mg < fs,max)',
    ],
    conceptTags: ['Static Friction', 'Limiting Friction', 'Vertical Wall Equilibrium'],
    diagramMetadata: {
      hasDiagram: true,
      description: 'A block of mass 3 kg held stationary against a vertical wall by a horizontal force vector F = 80 N.',
    },
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Archive)',
      year: 2019,
      source: 'JEE Friction Section A',
    },
  },

  // =========================================================================
  // CONCEPT 4: Inclined Plane Problems
  // =========================================================================
  {
    problemId: 'prob-inc-01',
    conceptId: 'inclined-plane',
    difficulty: 'medium',
    question:
      'A block of mass 5 kg is placed on a rough inclined plane tilted at 37° to the horizontal. The coefficient of static friction is μs = 0.5. A force P is applied up parallel to the incline to prevent the block from sliding down. Taking g = 10 m/s² (sin 37° = 0.6, cos 37° = 0.8), calculate the minimum magnitude of the force P (in Newtons) required to keep the block in equilibrium.',
    expectedApproach:
      'Resolve gravity into components: parallel (mg * sin θ) and perpendicular (mg * cos θ). Normal force is N = mg * cos θ. Limiting friction is fs,max = μs * N. For minimum force P to prevent sliding, static friction acts uphill: P + fs,max = mg * sin θ.',
    correctAnswer: 10,
    unit: 'N',
    reasoning:
      'The components of gravity are: downhill component F_down = mg * sin(37°) = 5 * 10 * 0.6 = 30 N; normal component N = mg * cos(37°) = 5 * 10 * 0.8 = 40 N. The maximum static friction force is fs,max = μs * N = 0.5 * 40 = 20 N. Since F_down (30 N) is greater than fs,max (20 N), the block needs an uphill force P. For the minimum force P, the friction acts uphill at its maximum: P + fs,max = F_down => P + 20 = 30 => P = 10 N.',
    commonMistakes: [
      'Assuming the minimum force is simply equal to the downhill weight component: P = mg * sin(37°) = 30 N.',
      'Adding the static friction component instead of subtracting: P = mg * sin(37°) + fs,max = 50 N.',
      'Swapping sine and cosine components for the incline angles.',
    ],
    givenData: {
      mass: 5,
      angle: 37,
      mu_s: 0.5,
      sin37: 0.6,
      cos37: 0.8,
      gravity: 10,
    },
    targetVariable: 'Minimum Uphill Force P (N)',
    fbdExpectations: [
      'Gravitational force component perpendicular to slope (mg * cos 37° = 40 N)',
      'Gravitational force component parallel to slope (mg * sin 37° = 30 N)',
      'Normal reaction force N perpendicular to slope',
      'External force P pointing up parallel to the slope',
      'Limiting static friction force fs pointing up parallel to the slope',
    ],
    governingEquations: [
      'N = mg * cos(37°)',
      'fs,max = μs * N',
      'P = mg * sin(37°) - fs,max',
    ],
    conceptTags: ['Inclined Plane', 'Forces Decomposition', 'Static Equilibrium with Friction'],
    diagramMetadata: {
      hasDiagram: true,
      description: 'A block of mass 5 kg resting on a 37° inclined plane, with a force vector P pointing up along the slope, and gravity components shown.',
    },
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Archive)',
      year: 2022,
      source: 'JEE Incline Section B',
    },
  },

  // =========================================================================
  // CONCEPT 5: Connected Bodies / Pulley Systems
  // =========================================================================
  {
    problemId: 'prob-pul-01',
    conceptId: 'connected-bodies-pulleys',
    difficulty: 'medium',
    question:
      'Block A of mass 4 kg rests on a smooth horizontal table. It is connected by a light inextensible string passing over a frictionless, massless pulley at the edge of the table to a vertically hanging Block B of mass 6 kg. Taking g = 10 m/s², calculate the tension T (in Newtons) in the string during motion.',
    expectedApproach:
      'Treat the connected blocks A and B as a single coupled system to find the system acceleration: a = mB * g / (mA + mB). Once acceleration is found, calculate the string tension: T = mA * a.',
    correctAnswer: 24,
    unit: 'N',
    reasoning:
      'The weight of hanging block B is the only external driving force: F_driving = mB * g = 6 kg * 10 m/s² = 60 N. The total accelerated mass is m_total = mA + mB = 4 kg + 6 kg = 10 kg. The system acceleration is a = F_driving / m_total = 60 N / 10 kg = 6 m/s². The tension pulling block A horizontally is T = mA * a = 4 kg * 6 m/s² = 24 N. (Verify with block B: mB * g - T = mB * a => 60 - 24 = 36 N, which matches 6 * 6 = 36 N).',
    commonMistakes: [
      'Assuming the tension is equal to the static weight of Block B: T = mB * g = 60 N.',
      'Setting tension equal to the weight of Block A: T = mA * g = 40 N.',
      'Using Atwood machine equation directly without accounting for block A being horizontal.',
    ],
    givenData: {
      massA: 4,
      massB: 6,
      gravity: 10,
    },
    targetVariable: 'String Tension (N)',
    fbdExpectations: [
      'Normal reaction and gravity balancing vertically for Block A',
      'Horizontal tension T pulling Block A to the right',
      'Downward gravity force on Block B (mB * g = 60 N)',
      'Upward tension force T pulling Block B',
    ],
    governingEquations: [
      'a = (mB * g) / (mA + mB)',
      'T = mA * a',
      'mB * g - T = mB * a',
    ],
    conceptTags: ['Connected Bodies', 'Constraint Motion', 'Pulley Systems', 'String Tension'],
    diagramMetadata: {
      hasDiagram: true,
      description: 'Block A of mass 4 kg on a horizontal frictionless tabletop, connected by a horizontal string passing over a pulley at the right edge, to a vertically hanging Block B of mass 6 kg.',
    },
    pyqMetadata: {
      exam: 'JEE Main (Adaptive Archive)',
      year: 2023,
      source: 'JEE Connected Systems A',
    },
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

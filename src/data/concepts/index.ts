import { ConceptId, PhysicsConcept } from '@/types/physics';

/**
 * Verified Physics Knowledge Base: Newton's Laws of Motion & Friction
 * Standard Class 11-12 Physics (NCERT / CBSE / JEE / NEET foundational mechanics)
 */
export const PHYSICS_CONCEPTS: Record<ConceptId, PhysicsConcept> = {
  'fbd-force-identification': {
    conceptId: 'fbd-force-identification',
    name: 'Free-Body Diagrams & Force Identification',
    description:
      'The systematic identification and isolation of all real forces acting on an object or system to determine net translational dynamics.',
    deepPrinciple:
      "Every force requires a physical agent and an interaction partner (Newton's Third Law pair). In an inertial frame, only real physical interactions (contact forces like normal reaction, tension, friction, and non-contact field forces like gravity) are included in a Free-Body Diagram. Fictitious forces are excluded unless analyzed from a non-inertial reference frame.",
    learningObjective:
      'Master force identification in accelerating vertical/horizontal frames and construct correct static FBD systems.',
    prerequisites: [
      'Vectors: magnitude, direction, and component resolution',
      'Basic definition of contact and non-contact forces',
      "Newton's Third Law (action-reaction pairs act on different bodies)",
    ],
    classLevel: 'Class 11',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'laws-of-motion',
    topicId: 'free-body-diagrams',
    coreEquations: [
      {
        id: 'eq-fbd-1',
        label: "Translational Equilibrium (1st Law)",
        latex: '\\sum \\vec{F} = 0 \\implies \\sum F_x = 0, \\; \\sum F_y = 0',
        explanation:
          'When an object is in equilibrium (at rest or moving at constant velocity), the vector sum of all external forces acting on it must be zero.',
        variables: {
          '\\vec{F}': 'External force vector acting on the isolated body (N)',
          'F_x, F_y': 'Orthogonal scalar force components (N)',
        },
      },
      {
        id: 'eq-fbd-2',
        label: 'Normal Force on Level Surface in Accelerating Frame',
        latex: 'N = m(g \\pm a_y)',
        explanation:
          'Apparent weight / normal force changes when the contact surface undergoes vertical acceleration.',
        variables: {
          N: 'Normal contact force exerted by surface on body (N)',
          m: 'Mass of the body (kg)',
          g: 'Acceleration due to gravity (m/s²)',
          a_y: 'Vertical acceleration of the reference frame (m/s²)',
        },
      },
    ],
    commonMisconceptions: [
      'Believing normal force is always equal to mg regardless of acceleration or surface angle.',
      'Treating "ma" (mass times acceleration) as an additional physical force acting on the body in an inertial frame.',
      'Assuming action-reaction pairs cancel each other out on the same object (they act on distinct interacting bodies).',
      'Confusing the object applying a force with the object experiencing that force.',
    ],
    surfaceFeatures: [
      'Elevators or lifts moving upward/downward',
      'Blocks pressed against vertical walls or ceilings',
      'Objects resting on horizontal floors or weighing scales',
      'Hanging masses attached to fixed ceilings or strings',
    ],
    deepStructure: {
      governingLaws: ["Newton's First Law", "Newton's Third Law", 'Vector Equilibrium'],
      invariants: [
        'Normal force is always perpendicular to the contact surface interface.',
        'Gravitational force always points toward the center of mass of the Earth (vertically downward).',
        'Tension in a continuous ideal string always pulls away from the attached body along the line of the string.',
      ],
      coordinateSystemStrategy:
        'Align one axis along the direction of actual or impending acceleration and the other perpendicular to it.',
      causalMechanisms: [
        'Microscopic electromagnetic repulsion at contact surfaces generates normal force.',
        'Molecular bonds resisting stretching generate tension in strings.',
      ],
    },
    twinGenerationConstraints: {
      invariableElements: [
        'Must require the student to isolate a single body and balance orthogonal force components.',
        'Must test whether the student correctly determines contact force magnitudes under external constraints.',
      ],
      variableSurfaceFeatures: [
        'Context narrative (elevator, spaceship, hanging mass, pressed block, scale).',
        'Direction of external acceleration (upward, downward, zero).',
        'Surface orientation (horizontal floor, vertical wall).',
      ],
      numericalRanges: {
        mass: { min: 1, max: 50, unit: 'kg', step: 1 },
        acceleration: { min: 0, max: 10, unit: 'm/s²', step: 0.5 },
        appliedForce: { min: 5, max: 200, unit: 'N', step: 5 },
      },
      forbiddenCombinations: [
        'Downward acceleration exceeding g without inverted contact modeling.',
      ],
    },
  },

  'newtons-second-law': {
    conceptId: 'newtons-second-law',
    name: "Newton's Second Law / Net Force",
    description:
      'The foundational relationship between the unbalanced net force vector acting on a mass and the resulting time rate of change of momentum (acceleration).',
    deepPrinciple:
      'The net vector sum of all external forces acting on a body of constant mass produces an instantaneous acceleration in the exact direction of the net force, inversely proportional to the mass: F_net = m * a.',
    learningObjective:
      'Calculate system accelerations and solve kinematics coupling equations under constant unbalanced forces.',
    prerequisites: [
      'Concept of inertia and mass as a measure of inertia',
      'Vector addition and resolution into perpendicular components',
      'Basic 1D kinematics (v = u + at, s = ut + 0.5at², v² = u² + 2as)',
    ],
    classLevel: 'Class 11',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'laws-of-motion',
    topicId: 'newton-laws',
    coreEquations: [
      {
        id: 'eq-nl2-1',
        label: "Newton's Second Law (Vector Form)",
        latex: '\\sum \\vec{F}_{ext} = m \\vec{a}',
        explanation:
          'Net external force acting on a body equals mass multiplied by its acceleration vector.',
        variables: {
          '\\sum \\vec{F}_{ext}': 'Vector resultant of all external forces (N)',
          m: 'Inertial mass of the body (kg)',
          '\\vec{a}': 'Linear acceleration vector of the body (m/s²)',
        },
      },
      {
        id: 'eq-nl2-2',
        label: 'Kinematics Coupling with Constant Force',
        latex: 'v = u + \\left(\\frac{F_{net}}{m}\\right)t, \\quad s = ut + \\frac{1}{2}\\left(\\frac{F_{net}}{m}\\right)t^2',
        explanation:
          'When net force is constant, acceleration is constant, allowing direct integration with linear kinematics.',
        variables: {
          u: 'Initial velocity (m/s)',
          v: 'Final velocity (m/s)',
          t: 'Elapsed time (s)',
          s: 'Displacement (m)',
        },
      },
    ],
    commonMisconceptions: [
      'Believing motion requires a continuous forward force in the direction of velocity (Aristotelian misconception).',
      'Confusing the instantaneous direction of velocity with the direction of net force / acceleration.',
      'Adding opposing forces scalar-wise rather than taking vector differences.',
      'Believing heavier objects naturally accelerate faster under equal forces.',
    ],
    surfaceFeatures: [
      'Crates being pushed or pulled horizontally on frictionless ice/floors',
      'Vehicles accelerating or braking under engine / braking forces',
      'Multiple collinear forces acting simultaneously (e.g. East vs West)',
      'Rocket propulsion or projectiles in idealized 1D flight',
    ],
    deepStructure: {
      governingLaws: ["Newton's Second Law of Motion", 'Linear Kinematics'],
      invariants: [
        'Acceleration is directly proportional to net force and inversely proportional to mass.',
        'Zero net force strictly implies zero acceleration (constant velocity or rest).',
        'Net force and acceleration vectors are strictly parallel in classical non-relativistic mechanics.',
      ],
      coordinateSystemStrategy:
        'Choose Cartesian coordinate axes aligned with the line of motion to convert vector equations into independent scalar 1D equations.',
      causalMechanisms: [
        'Unbalanced external force disrupts equilibrium, altering momentum over time.',
      ],
    },
    twinGenerationConstraints: {
      invariableElements: [
        'Must involve calculating or applying F_net = m * a.',
        'Must require vector combination of collinear forces or kinematic coupling.',
      ],
      variableSurfaceFeatures: [
        'Object type (crate, sled, car, spacecraft, particle).',
        'Given parameters (find a given F & m, or find v/s given F, m, t).',
        'Number of opposing forces acting on the line of motion.',
      ],
      numericalRanges: {
        mass: { min: 0.5, max: 100, unit: 'kg', step: 0.5 },
        netForce: { min: 1, max: 500, unit: 'N', step: 1 },
        time: { min: 1, max: 20, unit: 's', step: 1 },
      },
      forbiddenCombinations: [
        'Negative mass values.',
        'Zero mass in dynamic calculations.',
      ],
    },
  },

  'friction-direction': {
    conceptId: 'friction-direction',
    name: 'Friction & Direction of Friction',
    description:
      'The contact force that opposes relative tangential motion or the impending tendency of relative motion between two surfaces in contact.',
    deepPrinciple:
      'Static friction is an adaptive, self-adjusting reaction force up to a limiting maximum value (f_s <= mu_s * N). Once relative sliding occurs, kinetic friction acts with constant magnitude (f_k = mu_k * N) strictly opposing the instantaneous relative velocity vector.',
    learningObjective:
      'Differentiate between static and kinetic friction regimes and determine friction forces at threshold limits.',
    prerequisites: [
      'Normal reaction force determination',
      'Newton’s First and Second Laws',
      'Distinction between static equilibrium and dynamic motion',
    ],
    classLevel: 'Class 11',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'laws-of-motion',
    topicId: 'friction',
    coreEquations: [
      {
        id: 'eq-frc-1',
        label: 'Limiting Static Friction',
        latex: 'f_s \\le f_{s,max} = \\mu_s N',
        explanation:
          'Static friction matches the applied parallel force until it reaches its maximum threshold value.',
        variables: {
          f_s: 'Actual static friction force (N)',
          'f_{s,max}': 'Limiting static friction threshold (N)',
          '\\mu_s': 'Coefficient of static friction (dimensionless)',
          N: 'Normal contact force (N)',
        },
      },
      {
        id: 'eq-frc-2',
        label: 'Kinetic Friction',
        latex: 'f_k = \\mu_k N',
        explanation:
          'Kinetic friction opposes ongoing relative sliding between surfaces, typically with mu_k <= mu_s.',
        variables: {
          f_k: 'Kinetic friction force (N)',
          '\\mu_k': 'Coefficient of kinetic friction (dimensionless)',
          N: 'Normal contact force (N)',
        },
      },
    ],
    commonMisconceptions: [
      'Assuming static friction is always equal to mu_s * N, even when the applied force is lower.',
      'Thinking friction always opposes motion relative to the ground, rather than relative motion between contact surfaces.',
      'Assuming friction cannot cause acceleration (e.g. static friction accelerates a walking person or a car on a road).',
      'Confusing static friction coefficient (mu_s) with kinetic friction coefficient (mu_k).',
    ],
    surfaceFeatures: [
      'Blocks pulled horizontally by varying external forces',
      'Objects sliding to a stop due to rough surfaces (skidding cars, sliding boxes)',
      'Stacked blocks experiencing mutual friction forces',
      'Conveyor belts or walking locomotion',
    ],
    deepStructure: {
      governingLaws: [
        "Coulomb's Law of Friction",
        "Newton's First and Second Laws",
        'Relative Velocity Dynamics',
      ],
      invariants: [
        'Static friction self-adjusts: f_s = F_applied (along surface) as long as F_applied <= mu_s * N.',
        'Kinetic friction is independent of contact surface area and sliding speed (in standard Coulomb friction model).',
        'Friction force is strictly tangential (parallel) to the contact interface.',
      ],
      coordinateSystemStrategy:
        'Resolve forces perpendicular to surface to find N, then resolve forces parallel to surface to check motion threshold.',
      causalMechanisms: [
        'Microscopic asperities interlocking and intermolecular electrostatic bonds resist relative shear.',
      ],
    },
    twinGenerationConstraints: {
      invariableElements: [
        'Must test the threshold comparison between applied force and limiting friction.',
        'Must require correct determination of whether the system is static (a=0) or kinetic (a>0).',
      ],
      variableSurfaceFeatures: [
        'Applied pulling/pushing force magnitude vs static threshold.',
        'Nature of problem (finding friction magnitude vs finding resulting acceleration/stopping distance).',
        'Physical setting (box on wooden floor, tire on asphalt, metal block on steel plate).',
      ],
      numericalRanges: {
        mu_s: { min: 0.2, max: 0.8, unit: '', step: 0.05 },
        mu_k: { min: 0.1, max: 0.6, unit: '', step: 0.05 },
        mass: { min: 1, max: 20, unit: 'kg', step: 1 },
        appliedForce: { min: 5, max: 150, unit: 'N', step: 1 },
      },
      forbiddenCombinations: [
        'mu_k > mu_s (kinetic friction coefficient cannot exceed static friction coefficient).',
      ],
    },
  },

  'inclined-plane': {
    conceptId: 'inclined-plane',
    name: 'Inclined Plane Problems',
    description:
      'Dynamics and force resolution on tilted planar surfaces, requiring rotated coordinate systems to separate normal and tangential behavior.',
    deepPrinciple:
      'Gravitational force acts vertically downward and decomposes on an incline of angle theta into a parallel downhill component (mg sin theta) and a perpendicular normal component (mg cos theta). The normal contact force is N = mg cos theta (in absence of other perpendicular forces).',
    learningObjective:
      'Resolve weight components along and perpendicular to rotated inclined planes and compute downhill sliding dynamics.',
    prerequisites: [
      'Trigonometric functions (sine, cosine) and angle decomposition',
      'Free-Body Diagrams and normal force determination',
      'Friction on contact surfaces',
    ],
    classLevel: 'Class 11',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'laws-of-motion',
    topicId: 'inclined-planes',
    coreEquations: [
      {
        id: 'eq-inc-1',
        label: 'Normal Force on Incline',
        latex: 'N = mg \\cos\\theta',
        explanation:
          'Perpendicular force balance when no additional forces act perpendicular to the incline.',
        variables: {
          N: 'Normal contact force (N)',
          m: 'Mass of the object (kg)',
          g: 'Gravitational acceleration (m/s²)',
          '\\theta': 'Angle of inclination with horizontal (degrees/rad)',
        },
      },
      {
        id: 'eq-inc-2',
        label: 'Acceleration Down a Rough Incline',
        latex: 'a = g(\\sin\\theta - \\mu_k \\cos\\theta)',
        explanation:
          'Net downhill acceleration when gravitational pull overcomes kinetic friction.',
        variables: {
          a: 'Downhill acceleration (m/s²)',
          '\\mu_k': 'Coefficient of kinetic friction (dimensionless)',
          '\\theta': 'Incline angle (degrees)',
        },
      },
    ],
    commonMisconceptions: [
      'Using N = mg instead of N = mg cos theta on an inclined surface.',
      'Swapping sin theta and cos theta components (e.g. thinking mg cos theta acts down the slope).',
      'Believing acceleration down a frictionless ramp depends on the mass of the object.',
      'Assuming friction always points uphill regardless of whether the object is sliding up or down.',
    ],
    surfaceFeatures: [
      'Blocks sliding down smooth or rough ramps/hills',
      'Objects pushed up an incline with an external force',
      'Skiers or sleds descending snowy slopes',
      'Wedges and ramp angle variations (30 deg, 37 deg, 45 deg, 60 deg)',
    ],
    deepStructure: {
      governingLaws: [
        "Newton's Second Law in Rotated Coordinates",
        'Orthogonal Vector Decomposition',
        "Coulomb Friction Model",
      ],
      invariants: [
        'Gravitational component parallel to incline is always mg * sin(theta) directed downhill.',
        'Gravitational component perpendicular to incline is always mg * cos(theta) pressing into the incline.',
        'Acceleration on a frictionless incline is always a = g * sin(theta), independent of mass.',
      ],
      coordinateSystemStrategy:
        'Rotate Cartesian coordinate axes: align x-axis parallel to the incline slope (positive downhill or uphill) and y-axis perpendicular to the surface.',
      causalMechanisms: [
        'Geometrical tilt splits the constant vertical field force into a motion-driving component and a normal-reaction-inducing component.',
      ],
    },
    twinGenerationConstraints: {
      invariableElements: [
        'Must require decomposition of gravity into parallel (sin) and perpendicular (cos) components.',
        'Must account for the dependence of normal force and friction on the incline angle theta.',
      ],
      variableSurfaceFeatures: [
        'Angle of inclination (standard values: 30°, 37°, 45°, 53°, 60°).',
        'Frictional condition (smooth/frictionless vs rough with mu_k).',
        'Context (wooden wedge, playground slide, mountain road, ramp).',
      ],
      numericalRanges: {
        theta: { min: 15, max: 75, unit: 'deg', step: 1 },
        mass: { min: 1, max: 25, unit: 'kg', step: 1 },
        mu_k: { min: 0.1, max: 0.5, unit: '', step: 0.05 },
      },
      forbiddenCombinations: [
        'Angles <= 0 or >= 90 degrees in standard incline formulation.',
        'Friction force reversing acceleration when static friction is sufficient to hold the block at rest.',
      ],
    },
  },

  'connected-bodies-pulleys': {
    conceptId: 'connected-bodies-pulleys',
    name: 'Connected Bodies / Pulley Systems',
    description:
      'Coupled multi-body mechanical systems constrained by light inextensible strings and frictionless pulleys, sharing common kinematic constraints.',
    deepPrinciple:
      'In an ideal string-pulley system (massless, inextensible string; frictionless, massless pulley), the magnitude of acceleration is identical for all connected segments along the string constraint, and string tension is uniform throughout each continuous segment.',
    learningObjective:
      'Formulate coupled equations of motion for multi-body pulley systems under ideal tension constraints.',
    prerequisites: [
      'Newton’s Second Law applied to individual isolated subsystems',
      'String constraint kinematics (constant total string length)',
      'Free-Body Diagrams of individual connected bodies',
    ],
    classLevel: 'Class 11',
    examId: 'jee-main',
    subjectId: 'physics',
    chapterId: 'laws-of-motion',
    topicId: 'connected-systems',
    coreEquations: [
      {
        id: 'eq-pul-1',
        label: 'Atwood Machine Acceleration',
        latex: 'a = \\frac{(m_1 - m_2)g}{m_1 + m_2}',
        explanation:
          'Net driving gravitational force divided by total inertia of the coupled two-mass system.',
        variables: {
          a: 'Common acceleration magnitude of both masses (m/s²)',
          m_1: 'Heavier hanging mass (kg)',
          m_2: 'Lighter hanging mass (kg)',
          g: 'Gravitational acceleration (m/s²)',
        },
      },
      {
        id: 'eq-pul-2',
        label: 'Table-Hanging Mass System Tension',
        latex: 'T = \\frac{m_A m_B g}{m_A + m_B}',
        explanation:
          'Tension in string connecting horizontal frictionless block m_A and vertical hanging mass m_B.',
        variables: {
          T: 'String tension (N)',
          m_A: 'Mass on smooth horizontal surface (kg)',
          m_B: 'Hanging vertical mass (kg)',
        },
      },
    ],
    commonMisconceptions: [
      'Assuming string tension equals the static weight of the hanging mass (T = mg) while the system is accelerating.',
      'Treating the tension on both sides of a light continuous pulley as different without pulley friction/mass.',
      'Dividing net driving force by only one mass instead of the total system mass (m_total = m_1 + m_2).',
      'Thinking connected objects can have different acceleration magnitudes with an inextensible taut string.',
    ],
    surfaceFeatures: [
      'Vertical Atwood machine with two hanging masses',
      'Horizontal table with one block on table and one hanging over pulley',
      'Inclined plane with one mass on slope connected to hanging mass',
      'Elevator cables / counterweight systems',
    ],
    deepStructure: {
      governingLaws: [
        "Newton's Second Law for Coupled Systems",
        'String Kinematic Constraint Equation',
        "Internal Force Cancellation (Tension as internal to the total system)",
      ],
      invariants: [
        'Total system acceleration equals (Net External Driving Force) / (Total System Mass).',
        'Tension pulls away from each connected body toward the interior of the string.',
        'Inextensible string constraint ensures |a_1| = |a_2| along the constraint line.',
      ],
      coordinateSystemStrategy:
        'Follow the single coordinate path along the string from body 1 over the pulley to body 2, treating the constraint direction as a single 1D axis.',
      causalMechanisms: [
        'Inextensibility transmits force instantly through tension, coupling individual mass accelerations.',
      ],
    },
    twinGenerationConstraints: {
      invariableElements: [
        'Must maintain kinematic constraint consistency across connected bodies.',
        'Must require simultaneous FBD analysis or whole-system net force formulation.',
      ],
      variableSurfaceFeatures: [
        'Arrangement (vertical Atwood vs horizontal table with hanging block vs slope pulley).',
        'Target variable (solve for acceleration vs solve for string tension vs solve for unknown mass).',
        'Context (counterweight elevator, physics lab apparatus, industrial crane winch).',
      ],
      numericalRanges: {
        mass1: { min: 1, max: 20, unit: 'kg', step: 0.5 },
        mass2: { min: 1, max: 20, unit: 'kg', step: 0.5 },
        g: { min: 9.8, max: 10, unit: 'm/s²', step: 0.2 },
      },
      forbiddenCombinations: [
        'Mass equal to zero.',
        'Negative tension results in standard taut-string assumptions.',
      ],
    },
  },
};

/**
 * Helper to fetch all physics concepts as an array
 */
export function getAllConcepts(): PhysicsConcept[] {
  return Object.values(PHYSICS_CONCEPTS);
}

/**
 * Helper to fetch a single concept by ID
 */
export function getConceptById(conceptId: ConceptId): PhysicsConcept | undefined {
  return PHYSICS_CONCEPTS[conceptId];
}

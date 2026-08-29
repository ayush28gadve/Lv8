import React from 'react';

interface PhysicsDiagramProps {
  problemId: string;
}

export const PhysicsDiagram: React.FC<PhysicsDiagramProps> = ({ problemId }) => {
  // Common styles
  const strokeColor = 'var(--text-primary)';
  const strokeMuted = 'var(--text-disabled)';
  const accentColor = 'var(--accent-dark)';
  const fillCard = 'var(--bg-card)';
  const fillSecondary = 'var(--bg-secondary)';

  switch (problemId) {
    case 'prob-fbd-01':
      // Concept 1: Sphere nested in V-groove (30° and 60° slopes)
      return (
        <svg
          viewBox="0 0 200 150"
          className="w-full max-w-[240px] h-auto mx-auto border border-border-default bg-bg-secondary/10 rounded-lg p-2"
          aria-hidden="true"
        >
          {/* Horizontal Ground Reference */}
          <line x1="20" y1="130" x2="180" y2="130" stroke={strokeMuted} strokeWidth="1" strokeDasharray="3,3" />

          {/* V-Groove Left Slope (30° to horizontal) */}
          {/* Meeting point at (100, 120). Left goes up/left to (33, 81) */}
          <line x1="100" y1="120" x2="30" y2="80" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
          
          {/* V-Groove Right Slope (60° to horizontal) */}
          {/* Meeting point at (100, 120). Right goes up/right to (140, 51) */}
          <line x1="100" y1="120" x2="150" y2="33" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />

          {/* Solid hatching lines under the trough */}
          <line x1="80" y1="110" x2="70" y2="120" stroke={strokeMuted} strokeWidth="1" />
          <line x1="60" y1="100" x2="50" y2="110" stroke={strokeMuted} strokeWidth="1" />
          <line x1="120" y1="110" x2="130" y2="120" stroke={strokeMuted} strokeWidth="1" />
          <line x1="135" y1="80" x2="145" y2="90" stroke={strokeMuted} strokeWidth="1" />

          {/* Sphere resting in V-groove */}
          {/* Geometrically centered at (90, 78) with radius 23 */}
          <circle cx="90" cy="78" r="23" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
          {/* Center point of sphere */}
          <circle cx="90" cy="78" r="2" fill={accentColor} />

          {/* Mass Label */}
          <text x="90" y="82" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
            6 kg
          </text>

          {/* Left Angle 30° Arc and Label */}
          {/* Arcs drawn manually using path */}
          <path d="M 45 130 A 15 15 0 0 0 52 118" fill="none" stroke={strokeMuted} strokeWidth="1" />
          <text x="58" y="126" fontSize="8" fill="var(--text-secondary)" fontWeight="bold">30°</text>

          {/* Right Angle 60° Arc and Label */}
          <path d="M 135 130 A 15 15 0 0 1 128 118" fill="none" stroke={strokeMuted} strokeWidth="1" />
          <text x="114" y="126" fontSize="8" fill="var(--text-secondary)" fontWeight="bold">60°</text>

          {/* Normal reactions direction hints (light dotted) */}
          <line x1="90" y1="78" x2="68" y2="40" stroke={accentColor} strokeWidth="1" strokeDasharray="2,2" />
          <line x1="90" y1="78" x2="110" y2="43" stroke={accentColor} strokeWidth="1" strokeDasharray="2,2" />
          <text x="63" y="36" fontSize="7" fill={accentColor} fontWeight="bold">N₁</text>
          <text x="115" y="39" fontSize="7" fill={accentColor} fontWeight="bold">N₂</text>
        </svg>
      );

    case 'prob-nl2-01':
      // Concept 2: Block pulled horizontally on flat surface by F(t) = 4t
      return (
        <svg
          viewBox="0 0 200 150"
          className="w-full max-w-[240px] h-auto mx-auto border border-border-default bg-bg-secondary/10 rounded-lg p-2"
          aria-hidden="true"
        >
          {/* Floor line */}
          <line x1="20" y1="100" x2="180" y2="100" stroke={strokeColor} strokeWidth="2.5" />
          {/* Ground hatching */}
          <line x1="30" y1="100" x2="25" y2="106" stroke={strokeMuted} strokeWidth="1" />
          <line x1="55" y1="100" x2="50" y2="106" stroke={strokeMuted} strokeWidth="1" />
          <line x1="80" y1="100" x2="75" y2="106" stroke={strokeMuted} strokeWidth="1" />
          <line x1="105" y1="100" x2="100" y2="106" stroke={strokeMuted} strokeWidth="1" />
          <line x1="130" y1="100" x2="125" y2="106" stroke={strokeMuted} strokeWidth="1" />
          <line x1="155" y1="100" x2="150" y2="106" stroke={strokeMuted} strokeWidth="1" />

          {/* Block */}
          <rect x="60" y="60" width="55" height="40" rx="3" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
          <text x="87.5" y="84" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
            5 kg
          </text>

          {/* Pulling Force Arrow */}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={accentColor} />
            </marker>
          </defs>
          
          <line x1="115" y1="80" x2="160" y2="80" stroke={accentColor} strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="142" y="72" textAnchor="middle" fontSize="8" fontWeight="extrabold" fill={accentColor}>
            F(t) = 4t
          </text>

          {/* Small frictionless indicator text */}
          <text x="87.5" y="120" textAnchor="middle" fontSize="7" fill={strokeMuted} fontStyle="italic">
            Smooth surface (μ = 0)
          </text>
        </svg>
      );

    case 'prob-frc-01':
      // Concept 3: Block pressed against vertical wall with force F = 80 N
      return (
        <svg
          viewBox="0 0 200 150"
          className="w-full max-w-[240px] h-auto mx-auto border border-border-default bg-bg-secondary/10 rounded-lg p-2"
          aria-hidden="true"
        >
          {/* Vertical Wall */}
          <line x1="130" y1="20" x2="130" y2="130" stroke={strokeColor} strokeWidth="2.5" />
          {/* Wall hatching */}
          <line x1="130" y1="30" x2="136" y2="25" stroke={strokeMuted} strokeWidth="1" />
          <line x1="130" y1="50" x2="136" y2="45" stroke={strokeMuted} strokeWidth="1" />
          <line x1="130" y1="70" x2="136" y2="65" stroke={strokeMuted} strokeWidth="1" />
          <line x1="130" y1="90" x2="136" y2="85" stroke={strokeMuted} strokeWidth="1" />
          <line x1="130" y1="110" x2="136" y2="105" stroke={strokeMuted} strokeWidth="1" />

          {/* Block */}
          <rect x="80" y="50" width="50" height="50" rx="3" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
          <text x="105" y="79" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-primary)">
            3 kg
          </text>

          {/* Pushing Force Arrow */}
          <line x1="35" y1="75" x2="75" y2="75" stroke={accentColor} strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="55" y="67" textAnchor="middle" fontSize="8" fontWeight="extrabold" fill={accentColor}>
            F = 80 N
          </text>

          {/* Gravity indicator */}
          <line x1="105" y1="100" x2="105" y2="125" stroke={strokeMuted} strokeWidth="1" strokeDasharray="2,2" markerEnd="url(#arrow-muted)" />
          <text x="105" y="134" textAnchor="middle" fontSize="7" fill={strokeMuted}>
            W = mg
          </text>

          {/* Friction indicator pointing up */}
          <line x1="126" y1="55" x2="126" y2="35" stroke={accentColor} strokeWidth="1" markerEnd="url(#arrow)" />
          <text x="120" y="32" textAnchor="end" fontSize="7" fill={accentColor} fontWeight="bold">
            f_static
          </text>

          {/* Muted arrow marker definition */}
          <defs>
            <marker id="arrow-muted" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeMuted} />
            </marker>
          </defs>
        </svg>
      );

    case 'prob-inc-01':
      // Concept 4: Block on 37° inclined plane with force P pointing uphill
      return (
        <svg
          viewBox="0 0 200 150"
          className="w-full max-w-[240px] h-auto mx-auto border border-border-default bg-bg-secondary/10 rounded-lg p-2"
          aria-hidden="true"
        >
          {/* Inclined Plane Triangle */}
          {/* Corner points at (30, 115), (170, 115), (170, 35) */}
          <polygon points="30,115 170,115 170,35" stroke={strokeColor} strokeWidth="2.5" fill={fillSecondary} strokeLinejoin="round" />
          
          {/* Incline hatch marks */}
          <line x1="50" y1="115" x2="45" y2="121" stroke={strokeMuted} strokeWidth="1" />
          <line x1="80" y1="115" x2="75" y2="121" stroke={strokeMuted} strokeWidth="1" />
          <line x1="110" y1="115" x2="105" y2="121" stroke={strokeMuted} strokeWidth="1" />
          <line x1="140" y1="115" x2="135" y2="121" stroke={strokeMuted} strokeWidth="1" />

          {/* Angle 37° label and arc */}
          <path d="M 50 115 A 20 20 0 0 0 47 105" fill="none" stroke={strokeMuted} strokeWidth="1" />
          <text x="56" y="111" fontSize="8" fill="var(--text-secondary)" fontWeight="bold">37°</text>

          {/* Rotated Block on incline */}
          {/* Angle is approx 29.7° for points (30,115) to (170,35) */}
          <g transform="translate(100, 75) rotate(-29.7)">
            <rect x="-20" y="-16" width="40" height="24" rx="2" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
            <text x="0" y="-1.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-primary)">
              5 kg
            </text>
            
            {/* Force P vector uphill */}
            <line x1="20" y1="-4" x2="50" y2="-4" stroke={accentColor} strokeWidth="2" markerEnd="url(#arrow)" />
            <text x="35" y="-10" textAnchor="middle" fontSize="8" fontWeight="extrabold" fill={accentColor}>
              P
            </text>
          </g>
        </svg>
      );

    case 'prob-pul-01':
      // Concept 5: Connected bodies block A on table connected to hanging block B over a pulley
      return (
        <svg
          viewBox="0 0 200 150"
          className="w-full max-w-[240px] h-auto mx-auto border border-border-default bg-bg-secondary/10 rounded-lg p-2"
          aria-hidden="true"
        >
          {/* Table Surface */}
          <line x1="20" y1="75" x2="140" y2="75" stroke={strokeColor} strokeWidth="2.5" />
          {/* Vertical Leg */}
          <line x1="140" y1="75" x2="140" y2="135" stroke={strokeColor} strokeWidth="2.5" />
          {/* Ground surface */}
          <line x1="10" y1="135" x2="180" y2="135" stroke={strokeMuted} strokeWidth="1" strokeDasharray="3,3" />

          {/* Pulley at table edge */}
          <circle cx="140" cy="75" r="7" stroke={strokeColor} strokeWidth="1.5" fill={fillCard} />
          <circle cx="140" cy="75" r="1.5" fill={strokeColor} />

          {/* Block A (Tabletop) */}
          <rect x="55" y="52" width="45" height="23" rx="2" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
          <text x="77.5" y="66" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-primary)">
            A (4 kg)
          </text>

          {/* Block B (Hanging) */}
          <rect x="131.5" y="105" width="17" height="25" rx="2" stroke={strokeColor} strokeWidth="2" fill={fillCard} />
          <text x="140" y="120" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--text-primary)">
            B
          </text>
          <text x="140" y="128" textAnchor="middle" fontSize="6.5" fill="var(--text-secondary)">
            (6 kg)
          </text>

          {/* String lines connecting the blocks */}
          {/* Horizontal string from Block A to top of pulley */}
          <line x1="100" y1="68" x2="140" y2="68" stroke={accentColor} strokeWidth="1.5" />
          
          {/* Vertical string from right of pulley to Block B */}
          <line x1="147" y1="75" x2="147" y2="105" stroke={accentColor} strokeWidth="1.5" />
          
          {/* Dotted lines inside the table to support hatching visual */}
          <line x1="40" y1="75" x2="35" y2="81" stroke={strokeMuted} strokeWidth="1" />
          <line x1="80" y1="75" x2="75" y2="81" stroke={strokeMuted} strokeWidth="1" />
          <line x1="120" y1="75" x2="115" y2="81" stroke={strokeMuted} strokeWidth="1" />
        </svg>
      );

    default:
      return null;
  }
};

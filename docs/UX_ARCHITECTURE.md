# ConceptTwin — UX Architecture Specification

This document details the UX architecture for **ConceptTwin**, an AI-native physics learning application designed for the LV8 Tech "Rebuild the Classroom" hackathon.

---

## 1. Product Experience Philosophy

Most EdTech platforms act as passive content delivery networks or conversational chatbots that give answers away. **ConceptTwin** is built on a single, uncompromising principle:

> **"Don't tell the student what they know. Make them demonstrate it."**

### Core Pillars
- **Anti-Chatbot / Active Solving**: No chat inputs where students can say "explain this to me." Instead, the interface features a split-pane layout: a **Problem Space** on the left and a structured **Workspace** (Math/Reasoning editor + Answer box) on the right.
- **Deep Structure vs. Surface Features**: The UI must make this core pedagogical concept visually obvious. When a student solves a problem by rote formula lookup ("surface pattern matching"), the system exposes it and challenges them with a **Twin Problem**—a problem with different surface dressing (e.g. from an elevator to a rocket) but identical physics invariants.
- **Immediate, High-Fidelity Feedback**: No generic "Incorrect. Try again." The system dissects the student's step-by-step working and points directly to the misconception (e.g. "You assumed Normal Force always equals static weight ($N=mg$), ignoring the vertical acceleration of the system").

---

## 2. User Journey: From Landing to Mastery

```mermaid
graph TD
    A[1. Landing & Concept Select] --> B[2. Seed Challenge]
    B --> C{Evaluator Node}
    C -->|Correct Answer & Correct Reasoning| D[State: Mastery Achieved]
    C -->|Incorrect Answer OR Flawed Reasoning| E[State: Diagnosis revealed]
    E --> F[3. Twin Challenge served]
    F --> G{Verifier Node}
    G -->|Correct Transfer| D
    G -->|Incorrect / Max Cycles reached| H[State: Remediation / Guided Walkthrough]
    D --> I[Update Concept Map Status]
```

### The Steps:
1. **Discover**: Student lands on a clean, premium workspace. A minimalist **Concept Map** shows 5 core physics topics (Newton's Laws & Friction). Locked/unlocked status and current mastery levels are visible.
2. **First Attempt (Seed)**: Student selects a concept and is served an authentic, hand-crafted **Seed Problem**. They write their step-by-step working and input a final numerical value.
3. **Assessment**: The system evaluates both the final answer and the reasoning.
   - If they pass both: They immediately earn **Mastery** for this concept.
   - If they fail either: They see their diagnosis (the specific conceptual gap) and are served a **Twin Challenge** designed to expose this gap.
4. **The Twin Battle**: The student attempts the twin problem. The Verifier assesses whether conceptual transfer occurred. If successful, they achieve **Mastery**. If they fail repeatedly (max 3 cycles), they are routed to **Remediation**.

---

## 3. Complete Screen / Page Structure

To maintain maximum focus and eliminate distraction, ConceptTwin uses a **single-page workspace layout** with a persistent navigation/dashboard layer.

### Pages & Sub-views:
1. **Workspace View (`/`)**: 
   - **Sidebar**: Toggleable Concept Map, progress indicators, and historical stats.
   - **Central Split Pane**:
     - *Left Pane*: Active Problem (Seed or Twin) + Concept Metadata card.
     - *Right Pane*: Student Input area (rich working text area + numeric input + Submit).
   - **Feedback Overlay / Bottom Panel**: Slips up when evaluation/diagnosis is ready.
2. **Concept Selection View (Overlay / Modal)**:
   - A visual node graph representing the 5 concept clusters:
     1. Free-Body Diagrams & Force Identification
     2. Newton's Second Law / Net Force
     3. Friction & Direction of Friction
     4. Inclined Plane Problems
     5. Connected Bodies / Pulley Systems
3. **Mastery Splash (Celebration State)**:
   - Dynamic particle animation with a breakdown of what the student successfully demonstrated.
4. **Remediation View**:
   - Step-by-step interactive derivation walkthrough of the concept.

---

## 4. Main Learning Screen Layout

```
+-----------------------------------------------------------------------------------+
|  ConceptTwin  [ Newton's Laws + Friction ]                    [ Progress: 2/5 ]   |
+-----------------------------------------------------------------------------------+
|  [CONCEPT MAP]     |  PROBLEM PANE (Left)        | WORKSPACE PANE (Right)         |
|                    |  Target Concept:            | Write your step-by-step        |
|  (o) FBDs          |  Free-Body Diagrams         | working/derivation here:       |
|      [Mastered]    |                             | +----------------------------+ |
|                    |  Problem:                   | | N - mg = ma                | |
|  (*) Net Force     |  A 2 kg book rests on a     | | N = m(g + a)               | |
|      [Solving...]  |  table in an elevator       | | N = 2 * (10 + 2)           | |
|                    |  accelerating upward...     | | N = 24 N                   | |
|  ( ) Friction      |                             | +----------------------------+ |
|      [Locked]      |  Given variables:           | Final Answer:                  |
|                    |  m = 2 kg, a = 2 m/s^2      | [ 24 ] N                       |
|  ( ) Inclines      |                             |                                |
|      [Locked]      |                             | [ SUBMIT ANSWER ]              |
|                    |                             |                                |
+--------------------+-----------------------------+--------------------------------+
|  FOOTER: System Status [Idle]                                                     |
+-----------------------------------------------------------------------------------+
```

- **Split ratio**: 40% (Problem Context + Concept Info) | 60% (Interactive Solving Workspace).
- **Theme**: Premium dark mode base (slate/charcoal) with high-contrast indicator accents (violet for seed, emerald for mastery, amber for diagnosis/twins).

---

## 5. Student Interaction States

The interface shifts dynamically through these distinct states:

| State | Trigger | UI Behavior |
|---|---|---|
| **Idle** | Initial load / Concept chosen | Problem loaded. Workspace empty. Submit button disabled. |
| **Solving** | Student starts typing | Timer starts. Input field displays live count. Submit button active. |
| **Submitting** | Click "Submit Answer" | Inputs lock. Spinner displays over submit button. |
| **Evaluating** | API call in progress | Ambient pulse animation on left/right panes indicating AI processing. |
| **Mastered** | API returns `nextAction: 'mastered'` or `'twin_accepted'` | Confetti effect. Workspace locks. Big "Next Concept" button appears. |
| **Diagnosis** | API returns `nextAction: 'show_twin'` | Workspace split pane highlights in amber. Error feedback cards display. |
| **Twin Challenge**| Click "Accept Challenge" | Left pane transitions to the Twin Problem with custom entry animations. |
| **Verification** | Student submits Twin | Inputs lock. Verification-specific spinner. |
| **Remediation** | API returns `nextAction: 'remediation'` | Split pane merges into a single central panel containing structured explanations. |

---

## 6. Information Visibility Matrix

To ensure pedagogical integrity, certain data must remain strictly hidden from the client until they have completed their attempt:

| Information Item | Seed Stage | Diagnosis Stage | Twin Solving Stage | Verified Stage |
|---|---|---|---|---|
| **Seed Question** | **VISIBLE** | **VISIBLE** | **VISIBLE** | **VISIBLE** |
| **Seed Correct Answer** | *HIDDEN* | **VISIBLE** | **VISIBLE** | **VISIBLE** |
| **Seed Step-by-Step Reasoning** | *HIDDEN* | **VISIBLE** | **VISIBLE** | **VISIBLE** |
| **Evaluator Identified Mistakes** | *HIDDEN* | **VISIBLE** | **VISIBLE** | **VISIBLE** |
| **Misconception Classification** | *HIDDEN* | **VISIBLE** | **VISIBLE** | **VISIBLE** |
| **Twin Question** | *HIDDEN* | *HIDDEN* (Preview allowed) | **VISIBLE** | **VISIBLE** |
| **Twin Correct Answer** | *HIDDEN* | *HIDDEN* | *HIDDEN* | **VISIBLE** |
| **Twin Step-by-Step Reasoning** | *HIDDEN* | *HIDDEN* | *HIDDEN* | **VISIBLE** |
| **Transfer Score / Feedback** | *HIDDEN* | *HIDDEN* | *HIDDEN* | **VISIBLE** |

---

## 7. Concept Map Behavior and States

The Concept Map is the visual navigation system. It is represented as a progressive subway line or dependency tree.

### Concept Nodes & Statuses:
- **Locked**: Pale gray node, padlock icon. Hovering shows "Prerequisite: [Prereq Name]". Cannot be clicked.
- **Available / Unlocked**: Violet border, hollow node. Student can click to initiate the Seed challenge.
- **Active / Solving**: Glowing pulse indicator. The current problem session is tied to this node.
- **Mastered**: Filled emerald node, checkmark badge. Student can review past working but cannot "lose" mastery.
- **Needs Remediation**: Filled amber/red node, alert icon. Highlighted indicating student should enter the remediation walkthrough.

---

## 8. Error, Loading, and AI Failure States

Since we rely on generative AI, handling network latency and parsing failures gracefully is critical.

- **Loading State**: A progressive step-indicator loader shows exactly what the AI engine is doing (e.g. `[1/3] Evaluating your math...` -> `[2/3] Analyzing root causes...` -> `[3/3] Shaping a conceptual twin...`).
- **AI Timeout (55s)**: If the backend takes too long, the submission unlocks, a subtle red alert banner pops up at the top: *"We are experiencing heavy load. Your workspace has been saved. Please try submitting again."*
- **Zod Validation Failure**: If the engine outputs malformed JSON, the route automatically retries. If all retries fail, we fallback to a safe static diagnostic template (arithmetic/procedural check) so the user journey never breaks.

---

## 9. Responsive & Desktop Layouts

- **Desktop (1440px+)**: Full 3-column layout. Sidebar Concept Map is persistently visible on the left. Split-pane problem space and workspace sit side-by-side.
- **Laptop (1024px - 1440px)**: Sidebar collapses into a slide-out drawer. Problem and workspace panes scale fluidly using flexbox.
- **Mobile / Small Tablet (Below 1024px)**: Stacked single-pane layout. Tab bar at the top allows switching between the `Problem` and `Workspace` views.

---

## 10. Accessibility Considerations

- **Keyboard Navigation**: The math workspace must be fully focusable. Tab indices must move logically from Problem reading -> Working text area -> Final answer input -> Submit button.
- **LaTeX Rendering Accessibility**: All LaTeX elements (equations, problem text) will render using KaTeX with accessible MathML output.
- **Contrast Ratios**: The dark theme uses slate grays and off-whites that strictly adhere to WCAG AAA contrast guidelines (minimum 7:1 for text).

---

## 11. 10-Minute Hackathon Demo Flow

To wow judges in exactly 10 minutes, the UI will feature a **"Demo Preset Controller"** (hidden in production, expandable via bottom-right corner toggle).

```
[ DEMO PRESETS ] 
(1) Rote Solver (Fails seed, prompts twin)
(2) First-Principles Master (Instantly masters seed)
(3) The Arithmetic Slippage (Triggers calculation-error path)
```

### Demo Script:
1. **Minute 0-2 (The Pitch)**: Present the landing page and the Concept Map. Explain the "surface feature vs deep structure" problem in EdTech.
2. **Minute 2-5 (The Rote solver path)**: 
   - Click **Demo Preset 1**. The workspace populates with a book-in-elevator problem.
   - Click submit. The Evaluator detects a surface pattern mistake ($N=mg$).
   - Show the **Diagnosis Panel**: It exposes the misconception clearly.
   - Serve the **Twin Challenge** (Rocket capsule). Show how the scenario changed but the math invariants remained.
3. **Minute 5-8 (Conceptual Transfer)**:
   - Solve the twin correctly.
   - Show the Verifier's transfer assessment and the **Mastery Celebration**.
4. **Minute 8-10 (Q&A / Architecture)**: Show the clean layout, the Concept Map progress, and answer technical questions.

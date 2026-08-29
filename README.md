# ConceptTwin

An AI-powered adaptive physics learning system that detects surface-level pattern matching and tests whether a student can transfer the underlying concept to a structurally similar problem.

---

## Overview

ConceptTwin helps students move beyond rote formula memorization and surface-level pattern matching. By evaluating the student's step-by-step physical reasoning, identifying specific conceptual gaps, generating structurally equivalent "twin" problems, and verifying whether the student can transfer the concept to a new physical scenario, ConceptTwin ensures true mastery.

---

## The Problem

*   **Rote Pattern Substitution**: Students preparing for entrance exams often solve physics questions by recognizing surface patterns and substituting numbers into memorized equations.
*   **Insufficiency of Option-Based Checking**: A student can arrive at the correct final numerical answer through flawed reasoning, algebraic coincidence, or incorrect assumptions (e.g., assuming normal force always equals static weight, $N = mg$). Traditional platforms mark this as correct, creating a false positive.
*   **Scale of Diagnosis**: Instructors cannot manually audit and diagnose every student's handwritten calculations at scale to find the root conceptual misconception.
*   **Typed Input Barriers**: Traditional online testing portals force students to type complex equations. Since physics is naturally solved with pen and paper, typing mathematical derivations becomes an artificial bottleneck.

---

## The Solution

ConceptTwin evaluates the student's step-by-step reasoning rather than relying only on the final numerical answer. The platform accepts typed text or handwritten solution uploads (parsed via server-side multimodal AI). 

If the system detects incorrect reasoning or surface-level pattern matching, it locks progress, explains the conceptual gap, and serves a **ConceptTwin**. The twin problem preserves the identical mathematical and physical invariants of the concept while changing the surface scenario (e.g., resolving normal force on a vertical elevator table vs. a rising space shuttle cabin). Conceptual transfer is verified only when the student successfully solves the twin.

---

## How ConceptTwin Works

The platform guides students through a closed-loop assessment and transfer learning loop:

```
[Diagnostic PYQ] ──► [Student Solution (Typed/Handwritten)] ──► [AI Evaluation]
                                                                        │
                                            ┌───────────────────────────┴───────────────────────────┐
                                            ▼                                                       ▼
                                     [Deep Mastery]                                        [Rote Pattern Detected]
                                            │                                                       │
                                     (Unlock Module)                                       [Concept Gap Diagnosis]
                                                                                                    │
                                                                                           [ConceptTwin Served]
                                                                                                    │
                                                                                           [Transfer Test Pass]
```

1.  **Student Onboarding**: Configure student class level and target examination.
2.  **Concept Selection**: Select the target concept node from the sidebar map.
3.  **Diagnostic PYQ**: Serve an exam-level baseline question containing inline physics diagrams.
4.  **Student Solution**: Input steps in the math editor or upload a photo of the handwritten scratchpad.
5.  **AI Evaluation**: The Evaluator agent verifies the correctness of the calculations and reasoning steps.
6.  **Concept Gap Detection**: If a conceptual gap is detected, the system locks progression and diagnoses the specific misconception.
7.  **ConceptTwin Generation**: The Twin Generator creates a structurally equivalent challenge.
8.  **Transfer Test**: The student solves the newly generated twin problem.
9.  **Verification**: The Verifier validates the generated twin for correctness and grades the transfer attempt.
10. **Mastery / Next Concept**: Once transfer is proven, the concept is marked as mastered, unlocking the next topic.

---

## Current Demonstrated Scope

The deployed demonstration currently showcases the **Class 11 Physics — Laws of Motion** learning pathway with five curated diagnostic problems:

1.  **Free-Body Diagrams & Force Identification**: A sphere nested inside an asymmetric $30^\circ/60^\circ$ V-shaped trough. (Includes vector SVG diagram).
2.  **Newton's Second Law / Net Force**: A mass pulled by a time-varying force requiring acceleration integration.
3.  **Friction & Direction of Friction**: A block pressed against a vertical wall with horizontal force. (Includes vector SVG diagram).
4.  **Inclined Plane Problems**: A block in equilibrium on a rough inclined slope with static friction. (Includes vector SVG diagram).
5.  **Connected Bodies / Pulley Systems**: A coupled block-and-pulley system resting on a table. (Includes vector SVG diagram).

Four of the five diagnostic problems include physics diagrams. This scope is a demonstrated slice of the system; the underlying schemas and agent pipelines are fully curriculum-agnostic and designed to scale to additional topics.

---

## AI Agent Architecture

ConceptTwin orchestrates four specialized agents via a stateful **LangGraph** workflow:

*   **Evaluator**: Evaluates the correctness of the final numerical answer, transcribes calculations, and checks for surface-level rote patterns.
*   **Diagnostician**: Analyzes reasoning flaws against known physics misconceptions to identify the exact conceptual gap.
*   **Twin Generator**: Synthesizes a new challenge, maintaining core mathematical structures while changing surface descriptors.
*   **Verifier**: Validates the physical correctness of the generated twin and grades the student's transfer attempt.

---

## Key Differentiator

*   **Traditional Practice**:
    `Question ──► Answer ──► Correct/Incorrect`
*   **ConceptTwin**:
    `Question ──► Reasoning ──► AI Diagnosis ──► Concept Gap ──► Structural Twin ──► Transfer ──► Mastery`

The core distinction is that ConceptTwin attempts to separate **"Can the student reproduce the solution?"** from **"Does the student understand the underlying concept?"** to ensure true conceptual transfer.

---

## Product & UX

*   **Light-First Interface**: Clean workspace built on a warm off-white foundation (`#F8FAFA`) with charcoal typography (`#1A2020`) and active cyan/teal indicators (`#77FFFC` / `#008f8c`).
*   **Interactive Workspace**: Split-panel design showing the active problem context on the left and the typed/image solution upload workspace on the right.
*   **Vector Physics Diagrams**: Responsive vector shapes rendered using inline SVG/CSS variables directly inside the browser.
*   **AI Assessment Loader**: Centered processing glass card showing a rotating AI core orbit and progressive stage checklist to block duplicate submissions and freeze inputs.
*   **Outcomes Drawer**: Smooth sliding panel utilizing CSS transitions to display scores, diagnosed misconceptions, and next action triggers.

---

## Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling & Animation** | Tailwind CSS 4, CSS Keyframe Transitions |
| **AI Models & SDK** | Google GenAI SDK (`@google/genai`), Gemini 3.6 Flash (Text & Vision API) |
| **Orchestration** | LangGraph (`@langchain/langgraph`), LangChain Core |
| **Schema Validation** | Zod |
| **Diagrams Rendering** | Inline SVG, HTML5 Canvas |

---

## Repository Structure

```
concept-twin/
├── src/
│   ├── app/                   # Next.js pages and API route handlers
│   │   ├── api/
│   │   │   ├── session/       # Main LangGraph session evaluator API
│   │   │   └── analyze-solution/ # Multimodal image note parser API
│   ├── components/            # Reusable React items (SVG PhysicsDiagram)
│   ├── data/                  # Diagnostic question datasets & concept map
│   ├── lib/
│   │   ├── agents/            # Evaluator, Diagnostician, TwinGen, and Verifier agents
│   │   ├── ai/                # Central Gemini configuration & spacing queue
│   │   └── orchestration/     # LangGraph StateGraph schema definitions
│   ├── types/                 # Authoritative physics data models
```

---

## Demo & Resources

*   **Live Demo**: [https://concept-twin.vercel.app/](https://concept-twin.vercel.app/)
*   **Project Documentation**: [https://drive.google.com/file/d/118kjCrAMEGujhTexNi39PTjZ5wq3wJVV/view?usp=sharing](https://drive.google.com/file/d/118kjCrAMEGujhTexNi39PTjZ5wq3wJVV/view?usp=sharing)
*   **GitHub Repository**: [https://github.com/ayush28gadve/Lv8.git](https://github.com/ayush28gadve/Lv8.git)

*Note: The live demonstration currently showcases the Class 11 JEE Physics — Laws of Motion learning pathway with five curated diagnostic problems.*

---

## Getting Started

### 1. Prerequisites
*   Node.js (v18.x or higher)
*   Gemini API Key (obtain from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a local `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser.

---

## Development / Build Commands

Validate changes and compile assets using these scripts:
```bash
# TypeScript compiler verification
npx tsc --noEmit

# ESLint code health check
npm run lint

# Production build compilation
npm run build
```

---

## Future Expansion

*   **Database Scaling**: Adapt the concept nodes to support further physics domains (e.g., Work-Power-Energy, Kinematics) and subjects (e.g., Chemistry, Mathematics).
*   **Deeper Image Recognition**: Upgrade the vision parser to decipher complex handwritten Free-Body Diagrams (FBDs) and grade vector alignments.
*   **Historical Dashboard**: Implement analytics tracking student misconception trends over time.

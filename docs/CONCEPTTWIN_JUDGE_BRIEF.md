# ConceptTwin — Hackathon Judge Brief

An adaptive, multi-agent AI assessment platform designed to verify deep conceptual transfer and eliminate rote pattern-matching in competitive physics learning.

---

## 1. Executive Summary
ConceptTwin is an adaptive physics learning workspace built specifically for students preparing for high-stakes, concept-heavy competitive entrance examinations (JEE/NEET). Rather than evaluating only final numerical answers, ConceptTwin assesses the student’s step-by-step physical reasoning. If a student displays rote formula substitution without deep conceptual grasp, the platform diagnoses the gap and generates a **Conceptual Twin**—a structurally isomorphic challenge in a completely different physical context—to verify and enforce genuine transfer understanding.

---

## 2. The Problem
For competitive exams, questions are engineered to test deep understanding. However, students commonly prepare by memorizing formula rules, recognizing surface-level patterns, and substituting values without mastering the underlying physics models. 

### Why Conventional Evaluation Fails
1.  **MCQ False Positives**: Traditional portals record "mastery" if a student selects the correct option, even if they used flawed reasoning, lucky guesses, or rote formula memory.
2.  **Lack of Contextual Invariance**: A student who can solve a standard block-on-incline problem might fail if the same mathematical principles are applied to a particle sliding on a dome or a box inside an accelerating spaceship.
3.  **Typed Input Bottleneck**: Online portals force students to type complex derivations. In reality, physics is solved with pen and paper, resulting in students using online portals to check answers rather than document their calculations.

---

## 3. Our Solution
ConceptTwin implements a **transfer-learning** assessment model. The system does not stop at verifying numerical answers; it evaluates step-by-step derivations (typed or handwritten via image upload) using a multi-agent AI pipeline. 

If rote memorization or reasoning flaws are detected, the system locks progress, explains the conceptual gap, and serves a **ConceptTwin**. To solve the twin, the student must apply the same governing physics principles (invariants) to a structurally identical but visually and contextually different problem. Mastery is unlocked only when the student successfully transfers this understanding.

```
[Diagnostic PYQ] ──► [Typed/Handwritten Work] ──► [Multi-Agent Evaluator]
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
                                                                                      │
                                                                               [Mastery Unlocked]
```

---

## 4. How ConceptTwin Works

1.  **Onboarding**: Student configures target exam (NEET/JEE) and class level.
2.  **Diagnostic PYQ**: Serving an exam-level baseline question (often including inline vector SVG physics diagrams).
3.  **Student Attempt**: Student types their work or uploads a handwritten notepad image.
4.  **Vision Transcription**: Server-side Gemini Vision endpoint transcribes formulas, numerical values, and calculations into a editable review block.
5.  **Multi-Agent Evaluation**: LangGraph coordinates Evaluator, Diagnostician, TwinGen, and Verifier agents.
6.  **Transfer Challenge**: If evaluation fails or indicates rote understanding, the system serves the verified ConceptTwin.
7.  **Progressive Mastery**: The student solves the ConceptTwin, verifies transfer, and unlocks the next prerequisite node in the subway-map path.

---

## 5. Key Differentiators

*   **Multi-Agent Graph Orchestration**: Utilizes a strict sequential LangGraph state-graph. Every generated problem is verified by a secondary agent before rendering, eliminating AI hallucinations.
*   **Multimodal OCR Processing**: Converts handwritten notes directly into mathematical workspace items on the fly using server-side Gemini Vision.
*   **Structural Twin Generation**: Preserves core physics formulas (invariables) while varying surface features (context, objects, forces) to verify transfer learning.
*   **Resilience & Throttle Controls**: Configured with a global server-side throttling queue (minimum 1.5s spacing) and session concurrency locks to prevent rate limit blocks during live demos.
*   **Pure Vector Physics Diagrams**: Employs SVG/CSS instead of heavy external image files, rendering crisp, responsive figures matching paper booklets.

---

## 6. Multi-Agent AI Architecture

Coordinated via **LangGraph**, the pipeline manages state transitions across four distinct server-side agents:

| Agent Node | Filename | Primary Responsibility |
| :--- | :--- | :--- |
| **Evaluator** | `evaluator.ts` | Transcribes student reasoning, checks final answer, and flags rote behavior. |
| **Diagnostician** | `diagnostician.ts` | Compares student working against common misconceptions to isolate the exact gap. |
| **Twin Generator** | `twin-generator.ts` | Creates a new problem containing identical mathematical structures in a new context. |
| **Verifier** | `verifier.ts` | Validates physics consistency of the generated twin and grades the final transfer attempt. |

---

## 7. Real Student Journey Example

*   **Original PYQ (Concept: Friction Direction)**: A block of mass 3 kg is pressed against a rough vertical wall by horizontal force $F = 80\text{ N}$. (Limiting friction $= 40\text{ N}$, weight $= 30\text{ N}$).
*   **Student Work**: Writes "$f = \mu_s N = 0.5 \times 80 = 40\text{ N}$" (numerical calculation slip, or rote use of limiting friction formula instead of checking equilibrium).
*   **AI Diagnosis**: Flagged as rote pattern-matching. Static friction should self-adjust to balance the weight ($f = W = 30\text{ N}$).
*   **Generated ConceptTwin**: A block of mass 2 kg is pressed against a vertical wall by horizontal force $F = 100\text{ N}$ ($\mu_s = 0.4$, $\mu_k = 0.3$).
*   **Transfer Verification**: Student correctly deduces the block remains stationary and static friction must equal the weight ($20\text{ N}$), proving conceptual transfer.

---

## 8. Technology Stack

*   **Frontend Core**: Next.js 16 (App Router), React 19, TypeScript 5.
*   **Styling & FX**: Tailwind CSS 4, CSS Keyframe Orbits.
*   **AI Core**: Google GenAI SDK (`@google/genai`), Gemini 3.6 Flash (Text & Vision models).
*   **Orchestration**: LangGraph (`@langchain/langgraph`), LangChain Core.
*   **Validation**: Zod (strict schema enforcement).

---

## 9. Visual Evidence (Screenshots Placeholders)

```
================================================================================
[SCREENSHOT PLACEHOLDER 1: STUDENT ONBOARDING PANEL]
Description: Onboarding modal for student target selection (Class 12, NEET exam, chapter selections).
================================================================================
```

```
================================================================================
[SCREENSHOT PLACEHOLDER 2: PYQ STATEMENT CARD WITH SVG DIAGRAM]
Description: Diagnostic problem card serving a sphere-in-V-groove physics SVG diagram.
================================================================================
```

```
================================================================================
[SCREENSHOT PLACEHOLDER 3: MULTIMODAL HANDWRITING UPLOAD ZONE]
Description: Handwritten notes file drop zone showing the server-side text transcription.
================================================================================
```

```
================================================================================
[SCREENSHOT PLACEHOLDER 4: RESULTS DRAWER & CONCEPTTWIN CHALLENGE]
Description: Evaluation slide-up outcome displaying misconception diagnosis and next twin challenge.
================================================================================
```

---

## 10. Why It Matters
In competitive exams like JEE/NEET, a single conceptual misunderstanding can cost a student a year of preparation. By moving assessments from **"did you select the correct option"** to **"can you transfer the underlying concept,"** ConceptTwin shifts the educational focus from answer memorization to genuine mastery.

---

## 11. Project Links
*   **Live Demo**: *[INSERT LIVE URL]*
*   **GitHub Repository**: [https://github.com/ayush28gadve/Lv8.git](https://github.com/ayush28gadve/Lv8.git)
*   **Demo Video**: *[INSERT VIDEO URL]*

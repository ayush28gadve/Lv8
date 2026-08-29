# The ConceptTwin Learning Loop

This document details the cognitive learning model, multimodal solution parsing, and adaptive mastery metrics implemented in **ConceptTwin**.

---

## 1. The Core Learning Pathway

Traditional question banks check if a student clicked the correct option. ConceptTwin implements a closed-loop conceptual assessment:

```
[Diagnostic Anchor] ──► [Typed/Handwritten Solution] ──► [AI Evaluator]
                                                               │
                                       ┌───────────────────────┴───────────────────────┐
                                       ▼                                               ▼
                                [Deep Mastery]                               [Rote Pattern Detected]
                                       │                                               │
                                (Unlock Next)                                [Gap Misconception Diagnosis]
                                                                                       │
                                                                             [ConceptTwin Served]
                                                                                       │
                                                                              [Transfer Pass]
```

### The Stages:
1.  **Diagnostic Anchor**: The student is served a baseline exam-level question from the dataset (often including vector diagrams).
2.  **Typed/Handwritten Solution**: The student submits their derivation either by typing their steps directly into the math editor, or by uploading a photo of their physical notepad.
3.  **Evaluator Processing**: The system transcribes calculation steps and checks correctness.
    *   **Deep Understanding**: Correct answer and correct reasoning. Unlocks mastery immediately.
    *   **Incorrect / Surface Pattern**: Flawed logic or rote memorization. Triggers the Diagnostician.
4.  **Concept Gap Diagnosis**: The system identifies the specific conceptual pitfall (e.g. calculation error, static vs dynamic friction mismatch).
5.  **ConceptTwin Challenge**: The Twin Generator creates a structurally equivalent physics question in a new context, changing the values and variables but preserving the core invariants.
6.  **Transfer Verification**: The student attempts the twin, and the Verifier determines if conceptual transfer has occurred. Successful transfer unlocks mastery.

---

## 2. Multimodal Solution Parsing

To remove the barrier of typing complex formulas, students can upload images of their hand-drawn derivations:

*   **Endpoint**: `POST /api/analyze-solution`
*   **Workflow**:
    1.  The student uploads or drags a JPEG/PNG photo of their work.
    2.  The server validates the payload and dispatches it to Gemini Vision along with the problem context.
    3.  The model parses math symbols, identifies coordinate axes, distinguishes discard paths, and returns clean Markdown.
    4.  The student reviews the transcription in their workspace before final submission.
    5.  **Quality Guard**: If the handwriting is blurry, low-contrast, or cut off, the vision engine flags this as "ambiguous/unclear" to prevent false assumptions.

---

## 3. Physics Invariant Twins

A **ConceptTwin** is not a random follow-up question. It is an **isomorphic physics model** designed to check if the student can apply the same mathematical relationship to a different situation:

*   **Baseline (Elevator acceleration)**:
    A book of mass $m$ rests on a table inside an elevator accelerating upwards at acceleration $a$.
    *   *Mathematical Invariant*: $N - mg = ma \implies N = m(g+a)$.
*   **Twin (Spaceship acceleration)**:
    A rocket capsule containing cargo of mass $m$ launches upwards from a launchpad with vertical acceleration $a$.
    *   *Conceptual Transfer*: The student must realize that normal force and gravity behave identically under vertical spaceship acceleration.
*   **Variant (Spaceship deceleration)**:
    A lander pod descending on Mars decelerates vertically.
    *   *Mathematical Variation*: The sign of acceleration changes, testing if the student actually understands the vector resolution ($N = m(g-a)$) or merely memorized the addition formula.

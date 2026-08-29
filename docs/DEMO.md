# Deployed Demonstration & Walkthrough

This document contains demo pathways, preset guides, and links to evaluate the active ConceptTwin implementation.

---

## 1. Demo & Resources

*   **Live Demo**: [https://concept-twin.vercel.app/](https://concept-twin.vercel.app/)
*   **Project Documentation**: [https://drive.google.com/file/d/118kjCrAMEGujhTexNi39PTjZ5wq3wJVV/view?usp=sharing](https://drive.google.com/file/d/118kjCrAMEGujhTexNi39PTjZ5wq3wJVV/view?usp=sharing)
*   **GitHub Repository**: [https://github.com/ayush28gadve/Lv8.git](https://github.com/ayush28gadve/Lv8.git)

*Note: The live demonstration currently showcases the Class 11 JEE Physics — Laws of Motion learning pathway with five curated diagnostic problems.*

---

## 2. Deployed Demonstration Scope

The current implementation focuses on a vertical slice of **Class 11 Physics — Laws of Motion**:

| Topic Node | Seed Problem | SVG Diagrams | Mathematical Invariants |
| :--- | :--- | :--- | :--- |
| **1. Free-Body Diagrams** | Uniform sphere nested inside an asymmetric V-groove trough. | Yes | Normal reaction components $N_1 \sin\theta_1 = N_2 \sin\theta_2$. |
| **2. Newton's Second Law** | Block pulled by time-varying force $F(t) = 4t$. | No | Velocity integration $v(t) = \int a(t)dt$. |
| **3. Friction Direction** | Block pressed against a vertical wall with horizontal force. | Yes | Static friction self-adjusts to balance weight ($f = mg$). |
| **4. Inclined Planes** | Block on a rough inclined slope under static friction. | Yes | Equilibrium resolution along the plane $mg \sin\theta = f$. |
| **5. Connected Bodies** | Connected blocks on tabletop and pulley. | Yes | Acceleration and tension resolution in coupled systems. |

Four of the five problems render custom, responsive physics figures directly inside the browser using inline SVG elements.

---

## 3. Recommended Review Walkthrough

To review the state transitions of the multi-agent assessment system, follow these pathways:

### Pathway A: Direct Concept Mastery (First-Principles Solver)
1.  Open the [Live Demo](https://concept-twin.vercel.app/).
2.  Onboard with any profile name.
3.  Select concept **1. Free-Body Diagrams**.
4.  Solve the V-groove problem correctly. Type step-by-step resolution:
    `N1*sin(30) = N2*sin(60) => N1/2 = N2*sqrt(3)/2 => N1 = sqrt(3)*N2. Resolve vertical: N1*cos(30) + N2*cos(60) = W => N1*sqrt(3)/2 + N2/2 = 40. Substitute: 3*N2/2 + N2/2 = 40 => 2*N2 = 40 => N2 = 20 N. N1 = 20*sqrt(3) = 34.64 N.`
5.  Input final answer: `34.64`.
6.  Click **Submit Solution**.
7.  The system evaluates the steps and answer, awards mastery immediately, and unlocks the next concept on the subway map.

### Pathway B: Rote Pattern Matching Detection (The Twin Path)
1.  Select concept **3. Friction & Direction of Friction**.
2.  Read the problem (block of 3 kg against wall, $F = 80\text{ N}$, static friction limit $= 40\text{ N}$).
3.  Submit a rote pattern response. Type:
    `f = mu*N = 0.5 * 80 = 40 N.`
4.  Input final answer: `40`.
5.  Click **Submit Solution**.
6.  **AI Diagnosis**: The Evaluator flags this as a rote pattern-matching mistake, explaining that static friction adjusts to balance gravity ($f = mg = 30\text{ N}$) since the applied normal force is sufficient to prevent sliding.
7.  **Serve Twin**: Accept the Twin Challenge. A new context is loaded (e.g. block on a truck bed or ship shelf).
8.  Solve the twin correctly to demonstrate transfer and unlock mastery.

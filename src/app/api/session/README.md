# POST /api/session — ConceptTwin API Reference

Server-only route handler. Requires `GEMINI_API_KEY` in `.env.local`.

---

## Endpoint

```
POST /api/session
Content-Type: application/json
```

---

## Stage A — Seed Problem Attempt

Student submits their attempt at one of the 10 verified seed problems.

### Request

```json
{
  "stage": "seed",
  "problemId": "prob-fbd-01",
  "working": "The forces on the book are gravity (mg = 20 N down) and normal force N up.\nSince the elevator accelerates upward: N - mg = ma\nN = m(g + a) = 2 × (10 + 2) = 24 N",
  "finalAnswer": 24,
  "sessionId": "optional-uuid-for-correlation"
}
```

| Field         | Type              | Required | Notes                                             |
|---------------|-------------------|----------|---------------------------------------------------|
| `stage`       | `"seed"`          | ✅       | Discriminator — must be exactly `"seed"`          |
| `problemId`   | `string`          | ✅       | One of the 10 seed problem IDs from knowledge layer |
| `working`     | `string`          | ✅       | Student's step-by-step working (min 1 char)       |
| `finalAnswer` | `number\|string`  | ✅       | Student's stated answer                           |
| `sessionId`   | `string`          | ❌       | Optional; server generates a UUID if omitted      |

### Response — mastery path (student correct + deep reasoning)

```json
{
  "ok": true,
  "sessionId": "c3f8a2b1-...",
  "stage": "seed",
  "masteryLevel": "mastered",
  "nextAction": "mastered",
  "evaluation": {
    "isCorrect": true,
    "hasCorrectReasoning": true,
    "studentAnswer": 24,
    "expectedAnswer": 24,
    "identifiedMistakes": [],
    "score": 95,
    "summary": "Excellent! Correct answer with valid Newton's Second Law reasoning."
  }
}
```

### Response — twin path (student incorrect or surface-only)

```json
{
  "ok": true,
  "sessionId": "c3f8a2b1-...",
  "stage": "seed",
  "masteryLevel": "developing",
  "nextAction": "show_twin",
  "evaluation": {
    "isCorrect": false,
    "hasCorrectReasoning": false,
    "studentAnswer": 20,
    "expectedAnswer": 24,
    "identifiedMistakes": [
      "Normal force treated as equal to static weight mg — ignored elevator acceleration."
    ],
    "score": 20,
    "summary": "Incorrect: the elevator's upward acceleration increases the normal force above mg."
  },
  "diagnosis": {
    "misconceptionType": "Newton's Third Law / Pseudo-force confusion",
    "conceptualGap": "Student treats N = mg as always true, ignoring that N must account for net acceleration.",
    "deepStructureFailure": "Failure to apply Newton's Second Law in non-zero acceleration scenarios.",
    "isSurfacePatternMatcher": false,
    "confidence": 0.88
  },
  "twin": {
    "twinId": "twin-a8c2f1e3-...",
    "conceptId": "fbd-force-identification",
    "question": "A 3 kg crate rests on the floor of a rocket capsule. The capsule accelerates upward at 5 m/s². Taking g = 10 m/s², find the normal force the floor exerts on the crate.",
    "unit": "N",
    "twinRationale": "Changed: object (crate vs book), vehicle (rocket vs elevator), mass (3 kg vs 2 kg), acceleration (5 m/s² vs 2 m/s²). Preserved: upward acceleration scenario, requirement to apply N = m(g+a).",
    "difficulty": "easy"
  }
}
```

> **Note:** `twin.correctAnswer` and `twin.reasoning` are **intentionally omitted** from the response.
> The student must attempt the twin before the answer is revealed.

---

## Stage B — Twin Problem Attempt

Student submits their attempt at the AI-generated twin. The client echoes
back the `twin` object from Stage A so the server can verify the twinId
and run the conceptual-transfer check.

### Request

```json
{
  "stage": "twin",
  "twinId": "twin-a8c2f1e3-...",
  "problemId": "prob-fbd-01",
  "working": "Forces on crate: weight = 3 × 10 = 30 N down, Normal N up.\nN - 30 = 3 × 5 → N = 30 + 15 = 45 N",
  "finalAnswer": 45,
  "sessionId": "c3f8a2b1-...",
  "twinProblem": {
    "twinId": "twin-a8c2f1e3-...",
    "conceptId": "fbd-force-identification",
    "question": "A 3 kg crate rests on the floor of a rocket capsule. The capsule accelerates upward at 5 m/s². Taking g = 10 m/s², find the normal force the floor exerts on the crate.",
    "correctAnswer": 45,
    "unit": "N",
    "reasoning": "N - mg = ma → N = m(g+a) = 3(10+5) = 45 N",
    "twinRationale": "Changed surface features; preserved deep structure.",
    "difficulty": "easy"
  }
}
```

> **Why does the client send `twinProblem.correctAnswer`?**
> The server uses it to run the verifier. The server validates `twinId`
> matches `twinProblem.twinId` before using any client-supplied data.

### Response — successful transfer

```json
{
  "ok": true,
  "sessionId": "c3f8a2b1-...",
  "stage": "twin",
  "masteryLevel": "mastered",
  "nextAction": "twin_accepted",
  "evaluation": { ... },
  "verification": {
    "studentTransferred": true,
    "twinAttemptScore": 90,
    "transferFeedback": "Excellent conceptual transfer! You correctly applied N = m(g+a) to a new physical scenario.",
    "issues": []
  }
}
```

---

## Error Responses

All errors return `{ ok: false, error: string, code: string }`.

| Status | Code              | Cause                                               |
|--------|-------------------|-----------------------------------------------------|
| 400    | `BAD_REQUEST`     | Invalid JSON body or failed Zod validation          |
| 404    | `NOT_FOUND`       | `problemId` not in the knowledge layer              |
| 500    | `INTERNAL_ERROR`  | LangGraph / Gemini error (sanitised, no stack trace)|
| 504    | `TIMEOUT`         | Gemini took > 55 s to respond                       |

```json
{
  "ok": false,
  "error": "Problem 'prob-xyz' not found.",
  "code": "NOT_FOUND"
}
```

---

## Valid Problem IDs

| problemId         | Concept                          | Difficulty |
|-------------------|----------------------------------|------------|
| `prob-fbd-01`     | Free-Body Diagrams               | easy       |
| `prob-fbd-02`     | Free-Body Diagrams               | medium     |
| `prob-ns2-01`     | Newton's Second Law / Net Force  | easy       |
| `prob-ns2-02`     | Newton's Second Law / Net Force  | medium     |
| `prob-fric-01`    | Friction & Direction             | easy       |
| `prob-fric-02`    | Friction & Direction             | medium     |
| `prob-incl-01`    | Inclined Plane                   | medium     |
| `prob-incl-02`    | Inclined Plane                   | hard       |
| `prob-conn-01`    | Connected Bodies / Pulley        | medium     |
| `prob-conn-02`    | Connected Bodies / Pulley        | hard       |

---

## Testing with curl (development)

```bash
# Stage A — seed problem attempt
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "seed",
    "problemId": "prob-fbd-01",
    "working": "N - mg = ma, so N = m(g+a) = 2 x 12 = 24 N",
    "finalAnswer": 24
  }'
```

```bash
# Stage B — twin attempt (use twin from stage A response)
curl -X POST http://localhost:3000/api/session \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "twin",
    "twinId": "<twinId from stage A>",
    "problemId": "prob-fbd-01",
    "working": "N = m(g+a) = 3 x 15 = 45 N",
    "finalAnswer": 45,
    "twinProblem": { ... paste twin object from stage A response ... }
  }'
```

---

## Security Notes

- `GEMINI_API_KEY` is accessed only server-side via `process.env` — never in client bundles.
- Seed problem ground-truth answers are loaded from the server-side knowledge layer — the client cannot supply or modify them.
- Twin ground-truth (`correctAnswer`, `reasoning`) is stripped before the stage-A response reaches the browser.
- Stack traces are never included in error responses.
- This route has no authentication — add session/JWT middleware before production deployment.

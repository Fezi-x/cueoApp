# CUEO Engineering Codex Skill

Follow these rules exactly when working on CUEO.

## 1. Product Truths (Axioms)

These are absolute. If a feature violates one, it does not ship.

* Text is the product. Camera is a reference.
* One primary screen. One primary action.
* If a creator hesitates, the UX failed.
* Defaults beat settings.
* The UI must disappear during recording.

## Owner Overrides (Active)

* 2026-02-09: Allow camera-first layout and controls for the initial UI pass.
* 2026-02-09: Use this palette for the current design pass: black background, dark gray cards (#242424), white text, red record button.
* 2026-02-09: Implement camera permissions + recording + script modal + record-coupled auto-scroll as the current minimum working scope.

## 2. What CUEO Is / Is Not

### CUEO IS

* A dead-simple mobile teleprompter
* Optimized for short-form creators
* Built for daily use, not demos
* Offline-first, local-only

### CUEO IS NOT

* An AI tool
* A content suite
* A video editor
* A cloud product
* A social product
* A settings-heavy app

If a feature sounds powerful, it is probably wrong.

## 3. Technical Constraints (Hard Limits)

* Framework: React Native (Expo) + TypeScript
* Styling: Tailwind via NativeWind (className-first)
* State: Local only
* Persistence: AsyncStorage (only if required)
* Camera: expo-camera
* Media: expo-media-library
* Animations: Only if they reduce cognitive load

### Explicitly Forbidden

* Backend or authentication
* Feature flags
* Global state libraries
* Analytics SDKs
* Inline StyleSheet sprawl (prefer Tailwind utilities)
* Over-abstracted hooks
* Speculative utilities

## 4. UI Codex (Strict)

### Approved UI and UX Libraries (Apple / Snapchat Reference)

These libraries are approved and locked. No additional UI libraries may be added without explicit justification.

#### Core

* NativeWind (Tailwind) - layout, spacing, visual consistency
* react-native-reanimated - all motion and transitions (60fps native)
* react-native-gesture-handler - tap precision, long-press, swipe interactions
* react-native-safe-area-context - device-respecting layout

#### Sensory Feedback

* expo-haptics - recording start, pause/resume, countdown completion

#### Visual Focus (Limited)

* expo-blur - temporary modal/background focus only

##### Blur Rules

* Never decorative
* Never persistent
* Never stacked
* Maximum one blur layer at a time

#### Explicitly Disallowed UI Libraries

* React Native Paper
* NativeBase
* Tamagui
* UI Kitten
* Any pre-styled component system

Rationale: Apple- and Snapchat-grade UI comes from systems, motion, and restraint - not component libraries.

### Styling Rules (Tailwind)

* Use className via NativeWind by default
* Prefer utility composition over custom styles
* Custom styles allowed only for:
* Animations
* Measurements Tailwind cannot express
* No mixed styling paradigms in the same component

### Visual Rules

* Dark background only
* High-contrast text only
* Neon yellow-green only for:
* Recording state
* Active controls
* No decorative colors
* No gradients
* No shadows unless functional

Note: Owner Overrides may permit a red record control for the current design pass.

### Camera Rules

* Framed preview
* Rounded rectangle
* Never fullscreen
* Never dominant

### Text Rules

* Large by default
* Readable at arm's length
* Stable auto-scroll (no jitter)
* Mirror mode supported

## 5. Interaction Rules

* One-hand usable
* Two taps max to start recording
* Zero setup required
* Pause / resume must be immediate
* Recording state must be unmistakable

If the user has to think, the UX failed.

## 6. Feature Gate (Scope Control)

A feature is allowed only if it satisfies at least one:

1. Improves reading comfort
2. Reduces friction to recording
3. Removes a decision from the user

If it meets none, it is rejected.

## 7. Implementation Discipline

* Implement one feature at a time
* No parallel refactors
* No UI redesign during feature work
* No speculative cleanup

Every change must clearly state:

* The problem it solves
* Why it belongs now
* What was explicitly not built

## 7A. Feedback Loop and Decision Ledger (Non-Negotiable)

CUEO operates with a permanent memory of mistakes and decisions.

### Rules

* Anything explicitly stated as "don't do this again" is recorded and treated as a hard constraint going forward.
* Any decision, change, or directive stated by the owner is recorded as canonical until explicitly revoked.
* Any feature, pattern, or approach that causes an error, regression, or friction is marked as disallowed and must not be repeated.

### Error Handling Policy

* Errors are not debated after the fact.
* If something breaks flow, trust, or simplicity, it is classified as a mistake.
* The correct response to an error is elimination, not iteration.

### Enforcement

* Recorded mistakes override future suggestions.
* Past errors have higher priority than new ideas.
* No re-introducing previously rejected patterns under new names.

## 7B. Mistake Registry (Template)

All mistakes and rejected decisions must be recorded using the template below. Once recorded, they become constraints, not suggestions.

```md
| Date       | Area        | Mistake / Don't Do Again | Root Cause | Resolution / Action Taken | Status |
|------------|-------------|--------------------------|------------|---------------------------|--------|
| YYYY-MM-DD | UI / Logic  |                          |            |                           | Open / Closed / Banned |
```

### Registry Rules

* Every row represents a permanent learning.
* Banned means it must never be reintroduced.
* Similar future ideas must be checked against this table first.

## 7C. End-of-Day Commit Protocol

When the owner says "done for today", a commit message must be generated automatically following this format:

```text
<type>(cueo): <concise summary of today's work>
```

### Commit Rules

* One commit per day unless explicitly stated otherwise
* Summary reflects outcome, not effort
* No vague messages (e.g., "updates", "changes")

### Allowed Types

* feat - new user-facing capability
* fix - bug or regression fix
* refactor - internal change, no behavior change
* style - UI or Tailwind-only changes
* docs - documentation or codex changes
* chore - tooling or config

Example:

```text
feat(cueo): stabilize teleprompter scroll and recording state
```

## 8. File and Component Philosophy

* Prefer flat structure
* Avoid premature separation
* Readability over reuse
* If a component is used once, keep it inline

## 9. Response Contract (For AI / Team Use)

When working under this codex, every response or implementation must:

1. Briefly explain what is being done
2. List component-level changes
3. Include JSX and styles
4. Note edge cases
5. State assumptions explicitly

No filler. No ideation unless requested.

## 10. Reset Assumptions (Starting Point)

When rebuilding from scratch, assume:

* One main screen
* Script stored locally
* Modal-based text editing
* Auto-scroll is core
* Camera and recording come after reading feels perfect

## Final Reminder

If the teleprompter experience is not perfect without the camera, nothing else matters.

Build ruthlessly. Cut aggressively. Ship honestly.

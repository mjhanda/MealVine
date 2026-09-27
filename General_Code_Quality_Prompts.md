# General Code Quality Prompts

Standing instructions for Claude Code. Drop into `CLAUDE.md` / `AGENTS.md` at the repo root.

## Core rule

Write simple, low-complexity code by default. Optimize for the next reader, not fewer keystrokes now.

## Complexity limits (hard rules)

- Cyclomatic complexity per function: target ≤ 5, refactor if > 7.
- Cognitive complexity per function: target ≤ 5, refactor if > 7. 
- Nesting depth: max 2–3 levels. If you're nested deeper, extract a function.
- Function length: refactor past ~40 lines.
- Parameters: max 3–4; bundle extras into an object.
- Use early returns / guard clauses instead of nested if/else.
- Replace long if/else-if or switch chains with a lookup table, map of functions, or polymorphism.
- Extract compound boolean conditions (`a && b || c && !d`) into a named variable or predicate function.

## Design

- One function = one responsibility, named with a precise verb phrase.
- Prefer pure functions; push side effects (I/O, mutation, network) to the edges.
- Composition over inheritance.
- DRY after 3 repeats, not 2 (rule of three) — don't over-abstract early.
- No speculative generality — build for the current requirement, not hypothetical ones (YAGNI).

## Naming & style

- Descriptive names, no single-letter vars except short-lived loop indices.
- Booleans read as predicates: `isValid`, `hasPermission`.
- No magic numbers/strings — use named constants.
- Comments explain *why*, not *what*.
- Match existing project formatting/lint conventions.

## Errors

- Validate inputs early, fail fast.
- Never swallow exceptions silently — handle or rethrow.
- Use specific error types, not generic ones.
- Don't use exceptions for normal control flow.

## Before finalizing any function, self-check:

1. Complexity ≤ 8, nesting ≤ 3, length ≤ 40 lines?
2. Any compound conditional that should be a named predicate?
3. Any if/else-if or switch better as a lookup table or polymorphism?
4. Doing more than one job? Split it.
5. Dead code, debug logs, unused imports removed?

Refactor anything that fails before returning the result.

## Optional: automated enforcement

Pair with a complexity linter and treat violations as blocking:

- JS/TS: ESLint `"complexity": ["error", 8]`
- Python: `radon cc` / flake8 `mccabe` (`max-complexity = 8`)
- Go: `gocyclo -over 8`
- Java: Checkstyle/PMD `CyclomaticComplexity`
- General: SonarQube complexity gate in CI
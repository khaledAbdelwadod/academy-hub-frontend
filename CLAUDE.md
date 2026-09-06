# CLAUDE.md — Academy Hub Frontend

> Coding standards Claude Code must follow in this repo (React frontend).
> These rules define HOW code is written. Cross-cutting architecture (routing across
> `www.academy-hub.net` and `{academy}.academy-hub.net`, state/auth design) is documented
> in `Document/frontend/architecture.md`.
> The companion backend repo (`academy-hub-backend`) has its own `CLAUDE.md`.
> Every rule here is mandatory. Deviations require an explicit comment explaining why.

---

## 1. Clean Code Principles

### Naming
- Names must reveal intent. If a name requires a comment to explain it, rename it.
- Variables: noun or noun phrase describing the value (`userCount`, `invoiceTotal`).
- Booleans: `is`, `has`, `can`, `should` prefix (`isAuthenticated`, `hasPermission`).
- Functions/hooks: verb or verb phrase describing the action (`fetchUser`, `calculateDiscount`); hooks additionally prefixed `use` (`useAcademyContext`).
- Components/classes: noun describing the concept (`PlayerCard`, `AcademyPicker`).
- Constants: `SCREAMING_SNAKE_CASE` for module-level constants (`MAX_RETRY_COUNT`).
- Avoid abbreviations unless universally understood (`id`, `url`, `http` are fine; `usr`, `mgr`, `calc` are not).

### Functions
- A function does ONE thing. If describing it requires "and", split it.
- Maximum ~20–30 lines per function/component body. Beyond that, extract named sub-components or hooks.
- No more than 3–4 parameters/props by primitive count. If more are needed, pass a typed props object.
- No boolean flag parameters that change a function's core behavior — make two functions instead.
- Return early to reduce nesting. Avoid deeply nested `if/else` chains and deeply nested JSX conditionals.

### General Discipline
- No magic numbers or strings. Use named constants.
- No dead code. Delete it — version control has history.
- No commented-out code blocks.
- Every `TODO` must include a reference: `// TODO(#42): remove after migration`.
- DRY: search for an existing utility/hook/component before writing a new one.
- KISS: choose the simplest solution that correctly solves the problem.

---

## 2. Design Principles

React favors function components + hooks over class hierarchies, so apply these at the level of components, hooks, and modules rather than forcing class-based OOP:

- **Single Responsibility**: one component, one reason to change. A component that fetches data, manages complex state, AND renders a large UI tree should be split (e.g. a hook for data/state, a component for presentation).
- **Open/Closed**: extend behavior via composition (children, render props, new hooks) rather than editing a shared component's internals for one caller's special case.
- **Composition over inheritance**: build complex UI by composing small components, not by extending base component classes.
- **Interface Segregation**: prefer small, specific prop types over one large "god props" object passed everywhere.
- **Dependency Inversion**: components/hooks depend on abstractions (an API client interface, a context) injected via props/context/DI, not concrete implementations instantiated inline.
- Encapsulate what varies. Hide implementation details behind a stable component/hook interface.
- No God components that know about everything (data fetching, auth, layout, business rules all in one file).
- No utility files that are just an unrelated grab-bag of static helpers. Group by concept.
- Never expose internal state unnecessarily. Minimize a component's public prop surface.

---

## 3. Documentation

Documentation is not optional. Every public symbol must be documented before moving to the next one.

### What to document
- Every **exported** function, component, and hook.
- Every **module/file** (one-liner at the top describing its purpose).
- Private helpers: a one-liner if the logic is non-obvious.
- Complex algorithms: inline comment explaining the approach and why it was chosen.

### What NOT to document
- Obvious code (`count += 1` does not need `// increment count`).
- The "what" when the name already says it — document the "why" and the non-obvious constraints.

### JavaScript / TypeScript — JSDoc

```typescript
/**
 * Calculate the discounted price after applying a percentage reduction.
 *
 * @param price - The original price in the base currency unit.
 * @param percentage - The discount percentage (0–100).
 * @returns The final price after applying the discount. Always >= 0.
 * @throws {RangeError} If price is negative.
 */
function calculateDiscount(price: number, percentage: number): number {
```

---

## 4. Language Standards

### TypeScript / JavaScript
- **TypeScript strict mode**: `strict: true` in `tsconfig.json`. No exceptions.
- `noImplicitAny: true`, `strictNullChecks: true`, `noUncheckedIndexedAccess: true`.
- **Never use `any`**. Use `unknown` and narrow it with type guards.
- **Never use `as SomeType`** without a comment explaining why it is safe.
- **Formatting**: `Prettier` with project config.
- **Linting**: `ESLint` (flat config) with `typescript-eslint`'s recommended rules plus `eslint-plugin-react` / `eslint-plugin-react-hooks` recommended rules. (Not Airbnb's config — `eslint-config-airbnb-typescript` was archived in 2025 with no flat-config support, so we dropped it rather than build on a dead dependency.)
- Prefer `const` over `let`. Never use `var`.
- Arrow functions for callbacks; named function declarations for module-level functions and components.
- `async/await` over raw `.then()/.catch()` chains.
- Explicit return types on all functions (enforced by ESLint rule `@typescript-eslint/explicit-function-return-type`).
- Named exports preferred over default exports (except for React page/route components).

### CSS / SCSS
- Use TailwindCSS utility classes as the primary styling approach.
- Custom CSS only when Tailwind cannot express the style.
- No hardcoded hex values — use Tailwind's design tokens or project-defined CSS variables.
- No inline `style` attributes for static values (only for truly dynamic values like animation coordinates).

---

## 5. Modularity and File Size

- **One concept per file.** A file that needs "and" in its description should be two files.
- **Hard limit: ~300 lines per file.** When a file approaches this, extract sub-components/hooks.
- Group related files into feature folders. Avoid flat piles of files.
- Expose a clean public API from each feature folder via an index/barrel file. Internal implementation files are not part of the public contract.
- **Circular imports are banned.** Design the dependency graph before writing code. Dependencies flow in one direction.
- Separate concerns into distinct modules:
  - Presentation components (UI only, no data fetching)
  - Hooks (data fetching, derived state, side effects)
  - API/service layer (calls to the backend, one place that knows endpoint shapes)
  - State/store (cross-component state, e.g. current academy context, auth session)
  - Utilities (pure functions with no side effects)

There is no fixed folder-structure prescription here yet — the concrete layout (routing across `www.academy-hub.net` vs `{academy}.academy-hub.net`, how the academy/auth context is provided) is a real architecture decision and will be agreed with the user and recorded in `Document/frontend/architecture.md` before being added here.

---

## 6. High-Performance Habits

- **Code-split by route**: lazy-load route-level components (`React.lazy`/dynamic import) so `www` and academy-subdomain bundles don't ship code the current view doesn't need.
- **Avoid unnecessary re-renders**: memoize expensive computations (`useMemo`) and stable callbacks passed to memoized children (`useCallback`) — but don't reach for these by default, only when profiling shows a real cost.
- **Virtualize long lists**: player rosters, match histories, news feeds — anything that can grow large must be virtualized (e.g. windowing), not rendered in full.
- **Debounce/throttle** expensive handlers (search-as-you-type, resize/scroll listeners).
- **Lazy-load images/media** from the bucket; never block initial render on media that's below the fold.
- **Cache API responses with intent** (e.g. via a data-fetching library): document cache key and invalidation. Cache keys for academy-scoped data must include the current `academy_id`/subdomain — never show cached data from one academy while viewing another.
- **No premature optimization**: profile before optimizing. Write obviously efficient code (avoid clear waste); leave micro-optimization for measured bottlenecks.
- **Pagination always**: any list fetched from the API must use the API's pagination — never fetch-all-then-slice client-side.

---

## 7. Logging

Logging is mandatory. Every non-trivial function must emit log entries that allow tracing its execution without a debugger.

Note: this is a browser SPA, not a Node server — Node-only libraries (`winston`, server-side `pino`) don't run here. Use a thin browser-safe logger wrapper (console-based, gated by environment) and forward errors to an error-reporting service (e.g. Sentry) once one is adopted.

### When to log
- **Significant decisions**: log branches that represent different behavior paths (e.g., "served from cache", "falling back to default academy", "auth redirect").
- **Errors**: log at ERROR level with context before showing a user-facing error state.
- **Operation completion**: log at INFO level when a meaningful operation completes ("login succeeded", "academy switched").
- **Unexpected but recoverable states**: log at WARNING level.

### Log levels — when to use each

| Level | When |
|---|---|
| `DEBUG` | Detailed internal state; render/prop snapshots. Dev/staging only, stripped from production builds. |
| `INFO` | Normal operation milestones. Low-volume. |
| `WARNING` | Unexpected but non-fatal. Needs attention but the UI keeps working. |
| `ERROR` | Failure requiring investigation. Always include context (route, academy, user action). |

### Rules
- **Never use bare `console.log`** left in for diagnostics — use the logger wrapper, and strip DEBUG-level output from production builds.
- **Never log sensitive data**: passwords, tokens, full session cookies, PII.
- **Use structured logging** (an object of fields), not plain concatenated strings.

```typescript
import { logger } from '@/utils/logger';

async function login(credentials: LoginCredentials): Promise<Session> {
    logger.debug('Attempting login', { email: credentials.email });
    try {
        const session = await authApi.login(credentials);
        logger.info('Login succeeded', { userId: session.userId });
        return session;
    } catch (error) {
        logger.error('Login failed', { error });
        throw error;
    }
}
```

---

## 8. Claude Behavioral Rules

These rules override any default behavior when working on this project.

### Scope — Never Add What Was Not Asked For
- NEVER implement a function, component, hook, or feature that was not explicitly requested.
- If a technical necessity requires something beyond the request (e.g. a missing dependency, a required shared component), STOP — explain what is needed and WHY, then wait for approval before writing any code.
- When in doubt: ask first, code second. A short clarifying question costs nothing. Unrequested code wastes context and must be reviewed and potentially reverted.
- Examples of things that require discussion before implementing:
  - Auto-generation logic not mentioned by the user
  - Convenience wrappers around existing components/hooks
  - Any new page/route not agreed with the user
  - Any new dependency not already in `package.json`

### Post-Change Review (mandatory after every logic or flow change)
After completing any logic change, feature addition, or flow refactor, perform a review pass on all touched files before considering the task done:
- Remove dead code: unused imports, unreachable branches, components no longer rendered.
- Remove stale comments: inline comments or JSDoc that describe the old logic.
- Update JSDoc: every exported function/component/hook doc must match the current implementation. If a prop was added, removed, or renamed — update the doc immediately.
- Fix mismatches: if a component's behaviour changed but its name/props still imply the old behaviour, rename it.
- This rule applies even when no one asks — it is not optional.

### Documentation
- ALWAYS write the JSDoc for a function/component/hook before writing the next one. Never defer documentation.
- ALWAYS add a module-level comment to every new file.

### Type Safety
- NEVER use `any`. Use `unknown` + a type guard, or define a proper interface.
- NEVER use `as SomeType` (type assertion) without a comment explaining why it is safe.
- NEVER disable TypeScript or ESLint rules inline without a comment and a `TODO` to remove it.

### Error Handling
- NEVER write an empty `catch` block. Always handle or re-raise with logging.
- NEVER swallow an exception silently. If catching, log at ERROR level and either re-raise, show a user-facing error state, or return a typed error result.
- ALWAYS use specific `Error` subclasses for domain errors, not bare `Error`/`throw` of plain strings.

### Configuration and Secrets
- NEVER hardcode secrets, API URLs, or environment-specific values in source files.
- NEVER commit a `.env` file.
- ALWAYS use environment variables for configuration (set in Railway). Document new variables in `.env.example`.

### Structure and Size
- NEVER produce a file longer than 300 lines. Split it into sub-components/hooks before reaching this limit.
- NEVER put business logic inside a presentation component.
- NEVER call the backend API directly from a presentation component — go through the API/service layer.
- ALWAYS separate concerns: presentation, hooks, API layer, and state live in different modules (see §5).

### Reuse
- ALWAYS search the codebase for an existing component/hook/utility before creating a new one.
- NEVER duplicate logic. Extract it into a shared hook or module.
- PREFER extending or composing existing components over copy-pasting and modifying.

### Logging
- ALWAYS log significant decisions and all errors via the logger wrapper (see §7).
- NEVER leave bare `console.log` calls in for diagnostics.
- NEVER log sensitive data.

### Process
- When requirements are ambiguous: ASK before writing code, not after.
- When fixing a bug: write a comment explaining WHY the fix works — not just what changed.
- When a file is getting long: split it immediately, do not wait for it to become a problem.
- When adding a dependency: justify the addition and check if existing dependencies already solve it.

### Living Documentation (ALWAYS keep up to date)
After every frontend development session, update these files if anything changed:
- `Document/frontend/architecture.md` — update when: new feature added, new shared component created, new path alias, new library added, state management pattern changed, routing across `www`/academy subdomains changes.
- `Document/frontend/railway-deployment.md` — update when: new env variable added, Railway build/start settings change, new troubleshooting case found. (There is no local dev environment for this project — everything runs on Railway — so this file covers setup end-to-end, not just deployment.)

Rule: **never** finish a frontend task without checking if either of these files needs updating.

---

## Quick-Reference Checklist

Use this for every new function, component, or module added.

### New function / hook
- [ ] Name is a clear verb phrase describing what it does (hooks prefixed `use`)
- [ ] Single responsibility — does one thing
- [ ] Explicit return type
- [ ] JSDoc written with `@param`, `@returns`, `@throws`
- [ ] No sensitive data logged
- [ ] No hardcoded values — uses constants or environment variables
- [ ] Handles errors explicitly (no empty catch)
- [ ] ≤ 30 lines — if longer, extracted into sub-functions/hooks

### New component
- [ ] Name is a clear noun describing the concept
- [ ] Single responsibility — one reason to change
- [ ] Dependencies (API client, context) consumed via props/hooks, not instantiated inline
- [ ] Public prop interface is minimal — only what callers need
- [ ] Component doc comment written
- [ ] No direct API calls — goes through the API/service layer

### New file / module
- [ ] Module-level comment at the top
- [ ] One concept per file
- [ ] Placed in the correct feature folder
- [ ] ≤ 300 lines — if more, split before finalizing
- [ ] Public API exported from a barrel/index file if part of a feature folder
- [ ] No circular import introduced

---

*This file governs HOW code is written in `academy-hub-frontend`. Architecture, routing design, and
deployment configuration live in `Document/frontend/`.*

*Last updated: 2026-09-06.*

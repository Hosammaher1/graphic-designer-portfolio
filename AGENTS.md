# Portfolio Agent Instructions

## Project Scope
Read `Graphic_Designer_Portfolio_Plan_v1_1.md`, `docs/PLAN_AUDIT.md`, `docs/AGENT_HANDOFF.md`, `docs/DECISIONS.md`, and `docs/PROGRESS.md` before continuing development.

The approved plan contains 108 tasks across 10 phases, including the approved Hybrid Single-Page Experience Redesign (Phase 10: Tasks 10.01–10.11). Execute all remaining tasks sequentially, starting from the first genuinely incomplete task. Never repeat completed work.

The approved public architecture is:
- ONE continuous, immersive, scroll-driven homepage (Hero, Selected Work, About, Skills & Expertise, Creative Journey, Contact).
- Separate dynamic, SEO-friendly project detail pages (`/:locale/projects/:slug`).
- Independent admin dashboard (`/admin/*`).
- Existing Laravel backend, database, APIs, authentication, and content management remain intact.

## Autonomous Execution
- Continue implementing tasks without stopping between them.
- Use a dedicated feature branch for each task.
- Inspect Git state and existing code before making changes.
- Discover, evaluate, and use relevant available skills in `.agents/skills/` and system catalogs.
- Resolve routine technical and design decisions independently.
- Ask the owner only for material product decisions or required credentials.

## Git Workflow
- Commit and push completed tasks to their feature branches.
- Merge passing feature branches into `dev` and push `dev`.
- Never force-push.
- Never merge or push to `main` without explicit approval.
- Never deploy without explicit approval.
- Follow configured CLI permissions. Do not bypass security approval prompts.

## Testing & Visual Verification Strategy
- After each task: run only essential lightweight and targeted checks.
- For UI/motion tasks: open the actual website in a browser via Playwright, inspect desktop and mobile behavior, verify visible motion, and capture screenshots.
- After each phase: run comprehensive phase regression tests.
- After all phases: run the full backend, frontend, and E2E regression suites.
- Fix test failures before marking affected work as verified.
- Never report tests as passed unless actually executed successfully.

## Progress Documentation
After EVERY completed task, update `docs/PROGRESS.md` using the same detailed format as Task 02.08.

Include:
- Task ID, title, and status
- Branch, actual commit hash, and remote
- Files created and modified
- Features and API endpoints implemented
- Tests executed and actual results
- Browser verification and visual motion observed
- Issues encountered and fixes applied

Keep `docs/AGENT_HANDOFF.md` updated with the latest checkpoint.

## Security
- Never commit secrets, tokens, or `.env` files.
- Never enable unrestricted command execution.
- Preserve the approved technology stack and product scope.
- Do not introduce paid services without approval.

## Completion
Continue through all 108 tasks, respecting dependencies and phase gates. Report final implementation status, test results, and remaining deployment requirements.

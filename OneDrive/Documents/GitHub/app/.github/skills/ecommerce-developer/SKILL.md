---
name: ecommerce-developer
user-invocable: true
description: |
  **WORKFLOW SKILL — E-commerce website developer**
  A compact, reusable workflow for implementing, reviewing, and releasing common e-commerce features (products, cart/checkout, orders, admin, pincode/shipping, pricing, and integrations). Use this skill inside a repository to standardize steps, checks, and prompts that speed development and reduce regressions.
  Use when: adding or changing product models, admin APIs, checkout flow, or deploying environment secrets for e-commerce features.
---

# E-commerce Developer Skill

## Purpose

This skill captures a repeatable, checklist-driven approach for building and shipping features for e-commerce webapps. It is intended to be used in a project workspace (repo-scoped) and to guide the agent and developer through design, implementation, testing, and deployment-ready tasks.

## When to use
- Adding or editing product/catalog APIs, admin panels, or product editors
- Implementing or debugging orders, payments, shipping, inventory logic
- Preparing environment variables and deployment instructions for hosts
- Auditing feature readiness for production (tests, security, performance, SEO)

## Workflow Steps

1. Scoping & Safety
   - Confirm feature goal and acceptance criteria.
   - Identify data models affected (products, orders, users, inventory).
   - Decide whether database migrations or backfills are required.

2. Design & API Contract
   - Draft minimal request/response shapes for APIs and UI props.
   - Add or update OpenAPI/REST examples or tests for contract clarity.

3. Implement
   - Modify backend routes/functions and frontend components together where needed.
   - Follow existing repository conventions (naming, patterns).

4. Local Dev & Env
   - Add necessary environment variable keys to `.env.local.example` and document in `ADMIN_SETUP.md` or README.
   - If the feature requires external services (payments, email, DB), provide local fallbacks or clear dev instructions.

5. Tests
   - Add unit tests for core logic (price calculations, tax, shipping rules).
   - Add integration tests for API endpoints (mock external services when possible).

6. Accessibility & UX
   - Ensure product forms, carts, and admin tables are keyboard accessible and labeled.
   - Validate images have alt text and that forms have client-side validation.

7. Security Checks
   - Protect admin routes with token/auth checks and validate headers.
   - Avoid logging secrets. Ensure `.env.local` is in `.gitignore`.

8. Performance & SEO
   - Confirm product pages have proper metadata (title, description, structured data) and images are optimized.
   - Verify API endpoints are paginated and caches are used where appropriate.

9. Deployment Prep
   - Add environment variable setup instructions for common hosts (Vercel, Netlify, Render) and include sample `curl` tests.
   - Document rollback steps and backup plans for DB migrations.

10. Release & Monitor
   - After deploy, validate critical flows (login/admin, create product, place order) and watch logs for errors.

## Decision Points
- DB migration required? If yes → create migration + data migration plan.
- External service needed? Mock locally and document prod credentials required.
- Backwards-compatible? If not, schedule maintenance window and migration script.

## Quality Criteria / Done Checks
- Feature implements acceptance criteria and matches API contracts.
- Unit & integration tests added and pass locally.
- Linting and formatting pass; commit contains meaningful message.
- Admin UI protected and env vars documented; `.env.local` is ignored.
- Product pages have metadata for SEO and basic accessibility checks pass.

## Common Commands / Snippets
- Add env example entry (append to `.env.local.example`):
```
# Payment provider key
PAYMENT_KEY=your_test_key_here
```
- Quick curl check for admin login (example)
```
curl -s -X POST https://YOUR_HOST/api/admin/login -H "Content-Type: application/json" -d '{"password":"admin123"}' | jq
```

## Example Prompts (use with workspace open)
- "Add a POST `/api/admin/products` endpoint that validates input and inserts into `products` collection — follow repo conventions and add unit tests."
- "Audit the admin panel for missing auth checks and suggest minimal fixes to prevent unauthorized access." 
- "Prepare `ADMIN_SETUP.md` with variables and curl tests for Vercel and Netlify."

## Template Checklist (copy into PR description)
- [ ] Acceptance criteria documented
- [ ] Backend API implemented and unit-tested
- [ ] Frontend UI added/updated and smoke-tested
- [ ] `.env.local.example` updated and README notes added
- [ ] Admin routes protected and tested
- [ ] Accessibility quick checks performed
- [ ] Deployed to staging and basic flows validated

## Iteration Guidance
1. After first draft, run the repository tests and linters. 2. If unclear areas remain (data model, external APIs), ask for clarification: "Should the product `colors` be an array or comma-separated string in the DB?" 3. When ready, prepare a small PR (focused, single-responsibility) and attach the checklist above.

## Suggested Follow-ups / Related Skills
- `release-checklist` skill — automates release verification steps.
- `db-migrations` skill — encapsulates migration templates and rollback strategies.

---
**Output:** Saves `SKILL.md` to `.github/skills/ecommerce-developer/SKILL.md` and provides example PR checklist and prompts for the user to try.

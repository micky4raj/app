---
name: convergent-vercel
user-invocable: true
description: |
  **WORKFLOW SKILL — Deploy and verify on Convergent & Vercel**
  A workspace-scoped skill that captures the repeatable steps, decision points and checks for preparing, deploying and validating a Next.js (or similar) webapp to Convergent-hosted infrastructure and to Vercel. Use this when you need a deterministic deploy flow, environment setup, or a rollback-ready deployment checklist.
---

# Convergent & Vercel Deploy Skill

## Purpose

Provide a single, repo-scoped workflow for preparing code, managing secrets, deploying to Convergent and Vercel, and validating post-deploy behavior with minimal manual steps.

## Scope / When to use
- Finalizing a release to staging or production on Convergent and/or Vercel.
- Migrating environment variables or build/runtime settings between hosts.
- Troubleshooting build/runtime differences between platforms.

## High-level Flow

1. Prepare branch
   - Target a release branch (e.g., `main` or `release/*`). Ensure all tests pass locally.
   - Rebase or merge latest `main` to include fixes.

2. Ensure environment parity
   - Add any new env keys to `.env.local.example` and to Convergent/Vercel environment settings.
   - Confirm runtime mode (server, edge, static) matches code assumptions (Next.js app router vs pages).

3. Build checks locally
   - Run `npm run build` and `npm run lint` locally. Fix failures before deploying.

4. Deploy to staging (preview)
   - Vercel: Push branch or create a PR — Vercel will create a Preview deployment. Use `vercel` CLI if needed.
   - Convergent: Follow your Convergent pipeline (CI/CD job or push to specific branch) to create a staging deploy.

5. Smoke tests and health checks
   - Verify home page, product page, admin login and API endpoints.
   - Use curl smoke tests, Lighthouse spot checks, and confirm logs/metrics show no errors.

6. Promote to production
   - Merge PR into `main` and let CI/CD deploy, or manually trigger the production deploy in the host dashboards.

7. Post-deploy verification
   - Run end-to-end checks: login as admin, create product, place test order (use test gateway), check webhook flows.
   - Monitor logs, APM, and error tracking for 15–30 minutes.

8. Rollback plan
   - If failures occur, revert `main` to previous commit and re-deploy, or use the host's rollback UI to restore the last successful deployment.

## Decision Points
- Which host for which environment? Use Vercel for public frontend with SSR/ISR; use Convergent for backend services or if edge networking and private VPC are required.
- Build-time secrets: prefer injecting via host environment variables, not in code or build artifacts.
- Runtime: serverless vs persistent instances — choose per API latency and cold-start sensitivity.

## Required Checks (Pre-deploy)
- Local `npm run build` exits 0.
- Lint and unit tests pass.
- `.env.local.example` updated + documented.
- Secrets are added to Vercel Environment and Convergent Secrets manager.

## Post-deploy Acceptance Criteria
- Production homepage returns 200 and critical API endpoints return 200 within expected latency.
- Admin login and API auth routes function and return expected payloads.
- No 5xx errors in logs for 30 minutes after release.

## Commands & Snippets
- Local build & lint
```bash
npm ci
npm run build
npm run lint
```
- Vercel quick deploy (CLI)
```bash
npm i -g vercel
vercel --prod
```
- Curl smoke test examples
```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}\n" https://your-site.example/
curl -s -X POST https://your-site.example/api/admin/login -H 'Content-Type: application/json' -d '{"password":"admin123"}'
```

## Host-specific notes

Vercel
- Use the Project Settings → Environment Variables to add `MONGODB_URI`, `ADMIN_PASSWORD`, and any API keys.
- For Next.js app router, ensure server components are handled by the `node` runtime; set `VERCEL_BUILDER` if needed.
- Configure rewrites/redirects in `vercel.json` or `next.config.js` if you rely on custom API paths.

Convergent
- Follow your internal Convergent docs for secret injection and VPC egress rules.
- Ensure DNS and domain provisioning for the production hostname are present before promotion.

## Troubleshooting
- Build fails on host but works locally: check Node.js version, install flags, and `NODE_OPTIONS` in host. Match local engine in `package.json` to host runtime.
- SRV/DNS errors to external services: verify host egress rules and DNS resolver settings in Convergent.

## Example Prompts
- "Prepare a Vercel deployment checklist for this repo and add `vercel.json` rewrite rules for `/api` → `/api/*`."
- "Compare Next.js runtime assumptions in this repo and recommend Vercel runtime settings and Convergent egress rules." 

---
Output: writes `.github/skills/convergent-vercel/SKILL.md` in the repo with deploy workflow, checks and example prompts.

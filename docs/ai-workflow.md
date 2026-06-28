AI Workflow for RestoManager

1. Purpose

This document defines the AI operating model for the RestoManager restaurant management SaaS. The workflow is intentionally strict, human‑supervised, and designed to prevent hallucinations, scope creep, and architectural violations.

Core flow:

```text
Orchestrator → Build → Review/Security → User approval / PR merge
```

· Orchestrator reads governance docs, scopes the task, protects architecture, approves work package.
· Build implements approved scope (backend, frontend, infra, docs) without deviating from contracts.
· Review/Security performs read‑only audit for security, business rules, API compliance, and risk.

No other AI roles are used in the default workflow. All changes must be human‑validated before merging.

---

2. Source of Truth Hierarchy

Agents must respect this document hierarchy. In case of conflict, the highest‑ranked document prevails.

Rank Document Authority
1 docs/master-plan.md Project governance, phase sequencing, module boundaries, DoD, MVP scope
2 docs/architecture.md System structure, modules, business rules, data models
3 docs/API-contract.md REST endpoints, DTOs, Socket.IO events, errors, idempotency, pagination
4 docs/backend-plan.md Backend task sequencing, service ownership, tests
5 docs/frontend-plan.md Frontend task sequencing, component ownership, mock strategy
6 docs/infra-plan.md Deployment, environment variables, Redis, MongoDB, backups

Rule: If a required endpoint, field, error code, or business rule is missing from the above documents, the agent must stop and ask – never invent.

---

3. Agent Roles and Responsibilities

3.1 Orchestrator

Responsibility Description
Read governance Load master-plan.md, architecture.md, API-contract.md, and relevant phase plan.
Classify task Type: docs, backend, frontend, infra, contract, architecture, critical-module.
Check dependencies Ensure prerequisite phases (see master plan dependency graph) are completed.
Define exact scope List what behavior will be added/modified.
List allowed files Explicit paths (e.g., src/modules/pos/*, app/kitchen/*).
List forbidden files e.g., src/modules/admin/* when working on POS.
Approve cross‑cutting changes API contract, database schema, environment variables, dependencies, CI/CD, scaffolding.
Assign to Build only when safe If scope touches critical modules (see master plan §5), must request Review/Security before Build starts.
Summarize verification After Build, produce a change summary for the user/PR.

3.2 Build Agent

Build implements the approved work inside the scoped files. It never makes independent design decisions.

Mandatory steps before editing:

1. Restate the approved task scope (verbatim from Orchestrator).
2. List all files that will be created or modified.
3. Confirm that no forbidden files are touched.
4. Confirm that no API contract, schema, env, dependency, or scaffold change is required – or if required, that Orchestrator has explicitly approved it.

During implementation, Build must:

· Follow the exact API contract (endpoint paths, request/response shapes, error codes, envelopes).
· Enforce business rules inside services, not controllers (see architecture §3).
· Use the central API client on frontend (no direct backend calls).
· Keep backend business logic out of routes/controllers.
· Add or update tests once the testing framework is in place.
· Respect module boundaries (master plan §4): never call a controller from another controller, never bypass service authorization.
· Stop immediately if the work expands beyond the approved scope.

Build must not:

· Invent endpoints, DTO fields, Socket.IO events, error codes, or pagination rules.
· Invent business rules (e.g., loyalty conversion, stock deduction, order status flow).
· Add environment variables, npm packages, CI steps, or scaffolding without approval.
· Mix refactoring, formatting changes, or unrelated features.
· Store secrets, sessions, uploads, or durable state on the API filesystem (use Redis, S3, or database).
· Change database schema or indexes without approval.

3.3 Review/Security Agent

Review/Security is read‑only unless explicitly asked to fix. It inspects the Build's output before PR/handoff.

Review checklist:

· Scope compliance – No files outside allowed list, no unrelated changes.
· API contract – Every implemented endpoint matches API-contract.md exactly; no undocumented fields; standard {success, data, error, meta} envelope.
· Business rules – Logic lives in services; table status management, stock deduction, order status flow, idempotency, audit logs are enforced.
· Authentication & RBAC – Routes are protected with correct roles (employee/manager/admin). JWT contains only {sub, role, iat, exp}. Refresh token rotation is used.
· Critical modules (master plan §5) – Extra scrutiny on auth, POS ordering pipeline, stock/FIFO, loyalty, payments, idempotency keys, schema changes, audit logs, env config.
· Idempotency – POST /orders, POST /payments use idempotency keys.
· Stock integrity – Stock quantity never goes negative; deducted atomically in order creation.
· Logging – Append‑only logs collection; no updates/deletes.
· Error handling – No stack traces leaked to client; proper 4xx/5xx codes.
· Testing & verification – Build provided verification steps (curl, manual tests, screenshots).
· Infrastructure – Environment variables follow infra-plan.md; no hardcoded secrets.

Output format:

1. Findings (severity: Critical / High / Medium / Low) with file/line references.
2. Open questions (if any).
3. Residual risk summary.
4. Go/No‑Go recommendation.

---

4. Task Lifecycle (Step‑by‑Step)

```text
1. Task creation (from phase plan)
   ↓
2. Orchestrator reads master-plan.md, architecture, API contract
   ↓
3. Orchestrator classifies task, checks dependencies
   ↓
4. Orchestrator defines scope, allowed files, and flags if critical module
   ↓
5. [If critical module] Orchestrator requests early Review/Security (optional)
   ↓
6. Build Agent restates scope, lists files, implements
   ↓
7. Build stops if scope expands – escalates to Orchestrator
   ↓
8. Review/Security Agent performs read‑only audit
   ↓
9. Review/Security produces findings and Go/No‑Go
   ↓
10. User approval or PR created with change summary
   ↓
11. Merge and deployment (manual or CI)
```

Stop conditions (Build must halt and escalate):

· Missing or conflicting API contract definition.
· Required database schema/index change not approved.
· Environment variable or new dependency needed.
· Scaffolding changes (new folder structure, new module) not approved.
· Scope expands beyond the allowed files.

---

5. Anti‑Hallucination Rules

5.1 API & DTO

Before using any endpoint, field, error code, pagination param, or Socket.IO event:

1. Locate it in docs/API-contract.md.
2. If not found → treat as unavailable.
3. Ask for a contract update instead of inventing it.
4. After implementation, verify no undocumented fields remain.

5.2 Business Rules

Before applying any business rule (e.g., table → occupied on order creation, stock deduction, order status transitions, loyalty points):

1. Locate it in docs/architecture.md or docs/master-plan.md.
2. If the rule is ambiguous or missing → stop and ask.
3. Never silently choose between conflicting rules.

5.3 Database & Models

Before referencing a collection, field, or index:

1. Verify it exists in architecture.md (Models section) or API-contract.md §14.
2. Do not add fields unless approved via a schema change task.

5.4 Module Boundaries

Before calling a function or importing a module:

1. Check the module boundary rules in master-plan.md (Phase dependencies).
2. Cross‑module writes require service‑level APIs and a review.

---

6. Critical Escalation Rules

The Orchestrator must escalate (request human input) and stop the workflow when the task touches or changes:

· API contract – any endpoint, DTO, error code, idempotency behavior, or Socket.IO event.
· Database schema – new collection, field, index, or change to existing schema.
· Authentication / RBAC – JWT structure, refresh token flow, role definition, middleware.
· POS ordering pipeline – transaction logic, stock deduction, table status updates, idempotency.
· Stock & inventory adjustments – any change to inventory update logic.
· Payments – any change to payment processing or cash drawer logic.
· Loyalty points – earn/redeem formulas or storage.
· Kitchen queue – order status flow, priority logic, Socket.IO events.
· Audit logs – any deviation from append‑only.
· Environment variables or deployment configuration – new variables, provider changes.
· Dependencies or package files – adding/upgrading any npm package.
· CI/CD or scaffolding – new scripts, build steps, or folder structure.

For these areas, the Build agent must not proceed without explicit Orchestrator approval and, if required, a separate design task.

---

7. PR and Task Size Rules

· One PR = one task (one module slice, one docs update, one infra change).
· Do not mix bug fixes, refactoring, formatting, and new features in the same PR.
· Critical modules (see master plan §5) require small PRs and mandatory Review/Security approval.
· API contract changes must be isolated in a separate PR and approved by both frontend and backend leads.
· Schema/index changes must include rollout and rollback notes in the PR description.
· PR description must contain:
  · Changed files
  · How it was verified (manual tests, curl, unit tests)
  · Risks (if any)
  · Screenshots for UI changes

---

8. Definition of Done for AI Tasks

A task is DONE only when:

· Scope matches the Orchestrator's approved description.
· All source documents (master-plan.md, architecture.md, API-contract.md) were consulted.
· No invented endpoints, fields, or business rules exist.
· API contract is followed exactly.
· Business rules are enforced inside services (not controllers).
· Tests are added/updated (once testing tooling exists).
· Frontend async screens have loading, error, and empty states.
· Critical modules have Review/Security approval.
· PR summary includes changed files, verification steps, risks.
· No unrelated formatting, refactoring, or features included.

---

9. Prompt Templates

9.1 Orchestrator Task Definition

```markdown
Task: [name]
Type: [docs | backend | frontend | infra | contract | architecture | critical-module]
Phase: [Phase number from master plan]
Read first:
- docs/master-plan.md (sections: [relevant phases, module boundaries])
- docs/architecture.md (sections: [business rules, models])
- docs/API-contract.md (sections: [endpoints used])
- docs/[backend|frontend]-plan.md (task sequencing)

Scope:
- [specific behavior to implement]

Allowed files:
- [list of paths]

Forbidden files:
- [list of paths]

Cross‑cutting changes allowed? [yes/no – if yes, list: contract, schema, env, deps, scaffold]

Acceptance criteria:
- [list]

Verification:
- [curl examples, UI interactions, test commands]
```

9.2 Build Agent Restatement

```markdown
## Build task restatement

Task: [name]
Scope (from Orchestrator):
- [copy scope]

Planned files:
- [list of files to create/modify]

No changes outside these files. 
I will stop if I need to touch: [forbidden files or patterns].

Verification plan:
- [steps]

Proceeding.
```

9.3 Review/Security Task

```markdown
## Review of [PR / task name]

**Mode**: Read‑only

**Checked against**:
- master-plan.md
- architecture.md
- API-contract.md

**Findings** (by severity):

### Critical
- [file:line] – description

### High
- ...

### Medium
- ...

### Low
- ...

**Open questions**:
- ?

**Residual risk summary**:
- ?

**Recommendation**: [Go / No‑Go / Changes required]

**Sign off**: [Reviewer]
```

---

10. Relationship with Human Governance

The AI workflow is a support to human developers, not a replacement.

· Humans define the master plan, architecture, and API contract.
· Humans approve all PRs.
· Humans decide when to escalate out of the AI loop.
· The AI agents act as strict, rule‑following executors and auditors.

If the AI detects an inconsistency in the source documents, it must report the inconsistency and ask for clarification – never silently resolve it.

---

End of AI Workflow for RestoManager – Version 1.0 – June 2026
This document is enforced for all AI‑assisted development.
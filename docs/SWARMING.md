# Multi-agent coordination and swarming playbook

This playbook defines operational protocols for external orchestrators and parallel coding agents working across the three applications in this repository.

## 1. Isolation with git worktrees

Because this repository does not use a root monorepo manager, parallel agents working on separate apps should operate in distinct git worktrees to prevent workspace lock contention.

### Creating worktrees

```bash
# Worktree for storefront agent
git worktree add ../infit-storefront -b feat/storefront-enhancements

# Worktree for backend agent
git worktree add ../infit-backend -b feat/backend-enhancements

# Worktree for admin agent
git worktree add ../infit-admin -b feat/admin-enhancements
```

### Removing worktrees

```bash
git worktree remove ../infit-storefront
git worktree remove ../infit-backend
git worktree remove ../infit-admin
```

---

## 2. Branch naming conventions

Branch names must follow a standard prefix convention:

- `feat/frontend-<description>`: Changes scoped to `frontend/`.
- `feat/backend-<description>`: Changes scoped to `backend/`.
- `feat/admin-<description>`: Changes scoped to `admin/`.
- `fix/<app>-<description>`: Bug fixes targeting a specific app.
- `chore/infra-<description>`: Changes to CI, `render.yaml`, or root documentation.

---

## 3. Ownership matrix

To prevent merge conflicts and schema divergence, agents must respect app boundaries.

| Path | Primary owner | Rules and constraints |
|---|---|---|
| `frontend/` | Storefront agent | Uses vanilla CSS variables only. No Tailwind. Do not modify `backend/` or `admin/`. |
| `backend/` | Backend agent | Must maintain Zod schema backwards compatibility with `frontend/src/lib/constants.ts`. |
| `admin/` | Admin agent | Uses Tailwind CSS v4. Must not import from `frontend/` or `backend/` directly. |
| `docs/` | Orchestrator | Updates architecture records and task progress. |
| `.github/` | Orchestrator | Shared CI pipeline. Edits must be verified against all three jobs. |

---

## 4. Merge ordering protocol

When a planned feature spans both the data producer (backend) and consumers (frontend or admin), follow this merge order:

1. **Step 1 (Backend first)**: Implement and merge the backend schema changes or new API endpoints. Run `npm run smoke` to confirm backwards compatibility.
2. **Step 2 (Data snapshot update)**: Update the mirror `SNAPSHOT_PRODUCTS` array in `frontend/src/lib/constants.ts` to reflect any new fields.
3. **Step 3 (Consumer integration)**: Implement storefront or admin features that consume the updated contract.
4. **Step 4 (Verification)**: Ensure both `frontend` and `admin` production builds succeed against the updated snapshot.

---

## 5. Handoff protocol between agents

When an agent completes an assigned task, it must produce a structured handoff note before delegating to the next agent:

1. **Summary of changes**: Explicit list of modified, added, and deleted files.
2. **Contract modifications**: Any adjustments made to the shared `Product` type or Zod schemas.
3. **Validation commands executed**: Command line strings and exit statuses (`npm run build`, `npm run lint`).
4. **Remaining tasks**: Unresolved items or prerequisites required for the subsequent workstream.

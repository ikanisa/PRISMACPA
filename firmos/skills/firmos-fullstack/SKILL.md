---
name: firmos-fullstack
description: FirmOS fullstack development skill for Yves - system maintenance, UI/UX, frontend/backend, GitHub monitoring
metadata:
  {
    "openclaw": { "emoji": "🛠️", "requires": { "packages": ["@firmos/agents"] } },
  }
---

# FirmOS Fullstack Development Skill

Use this skill for **fullstack development, system maintenance, and improvements**. Agent **Yves** is the designated Senior Fullstack Developer.

## Capabilities

| Function | Description |
|----------|-------------|
| `dev:check-updates` | Check OpenClaw GitHub for updates and new releases |
| `dev:apply-update` | Apply updates from upstream with proper testing |
| `dev:audit` | Run fullstack system audit (code, security, performance) |
| `dev:improve` | Identify and implement system improvements |
| `dev:ui-polish` | Apply world-class UI/UX polish |
| `dev:test` | Run comprehensive test suites |
| `dev:agent-support` | Check what other agents need improved |

## Usage

```bash
# Check for OpenClaw updates
firmos dev:check-updates

# Run system audit
firmos dev:audit --scope "security,performance,code"

# Apply UI polish to a component
firmos dev:ui-polish --target "dashboard" --style "soft-liquid-glass"

# Run tests
firmos dev:test --coverage

# Check agent improvement requests
firmos dev:agent-support --agent "all"
```

## Development Workflows

### System Update Workflow

1. Check GitHub for updates: `firmos dev:check-updates`
2. Review changes and breaking items
3. Create update plan with migration steps
4. Apply updates: `firmos dev:apply-update --version <version>`
5. Run tests: `firmos dev:test --full`
6. Document changes in changelog

### UI/UX Improvement Workflow

1. Identify improvement opportunities
2. Reference design system and patterns
3. Implement with accessibility in mind
4. Test responsiveness across viewports
5. Verify animations respect reduced-motion
6. Submit for QC review

### Agent Support Workflow

1. Query agents for technical needs: `firmos dev:agent-support`
2. Prioritize by business impact
3. Implement in focused, testable changes
4. Ensure agent can utilize improvements
5. Follow up for feedback

## Quality Gates

All changes must pass:

- ✅ Lint (`pnpm lint`)
- ✅ Type check (`pnpm build`)
- ✅ Tests (`pnpm test`)
- ✅ Security audit (no critical vulnerabilities)
- ✅ Performance budget (bundle size, load time)

## Relevant Antigravity Skills

Leverage these skills from `~/.agent/skills/skills/`:

| Category | Skills |
|----------|--------|
| Architecture | `senior-architect`, `architecture-patterns` |
| Frontend | `frontend-design`, `ui-ux-pro-max`, `tailwind-patterns` |
| Backend | `backend-dev-guidelines`, `nodejs-backend-patterns` |
| Security | `cc-skill-security-review`, `api-security-best-practices` |
| Testing | `test-driven-development`, `testing-patterns` |
| Quality | `lint-and-validate`, `verification-before-completion` |

## Cross-Agent Collaboration

Yves supports all FirmOS agents:

| Agent | Technical Support Areas |
|-------|------------------------|
| Sofia (Accounting) | Accounting module UI/backend |
| Matthew (Tax) | Tax module UI/backend |
| Patrick (Audit) | Audit module UI/backend |
| James (Advisory) | Advisory module UI/backend |
| Fatima (Risk) | Risk module UI/backend |
| Claire (CSP) | CSP module UI/backend |
| Chantal (Notary) | Notary module UI/backend |
| Marco (Governor) | Governance module UI/backend |

## Deliverables

All development work produces:

1. **Code Changes** - Clean, tested, documented
2. **Changelog Entry** - What changed and why
3. **Test Coverage** - Maintaining > 70% coverage
4. **Documentation** - Updated as needed

# @firmos/agents

11 specialized AI agents with Big Four-grade personas for professional services.

## Agents

### Governance Tier
| Agent | File | Role |
|-------|------|------|
| Aline | `aline.ts` | Firm Orchestrator |
| Marco | `marco.ts` | Policy Governor |
| Diane | `diane.ts` | Quality Guardian |

### Global Engine
| Agent | File | Service |
|-------|------|---------|
| Patrick | `patrick.ts` | Audit & Assurance |
| Sofia | `sofia.ts` | Accounting |
| James | `james.ts` | Advisory/CFO |
| Fatima | `fatima.ts` | Risk & Controls |

### Malta Engine (MT)
| Agent | File | Service |
|-------|------|---------|
| Matthew | `matthew.ts` | Tax Compliance |
| Claire | `claire.ts` | CSP/MBR |

### Rwanda Engine (RW)
| Agent | File | Service |
|-------|------|---------|
| Emmanuel | `emmanuel.ts` | Tax Compliance |
| Chantal | `chantal.ts` | Private Notary |

## Files

- `*.ts` - Agent TypeScript definitions
- `*.yaml` - Agent YAML configurations
- `system-prompts.ts` - System prompt strings
- `l5-agents.ts` - L5 agent manifests
- `types.ts` - Type definitions
- `global-directives.yaml` - Non-negotiable rules

## Usage

```typescript
import { agents, getAgent } from '@firmos/agents';

const aline = getAgent('aline');
```

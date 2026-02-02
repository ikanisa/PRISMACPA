# FirmOS Governance

> **Version**: 1.0  
> **Last Updated**: 2026-02-02

## Governance Agents

### Marco — Governor
**Role**: Policy enforcement, release authorization, escalation handling.

**Responsibilities**:
- Authorize all external releases
- Enforce pack separation rules
- Handle escalations from service agents
- Manage release rollbacks

**Decision Flow**:
```
Request → QC Pass Check → Pack Validation → Authorize/Deny → Execute
```

### Diane — Guardian
**Role**: Quality control, evidence validation, compliance checks.

**Responsibilities**:
- Run QC gates before release
- Validate evidence completeness
- Check pack boundary compliance
- Score novelty of outputs

**QC Checks**:
| Check | Description |
|-------|-------------|
| Evidence Coverage | All required evidence types referenced |
| Pack Boundary | Outputs stay within authorized packs |
| Output Completeness | Required outputs present |
| Task Validation | Task structure matches schema |

## Universal Gates

| Gate | Trigger | Enforced By |
|------|---------|-------------|
| GATE_G1 | External submission | Marco |
| GATE_G2 | Cross-pack transfer | Marco |
| GATE_G3 | Novel template creation | Diane → Marco |
| GATE_G4 | Data export | Marco |

## Escalation Rules

### Automatic Escalation Triggers
- Novelty score > 0.7
- Missing evidence > 2 items
- Pack boundary violation
- QC gate failure (critical severity)
- Operator override request

### Escalation Path
```
Service Agent → Diane (QC review) → Marco (policy decision) → Operator (final authority)
```

## Pack Separation Rules

### Malta Pack (`MT_*`)
- Only accessible by: Aline, Marco, Diane, Matthew, Claire
- Contains: Malta tax, CSP/MBR procedures
- Isolation: Cannot access Rwanda data

### Rwanda Pack (`RW_*`)
- Only accessible by: Aline, Marco, Diane, Emmanuel, Chantal
- Contains: Rwanda tax, private notary procedures
- Isolation: Cannot access Malta data

### Global Pack
- Accessible by all agents
- Contains: Cross-jurisdiction templates, shared policies

## Release Workflow

1. **Request**: Agent submits release request
2. **QC Gate**: Diane runs quality checks
3. **Pack Validation**: Verify pack access rights
4. **Authorization**: Marco approves/denies
5. **Execution**: Release action performed
6. **Audit**: Decision logged with evidence

## Rollback Procedure

1. Marco initiates rollback
2. Previous state restored
3. Incident logged
4. Root cause analysis triggered

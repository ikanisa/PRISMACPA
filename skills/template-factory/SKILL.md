---
name: template-factory
description: FirmOS template factory - generates, manages, and version-controls document templates
metadata:
  {
    "openclaw": { "emoji": "📋", "requires": { "packages": ["@firmos/agents", "@firmos/templates"] } },
  }
---

# Template Factory Skill

This skill manages **document templates** for FirmOS agents. It generates, versions, and maintains templates for all deliverables.

## Capabilities

| Function | Description |
|----------|-------------|
| `template:list` | List available templates |
| `template:get` | Get template by ID |
| `template:generate` | Generate document from template |
| `template:create` | Create new template |
| `template:update` | Update existing template |
| `template:validate` | Validate template against schema |

## Usage

```typescript
// List available templates
firmos template:list --category "Tax" --jurisdiction "MT"

// Generate document from template
firmos template:generate --template "vat-return-mt" --client "ClientCo Ltd" --period "Q1-2025"

// Create custom template
firmos template:create --name "engagement-letter" --category "Advisory" --base "letter-template"

// Validate template
firmos template:validate --template "audit-report" --schema "ISA-700"
```

## Template Categories

| Category | Templates | Primary Agent |
|----------|-----------|---------------|
| **Tax** | VAT returns, CIT filings, WHT forms | Matthew |
| **Accounting** | Trial balance, FS templates, JE forms | Sofia |
| **Audit** | Engagement letters, audit reports, WP templates | Patrick |
| **Advisory** | Valuation reports, DD checklists, CFO dashboards | James |
| **Risk** | Risk registers, control matrices, SOC reports | Fatima |
| **CSP** | MBR filings, director forms, UBO declarations | Claire |
| **Notary** | RDB filings, notarial certificates, resolutions | Chantal |
| **Governance** | QC checklists, ethics declarations, independence forms | Marco |

## Malta Templates

| Template ID | Description | Frequency |
|-------------|-------------|-----------|
| `vat-return-mt` | Malta VAT Return | Quarterly |
| `cit-return-mt` | Corporate Income Tax Return | Annual |
| `annual-return-mbr` | MBR Annual Return | Annual |
| `director-appointment-mt` | Form C - Director Change | As needed |
| `ubo-declaration-mt` | UBO Registration Form | As needed |

## Rwanda Templates

| Template ID | Description | Frequency |
|-------------|-------------|-----------|
| `vat-return-rw` | Rwanda VAT Declaration | Monthly |
| `cit-return-rw` | Corporate Income Tax Return | Annual |
| `annual-return-rdb` | RDB Annual Return | Annual |
| `notarial-certificate` | Notarized Document Template | As needed |

## Template Versioning

Templates follow semantic versioning:
- **Major**: Breaking changes to structure
- **Minor**: New optional fields
- **Patch**: Bug fixes, typos

Example: `vat-return-mt@2.1.0`

## Template Variables

Common variables available in templates:

| Variable | Description |
|----------|-------------|
| `{{client.name}}` | Client legal name |
| `{{client.tin}}` | Tax identification number |
| `{{period.start}}` | Period start date |
| `{{period.end}}` | Period end date |
| `{{preparer.name}}` | Preparing agent name |
| `{{reviewer.name}}` | Reviewing agent name |
| `{{date.now}}` | Current date |

## Integration

Works with all FirmOS agents to provide standardized document generation.

The template factory ensures:
1. **Consistency** - All documents follow approved formats
2. **Compliance** - Templates meet regulatory requirements
3. **Efficiency** - Rapid document generation
4. **Quality** - Built-in validation rules

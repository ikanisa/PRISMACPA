# Skills Directory

60 skill modules for OpenClaw + FirmOS agents.

## FirmOS Skills (8)

| Skill | Agent(s) | Purpose |
|-------|----------|---------|
| `firmos-audit` | Patrick | Audit programs, evidence collection, QC gates |
| `firmos-tax` | Matthew (MT), Emmanuel (RW) | Tax compliance, filings, advisory |
| `firmos-accounting` | Sofia | Bookkeeping, close, reconciliation |
| `firmos-advisory` | James | CFO services, M&A, valuations |
| `firmos-risk` | Fatima | ERM, controls, SOC, AML |
| `firmos-governance` | Aline, Marco, Diane | Workflow routing, QC, ethics |
| `firmos-csp` | Claire (MT) | CSP/MBR, company secretarial |
| `firmos-notary` | Chantal (RW) | Notary, RDB filings |

## Base OpenClaw Skills (52)

| Skill | Description |
|-------|-------------|
| `coding-agent` | Run Codex/Claude Code/Pi |
| `debugging` | Debug applications |
| `git` | Git operations |
| `mcp` | Model Context Protocol |
| `bash` | Shell commands |
| `tts` | Text-to-speech |
| `browser` | Browser automation |
| `calendar` | Calendar integration |
| `contacts` | Contact management |
| `email` | Email handling |
| `files` | File operations |
| `memory` | Memory management |
| `notes` | Note-taking |
| `reminders` | Reminder system |
| `search` | Web search |
| `translate` | Language translation |
| ... | And 36 more |

## Skill Format

Each skill is a directory with a `SKILL.md` file:

```yaml
---
name: skill-name
description: Short description
metadata:
  openclaw:
    emoji: "🔧"
    requires:
      packages: []
---

# Skill Name

Usage instructions and examples...
```

## Usage

Skills are auto-loaded by OpenClaw agents based on their configuration.

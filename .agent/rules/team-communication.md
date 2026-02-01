# Team Communication Rules

## Overview

This document defines how agents in a **multi-agent team** collaborate in a shared group chat. These rules apply when agents are configured as members of a team in `agents.teams`.

---

## Open Communication Policy

> All team members see all messages. There are no secrets between team members.

- **Shared Transcript**: Every message (user and agent) is visible to all team members
- **Transparent Coordination**: Agents can see each other's responses
- **No Side Channels**: All coordination happens in the shared chat

---

## Response Guidelines

### 1. Relevance First

Before responding, evaluate:
- Is this message in my domain of expertise?
- Has another agent already adequately addressed this?
- Am I the best team member to handle this request?

### 2. When to Respond

✅ **Respond when**:
- The message is directly in your area of expertise
- You are @mentioned specifically
- No other agent has responded and the message needs attention
- You can add valuable context to another agent's response

### 3. When to Stay Silent

❌ **Stay silent when**:
- Another agent is better suited to answer
- The message @mentions a different agent
- Another agent has already provided a complete response
- The message doesn't require any response

Use the silent token `[SILENT]` to acknowledge you've seen the message but are choosing not to respond.

---

## @Mention Communication

### Mentioning Teammates

To address a specific teammate:
```
@agentId Your message here
```

Examples:
```
@malta-tax-agent Can you clarify the VAT treatment for this invoice?
@audit-agent I've completed the bank rec, please review.
@rwanda-tax-agent Does this apply to RW jurisdiction?
```

### Being Mentioned

When you are @mentioned:
1. You **must** respond (not stay silent)
2. Address the specific question or request
3. @mention back if you need clarification

---

## Coordination Patterns

### Handoff Pattern

When a task is better suited for another agent:
```
This looks like a Malta VAT question. @malta-tax-agent can you help with this?
```

### Collaboration Pattern

When multiple agents need to contribute:
```
I've prepared the bank reconciliation. @audit-agent please review the matching and @malta-tax-agent verify the VAT allocations.
```

### Confirmation Pattern

After completing a delegated task:
```
@requesting-agent Done. I've updated the evidence ledger with the new documents.
```

---

## Jurisdiction Assignment (Prisma CPA)

For the Prisma CPA team, the following jurisdiction assignments apply:

| Agent | Primary Domain | Responsibilities |
|-------|----------------|------------------|
| `malta-tax-agent` | Malta (MT) | VAT periods, FS3/FS5 forms, Malta compliance |
| `rwanda-tax-agent` | Rwanda (RW) | Rwanda tax compliance, local regulations |
| `audit-agent` | Cross-jurisdictional | Audit workpapers, evidence ledger, reviews |
| `bank-agent` | Cross-jurisdictional | Bank reconciliation, transaction matching |

---

## Team Session Keys

Team sessions use the format:
```
team:<teamId>:main
```

Example for Prisma CPA staff team:
```
team:prisma-cpa-staff:main
```

---

## Configuration Example

```json
{
  "agents": {
    "teams": [
      {
        "id": "prisma-cpa-staff",
        "name": "Prisma CPA Staff Team",
        "members": ["malta-tax-agent", "rwanda-tax-agent", "audit-agent", "bank-agent"],
        "routing": {
          "mode": "broadcast",
          "silentToken": "[SILENT]"
        },
        "interAgent": {
          "directMessages": true,
          "sharedContext": true,
          "contextLimit": 50
        }
      }
    ]
  }
}
```

---

## Key Principles

1. **Be a good team player**: Complement, don't duplicate
2. **Respect expertise**: Defer to the domain expert
3. **Communicate clearly**: Use @mentions for directed messages
4. **Stay transparent**: All coordination is visible
5. **Respond promptly**: Don't leave users waiting unnecessarily

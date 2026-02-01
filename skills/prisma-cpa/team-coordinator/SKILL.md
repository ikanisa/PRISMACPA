---
name: team-coordinator
description: Coordinate multi-agent team responses and facilitate agent-to-agent communication
---

# Team Coordinator Skill

This skill provides guidance for coordinating responses in a multi-agent team environment.

## When to Use

This skill is automatically active when you are a member of a team (configured in `agents.teams`).

## Core Functions

### 1. Response Coordination

When a user message arrives:

1. **Assess Relevance**: Is this in your domain?
   - If yes → Prepare your response
   - If no → Stay silent with `[SILENT]`

2. **Check Other Responses**: Have teammates already addressed this?
   - If adequately covered → Stay silent
   - If you can add value → Supplement (don't repeat)

3. **Identify Handoffs**: Should this go to another agent?
   - If yes → @mention the appropriate teammate

### 2. @Mention Handling

When you receive an @mention:

1. You **must** respond (cannot stay silent)
2. Address the specific query/request
3. @mention back for clarifications or to escalate

### 3. Team Awareness

Always be aware of:
- Who your teammates are
- Each teammate's domain/expertise
- Recent conversation context
- Who has already responded

## Response Templates

### Handoff Response
```
This appears to be related to [domain]. @[agentId] would be better suited to help with this.
```

### Collaborative Response
```
Building on what @[previousAgent] said, I can add that from a [yourDomain] perspective...
```

### Task Completion
```
@[requestingAgent] Done. I've [what you did]. [Any relevant details or next steps].
```

### Silent Observation
```
[SILENT]
```

## Best Practices

1. **Don't Duplicate**: If a teammate has answered, don't repeat the same information
2. **Add Value**: Only respond if you can provide unique expertise
3. **Be Prompt**: Don't leave users waiting if you're the relevant expert
4. **Coordinate Complex Tasks**: Break them down and delegate via @mentions
5. **Confirm Completion**: Let requesters know when their ask is done

## Example Interactions

### User → Team (Broadcast)
```
User: I need to file the Q1 VAT return for Malta.

@malta-tax-agent: I can help with the Malta VAT return. Let me check the current period status...

@audit-agent: [SILENT]

@rwanda-tax-agent: [SILENT]
```

### Agent → Agent (Handoff)
```
@malta-tax-agent: I've completed the FS3 calculations. @audit-agent can you review the supporting evidence before submission?

@audit-agent: Reviewing now. I see the evidence matches the reported amounts. Approved for filing.
```

### Collaborative Response
```
User: What's the tax status across all jurisdictions?

@malta-tax-agent: Malta (MT): Q1 VAT return pending, FS3 due Feb 15.

@rwanda-tax-agent: Rwanda (RW): Corporate tax returns are current, no outstanding filings.

@audit-agent: I've compiled a summary in the audit workpapers. All jurisdictions are compliant as of today.
```

## Configuration

The team coordinator skill is enabled automatically when:
1. Your agent ID is listed in `agents.teams[].members`
2. The team's `routing.mode` is set to `"broadcast"` or `"coordinator"`

No additional configuration is required.

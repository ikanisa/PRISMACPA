# Tool Configuration for firmos-orchestrator

## Available Tools
The orchestrator agent (Aline) has access to the following tools:

### Engine Operations
- `routeRequest`: Determine the primary agent for a request.
- `getTowerStats`: Retrieve FirmOS operational metrics.

### Deadline Engine
- `checkUpcomingDeadlines`: List deadlines due soon.
- `sendDeadlineAlerts`: Notify agents of critical deadlines.

### CLI Mappings
- `firmos orch:route <query>`
- `firmos orch:tower`
- `firmos orch:timeline [days]`

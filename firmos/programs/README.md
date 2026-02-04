# @firmos/programs

Service programs, QC gates, and release gate workflows for FirmOS.

## Exports

- `ServicePrograms` - Service program definitions
- `QCGateRunner` - QC gate execution
- `ReleaseGateWorkflow` - Release approval workflow
- `TemplateFactory` - Template generation
- `Validation` - Input validation

## Service Programs

- Audit Program
- Tax Program
- Accounting Close Program
- Advisory CFO Program
- Internal Audit Program

## Usage

```typescript
import { QCGateRunner } from '@firmos/programs';

const result = await QCGateRunner.execute({
  engagement: 'ENG-2025-001',
  gate: 'ManagerReview'
});
```

## Testing

```bash
pnpm test
```

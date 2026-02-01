# Domain Types Reference

## EvidenceItem

```typescript
interface EvidenceItem {
  id: string;
  periodId: string;
  fileHash: string;        // SHA-256 of file bytes
  fileName: string;
  fileType: string;
  storagePath: string;
  extractedFields: Record<string, unknown>;
  extractionConfidence: number;
  createdAt: Date;
}
```

## VATDraftPack

```typescript
interface VATDraftPack {
  id: string;
  periodId: string;
  versionNumber: number;
  outputVatTotal: number;
  inputVatTotal: number;
  netVat: number;
  evidenceIds: string[];
  exceptions: VATException[];
  packHash: string;
  previousVersionId?: string;
  createdAt: Date;
}
```

## VATException

```typescript
interface VATException {
  type: 'missing_invoice' | 'ambiguous_rate' | 'duplicate_candidate' | 'reverse_charge';
  description: string;
  evidenceId?: string;
  suggestedAction: string;
}
```

## Approval

```typescript
interface Approval {
  id: string;
  targetType: 'entry' | 'pack' | 'period';
  targetId: string;
  approvalType: 'prepare' | 'review' | 'file';
  approved: boolean;
  notes?: string;
  approverId: string;
  approverName: string;
  createdAt: Date;
}
```

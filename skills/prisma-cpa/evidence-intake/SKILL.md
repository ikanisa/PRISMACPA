---
name: evidence-intake
description: Ingest, classify, and verify documents for the evidence ledger with OCR extraction and hash verification. Use when uploading invoices/receipts, extracting fields via OCR, classifying documents by type, verifying document authenticity, or managing the evidence chain for Malta tax compliance.
---

# Evidence Intake

Ingest documents into the evidence ledger with OCR and verification.

## Workflow

1. **Upload Document** — Receive file (PDF, image, or structured data)
2. **Hash & Store** — Generate SHA-256 hash for integrity
3. **OCR Extract** — Pull vendor, date, amount, VAT fields
4. **Classify** — Assign document type and VAT code
5. **Queue Review** — Flag low-confidence extractions
6. **Link to Period** — Associate with VAT period/transaction

## Document Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `invoice` | Supplier invoice | vendor, date, amount, vat |
| `receipt` | Till receipt | vendor, date, total |
| `bank_statement` | Bank statement | account, period, balance |
| `contract` | Service agreement | parties, dates, value |
| `payslip` | Employee payslip | employee, period, amounts |

## OCR Confidence Thresholds

- **≥0.9**: Auto-accept extraction
- **0.7-0.9**: Flag for review
- **<0.7**: Manual entry required

## Critical Constraints

> [!CAUTION]
> - **NEVER delete** original documents
> - **Store hash** immediately on upload
> - **Preserve chain** of custody metadata
> - Low-confidence fields must be **flagged, not guessed**

## Usage

```text
User: "Upload this invoice for ABC Ltd"

1. Accept file upload
2. Hash: sha256(file) → store in evidence_items.hash
3. OCR: Extract vendor='ABC Ltd', date='2025-01-15', amount=1200.00, vat=228.00
4. Classify: type='invoice', vat_code='standard_19'
5. Set ocr_confidence = 0.92, ocr_status = 'verified'
6. Insert into evidence_items with pack_id link
```

## References

- See [domain-types.md](../references/domain-types.md) for Evidence types

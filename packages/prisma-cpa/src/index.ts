/**
 * @prisma-cpa/prisma-cpa - Consolidated Prisma CPA Package
 * 
 * Malta tax, audit, evidence, bank reconciliation, and AML compliance
 */

// Core exports
export * from './core/index.js';

// Domain-specific exports
export * as maltaTax from './malta-tax/index.js';
export * as evidence from './evidence/index.js';
export * as audit from './audit/index.js';
export * as bankRecon from './bank-recon/index.js';

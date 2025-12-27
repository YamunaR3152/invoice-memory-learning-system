import { Memory, VendorMemory } from "./memory";

/* ========= TYPES ========= */

export interface AuditStep {
  step: "recall" | "apply" | "decide" | "learn";
  timestamp: string;
  details: string;
}

export interface ProcessedOutput {
  invoiceId: string;
  normalizedInvoice: any;
  proposedCorrections: string[];
  requiresHumanReview: boolean;
  reasoning: string;
  confidenceScore: number;
  memoryUpdates: string[];
  auditTrail: AuditStep[];
}

/* ========= INTERNAL MEMORY TYPES ========= */

interface MemoryCorrection {
  pattern: string;
  correction: string;
  confidence: number;
}

interface MemoryResolution {
  issue: string;
  confidence: number;
}

/* ========= PROCESSOR ========= */

export class Processor {
  private memory: Memory;

  constructor(memory: Memory) {
    this.memory = memory;
  }

  processInvoice(invoice: any): ProcessedOutput {
    const auditTrail: AuditStep[] = [];
    const proposedCorrections: string[] = [];
    const memoryUpdates: string[] = [];
    let appliedFromTrustedMemory = false;

    // ✅ Confidence from knowledge graph properties
    let confidenceScore: number = invoice.properties?.confidence ?? 0.5;

    /* ================= RECALL ================= */

    auditTrail.push({
      step: "recall",
      timestamp: new Date().toISOString(),
      details: `Recalling memory for vendor ${invoice.vendor}`
    });

    const vendorMemory: VendorMemory | undefined =
      this.memory.getVendor(invoice.vendor);

    if (vendorMemory) {
      auditTrail.push({
        step: "recall",
        timestamp: new Date().toISOString(),
        details: `Vendor memory found with ${
          Object.keys(vendorMemory.fieldMappings).length
        } learned mappings`
      });
    } else {
      auditTrail.push({
        step: "recall",
        timestamp: new Date().toISOString(),
        details: "No vendor memory found"
      });
    }

    /* ================= APPLY ================= */

    auditTrail.push({
      step: "apply",
      timestamp: new Date().toISOString(),
      details: "Applying memory with confidence gating"
    });

    // ✅ Normalize invoice node
    const normalizedInvoice = {
      invoiceId: invoice.id,
      vendor: invoice.vendor,
      ...invoice.properties
    };

    /* ---- Vendor Memory (field mappings) ---- */
    if (vendorMemory) {
      for (const [field, mapping] of Object.entries(
        vendorMemory.fieldMappings
      )) {
        if (
          normalizedInvoice[field] == null &&
          mapping.approvedByHuman === true
        ) {
          normalizedInvoice[field] = `Derived from ${mapping.sourceField}`;

          proposedCorrections.push(
            `Filled ${field} using vendor mapping from ${mapping.sourceField}`
          );

          confidenceScore = Math.max(confidenceScore, 0.85);
          appliedFromTrustedMemory = true;

          auditTrail.push({
            step: "apply",
            timestamp: new Date().toISOString(),
            details: `Vendor mapping applied: ${mapping.sourceField} → ${field}`
          });
        }
      }
    }

    /* ---- Correction Memory (pattern-based) ---- */
    if (invoice.rawText) {
      const corrections: Record<string, MemoryCorrection> =
        (this.memory as unknown as {
          store: { corrections: Record<string, MemoryCorrection> };
        }).store?.corrections ?? {};

      for (const correction of Object.values(corrections)) {
        if (
          invoice.rawText.includes(correction.pattern) &&
          correction.confidence >= 0.6
        ) {
          proposedCorrections.push(
            `Pattern detected "${correction.pattern}" → ${correction.correction}`
          );

          confidenceScore = Math.min(1, confidenceScore + 0.05);

          auditTrail.push({
            step: "apply",
            timestamp: new Date().toISOString(),
            details: `Correction pattern applied: ${correction.pattern}`
          });
        }
      }
    }

    /* ---- Resolution Memory (risk biasing) ---- */
    const resolutions: Record<string, MemoryResolution> =
      (this.memory as unknown as {
        store: { resolutions: Record<string, MemoryResolution> };
      }).store?.resolutions ?? {};

    for (const resolution of Object.values(resolutions)) {
      if (resolution.confidence < 0.4) {
        confidenceScore = Math.max(0, confidenceScore - 0.05);

        auditTrail.push({
          step: "apply",
          timestamp: new Date().toISOString(),
          details: `Low-confidence resolution detected: ${resolution.issue}`
        });
      }
    }

    /* ================= DECIDE ================= */

    // ✅ Dynamic missing-field detection (FIXED)
    const missingFields = Object.entries(normalizedInvoice)
      .filter(([_, value]) => value === null || value === undefined)
      .map(([key]) => key);

    let requiresHumanReview = true;
    let reasoning = "";

    if (appliedFromTrustedMemory) {
      requiresHumanReview = false;
      reasoning =
        "Field mapping reused from previously human-approved vendor memory.";
    } else if (missingFields.length > 0) {
      requiresHumanReview = true;
      reasoning = `Missing required field(s): ${missingFields.join(
        ", "
      )}. No prior vendor memory. Human clarification required.`;
    } else {
      requiresHumanReview = true;
      reasoning = "Low confidence. Human review required.";
    }

    auditTrail.push({
      step: "decide",
      timestamp: new Date().toISOString(),
      details: reasoning
    });

    /* ================= LEARN ================= */

    auditTrail.push({
      step: "learn",
      timestamp: new Date().toISOString(),
      details: "Updating memory based on decision outcome"
    });

    if (!requiresHumanReview && confidenceScore > 0.75) {
      this.memory.updateResolution(
        `${invoice.vendor}:${invoice.id}`,
        true
      );
      memoryUpdates.push(
        `Resolution approved for ${invoice.vendor}:${invoice.id}`
      );
    }

    if (confidenceScore < 0.4) {
      this.memory.updateResolution(
        `${invoice.vendor}:${invoice.id}`,
        false
      );
      memoryUpdates.push(
        `Resolution rejected for ${invoice.vendor}:${invoice.id}`
      );
    }

    /* ================= OUTPUT ================= */

    return {
      invoiceId: invoice.id,
      normalizedInvoice,
      proposedCorrections,
      requiresHumanReview,
      reasoning,
      confidenceScore: Number(confidenceScore.toFixed(2)),
      memoryUpdates,
      auditTrail
    };
  }
}

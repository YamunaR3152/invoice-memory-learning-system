import fs from "fs";
import path from "path";

/* ========= TYPES ========= */

export interface VendorMemory {
  vendorName: string;
  fieldMappings: {
    [normalizedField: string]: {
      sourceField: string;
      confidence: number;
      learnedFrom: string[];
      approvedByHuman: boolean;
      approvalCount: number;
    };
  };
  lastSeen: string;
}

export interface CorrectionMemory {
  pattern: string;
  correction: string;
  confidence: number;
  count: number;
}

export interface ResolutionMemory {
  issue: string;
  approvedCount: number;
  rejectedCount: number;
  confidence: number;
}

export interface MemoryStore {
  vendors: Record<string, VendorMemory>;
  corrections: Record<string, CorrectionMemory>;
  resolutions: Record<string, ResolutionMemory>;
}

/* ========= MEMORY CLASS ========= */

export class Memory {
  private memoryPath: string;
  private store: MemoryStore;

  constructor() {
    this.memoryPath = path.join(__dirname, "../data/memory.json");
    this.store = this.loadMemory();
  }

  /* ========= LOAD & SAVE ========= */

  private loadMemory(): MemoryStore {
    if (!fs.existsSync(this.memoryPath)) {
      const emptyMemory: MemoryStore = {
        vendors: {},
        corrections: {},
        resolutions: {}
      };

      fs.writeFileSync(
        this.memoryPath,
        JSON.stringify(emptyMemory, null, 2),
        "utf-8"
      );

      return emptyMemory;
    }

    const raw = fs.readFileSync(this.memoryPath, "utf-8");
    return JSON.parse(raw) as MemoryStore;
  }

  private saveMemory(): void {
    fs.writeFileSync(
      this.memoryPath,
      JSON.stringify(this.store, null, 2),
      "utf-8"
    );
  }

  /* ========= VENDOR MEMORY ========= */

  getVendor(vendorName: string): VendorMemory | undefined {
    return this.store.vendors[vendorName];
  }

  ensureVendor(vendorName: string): VendorMemory {
    if (!this.store.vendors[vendorName]) {
      this.store.vendors[vendorName] = {
        vendorName,
        fieldMappings: {},
        lastSeen: new Date().toISOString()
      };
      this.saveMemory();
    }

    return this.store.vendors[vendorName];
  }

  updateVendor(vendor: VendorMemory): void {
    const existing = this.store.vendors[vendor.vendorName];

    this.store.vendors[vendor.vendorName] = {
      ...existing,
      ...vendor,
      lastSeen: new Date().toISOString()
    };

    this.saveMemory();
  }
  /* ✅ ADD THIS METHOD HERE */
approveVendorMapping(
  vendorName: string,
  sourceField: string,
  targetField: string
): void {
  const vendor = this.ensureVendor(vendorName);

  const existing = vendor.fieldMappings[targetField];

  if (!existing) {
    vendor.fieldMappings[targetField] = {
      sourceField,
      confidence: 0.85, // TRUSTED immediately
      learnedFrom: ["human"],
      approvedByHuman: true,
      approvalCount: 1
    };
  } else {
    existing.approvedByHuman = true;
    existing.approvalCount += 1;
    existing.confidence = Math.min(1, existing.confidence + 0.1);
  }

  this.updateVendor(vendor);
}







  /* ========= CORRECTION MEMORY ========= */

  updateCorrection(pattern: string, correction: string): void {
    const existing = this.store.corrections[pattern];

    if (!existing) {
      this.store.corrections[pattern] = {
        pattern,
        correction,
        confidence: 0.4,
        count: 1
      };
    } else {
      existing.count += 1;
      existing.confidence = Math.min(1, existing.confidence + 0.1);
    }

    this.saveMemory();
  }

  getCorrection(pattern: string): CorrectionMemory | undefined {
    return this.store.corrections[pattern];
  }

  /* ========= RESOLUTION MEMORY ========= */

  updateResolution(issue: string, approved: boolean): void {
    const existing = this.store.resolutions[issue];

    if (!existing) {
      this.store.resolutions[issue] = {
        issue,
        approvedCount: approved ? 1 : 0,
        rejectedCount: approved ? 0 : 1,
        confidence: approved ? 0.6 : 0.3
      };
    } else {
      approved ? existing.approvedCount++ : existing.rejectedCount++;
      existing.confidence =
        existing.approvedCount /
        (existing.approvedCount + existing.rejectedCount);
    }

    this.saveMemory();
  }

  getResolution(issue: string): ResolutionMemory | undefined {
    return this.store.resolutions[issue];
  }
  /* ================= HUMAN CORRECTION LEARNING ================= */
  learnFromHumanCorrection(correction: any):void{
    const vendor = correction.vendor;
    for(const rule of correction.learnedRules){
        if(rule.rule.includes("→")) {
            const [source, target]=rule.rule.split("→").map((s:string)=>s.trim());
            this.approveVendorMapping(vendor,source,target);
        } else {
            this.updateCorrection(rule.rule, rule.value); 
        
        }
    
    }
    this.updateResolution(correction.invoiceId, correction.approved);
  }
}

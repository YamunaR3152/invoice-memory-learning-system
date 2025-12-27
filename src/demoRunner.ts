import { Memory } from "./memory";
import { Processor } from "./processor";

/* ================= DEMO RUNNER ================= */

function runDemo() {
  console.log("\n================ FLOWBIT MEMORY DEMO ================\n");

  const memory = new Memory();
  const processor = new Processor(memory);

  /* ========== INVOICE 1 (BEFORE LEARNING) ========== */

  const invoice1 = {
    id: "INV-A-001",
    vendor: "Supplier GmbH",
    properties: {
      invoiceNumber: "INV-2024-001",
      invoiceDate: "2024-01-12",
      serviceDate: null,
      currency: "EUR",
      netTotal: 2500,
      taxRate: 0.19,
      taxTotal: 475,
      grossTotal: 2975,
      confidence: 0.78
    }
  };

  console.log("🔹 Processing Invoice INV-A-001 (Before Learning)\n");

  const output1 = processor.processInvoice(invoice1);
  console.log(JSON.stringify(output1, null, 2));

  /* ========== SIMULATE HUMAN CORRECTION ========== */

  console.log("\n APPLYING HUMAN CORRECTIONS\n");

  // Human explicitly approves vendor mapping
  memory.approveVendorMapping(
    "Supplier GmbH",
    "Leistungsdatum",
    "serviceDate"
  );

  console.log("✅ Memory updated from human correction\n");

  /* ========== INVOICE 2 (AFTER LEARNING) ========== */

  const invoice2 = {
    id: "INV-A-002",
    vendor: "Supplier GmbH",
    properties: {
      invoiceNumber: "INV-2024-002",
      invoiceDate: "2024-01-18",
      serviceDate: null,
      currency: "EUR",
      netTotal: 2375,
      grossTotal: 2826.25,
      confidence: 0.72
    }
  };

  console.log("🔹 Processing Invoice INV-A-002 (After Learning)\n");

  const output2 = processor.processInvoice(invoice2);
  console.log(JSON.stringify(output2, null, 2));

  console.log("\n================ DEMO COMPLETE =================\n");
}

runDemo();

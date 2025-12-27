/* please press ctrl + shift + v for readme review */
# Invoice Memory Learning System

**AI Agent Development Internship – Flowbit Private Limited**

---

## Overview

This project implements a **memory-driven learning layer** for invoice processing systems.  
Instead of treating every invoice as a new, stateless document, the system learns from past human corrections, stores reusable insights, and applies them intelligently to future invoices.

The focus of this project is **not OCR or data extraction accuracy**. All invoice data is assumed to be pre-extracted.  
The primary objective is to demonstrate **persistent, explainable, and auditable memory** that improves automation quality over time.

---

## Core Lifecycle

Each invoice is processed through a clearly defined lifecycle:
Recall → Apply → Decide → Learn

This lifecycle ensures traceability, safety, and controlled learning.

---

## 1. Recall

- Retrieves vendor-specific learned memory  
- Retrieves known correction and resolution patterns  
- Logs all recall actions in an audit trail  

---

## 2. Apply

- Applies **human-approved vendor mappings** (confidence-gated)  
- Applies correction patterns only when confidence thresholds are met  
- Adjusts overall confidence score based on memory quality  

---

## 3. Decide

- Determines whether the invoice can be auto-accepted  
- Escalates to human review if confidence is low or required data is missing  
- Produces a clear and explainable reasoning string for every decision  

---

## 4. Learn

- Reinforces memory when automated decisions are approved  
- Weakens memory when decisions are rejected  
- Persists learned memory across program executions  

---

## Memory Types

### Vendor Memory

Stores vendor-specific patterns learned from explicit human corrections.

**Example:**
"Leistungsdatum" → serviceDate (for Supplier GmbH)

Only mappings that are **explicitly approved by humans** are eligible for automatic application.

---

### Correction Memory

Tracks recurring correction patterns and their confidence evolution.

**Examples:**
- Currency inference from raw text  
- Description-to-SKU mapping  

Confidence increases or decreases based on repeated outcomes.

---

### Resolution Memory

Tracks how similar issues were resolved historically:

- Approved vs rejected outcomes  
- Confidence evolution over time  

This prevents incorrect learning from dominating future decisions.

---

## Persistence Strategy

Memory is stored using **file-based JSON persistence** to keep the system:

- Lightweight  
- Transparent  
- Easy to inspect and audit  



Although persistence uses plain JSON files, the data is intentionally structured in a **knowledge-graph–inspired format** using **nodes and relationships**.

### Examples

- Invoices, Purchase Orders, Delivery Notes, and Human Corrections represented as nodes  
- Explicit relationships such as vendor associations, duplicates, and inferred links  

### Benefits

- Faster lookup and updates for related entities (vendor → invoice → correction)  
- Clear traceability of how learned memory originated  
- Explainable learning with auditable relationships  
- Lightweight alternative to a full graph database  

The system does **not rely on a dedicated graph engine**.  
Instead, it uses a **graph-inspired JSON structure**, sufficient to demonstrate memory-driven behavior while remaining simple and portable.

This approach balances:

- Simplicity (plain JSON files)  
- Structure (graph-style relationships)  
- Practical performance for memory-driven agents  

Memory persists across program executions, demonstrating **true learning behavior**.

---

## Project Structure

```text
invoice_memory/
├── data/
│   ├── delivery_notes.json        # Reference delivery note data
│   ├── human_corrections.json     # Sample human correction logs
│   ├── memory.json                # Persistent learned memory
│   └── purchase_orders.json       # Purchase order reference data
│
├── invoices/
│   └── invoices_extracted.json    # Pre-extracted invoice data
│
├── src/
│   ├── demoRunner.ts              # Demo execution script
│   ├── memory.ts                  # Memory storage and learning logic
│   └── processor.ts               # Recall / Apply / Decide / Learn engine
│
├── package.json
├── tsconfig.json
└── README.md
Demo Flow: Learning Over Time
Step 1: First Invoice (Before Learning)
Invoice: INV-A-001

Vendor: Supplier GmbH

Issue: Missing serviceDate

Result:

No vendor memory exists

Invoice escalated to human review

Step 2: Human Correction
Human approves mapping:

"Leistungsdatum" → serviceDate
Result:

Mapping stored in vendor memory with high confidence

Memory persisted to disk

Step 3: Second Invoice (After Learning)
Invoice: INV-A-002

Vendor: Supplier GmbH

Result:

serviceDate auto-filled from learned memory

No human review required

Confidence score increased

Step 4: Subsequent Program Runs
Previously learned mappings are reused

Confirms persistent memory across executions

Running the Demo
Install Dependencies
npm install
Run Demo
npm run demo
The console output clearly shows:

Memory recall

Applied mappings

Decision logic

Learning updates

Full audit trail for each invoice

Output Format
For every invoice, the system produces:

{
  "invoiceId": "INV-A-002",
  "normalizedInvoice": { "...": "..." },
  "proposedCorrections": [ "..." ],
  "requiresHumanReview": false,
  "reasoning": "Explainable decision logic",
  "confidenceScore": 0.85,
  "memoryUpdates": [ "..." ],
  "auditTrail": [
    {
      "step": "recall | apply | decide | learn",
      "timestamp": "...",
      "details": "..."
    }
  ]
}
The output is fully explainable, auditable, and deterministic.

Design Decisions
No ML model training; heuristic-based learning for transparency

Confidence-gated memory application to prevent over-automation

File-based persistence instead of heavy databases

Human-in-the-loop learning as the primary trust mechanism

Conclusion
This project demonstrates how an AI agent can:

Learn from human feedback

Improve automation accuracy over time

Remain safe, explainable, and auditable

Persist knowledge across executions

The architecture is intentionally simple, extensible, and production-ready, making it suitable for real-world enhancement and scaling.





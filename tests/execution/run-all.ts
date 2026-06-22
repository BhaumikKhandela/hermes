// Execution Engine Integration Test Suite
//
// Tests the business logic of the AI workflow execution engine:
//   - Execution plan compilation & validation
//   - Credential resolution
//   - Tool registry resolution
//   - Sub-agent delegation
//   - Recursive execution
//   - Failure propagation
//   - Output propagation
//   - WorkflowRun persistence
//   - End-to-end workflow correctness
//
// Usage: npx tsx tests/execution/run-all.ts

const TEST_TIMEOUT_MS = 120_000;

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const tests = [
  { name: "Test G: Execution Plan Compilation", file: "./TestG_ExecutionPlanCompilation" },
  { name: "Test K: Tool Registry Resolution", file: "./TestK_ToolRegistryResolution" },
  { name: "Test H: Credential Resolution", file: "./TestH_CredentialResolution" },
  { name: "Test M: Failure Propagation", file: "./TestM_FailurePropagation" },
  { name: "Test L: Tool Output Propagation", file: "./TestL_ToolOutputPropagation" },
  { name: "Test I: Single Sub-Agent Delegation", file: "./TestI_SingleSubAgentDelegation" },
  { name: "Test J: Deep Recursive Delegation", file: "./TestJ_DeepRecursiveDelegation" },
  { name: "Test N: Mixed Success/Failure", file: "./TestN_MixedSuccessFailure" },
  { name: "Test O: WorkflowRun Persistence", file: "./TestO_WorkflowRunPersistence" },
  { name: "Test P: End-to-End Happy Path", file: "./TestP_EndToEndHappyPath" },
];

async function runTest(test: { name: string; file: string }): Promise<TestResult> {
  const startedAt = Date.now();

  try {
    const mod = await import(test.file);
    const runFn = (mod as any).runTest;
    if (typeof runFn === "function") {
      await runFn();
    }
    return {
      name: test.name,
      passed: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      name: test.name,
      passed: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startedAt,
    };
  }
}

async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       Execution Engine Integration Tests               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log(`Total tests: ${tests.length}\n`);

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`\n▶ Running: ${test.name}`);
    const result = await runTest(test);
    results.push(result);

    if (result.passed) {
      console.log(`  ✓ ${result.name} (${result.durationMs}ms)`);
    } else {
      console.log(`  ✗ ${result.name} (${result.durationMs}ms)`);
      console.log(`    Error: ${result.error}`);
    }
  }

  // Final summary
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    Final Summary                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("  Test                      Status    Duration");
  console.log("  ─────────────────────────────────────────────");
  for (const r of results) {
    const status = r.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`  ${r.name.padEnd(35)} ${status.padEnd(8)} ${r.durationMs}ms`);
  }
  console.log("");
  console.log(`  Passed: ${passed}/${tests.length}`);
  console.log(`  Failed: ${failed}/${tests.length}`);
  console.log(`  Total:  ${tests.length}`);
  console.log("");

  if (failed > 0) {
    console.log("  Failed tests:");
    for (const r of results) {
      if (!r.passed) {
        console.log(`    - ${r.name}: ${r.error}`);
      }
    }
    console.log("");
    process.exit(1);
  } else {
    console.log("  All tests passed!");
    console.log("");
  }
}

main().catch((err) => {
  console.error("Orchestrator failed:", err);
  process.exit(1);
});

// Integration Test Suite: Observability Architecture
//
// Runs all test cases sequentially. Each test:
// 1. Captures emitted events via EventCollector (mocked inngest.send)
// 2. Asserts event counts, payload schemas, elementId propagation
// 3. Prints a validation report per test
//
// Usage: npx tsx tests/run-all.ts

import { EventCollector } from "./harness";

const TEST_TIMEOUT_MS = 30_000;

type TestModule = {
  default?: never;
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const tests = [
  { name: "Test A: Retry Behavior", file: "./TestA_RetryBehavior" },
  { name: "Test B: Missing Credential", file: "./TestB_MissingCredential" },
  { name: "Test C: Happy Path (Lifecycle Events)", file: "./TestC_HappyPath" },
  { name: "Test D: Tool Counting", file: "./TestD_ToolCounting" },
  { name: "Test E: SubAgent Failure Propagation", file: "./TestE_SubAgentFailure" },
  { name: "Test F: Multi-Tool Reuse", file: "./TestF_MultiToolReuse" },
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
  console.log("║     Observability Architecture Integration Tests        ║");
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

// Test E: SubAgent Failure Propagation
// Validates that when a sub-agent fails, both the sub-agent and parent agent
// emit workflow/element.failed events with correct and distinct elementIds.

import {
  EventCollector,
  runSubAgentWithEvents,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "./harness";

const RUN_ID = "test-e-subagent-failure";
const PARENT_ID = "orchestrator";
const CHILD_ID = "retry-tester";
const PARENT_LABEL = "Orchestrator";
const CHILD_LABEL = "RetryTester";

printSection("Test E: SubAgent Failure Propagation");

export async function runTest() {
  const collector = new EventCollector();
  collector.install();

  // Simulate parent → child where child fails
  try {
    await runSubAgentWithEvents(
      { runId: RUN_ID, elementId: PARENT_ID, agentLabel: PARENT_LABEL },
      { runId: RUN_ID, elementId: CHILD_ID, agentLabel: CHILD_LABEL },
      true, // child fails
    );
    fail("Expected sub-agent failure to propagate to caller");
  } catch {
    pass("Failure propagated to caller as expected");
  }

  // ── Assertion 1: Both parent and child have workflow/element.failed ─────────
  printSubSection("Failure Event Assertions");

  const allFailed = collector.byName("workflow/element.failed");
  assert(
    allFailed.length === 2,
    `workflow/element.failed count: expected 2, got ${allFailed.length}`,
  );

  // ── Assertion 2: Correct element IDs ───────────────────────────────────────
  printSubSection("Element ID Assertions");

  const childFailed = allFailed.filter((e) => e.data.elementId === CHILD_ID);
  const parentFailed = allFailed.filter((e) => e.data.elementId === PARENT_ID);

  assert(
    childFailed.length === 1,
    `Child has exactly 1 failed event: expected 1, got ${childFailed.length}`,
  );
  assert(
    parentFailed.length === 1,
    `Parent has exactly 1 failed event: expected 1, got ${parentFailed.length}`,
  );

  // ── Assertion 3: Event payload schema ──────────────────────────────────────
  printSubSection("Event Payload Assertions");

  for (const evt of allFailed) {
    assert(evt.data.runId === RUN_ID, `failed event has runId`);
    assert(typeof evt.data.elementId === "string", `failed event has elementId`);
    assert(evt.data.elementType === "agent", `failed event has elementType=agent`);
    assert(typeof evt.data.error === "string" && evt.data.error.length > 0, `failed event has error message`);
    assert(evt.data.label === (evt.data.elementId === PARENT_ID ? PARENT_LABEL : CHILD_LABEL), `failed event has label`);
  }

  // ── Assertion 4: Started events for both ───────────────────────────────────
  printSubSection("Started Event Assertions");

  const allStarted = collector.byName("workflow/element.started");
  assert(
    allStarted.length === 2,
    `workflow/element.started count: expected 2, got ${allStarted.length}`,
  );

  const childStarted = allStarted.filter((e) => e.data.elementId === CHILD_ID);
  assert(
    childStarted.length === 1,
    `Child has exactly 1 started event: expected 1, got ${childStarted.length}`,
  );

  // ── Assertion 5: No completed events ───────────────────────────────────────
  printSubSection("Completed Event Assertions");

  const allCompleted = collector.byName("workflow/element.completed");
  assert(
    allCompleted.length === 0,
    `workflow/element.completed count: expected 0, got ${allCompleted.length}`,
  );

  // ── Assertion 6: Event sequence ──────────────────────────────────────────
  printSubSection("Event Sequence Assertion");

  // Expected order: child starts (created first) → parent starts → child fails → parent fails
  // The childPromise is created before parent's fn, so child's started fires first.
  const timeline = collector.timeline();
  assert(
    timeline[0].name === "workflow/element.started",
    `First event is started: got ${timeline[0].name}`,
  );
  assert(
    timeline[0].data.elementId === CHILD_ID,
    `First event belongs to child (created first): got ${timeline[0].data.elementId}`,
  );
  assert(
    timeline[1].data.elementId === PARENT_ID,
    `Second event belongs to parent: got ${timeline[1].data.elementId}`,
  );

  collector.assertSequence([
    "workflow/element.started",
    "workflow/element.started",
    "workflow/element.failed",
    "workflow/element.failed",
  ]);
  pass("Sub-agent failure event order: child started → parent started → child failed → parent failed");

  // ── Assertion 7: byElementId for parent and child ────────────────────────
  printSubSection("Element ID Filter Assertions");
  const parentEvents = collector.byElementId(PARENT_ID);
  const childEvents = collector.byElementId(CHILD_ID);
  assert(
    parentEvents.length === 2,
    `Parent (${PARENT_ID}) has ${parentEvents.length} events (started + failed)`,
  );
  assert(
    parentEvents[0].name === "workflow/element.started",
    `Parent first event is started`,
  );
  assert(
    parentEvents[1].name === "workflow/element.failed",
    `Parent second event is failed`,
  );
  assert(
    childEvents.length === 2,
    `Child (${CHILD_ID}) has ${childEvents.length} events (started + failed)`,
  );

  // ── byRunId ──────────────────────────────────────────────────────────────
  printSubSection("Run ID Filter Assertion");
  const byRun = collector.byRunId(RUN_ID);
  assert(
    byRun.length === collector.events.length,
    `byRunId returned all ${byRun.length} events`,
  );

  // ── Event Report ───────────────────────────────────────────────────────────
  printSubSection("Event Validation Report");
  collector.printReport();

  collector.uninstall();
}

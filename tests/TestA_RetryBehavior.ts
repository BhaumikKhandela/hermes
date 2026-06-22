// Test A: Retry Behavior
// Validates that the middleware stack correctly emits retry events
// and retries-exhausted events with correct elementId attribution.

import { HumanMessage } from "@langchain/core/messages";
import { modelRetryMiddleware } from "langchain";
import {
  AlwaysFailModel,
  EventCollector,
  buildTestAgent,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "./harness";

const RUN_ID = "test-a-retry-behavior";
const ELEMENT_ID = "orchestrator";
const AGENT_LABEL = "RetryTester";
const EXPECTED_MAX_RETRIES = 3;

printSection("Test A: Retry Behavior");

export async function runTest() {
  const collector = new EventCollector();
  collector.install();

  const model = new AlwaysFailModel();
  const agent = buildTestAgent({
    model,
    runId: RUN_ID,
    elementId: ELEMENT_ID,
    agentLabel: AGENT_LABEL,
    maxRetries: EXPECTED_MAX_RETRIES,
  });

  let caught = false;
  try {
    await agent.invoke({ messages: [new HumanMessage("Say hello")] });
  } catch {
    caught = true;
  }

  if (!caught) {
    fail("Agent should have thrown after retries exhausted");
  }

  // ── Assertion 1: Correct retry count ────────────────────────────────────
  // maxRetries=3 => 4 total attempts (initial + 3 retries)
  printSubSection("Retry Count Assertions");
  const callFailedEvents = collector.byName("agent/model.call.failed");
  const exhaustedEvents = collector.byName("agent/model.retries_exhausted");

  assert(
    callFailedEvents.length === 4,
    `agent/model.call.failed count: expected 4, got ${callFailedEvents.length}`,
  );
  assert(
    exhaustedEvents.length === 1,
    `agent/model.retries_exhausted count: expected 1, got ${exhaustedEvents.length}`,
  );

  // ── Assertion 2: Element ID propagation ─────────────────────────────────
  printSubSection("Element ID Assertions");

  for (const evt of callFailedEvents) {
    assert(
      evt.data.elementId === ELEMENT_ID,
      `call.failed elementId: expected ${ELEMENT_ID}, got ${evt.data.elementId}`,
    );
  }
  assert(
    exhaustedEvents[0].data.elementId === ELEMENT_ID,
    `exhausted elementId: expected ${ELEMENT_ID}, got ${exhaustedEvents[0].data.elementId}`,
  );

  // ── Assertion 3: Required fields on retry events ────────────────────────
  printSubSection("Event Payload Schema Assertions");

  const requiredRetryFields = ["runId", "elementId", "agentLabel", "error", "callId", "durationMs"];
  for (const evt of callFailedEvents) {
    for (const field of requiredRetryFields) {
      assert(
        field in evt.data,
        `call.failed missing required field: ${field}`,
      );
    }
  }

  const requiredExhaustedFields = ["runId", "elementId", "agentLabel", "error"];
  for (const evt of exhaustedEvents) {
    for (const field of requiredExhaustedFields) {
      assert(
        field in evt.data,
        `exhausted missing required field: ${field}`,
      );
    }
  }

  // ── Assertion 4: Run ID propagation ─────────────────────────────────────
  printSubSection("Run ID Assertions");
  for (const evt of collector.events) {
    assert(
      evt.data.runId === RUN_ID,
      `Event ${evt.name} has correct runId: expected ${RUN_ID}, got ${evt.data.runId}`,
    );
  }

  // ── Assertion 5: callId uniqueness ──────────────────────────────────────
  printSubSection("callId Uniqueness Assertion");
  const callIds = callFailedEvents.map((e) => e.data.callId);
  const uniqueIds = new Set(callIds);
  assert(
    uniqueIds.size === 4,
    `Unique callIds: expected 4, got ${uniqueIds.size}`,
  );

  // ── Assertion 6: durationMs present and non-negative ────────────────────
  printSubSection("durationMs Assertion");
  for (const evt of callFailedEvents) {
    assert(
      typeof evt.data.durationMs === "number" && evt.data.durationMs >= 0,
      `call.failed has valid durationMs: got ${evt.data.durationMs}`,
    );
  }

  // ── Assertion 7: Event sequence ─────────────────────────────────────────
  printSubSection("Event Sequence Assertion");
  const expectedSequence = [
    "agent/model.call.failed",
    "agent/model.call.failed",
    "agent/model.call.failed",
    "agent/model.call.failed",
    "agent/model.retries_exhausted",
  ];
  collector.assertSequence(expectedSequence);
  pass("Event sequence matches expected order");

  // ── Assertion 8: byElementId / byRunId consistency ──────────────────────
  printSubSection("Element/Run ID Filter Assertions");
  const byElement = collector.byElementId(ELEMENT_ID);
  const byRun = collector.byRunId(RUN_ID);
  assert(
    byElement.length === collector.events.length,
    `byElementId returned all ${byElement.length} events`,
  );
  assert(
    byRun.length === collector.events.length,
    `byRunId returned all ${byRun.length} events`,
  );

  // ── Event Report ────────────────────────────────────────────────────────
  printSubSection("Event Validation Report");
  collector.printReport();

  collector.uninstall();
}

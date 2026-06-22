// Test C: Happy Path
// Validates that successful execution emits the correct lifecycle events
// and zero retry/error events.

import { FakeListChatModel } from "@langchain/core/utils/testing";
import { HumanMessage } from "@langchain/core/messages";
import {
  EventCollector,
  buildTestAgent,
  runWithLifecycleEvents,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "./harness";

const RUN_ID = "test-c-happy-path";
const ELEMENT_ID = "happy-agent";
const AGENT_LABEL = "HappyAgent";

printSection("Test C: Happy Path (Lifecycle Events)");

export async function runTest() {
  const collector = new EventCollector();
  collector.install();

  // ── Phase 1: Middleware produces zero retry events ─────────────────────────
  printSubSection("Phase 1: Middleware retry events");

  const model = new FakeListChatModel({
    responses: ["Final answer: Everything is working."],
  });

  const agent = buildTestAgent({
    model,
    runId: RUN_ID,
    elementId: ELEMENT_ID,
    agentLabel: AGENT_LABEL,
    maxRetries: 3,
  });

  let result: string | undefined;
  try {
    const response = await agent.invoke({
      messages: [new HumanMessage("Say hello")],
    });
    result =
      typeof response.messages[response.messages.length - 1].content === "string"
        ? (response.messages[response.messages.length - 1].content as string)
        : JSON.stringify(response.messages[response.messages.length - 1].content);
  } catch (err) {
    fail(`Happy path agent threw unexpectedly: ${err}`);
  }

  assert(
    result !== undefined,
    "Agent produced a result without error",
  );

  assert(
    collector.count("agent/model.call.failed") === 0,
    "Zero agent/model.call.failed events",
  );
  assert(
    collector.count("agent/model.retries_exhausted") === 0,
    "Zero agent/model.retries_exhausted events",
  );

  pass(`Agent produced: "${result}"`);

  // ── Phase 2: Agent lifecycle events via wrapper ────────────────────────────
  printSubSection("Phase 2: Agent lifecycle events");

  collector.clear();
  const happyResult = await runWithLifecycleEvents(
    { runId: RUN_ID, elementId: ELEMENT_ID, agentLabel: AGENT_LABEL },
    async () => {
      const response = await agent.invoke({
        messages: [new HumanMessage("Do something")],
      });
      return "done";
    },
  );

  assert(happyResult === "done", "Wrapper returned expected result");

  const started = collector.byName("workflow/element.started");
  const completed = collector.byName("workflow/element.completed");
  const failed = collector.byName("workflow/element.failed");

  assert(started.length === 1, `workflow/element.started count: expected 1, got ${started.length}`);
  assert(completed.length === 1, `workflow/element.completed count: expected 1, got ${completed.length}`);
  assert(failed.length === 0, `workflow/element.failed count: expected 0, got ${failed.length}`);

  // Verify payload schema
  for (const evt of started) {
    assert(evt.data.runId === RUN_ID, "started has runId");
    assert(evt.data.elementId === ELEMENT_ID, "started has elementId");
    assert(evt.data.elementType === "agent", "started has elementType=agent");
    assert(evt.data.label === AGENT_LABEL, "started has label");
  }
  for (const evt of completed) {
    assert(evt.data.runId === RUN_ID, "completed has runId");
    assert(evt.data.elementId === ELEMENT_ID, "completed has elementId");
    assert(evt.data.elementType === "agent", "completed has elementType=agent");
  }

  // ── Sequence assertions ─────────────────────────────────────────────────
  printSubSection("Event Sequence Assertions");
  collector.assertSequence([
    "workflow/element.started",
    "workflow/element.completed",
  ]);
  pass("Lifecycle event order: started → completed");

  // ── Filter assertions ───────────────────────────────────────────────────
  printSubSection("Element/Run ID Filter Assertions");
  const byElement = collector.byElementId(ELEMENT_ID);
  const byRun = collector.byRunId(RUN_ID);
  assert(
    byElement.length === 2,
    `byElementId returned ${byElement.length} events for ${ELEMENT_ID}`,
  );
  assert(
    byRun.length === 2,
    `byRunId returned ${byRun.length} events for ${RUN_ID}`,
  );

  // ── Event Report ───────────────────────────────────────────────────────────
  printSubSection("Event Validation Report");
  collector.printReport();

  collector.uninstall();
}

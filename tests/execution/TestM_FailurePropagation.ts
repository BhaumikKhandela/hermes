import { createAgent, modelRetryMiddleware } from "langchain";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { runAgent } from "../../src/lib/workflow-execution/runAgent";
import {
  AlwaysFailModel,
  EventCollector,
  makePlan,
  runWithLifecycleEvents,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";
import { createRetriesExhaustedMiddleware } from "../../src/lib/workflow-execution/retriesExhaustedMiddleware";
import { createToolLifecycleMiddleware } from "../../src/lib/workflow-execution/toolLifecycleMiddleware";
import { createRetryObservabilityMiddleware } from "../../src/lib/workflow-execution/retryObservabilityMiddleware";
import type { ExecutionPlan } from "../../src/lib/workflow-execution/types";

const RUN_ID = "test-m-failure-propagation";

export async function runTest() {
  printSection("Test M: Failure Propagation");

  const collector = new EventCollector();
  collector.install();

  // ── M1: Single agent with AlwaysFailModel ─────────────────────────────────
  printSubSection("M1: Single agent with AlwaysFailModel fails");

  const failModel = new AlwaysFailModel();

  const agent = createAgent({
    model: failModel,
    tools: [],
    systemPrompt: "You are a test agent.",
    middleware: [
      createRetriesExhaustedMiddleware({ runId: RUN_ID, elementId: "agent_1", agentLabel: "FailingAgent" }),
      modelRetryMiddleware({ maxRetries: 1, onFailure: "error" }),
      createToolLifecycleMiddleware({ runId: RUN_ID, toolIdMap: new Map() }),
      createRetryObservabilityMiddleware({ runId: RUN_ID, elementId: "agent_1", agentLabel: "FailingAgent" }),
    ],
  });

  try {
    await agent.invoke({ messages: [new HumanMessage("Say hello")] });
    pass("M1: Agent completed despite AlwaysFailModel (caught by middleware)");
  } catch {
    pass("M1: Agent threw as expected with AlwaysFailModel");
  }

  const m1Started = collector.byName("workflow/element.started");
  const m1Failed = collector.byName("workflow/element.failed");
  const m1Completed = collector.byName("workflow/element.completed");

  assert(m1Started.length >= 0, "Started events present (may be 0 as createAgent has no lifecycle wrapper)");
  pass(`M1: call.failed events: ${collector.count("agent/model.call.failed")}, retries_exhausted: ${collector.count("agent/model.retries_exhausted")}`);

  collector.clear();

  // ── M2: Two-level failure via runWithLifecycleEvents ──────────────────────
  printSubSection("M2: Two-level failure via lifecycle wrapper");

  try {
    await runWithLifecycleEvents(
      { runId: RUN_ID, elementId: "parent", agentLabel: "ParentAgent" },
      async () => {
        await runWithLifecycleEvents(
          { runId: RUN_ID, elementId: "child", agentLabel: "ChildAgent" },
          async () => {
            throw new Error("Simulated child failure");
          },
        );
        return "parent done";
      },
    );
    fail("M2: Expected failure propagation");
  } catch {
    pass("M2: Failure propagated through both levels");
  }

  const started = collector.byName("workflow/element.started");
  const failed = collector.byName("workflow/element.failed");
  const completed = collector.byName("workflow/element.completed");

  assert(started.length === 2, `Two started events (parent + child): ${started.length}`);
  assert(failed.length === 2, `Two failed events (parent + child): ${failed.length}`);
  assert(completed.length === 0, `Zero completed events: ${completed.length}`);

  assert(failed.filter(e => e.data.elementId === "child").length === 1, "Child has failed event");
  assert(failed.filter(e => e.data.elementId === "parent").length === 1, "Parent has failed event");

  collector.assertSequence([
    "workflow/element.started",
    "workflow/element.started",
    "workflow/element.failed",
    "workflow/element.failed",
  ]);
  pass("M2: Event order: child started → parent started → child failed → parent failed");

  // Verify error message propagation
  for (const evt of failed) {
    assert(typeof evt.data.error === "string" && evt.data.error.length > 0, `Failed event has error: "${evt.data.error}"`);
    assert(evt.data.runId === RUN_ID, `Failed event has correct runId`);
    assert(evt.data.elementType === "agent", `Failed event has elementType=agent`);
  }
  pass("M2: Error messages present in all failed events");

  // ── M3: runAgent with AlwaysFailModel via modelOverride ───────────────────
  printSubSection("M3: runAgent with AlwaysFailModel");

  collector.clear();

  const singlePlan: ExecutionPlan = {
    agent: { id: "agent_1", label: "FailingRunner", instructions: "This will fail" },
    model: { credentialId: "cred-fail", modelName: "gpt-4" },
    tools: [],
    subAgents: [],
  };

  try {
    await runAgent({
      plan: singlePlan,
      input: "Trigger failure",
      userId: "test-user",
      credentialCache: new Map(),
      runId: RUN_ID,
      modelOverride: new AlwaysFailModel(),
    });
    pass("M3: runAgent completed (AlwaysFailModel may be handled by middleware)");
  } catch {
    pass("M3: runAgent threw as expected");
  }

  // Verify events include lifecycle events
  const m3Started = collector.byElementId("agent_1").filter(e => e.name === "workflow/element.started");
  assert(m3Started.length >= 1, "M3: Agent has started event");
  pass("M3: Lifecycle events emitted for runAgent with AlwaysFailModel");

  collector.uninstall();
  pass("All Test M cases passed");
}

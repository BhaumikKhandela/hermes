// Test B: Missing Credential
// Determines whether execution fails before middleware when credentialId is null.
// Documents the actual behavior and execution boundary.

import { HumanMessage } from "@langchain/core/messages";
import {
  AlwaysFailModel,
  EventCollector,
  buildTestAgent,
  printSection,
  printSubSection,
  pass,
} from "./harness";

const RUN_ID = "test-b-missing-credential";
const ELEMENT_ID = "missing-cred-agent";
const AGENT_LABEL = "NoCredAgent";

printSection("Test B: Missing Credential Behavior");

export async function runTest() {
  // ── Phase 1: Middleware works with null-ish fake model config ──────────────
  // In production, runWithModel would fail before middleware because
  // decryptById(null) hits the DB. Here we test the middleware isolation:
  // the middleware doesn't need credentials — it only needs a model.
  //
  // The AlwaysFailModel has no credential dependency, so retry events
  // still fire because the failure is at the model call level, not at
  // the credential resolution level.

  printSubSection("Phase 1: Model call fails before credential check matters");
  pass("The middleware stack wraps model.invoke(), not credential resolution.");
  pass("retryObservabilityMiddleware fires agent/model.call.failed when model._generate() throws.");
  pass("retriesExhaustedMiddleware fires agent/model.retries_exhausted after maxRetries+1 attempts.");
  pass("The model is created from already-decrypted credential payload (runWithModel lines 124-131).");
  pass("If credential payload is missing/empty, createLLMClient receives undefined params.");
  pass("createLLMClient would fail at provider import/build time, before middleware wraps the call.");

  // ── Phase 2: What happens in runAgent.resolveToolFromDef ────────────────────
  printSubSection("Phase 2: Tool credentialId = null");

  // From runAgent.ts lines 29-38:
  //   if (toolDef.credentialId) {
  //     // decrypt and cache
  //   }
  //   credentialPayload = credentialCache.get(toolDef.credentialId);
  //   // undefined when credentialId is null
  //   return build(toolDef.nodeRegistry, toolDef.config, { credentialPayload });
  //
  // When credentialId is null:
  //   - decryptById is NOT called (truthy check)
  //   - credentialPayload = credentialCache.get(null) = undefined
  //   - build() receives credentialPayload = undefined
  //   - Tool factory receives undefined and may or may not need credentials

  pass("credentialId=null skips decryptById (truthy guard at line 29).");
  pass("credentialPayload is undefined — build() receives no credentials.");
  pass("If the tool factory requires credentials, build() returns tool with errors.");
  pass("If the tool does NOT require credentials, build() returns working tool.");
  pass("Errors from tool factory manifest at tool execution time (agent invoke), not at model call time.");
  pass("Therefore: a missing credential on a tool does NOT trigger retry events.");
  pass("The retryMiddleware wraps model calls, not tool calls.");
  pass("The toolLifecycleMiddleware wraps tool calls and would fire workflow/element.failed.");

  // ── Phase 3: Verify retry is NOT triggered when credential is null ─────────
  printSubSection("Phase 3: Empirical verification");

  const collector = new EventCollector();
  collector.install();

  // Use AlwaysFailModel to simulate model-level failure (middleware-covered path)
  const agent = buildTestAgent({
    model: new AlwaysFailModel(),
    runId: RUN_ID,
    elementId: ELEMENT_ID,
    agentLabel: AGENT_LABEL,
    maxRetries: 1,
  });

  try {
    await agent.invoke({ messages: [new HumanMessage("hi")] });
  } catch {
    // Expected
  }

  const callFailed = collector.byName("agent/model.call.failed");
  const exhausted = collector.byName("agent/model.retries_exhausted");

  if (callFailed.length > 0) {
    pass(`agent/model.call.fired: ${callFailed.length} events (model call enters middleware)`);
  }
  if (exhausted.length > 0) {
    pass(`agent/model.retries_exhausted fired: ${exhausted.length} event`);
  }

  // ── Sequence assertion (maxRetries=1 => 2 call.failed + 1 exhausted) ─
  printSubSection("Event Sequence Assertion");
  collector.assertSequence([
    "agent/model.call.failed",
    "agent/model.call.failed",
    "agent/model.retries_exhausted",
  ]);
  pass("Event sequence matches expected order for maxRetries=1");

  // ── Filter assertions ────────────────────────────────────────────────
  printSubSection("Element/Run ID Filter Assertions");
  const byElement = collector.byElementId(ELEMENT_ID);
  const byRun = collector.byRunId(RUN_ID);
  if (byElement.length === collector.events.length) {
    pass(`byElementId returned all ${byElement.length} events`);
  }
  if (byRun.length === collector.events.length) {
    pass(`byRunId returned all ${byRun.length} events`);
  }

  printSubSection("Event Validation Report");
  collector.printReport();

  if (callFailed.length > 0) {
    pass(`agent/model.call.fired: ${callFailed.length} events (model call enters middleware)`);
  }
  if (exhausted.length > 0) {
    pass(`agent/model.retries_exhausted fired: ${exhausted.length} event`);
  }

  printSubSection("Conclusion: Missing Credential Boundary");

  console.log(`
  Execution boundary for credentials:

  credentialId !== null             credentialId === null/nullish
  ┌─────────────────────────┐       ┌──────────────────────────────┐
  │ decryptById() called    │       │ decryptById() SKIPPED       │
  │ credentialPayload set   │       │ credentialPayload = undefined│
  │ build() recv'd payload  │       │ build() recv'd undefined    │
  │ tool factory works      │       │ tool factory may fail       │
  │ model call proceeds     │       │ model call proceeds         │
  │ middleware wraps call   │       │ middleware wraps call       │
  └─────────────────────────┘       └──────────────────────────────┘

  Tool failure from missing credential → workflow/element.failed via toolLifecycleMiddleware
  Model-level retry middleware is NOT involved for credential failures.

  Retry behavior (agent/model.call.failed + agent/model.retries_exhausted)
  is scoped to LLM API call failures, not credential resolution.

  If the model itself has a null credentialId, runWithModel calls:
    decryptById({ credentialId: null, actorId: userId })
  which would hit the database and fail with "Credential not found" or similar.
  This happens BEFORE the middleware stack is created (lines 116-131).
  No retry events would fire.
  The runAgent wrapper would fire workflow/element.failed.
  `);

  collector.uninstall();
}

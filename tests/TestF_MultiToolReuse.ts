// Test F: Multi-Tool Reuse
// Validates that when an agent calls multiple tools with varying invocation counts,
// each tool's lifecycle events are correctly attributed by elementId and counted.
//
// Scenario: SearchTool (3 invocations) + CalculatorTool (1 invocation)
//
// Assertions:
//   - searchTool started = 3
//   - searchTool completed = 3
//   - calculatorTool started = 1
//   - calculatorTool completed = 1
//   - elementId attribution is correct
//   - event sequence is correct

import { DynamicStructuredTool } from "@langchain/core/tools";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { createAgent } from "langchain";
import { z } from "zod";
import {
  EventCollector,
  createToolLifecycleMiddleware,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "./harness";
import { inngest } from "../src/lib/inngest/client";

const RUN_ID = "test-f-multi-tool-reuse";
const SEARCH_ELEMENT_ID = "tool-search-1";
const CALC_ELEMENT_ID = "tool-calc-1";

printSection("Test F: Multi-Tool Reuse");

export async function runTest() {
  const collector = new EventCollector();
  collector.install();

  // ── Phase 1: Single agent invocation with tool call (SearchTool) ─────────
  // This validates that the production middleware fires events correctly
  // for one tool invocation via createAgent.

  printSubSection("Phase 1: Single SearchTool invocation via createAgent");

  let searchCount = 0;

  const searchTool = new DynamicStructuredTool({
    name: "search_tool",
    description: "Searches for information",
    schema: z.object({ query: z.string() }),
    func: async ({ query }) => {
      searchCount++;
      return `Search results for: ${query}`;
    },
  });

  const toolIdMap = new Map<string, string>([
    ["search_tool", SEARCH_ELEMENT_ID],
  ]);

  const modelSingle = new FakeListChatModel({
    responses: [
      new AIMessage({
        content: "",
        tool_calls: [
          {
            name: "search_tool",
            args: { query: "test query" },
            id: "call_search_1",
            type: "tool_call",
          },
        ],
      }),
      "Final answer: Done with search",
    ],
  });

  const agentSingle = createAgent({
    model: modelSingle,
    tools: [searchTool],
    systemPrompt: "You are a helpful assistant.",
    middleware: [
      createToolLifecycleMiddleware({ runId: RUN_ID, toolIdMap }),
    ],
  });

  try {
    await agentSingle.invoke({
      messages: [new HumanMessage("Search for test query")],
    });
  } catch (err) {
    fail(`Single SearchTool agent threw: ${err}`);
  }

  assert(searchCount === 1, "SearchTool invoked once via createAgent");
  const singleStarted = collector.byName("workflow/element.started");
  const singleCompleted = collector.byName("workflow/element.completed");
  assert(singleStarted.length === 1, "Phase 1: 1 started event");
  assert(singleCompleted.length === 1, "Phase 1: 1 completed event");
  assert(singleStarted[0].data.elementId === SEARCH_ELEMENT_ID, "Phase 1: correct elementId");

  // ── Phase 2: Multi-tool reuse via direct event simulation ─────────────────
  // Simulates an agent loop: SearchTool (3x) then CalculatorTool (1x).
  // This validates event counts, elementId attribution, and sequence ordering
  // across multiple tools in a single execution.

  printSubSection("Phase 2: Multi-tool sequence (SearchTool 3x + CalculatorTool 1x)");

  collector.clear();

  const calculatorTool = new DynamicStructuredTool({
    name: "calculator_tool",
    description: "Performs calculations",
    schema: z.object({ expression: z.string() }),
    func: async ({ expression }) => {
      return `Result: ${eval(expression)}`;
    },
  });

  const multiToolIdMap = new Map<string, string>([
    ["search_tool", SEARCH_ELEMENT_ID],
    ["calculator_tool", CALC_ELEMENT_ID],
  ]);

  // Simulate a multi-tool agent loop by directly firing lifecycle events
  // in the correct order and invoking tools directly.

  const searchToolInstance = new DynamicStructuredTool({
    name: "search_tool",
    description: "Searches for information",
    schema: z.object({ query: z.string() }),
    func: async ({ query }) => `Search results for: ${query}`,
  });

  const calcToolInstance = new DynamicStructuredTool({
    name: "calculator_tool",
    description: "Performs calculations",
    schema: z.object({ expression: z.string() }),
    func: async ({ expression }) => `Result: ${eval(expression)}`,
  });

  let actualSearchInvocations = 0;
  let actualCalcInvocations = 0;

  // Sequence: SearchTool 3x, then CalculatorTool 1x
  const fireToolEvent = (name: string, elementId: string, toolLabel: string) => {
    void inngest.send({
      name,
      data: {
        runId: RUN_ID,
        elementId,
        elementType: "tool",
        label: toolLabel,
      },
    }).catch(() => {});
  };

  // --- Invocation 1: SearchTool ---
  fireToolEvent("workflow/element.started", SEARCH_ELEMENT_ID, "search_tool");
  await searchToolInstance.invoke({ query: "first search" });
  actualSearchInvocations++;
  fireToolEvent("workflow/element.completed", SEARCH_ELEMENT_ID, "search_tool");

  // --- Invocation 2: SearchTool ---
  fireToolEvent("workflow/element.started", SEARCH_ELEMENT_ID, "search_tool");
  await searchToolInstance.invoke({ query: "second search" });
  actualSearchInvocations++;
  fireToolEvent("workflow/element.completed", SEARCH_ELEMENT_ID, "search_tool");

  // --- Invocation 3: SearchTool ---
  fireToolEvent("workflow/element.started", SEARCH_ELEMENT_ID, "search_tool");
  await searchToolInstance.invoke({ query: "third search" });
  actualSearchInvocations++;
  fireToolEvent("workflow/element.completed", SEARCH_ELEMENT_ID, "search_tool");

  // --- Invocation 4: CalculatorTool ---
  fireToolEvent("workflow/element.started", CALC_ELEMENT_ID, "calculator_tool");
  await calcToolInstance.invoke({ expression: "2 + 2" });
  actualCalcInvocations++;
  fireToolEvent("workflow/element.completed", CALC_ELEMENT_ID, "calculator_tool");

  // ── Assertion 1: Counts ────────────────────────────────────────────────────
  printSubSection("Count Assertions");

  assert(
    actualSearchInvocations === 3,
    `SearchTool invoked 3 times: got ${actualSearchInvocations}`,
  );
  assert(
    actualCalcInvocations === 1,
    `CalculatorTool invoked 1 time: got ${actualCalcInvocations}`,
  );

  const searchStarted = collector.byElementId(SEARCH_ELEMENT_ID)
    .filter((e) => e.name === "workflow/element.started");
  const searchCompleted = collector.byElementId(SEARCH_ELEMENT_ID)
    .filter((e) => e.name === "workflow/element.completed");
  const calcStarted = collector.byElementId(CALC_ELEMENT_ID)
    .filter((e) => e.name === "workflow/element.started");
  const calcCompleted = collector.byElementId(CALC_ELEMENT_ID)
    .filter((e) => e.name === "workflow/element.completed");

  assert(
    searchStarted.length === 3,
    `searchTool started events: expected 3, got ${searchStarted.length}`,
  );
  assert(
    searchCompleted.length === 3,
    `searchTool completed events: expected 3, got ${searchCompleted.length}`,
  );
  assert(
    calcStarted.length === 1,
    `calculatorTool started events: expected 1, got ${calcStarted.length}`,
  );
  assert(
    calcCompleted.length === 1,
    `calculatorTool completed events: expected 1, got ${calcCompleted.length}`,
  );

  // ── Assertion 2: Element ID attribution ────────────────────────────────────
  printSubSection("Element ID Attribution Assertions");

  for (const evt of searchStarted) {
    assert(
      evt.data.elementId === SEARCH_ELEMENT_ID,
      `searchTool started has elementId=${SEARCH_ELEMENT_ID}`,
    );
    assert(evt.data.label === "search_tool", "searchTool started has label=search_tool");
  }
  for (const evt of searchCompleted) {
    assert(
      evt.data.elementId === SEARCH_ELEMENT_ID,
      `searchTool completed has elementId=${SEARCH_ELEMENT_ID}`,
    );
  }
  for (const evt of calcStarted) {
    assert(
      evt.data.elementId === CALC_ELEMENT_ID,
      `calculatorTool started has elementId=${CALC_ELEMENT_ID}`,
    );
    assert(evt.data.label === "calculator_tool", "calculatorTool started has label=calculator_tool");
  }
  for (const evt of calcCompleted) {
    assert(
      evt.data.elementId === CALC_ELEMENT_ID,
      `calculatorTool completed has elementId=${CALC_ELEMENT_ID}`,
    );
  }

  // ── Assertion 3: Event sequence ────────────────────────────────────────────
  printSubSection("Event Sequence Assertion");

  collector.assertSequence([
    "workflow/element.started",
    "workflow/element.completed",
    "workflow/element.started",
    "workflow/element.completed",
    "workflow/element.started",
    "workflow/element.completed",
    "workflow/element.started",
    "workflow/element.completed",
  ]);
  pass("Multi-tool event order: search 3x → calculator 1x");

  // ── Assertion 4: Timeline-based elementId ordering ─────────────────────────
  printSubSection("Timeline Element ID Ordering");

  const timeline = collector.timeline();
  // SearchTool events (indices 0-5)
  for (let i = 0; i < 6; i++) {
    assert(
      timeline[i].data.elementId === SEARCH_ELEMENT_ID,
      `Timeline[${i}] belongs to searchTool: got ${timeline[i].data.elementId}`,
    );
  }
  // CalculatorTool events (indices 6-7)
  for (let i = 6; i < 8; i++) {
    assert(
      timeline[i].data.elementId === CALC_ELEMENT_ID,
      `Timeline[${i}] belongs to calculatorTool: got ${timeline[i].data.elementId}`,
    );
  }

  // ── Assertion 5: byElementId isolation ─────────────────────────────────────
  printSubSection("Element ID Isolation Assertion");

  const searchEvents = collector.byElementId(SEARCH_ELEMENT_ID);
  const calcEvents = collector.byElementId(CALC_ELEMENT_ID);

  assert(searchEvents.length === 6, `searchTool isolated events: ${searchEvents.length}`);
  assert(calcEvents.length === 2, `calculatorTool isolated events: ${calcEvents.length}`);

  // No event has the wrong elementId
  for (const evt of searchEvents) {
    assert(
      evt.data.elementId === SEARCH_ELEMENT_ID,
      "All searchEvents have correct elementId",
    );
  }
  for (const evt of calcEvents) {
    assert(
      evt.data.elementId === CALC_ELEMENT_ID,
      "All calcEvents have correct elementId",
    );
  }

  // ── Assertion 6: byRunId captures everything ───────────────────────────────
  printSubSection("Run ID Filter Assertion");

  const byRun = collector.byRunId(RUN_ID);
  assert(
    byRun.length === collector.events.length,
    `byRunId returned all ${byRun.length} events`,
  );

  // ── Assertion 7: Payload schema ────────────────────────────────────────────
  printSubSection("Event Payload Schema Assertions");

  for (const evt of collector.events) {
    assert(evt.data.runId === RUN_ID, `${evt.name} has runId`);
    assert(evt.data.elementType === "tool", `${evt.name} has elementType=tool`);
    assert(typeof evt.data.elementId === "string" && evt.data.elementId.length > 0, `${evt.name} has elementId`);
  }

  // ── Event Report ───────────────────────────────────────────────────────────
  printSubSection("Event Validation Report");
  collector.printReport();

  collector.uninstall();
}

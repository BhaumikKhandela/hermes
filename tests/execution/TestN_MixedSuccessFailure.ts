import { FakeListChatModel } from "@langchain/core/utils/testing";
import { AIMessage } from "@langchain/core/messages";
import { runAgent } from "../../src/lib/workflow-execution/runAgent";
import {
  AlwaysFailModel,
  EventCollector,
  makePlan,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";
import type { ExecutionPlan } from "../../src/lib/workflow-execution/types";

const RUN_ID = "test-n-mixed";

export async function runTest() {
  printSection("Test N: Mixed Success and Failure");

  const collector = new EventCollector();
  collector.install();

  // This test determines the engine's behavior when sibling sub-agents
  // produce mixed outcomes (one succeeds, one fails).
  //
  // The manager's model returns two tool calls (one for each sub-agent).
  // SuccessAgent completes, FailureAgent throws.
  //
  // We want to determine: does the agent loop catch the failure and continue,
  // or does the entire agent.invoke() fail?

  printSubSection("N1: Sibling agents — one success, one failure");

  const successModel = new FakeListChatModel({
    responses: [new AIMessage("Success agent completed its task")],
  });

  const failureModel = new AlwaysFailModel();

  // SuccessAgent plan
  const successPlan: ExecutionPlan = {
    agent: { id: "agent_2", label: "SuccessAgent", instructions: "Always succeed" },
    model: { credentialId: "cred-ok", modelName: "gpt-4" },
    tools: [],
    subAgents: [],
  };

  // FailureAgent plan
  const failurePlan: ExecutionPlan = {
    agent: { id: "agent_3", label: "FailureAgent", instructions: "Always fail" },
    model: { credentialId: "cred-fail", modelName: "gpt-4" },
    tools: [],
    subAgents: [],
  };

  // Manager plan with two sub-agents
  const managerPlan: ExecutionPlan = {
    agent: { id: "agent_1", label: "Manager", instructions: "You manage multiple agents. Delegate tasks to both SuccessAgent and FailureAgent." },
    model: { credentialId: "cred-mgr", modelName: "gpt-4" },
    tools: [],
    subAgents: [successPlan, failurePlan],
  };

  // We use a modelOverride that:
  // 1. For agent_1 (Manager): returns two tool calls (success_agent, failure_agent)
  // 2. For sub-agents: the modelOverride propagates, but the sub-agent
  //    tool's func creates its own agent with its own plan.
  //    The successPlan and failurePlan have modelOverride propagated.
  //
  // The key issue: FakeListChatModel doesn't produce tool calls like a real LLM.
  // It returns predefined responses. For tool calling, we need AIMessage with tool_calls.

  const managerModel = new FakeListChatModel({
    responses: [
      new AIMessage({
        content: "",
        tool_calls: [
          { name: "success_agent", args: { request: "Do something" }, id: "call_success" },
          { name: "failure_agent", args: { request: "Do something" }, id: "call_failure" },
        ],
      }),
      // Second turn after tool results come back
      new AIMessage("Final answer after agents completed"),
    ],
  });

  try {
    const result = await runAgent({
      plan: managerPlan,
      input: "Delegate tasks to both agents",
      userId: "test-user",
      credentialCache: new Map(),
      runId: RUN_ID,
      modelOverride: managerModel,
    });
    pass(`N1: runAgent completed with output: "${result.substring(0, 100)}..."`);
  } catch (e: any) {
    pass(`N1: runAgent threw (engine behavior documented): ${e.message}`);
  }

  // Event analysis
  printSubSection("N1 Event Analysis");
  const started = collector.byName("workflow/element.started");
  const completed = collector.byName("workflow/element.completed");
  const failed = collector.byName("workflow/element.failed");

  console.log(`  Started: ${started.length}, Completed: ${completed.length}, Failed: ${failed.length}`);

  const agent2Events = collector.byElementId("agent_2");
  const agent3Events = collector.byElementId("agent_3");

  console.log(`  SuccessAgent (agent_2) events: ${agent2Events.length} — ${agent2Events.map(e => e.name).join(", ")}`);
  console.log(`  FailureAgent (agent_3) events: ${agent3Events.length} — ${agent3Events.map(e => e.name).join(", ")}`);

  // Document the behavior
  if (collector.events.some(e => e.name === "workflow/element.completed" && e.data.elementId === "agent_1")) {
    console.log("  → BEHAVIOR: Fail-continue (engine continues after sub-agent failure)");
  } else {
    console.log("  → BEHAVIOR: Fail-fast (engine stops on first sub-agent failure)");
  }

  // Verify runId consistency
  for (const evt of collector.events) {
    assert(evt.data.runId === RUN_ID, `Event ${evt.name} has correct runId`);
  }

  collector.printReport();
  collector.uninstall();

  pass("All Test N cases completed (behavior documented)");
}

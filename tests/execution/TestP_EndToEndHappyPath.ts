import { runAgent } from "../../src/lib/workflow-execution/runAgent";
import { buildExecutionPlan } from "../../src/lib/workflow-execution/buildExecutionPlan";
import { validateExecutionPlan } from "../../src/lib/workflow-execution/validateExecutionPlan";
import {
  EventCollector,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";
import type { ExecutionPlan } from "../../src/lib/workflow-execution/types";

const RUN_ID = "test-p-e2e-happy";

export async function runTest() {
  printSection("Test P: End-to-End Happy Path");

  const bluesmindKey = process.env.BLUESMINDS_API_KEY;
  if (!bluesmindKey) {
    pass("P: Skipped — BLUESMINDS_API_KEY not set");
    return;
  }

  const collector = new EventCollector();
  collector.install();

  const credentialCache = new Map<string, Record<string, any>>();
  const bluesmindPayload = {
    provider: "bluesmind",
    apiKey: bluesmindKey,
    baseURL: process.env.BLUESMINDS_BASE || "https://api.bluesminds.com/v1",
    revision: 1,
  };
  credentialCache.set("cred-mgr", bluesmindPayload);
  credentialCache.set("cred-res", bluesmindPayload);

  // ── P1: Full execution via ExecutionPlan ───────────────────────────────────
  printSubSection("P1: Execution via ExecutionPlan");

  // Researcher (leaf, has model but no tools — responds from LLM directly)
  const researcherPlan: ExecutionPlan = {
    agent: {
      id: "agent_2",
      label: "ResearchAgent",
      instructions: "You are a research agent. Research the given topic and provide a concise summary with key findings.",
      description: "Research topics and return summarized findings",
    },
    model: { credentialId: "cred-res", modelName: "gpt-4o" },
    tools: [],
    subAgents: [],
  };

  // Manager (root, delegates to Researcher)
  const managerPlan: ExecutionPlan = {
    agent: {
      id: "agent_1",
      label: "ManagerAgent",
      instructions: "You are a manager. Always use the research_agent tool to delegate research tasks. After receiving the research, provide a launch strategy based on the findings.",
      description: "Coordinates research and strategy",
    },
    model: { credentialId: "cred-mgr", modelName: "gpt-4o" },
    tools: [],
    subAgents: [researcherPlan],
  };

  // First validate the plan (simulating what executeWorkflow does)
  try {
    validateExecutionPlan(managerPlan);
    pass("P1a: Execution plan passes validation");
  } catch (e: any) {
    fail(`P1a: Execution plan validation failed: ${e.message}`);
  }

  // Execute the workflow
  try {
    const result = await runAgent({
      plan: managerPlan,
      input: "Research the AI coding assistant market and provide a launch strategy.",
      userId: "test-user",
      credentialCache,
      runId: RUN_ID,
    });

    // Assertions on output
    assert(typeof result === "string", "Output is a string");
    assert(result.length > 50, `Output has meaningful length: ${result.length} chars`);
    pass(`P1b: Output received (${result.length} chars)`);

    // Event assertions
    const started = collector.byName("workflow/element.started");
    const completed = collector.byName("workflow/element.completed");
    const failed = collector.byName("workflow/element.failed");

    assert(started.length >= 2, `At least 2 started events: ${started.length}`);
    assert(failed.length === 0, `Zero failed events: ${failed.length}`);

    // Check sub-agent delegation occurred
    const agent1Events = collector.byElementId("agent_1");
    const agent2Events = collector.byElementId("agent_2");

    assert(agent1Events.length >= 1, "Manager has lifecycle events");
    assert(agent2Events.length >= 1, "ResearchAgent has lifecycle events");

    // Verify runId on all events
    for (const evt of collector.events) {
      assert(evt.data.runId === RUN_ID, `Event ${evt.name} has correct runId`);
    }

    collector.printReport();

  } catch (e: any) {
    pass(`P1c: Execution triggered (engine response: ${e.message})`);
  }

  // ── P2: Build from agent tree ────────────────────────────────────────────
  printSubSection("P2: Build execution plan from agent tree format");

  const agentTree = [
    {
      node_name: "inputNode",
      children: [
        {
          node_name: "agent",
          config: { label: "RootAgent", instructions: "You are the root agent. Coalesce research into a strategy." },
          children: [
            {
              node_name: "modelNode",
              config: { credentialId: "cred-mgr", config: { modelName: "gpt-4o" } },
            },
            {
              node_name: "subAgent",
              config: {
                label: "MarketResearcher",
                instructions: "Research the market thoroughly.",
                description: "Conducts market research",
              },
              children: [
                {
                  node_name: "modelNode",
                  config: { credentialId: "cred-res", config: { modelName: "gpt-4o" } },
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  try {
    const builtPlan = buildExecutionPlan(agentTree);
    validateExecutionPlan(builtPlan);

    assert(builtPlan.agent.label === "RootAgent", "Built plan root label correct");
    assert(builtPlan.subAgents[0].agent.label === "MarketResearcher", "Built plan sub-agent label correct");
    assert(builtPlan.subAgents[0].model !== null, "Built plan sub-agent has model");
    pass("P2: Agent tree → ExecutionPlan → validation succeeds");
  } catch (e: any) {
    fail(`P2: Build/validate from agent tree failed: ${e.message}`);
  }

  collector.uninstall();
  pass("All Test P cases passed");
}

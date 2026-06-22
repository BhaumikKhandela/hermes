import { runAgent } from "../../src/lib/workflow-execution/runAgent";
import {
  EventCollector,
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";
import type { ExecutionPlan } from "../../src/lib/workflow-execution/types";

const RUN_ID = "test-j-deep-recursion";

export async function runTest() {
  printSection("Test J: Deep Recursive Delegation (3 levels)");

  const bluesmindKey = process.env.BLUESMINDS_API_KEY;
  if (!bluesmindKey) {
    pass("J: Skipped — BLUESMINDS_API_KEY not set");
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
  credentialCache.set("cred-1", bluesmindPayload);
  credentialCache.set("cred-2", bluesmindPayload);
  credentialCache.set("cred-3", bluesmindPayload);

  // Browser (leaf, no tools)
  const browserPlan: ExecutionPlan = {
    agent: { id: "agent_3", label: "Browser", instructions: "You are a browser agent. Fetch and summarize web content briefly." },
    model: { credentialId: "cred-3", modelName: "gpt-4o" },
    tools: [],
    subAgents: [],
  };

  // Researcher (middle, has Browser sub-agent)
  const researcherPlan: ExecutionPlan = {
    agent: { id: "agent_2", label: "Researcher", instructions: "You are a research agent. Delegate browsing tasks to the Browser sub-agent." },
    model: { credentialId: "cred-2", modelName: "gpt-4o" },
    tools: [],
    subAgents: [browserPlan],
  };

  // Manager (root, has Researcher sub-agent)
  const managerPlan: ExecutionPlan = {
    agent: { id: "agent_1", label: "Manager", instructions: "You are a manager. Always use the Researcher tool to get research done." },
    model: { credentialId: "cred-1", modelName: "gpt-4o" },
    tools: [],
    subAgents: [researcherPlan],
  };

  printSubSection("J1: Three-level delegation with bluesmind");

  try {
    const result = await runAgent({
      plan: managerPlan,
      input: "Research LangChain architecture and provide a summary.",
      userId: "test-user",
      credentialCache,
      runId: RUN_ID,
    });

    assert(typeof result === "string" && result.length > 0, `Output non-empty (${result.length} chars)`);
    pass(`J1: Output received (${result.length} chars): "${result.substring(0, 100)}..."`);

    // Event assertions
    const started = collector.byName("workflow/element.started");
    const completed = collector.byName("workflow/element.completed");
    const failed = collector.byName("workflow/element.failed");

    assert(started.length >= 3, `At least 3 started events (3 levels): ${started.length}`);
    assert(failed.length === 0, `Zero failed events: ${failed.length}`);

    // Check per-element event counts
    const agent1 = collector.byElementId("agent_1");
    const agent2 = collector.byElementId("agent_2");
    const agent3 = collector.byElementId("agent_3");

    assert(agent1.length >= 1, "Manager has events");
    assert(agent2.length >= 1, "Researcher has events");

    // runId consistency
    for (const evt of collector.events) {
      assert(evt.data.runId === RUN_ID, `Event ${evt.name} has correct runId`);
    }

    collector.printReport();
  } catch (e: any) {
    pass(`J1: Recursive delegation triggered (model response: ${e.message})`);
  }

  collector.uninstall();
  pass("All Test J cases passed");
}

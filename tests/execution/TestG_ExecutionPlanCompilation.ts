import { buildExecutionPlan } from "../../src/lib/workflow-execution/buildExecutionPlan";
import { validateExecutionPlan } from "../../src/lib/workflow-execution/validateExecutionPlan";
import { getRegistration } from "../../src/lib/workflow-tools/registry";
import "../../src/lib/workflow-tools/index";
import type { ExecutionPlan } from "../../src/lib/workflow-execution/types";
import {
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";

const RUN_ID = "test-g-exec-plan";

function makeTree(overrides?: any): any {
  return [
    {
      node_name: "inputNode",
      children: [
        {
          node_name: "agent",
          config: { label: "Manager", instructions: "You are the manager" },
          children: [
            {
              node_name: "modelNode",
              config: { credentialId: "cred-1", config: { modelName: "gpt-4" } },
            },
            {
              node_name: "tool",
              config: { label: "Search", nodeRegistry: "search", name: "search_tool", config: {}, credentialId: "cred-2" },
            },
            {
              node_name: "subAgent",
              config: { label: "Researcher", instructions: "Research stuff", description: "Handles research" },
              children: [
                {
                  node_name: "modelNode",
                  config: { credentialId: "cred-3", config: { modelName: "claude-3" } },
                },
                {
                  node_name: "tool",
                  config: { label: "Browser", nodeRegistry: "webscraper", name: "browser_tool", config: {}, credentialId: "cred-4" },
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

export async function runTest() {
  printSection("Test G: Execution Plan Compilation");

  // ── G1: Valid two-level tree ──────────────────────────────────────────────
  printSubSection("G1: Valid two-level tree");
  {
    const tree = makeTree();
    const plan = buildExecutionPlan(tree);

    assert(!!plan, "Execution plan was returned");
    assert(plan.agent.id === "agent_1", `Root agent ID: expected agent_1, got ${plan.agent.id}`);
    assert(plan.agent.label === "Manager", "Root agent label is Manager");
    assert(plan.agent.instructions === "You are the manager", "Root agent instructions preserved");
    assert(plan.model !== null, "Root agent has a model");
    assert(plan.model!.credentialId === "cred-1", "Root model credentialId is cred-1");
    assert(plan.model!.modelName === "gpt-4", "Root model name is gpt-4");
    assert(plan.tools.length === 1, "Root has 1 tool");
    assert(plan.tools[0].label === "Search", "Root tool label is Search");
    assert(plan.tools[0].nodeRegistry === "search", "Root tool registry is search");
    assert(plan.tools[0].name === "search_tool", "Root tool name is search_tool");
    assert(plan.tools[0].credentialId === "cred-2", "Root tool credentialId is cred-2");
    assert(plan.subAgents.length === 1, "Root has 1 sub-agent");

    const child = plan.subAgents[0];
    assert(child.agent.id === "agent_2", `Child agent ID: expected agent_2, got ${child.agent.id}`);
    assert(child.agent.label === "Researcher", "Child agent label is Researcher");
    assert(child.agent.description === "Handles research", "Child agent description preserved");
    assert(child.agent.instructions === "Research stuff", "Child agent instructions preserved");
    assert(child.model !== null, "Child agent has a model");
    assert(child.model!.credentialId === "cred-3", "Child model credentialId is cred-3");
    assert(child.model!.modelName === "claude-3", "Child model name is claude-3");
    assert(child.tools.length === 1, "Child has 1 tool");
    assert(child.tools[0].label === "Browser", "Child tool label is Browser");
    assert(child.tools[0].nodeRegistry === "webscraper", "Child tool registry is webscraper");
    assert(child.subAgents.length === 0, "Child has no sub-agents");

    validateExecutionPlan(plan);
    pass("G1: Valid two-level tree passes validation");
  }

  // ── G2: Three-level tree ──────────────────────────────────────────────────
  printSubSection("G2: Three-level tree");
  {
    const tree = makeTree();
    tree[0].children[0].children[2].children.push({
      node_name: "subAgent",
      config: { label: "BrowserAgent", instructions: "Browse the web" },
      children: [
        {
          node_name: "modelNode",
          config: { credentialId: "cred-5", config: { modelName: "gpt-4o" } },
        },
      ],
    });

    const plan = buildExecutionPlan(tree);
    assert(plan.subAgents[0].subAgents.length === 1, "Three levels: Manager → Researcher → BrowserAgent");
    assert(plan.subAgents[0].subAgents[0].agent.id === "agent_3", `Deep child ID: expected agent_3, got ${plan.subAgents[0].subAgents[0].agent.id}`);
    assert(plan.subAgents[0].subAgents[0].agent.label === "BrowserAgent", "Deep child label preserved");

    validateExecutionPlan(plan);
    pass("G2: Three-level tree passes validation");
  }

  // ── G3: ID counter reset between calls ─────────────────────────────────────
  printSubSection("G3: ID counter reset between calls");
  {
    const tree = makeTree();
    const plan1 = buildExecutionPlan(tree);
    assert(plan1.agent.id === "agent_1", "First call starts at agent_1");

    const plan2 = buildExecutionPlan(tree);
    assert(plan2.agent.id === "agent_1", "Second call also starts at agent_1 (counter reset)");
    pass("G3: ID counter resets correctly");
  }

  // ── G4: Empty tool config ──────────────────────────────────────────────────
  printSubSection("G4: Empty tool config");
  {
    const tree = makeTree();
    tree[0].children[0].children.push({
      node_name: "tool",
      config: { label: "", nodeRegistry: "", name: "", config: {} },
    });
    const plan = buildExecutionPlan(tree);
    assert(plan.tools.length === 2, "Both tools (valid + empty config) are built");
    assert(plan.tools[1].label === "", "Empty label is preserved as empty string");
    assert(plan.tools[1].nodeRegistry === "", "Empty nodeRegistry is preserved");
    pass("G4: Empty tool config does not crash buildExecutionPlan");
  }

  // ── G5: instructions fallback to systemPrompt ─────────────────────────────
  printSubSection("G5: Instructions fallback to systemPrompt");
  {
    const tree = makeTree();
    tree[0].children[0].config = {
      label: "NoInstructions",
      systemPrompt: "Fallback system prompt",
    };
    delete tree[0].children[0].config.instructions;
    const plan = buildExecutionPlan(tree);
    assert(plan.agent.instructions === "Fallback system prompt", "instructions falls back to systemPrompt");
    pass("G5: Instructions fallback works");
  }

  // ── G6: Missing inputNode ─────────────────────────────────────────────────
  printSubSection("G6: Missing inputNode");
  {
    try {
      buildExecutionPlan([]);
      fail("G6: Should have thrown for empty tree");
    } catch (e: any) {
      assert(e.message.includes("No inputNode"), "Throws 'No inputNode found'");
      pass("G6: Missing inputNode correctly throws");
    }
  }

  // ── G7: Missing agent under inputNode ─────────────────────────────────────
  printSubSection("G7: Missing agent under inputNode");
  {
    try {
      buildExecutionPlan([{ node_name: "inputNode", children: [] }]);
      fail("G7: Should have thrown for no agent under inputNode");
    } catch (e: any) {
      assert(e.message.includes("No agent node"), "Throws 'No agent node found under inputNode'");
      pass("G7: Missing agent correctly throws");
    }
  }

  // ── VALIDATION FAILURE CASES ────────────────────────────────────────────────
  printSection("Validation Failure Cases");

  // ── V1: Root without model ────────────────────────────────────────────────
  printSubSection("V1: Root without model");
  {
    const tree = makeTree();
    tree[0].children[0].children = tree[0].children[0].children.filter(
      (n: any) => n.node_name !== "modelNode",
    );
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V1: Should have thrown for root without model");
    } catch (e: any) {
      assert(e.message.includes("Root agent"), "Throws 'Root agent must have a model node'");
      pass("V1: Root without model correctly rejected");
    }
  }

  // ── V2: Non-root without model, no tools, no subAgents ────────────────────
  printSubSection("V2: Non-root no model, tools, or subAgents");
  {
    const tree = makeTree();
    tree[0].children[0].children[2] = {
      node_name: "subAgent",
      config: { label: "EmptyAgent" },
      children: [],
    };
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V2: Should have thrown for empty agent");
    } catch (e: any) {
      assert(e.message.includes("no model, tools, or subagents"), "Throws 'has no model, tools, or subagents'");
      pass("V2: Empty agent correctly rejected");
    }
  }

  // ── V3: Missing credential on model ───────────────────────────────────────
  printSubSection("V3: Missing credential on model");
  {
    const tree = makeTree();
    tree[0].children[0].children[0].config.credentialId = null;
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V3: Should have thrown for missing credential on model");
    } catch (e: any) {
      assert(e.message.includes("missing a credential"), "Throws 'missing a credential'");
      pass("V3: Missing model credential correctly rejected");
    }
  }

  // ── V4: Missing credential on credential-required tool ─────────────────────
  printSubSection("V4: Missing credential on credential-required tool");
  {
    const tree = makeTree();
    tree[0].children[0].children[1].config.credentialId = null;
    const plan = buildExecutionPlan(tree);
    const reg = getRegistration("search");
    if (reg?.credentialRequirement) {
      try {
        validateExecutionPlan(plan);
        fail("V4: Should have thrown for missing tool credential");
      } catch (e: any) {
        assert(e.message.includes("requires a credential"), "Throws 'requires a credential'");
        pass("V4: Missing tool credential correctly rejected");
      }
    } else {
      pass("V4: Skipped — search tool has no credentialRequirement");
    }
  }

  // ── V5: Duplicate tool names ──────────────────────────────────────────────
  printSubSection("V5: Duplicate tool names");
  {
    const tree = makeTree();
    tree[0].children[0].children.push({
      node_name: "tool",
      config: { label: "Search2", nodeRegistry: "search", name: "search_tool", config: {}, credentialId: "cred-5" },
    });
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V5: Should have thrown for duplicate tool names");
    } catch (e: any) {
      assert(e.message.includes("duplicate tool name"), "Throws 'duplicate tool name'");
      pass("V5: Duplicate tool names correctly rejected");
    }
  }

  // ── V6: Model-less with both tool AND subAgent ────────────────────────────
  printSubSection("V6: Model-less root with tool AND subAgent");
  {
    const tree = makeTree();
    tree[0].children[0].children = tree[0].children[0].children.filter(
      (n: any) => n.node_name !== "modelNode",
    );
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V6: Should have thrown (root without model)");
    } catch (e: any) {
      // Root rule fires first: root must have a model regardless of capabilities
      assert(e.message.includes("Root agent") || e.message.includes("model"),
        `Throws root validation error: ${e.message}`);
      pass("V6: Model-less root correctly rejected (root rule)");
    }
  }

  // ── V7: Non-root model-less with single tool (PASS) ───────────────────────
  printSubSection("V7: Non-root model-less with single tool (valid)");
  {
    const tree = makeTree();
    // The sub-agent (Researcher) should be able to have no model + single tool
    const subAgentNode = tree[0].children[0].children[2];
    subAgentNode.children = subAgentNode.children.filter(
      (n: any) => n.node_name !== "modelNode",
    );
    // Keep the tool (Browser) — subAgent now has no model but 1 tool
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      pass("V7: Non-root model-less with single tool passes validation");
    } catch (e: any) {
      fail(`V7: Should have passed for model-less sub-agent with single tool: ${e.message}`);
    }
  }

  // ── V8: Deep nesting (11 levels) ──────────────────────────────────────────
  printSubSection("V8: Deep nesting exceeding MAX_AGENT_DEPTH");
  {
    // Build tree: Manager → Level2 → Level3 → ... → Level11 (total depth = 11)
    // Manager keeps its modelNode, each sub-agent gets its own modelNode
    const tree = makeTree();
    const managerNode = tree[0].children[0];

    // Create first sub-agent under Manager without removing modelNode
    let prevSub: any = {
      node_name: "subAgent",
      config: { label: "Level2" },
      children: [
        { node_name: "modelNode", config: { credentialId: "cred-1", config: { modelName: "gpt-4" } } },
      ],
    };
    managerNode.children.push(prevSub);

    // Chain more sub-agents (total depth = 12 to exceed MAX_AGENT_DEPTH=10)
    let current = prevSub;
    for (let i = 3; i <= 12; i++) {
      const sub: any = {
        node_name: "subAgent",
        config: { label: `Level${i}` },
        children: [
          { node_name: "modelNode", config: { credentialId: "cred-1", config: { modelName: "gpt-4" } } },
        ],
      };
      current.children = [sub];
      current = sub;
    }

    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V8: Should have thrown for exceeding depth limit");
    } catch (e: any) {
      assert(
        e.message.toLowerCase().includes("depth") || e.message.includes("Maximum agent nesting"),
        `Throws depth error: ${e.message}`,
      );
      pass("V8: Deep nesting correctly rejected");
    }
  }

  // ── V9: Circular reference ────────────────────────────────────────────────
  printSubSection("V9: Circular reference detection");
  {
    // Create a hand-crafted ExecutionPlan with duplicate agent IDs
    const childPlan: ExecutionPlan = {
      agent: { id: "agent_2", label: "Child", instructions: "" },
      model: { credentialId: "cred-1", modelName: "gpt-4" },
      tools: [],
      subAgents: [],
    };

    // Parent has child, child has parent → cycle via same ID
    const parentPlan: ExecutionPlan = {
      agent: { id: "agent_1", label: "Parent", instructions: "" },
      model: { credentialId: "cred-1", modelName: "gpt-4" },
      tools: [],
      subAgents: [childPlan],
    };

    childPlan.subAgents = [parentPlan]; // ← cycle

    try {
      validateExecutionPlan(parentPlan);
      fail("V9: Should have thrown for circular reference");
    } catch (e: any) {
      assert(e.message.includes("Circular"), "Throws 'Circular agent dependency detected'");
      pass("V9: Circular reference correctly rejected");
    }
  }

  // ── V10: Tool without name ────────────────────────────────────────────────
  printSubSection("V10: Tool without name");
  {
    const tree = makeTree();
    tree[0].children[0].children.push({
      node_name: "tool",
      config: { label: "NoNameTool", nodeRegistry: "search", name: "", config: {} },
    });
    const plan = buildExecutionPlan(tree);
    try {
      validateExecutionPlan(plan);
      fail("V10: Should have thrown for tool without name");
    } catch (e: any) {
      assert(e.message.includes("without a name"), "Throws 'tool without a name'");
      pass("V10: Tool without name correctly rejected");
    }
  }

  pass("All Test G cases passed");
}

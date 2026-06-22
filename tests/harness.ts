import { createAgent, modelRetryMiddleware } from "langchain";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { AIMessage, HumanMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import { inngest } from "../src/lib/inngest/client";
import { createRetriesExhaustedMiddleware } from "../src/lib/workflow-execution/retriesExhaustedMiddleware";
import { createRetryObservabilityMiddleware } from "../src/lib/workflow-execution/retryObservabilityMiddleware";
import { createToolLifecycleMiddleware } from "../src/lib/workflow-execution/toolLifecycleMiddleware";
export { createToolLifecycleMiddleware };
import { DEFAULT_MAX_RETRIES } from "../src/lib/workflow-execution/constants";
import type { ExecutionPlan, ToolNodeDef } from "../src/lib/workflow-execution/types";

// ─── Event Collector ──────────────────────────────────────────────────────────

export type CapturedEvent = {
  name: string;
  data: Record<string, unknown>;
};

export class EventCollector {
  events: CapturedEvent[] = [];
  private origSend: typeof inngest.send;
  private installed = false;

  install() {
    if (this.installed) return;
    this.events = [];
    this.installed = true;
    this.origSend = inngest.send.bind(inngest);
    inngest.send = async (event: any) => {
      this.events.push({ name: event.name, data: event.data ?? {} });
      return { ids: [] };
    };
  }

  uninstall() {
    if (!this.installed) return;
    this.installed = false;
    inngest.send = this.origSend;
  }

  clear() {
    this.events = [];
  }

  byName(name: string): CapturedEvent[] {
    return this.events.filter((e) => e.name === name);
  }

  count(name: string): number {
    return this.byName(name).length;
  }

  printReport() {
    const types = [
      "agent/model.call.failed",
      "agent/model.retries_exhausted",
      "workflow/element.started",
      "workflow/element.completed",
      "workflow/element.failed",
    ];
    const counts: Record<string, number> = {};
    for (const t of types) counts[t] = this.count(t);

    const rows: [string, ...string[]][] = [["Event Type", "Count"]];
    for (const t of types) {
      rows.push([t, String(counts[t])]);
    }
    rows.push(["---", "---"]);
    rows.push(["Total", String(this.events.length)]);

    const colWidth = Math.max(...rows.map((r) => r[0].length)) + 2;
    for (const row of rows) {
      if (row[0] === "---") {
        console.log("-".repeat(colWidth + 8));
      } else {
        console.log(row[0].padEnd(colWidth) + row[1]);
      }
    }
  }

  assertCount(name: string, expected: number): void {
    const actual = this.count(name);
    if (actual !== expected) {
      throw new Error(
        `Event count mismatch: ${name} expected ${expected}, got ${actual}`,
      );
    }
  }

  assertField(eventName: string, field: string, expected: unknown): void {
    const events = this.byName(eventName);
    if (events.length === 0) {
      throw new Error(`No events of type ${eventName} to assert field ${field}`);
    }
    for (const evt of events) {
      if (evt.data[field] !== expected) {
        throw new Error(
          `Field mismatch on ${eventName}: ${field} expected ${expected}, got ${evt.data[field]}`,
        );
      }
    }
  }

  assertFieldExists(eventName: string, field: string): void {
    const events = this.byName(eventName);
    if (events.length === 0) {
      throw new Error(`No events of type ${eventName} to assert field ${field}`);
    }
    for (const evt of events) {
      if (!(field in evt.data)) {
        throw new Error(
          `Missing field ${field} on ${eventName} event`,
        );
      }
    }
  }

  byElementId(elementId: string): CapturedEvent[] {
    return this.events.filter((e) => e.data.elementId === elementId);
  }

  byRunId(runId: string): CapturedEvent[] {
    return this.events.filter((e) => e.data.runId === runId);
  }

  timeline(): CapturedEvent[] {
    return [...this.events];
  }

  assertSequence(expectedNames: string[]): void {
    const actualNames = this.events.map((e) => e.name);
    if (actualNames.length < expectedNames.length) {
      throw new Error(
        `Sequence length mismatch: expected ${expectedNames.length} events, got ${actualNames.length}\n` +
        `  Expected: [${expectedNames.join(", ")}]\n` +
        `  Actual:   [${actualNames.join(", ")}]`,
      );
    }
    for (let i = 0; i < expectedNames.length; i++) {
      if (actualNames[i] !== expectedNames[i]) {
        throw new Error(
          `Sequence mismatch at index ${i}: expected "${expectedNames[i]}", got "${actualNames[i]}"\n` +
          `  Expected: [${expectedNames.join(", ")}]\n` +
          `  Actual:   [${actualNames.join(", ")}]`,
        );
      }
    }
  }
}

// ─── Fake Models ──────────────────────────────────────────────────────────────

export class AlwaysFailModel extends BaseChatModel<BaseChatModelParams> {
  static lc_name(): string {
    return "AlwaysFailModel";
  }
  _llmType(): string {
    return "always-fail";
  }
  constructor() {
    super({});
  }
  bindTools(): any {
    return this;
  }
  _generate(_messages: BaseMessage[], _options: this["ParsedCallOptions"]): Promise<any> {
    throw new Error("Simulated model failure for testing");
  }
}

export class FailOnNthCall extends BaseChatModel<BaseChatModelParams> {
  private callCount = 0;
  private failOn: number;
  private response: string;

  constructor(failOn: number, response = "Hello from fake model") {
    super({});
    this.failOn = failOn;
    this.response = response;
  }

  static lc_name(): string {
    return "FailOnNthCall";
  }
  _llmType(): string {
    return "fail-on-nth";
  }
  bindTools(): any {
    return this;
  }
  async _generate(_messages: BaseMessage[], _options: this["ParsedCallOptions"]): Promise<any> {
    this.callCount++;
    if (this.callCount >= this.failOn) {
      throw new Error(`Simulated failure on call #${this.callCount}`);
    }
    return {
      generations: [
        {
          message: new AIMessage(this.response),
          text: this.response,
        },
      ],
      llmOutput: {},
    };
  }

  get callCountValue(): number {
    return this.callCount;
  }
}

// ─── Counter Tool ─────────────────────────────────────────────────────────────

export function createCounterTool(name: string, description: string) {
  let count = 0;
  return {
    tool: new DynamicStructuredTool({
      name,
      description,
      schema: z.object({}),
      func: async () => {
        count++;
        return `Invoked ${count} times`;
      },
    }),
    getCount: () => count,
  };
}

// ─── Agent Builder ────────────────────────────────────────────────────────────

export function buildTestAgent(params: {
  model: BaseChatModel;
  tools?: DynamicStructuredTool[];
  toolIdMap?: Map<string, string>;
  runId: string;
  elementId: string;
  agentLabel: string;
  maxRetries?: number;
}) {
  const {
    model,
    tools = [],
    toolIdMap = new Map(),
    runId,
    elementId,
    agentLabel,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = params;

  return createAgent({
    model,
    tools,
    systemPrompt: "You are a helpful assistant for testing.",
    middleware: [
      createRetriesExhaustedMiddleware({ runId, elementId, agentLabel }),
      modelRetryMiddleware({ maxRetries, onFailure: "error" }),
      createToolLifecycleMiddleware({ runId, toolIdMap }),
      createRetryObservabilityMiddleware({ runId, elementId, agentLabel }),
    ],
  });
}

// ─── Reporting ────────────────────────────────────────────────────────────────

export function printSection(title: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(60)}`);
}

export function printSubSection(title: string) {
  console.log(`\n--- ${title} ---`);
}

export function pass(msg: string) {
  console.log(`  [PASS] ${msg}`);
}

export function fail(msg: string): never {
  console.log(`  [FAIL] ${msg}`);
  process.exit(1);
}

export function assert(condition: boolean, msg: string): void {
  if (!condition) {
    fail(msg);
  }
  pass(msg);
}

// ─── Agent Lifecycle Event Emitter (mimics runAgent.ts pattern) ───────────────

export type LifecycleEventOptions = {
  runId: string;
  elementId: string;
  agentLabel: string;
};

export async function runWithLifecycleEvents<T>(
  options: LifecycleEventOptions,
  fn: () => Promise<T>,
): Promise<T> {
  const eventBase = {
    runId: options.runId,
    elementId: options.elementId,
    elementType: "agent" as const,
    label: options.agentLabel,
  };

  void inngest
    .send({ name: "workflow/element.started", data: eventBase })
    .catch((e: Error) => console.error("Failed to send started event", e));

  try {
    const result = await fn();
    void inngest
      .send({ name: "workflow/element.completed", data: eventBase })
      .catch((e: Error) => console.error("Failed to send completed event", e));
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    void inngest
      .send({
        name: "workflow/element.failed",
        data: { ...eventBase, error: errMsg },
      })
      .catch((e: Error) => console.error("Failed to send failed event", e));
    throw error;
  }
}

// ─── Sub-Agent Execution Simulator ───────────────────────────────────────────

export async function runSubAgentWithEvents(
  options: LifecycleEventOptions,
  childOptions: LifecycleEventOptions,
  shouldFail: boolean,
): Promise<string> {
  // Child runs first
  const childPromise = runWithLifecycleEvents(childOptions, async () => {
    if (shouldFail) {
      throw new Error(`Simulated failure in ${childOptions.agentLabel}`);
    }
    return `${childOptions.agentLabel} completed successfully`;
  });

  // Parent wraps the child
  return runWithLifecycleEvents(options, async () => {
    return childPromise;
  });
}

// ─── Execution Plan Builder (for tests) ──────────────────────────────────────

export function makePlan(overrides?: Partial<ExecutionPlan>): ExecutionPlan {
  return {
    agent: { id: "agent-1", label: "TestAgent", instructions: "You are a test agent." },
    model: { credentialId: "cred-1", modelName: "gpt-4" },
    tools: [],
    subAgents: [],
    ...overrides,
  };
}

export function makeToolDef(overrides?: Partial<ToolNodeDef>): ToolNodeDef {
  return {
    id: "tool-1",
    label: "TestTool",
    nodeRegistry: "test-tool",
    name: "test_tool",
    config: {},
    credentialId: "cred-1",
    ...overrides,
  };
}

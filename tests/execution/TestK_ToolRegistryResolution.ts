// Must import the tool registration barrel before using registry
import "../../src/lib/workflow-tools/index";
import { build, getRegistration, list } from "../../src/lib/workflow-tools/registry";
import {
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";

export async function runTest() {
  printSection("Test K: Tool Registry Resolution");

  // ── K1: Known registry name ───────────────────────────────────────────────
  printSubSection("K1: Known registry name — search");
  {
    const tool = build("search");
    assert(!!tool, "build returned a tool instance");
    assert(typeof tool.name === "string" && tool.name.length > 0, `Tool has name: ${tool.name}`);
    assert(typeof tool.description === "string" && tool.description.length > 0, "Tool has description");
    assert(!!tool.schema, "Tool has a schema");
    pass("K1: build('search') returns valid DynamicStructuredTool");
  }

  // ── K2: Another known registry name ───────────────────────────────────────
  printSubSection("K2: Known registry name — webscraper");
  {
    const tool = build("webscraper");
    assert(!!tool, "build returned a tool instance");
    assert(typeof tool.name === "string" && tool.name.length > 0, `Tool has name: ${tool.name}`);
    pass("K2: build('webscraper') returns valid tool");
  }

  // ── K3: Unknown registry name ─────────────────────────────────────────────
  printSubSection("K3: Unknown registry name");
  {
    try {
      build("non-existent-tool");
      fail("K3: Should have thrown for unknown registry");
    } catch (e: any) {
      assert(
        e.message.includes("No tool registered") || e.message.includes('"non-existent-tool"'),
        `Throws error about missing registry: ${e.message}`,
      );
      pass("K3: Unknown registry correctly throws");
    }
  }

  // ── K4: getRegistration returns metadata ──────────────────────────────────
  printSubSection("K4: getRegistration metadata");
  {
    const reg = getRegistration("search");
    assert(!!reg, "getRegistration returned a registration");
    assert(reg!.nodeRegistry === "search", "Registration has correct nodeRegistry");
    assert(typeof reg!.label === "string" && reg!.label.length > 0, "Registration has label");
    assert(typeof reg!.description === "string", "Registration has description");
    assert(typeof reg!.category === "string", "Registration has category");
    assert(typeof reg!.factory === "function", "Registration has factory function");
    pass("K4: getRegistration('search') returns complete ToolRegistration");
  }

  // ── K5: Unknown name returns undefined ────────────────────────────────────
  printSubSection("K5: getRegistration for unknown name");
  {
    const reg = getRegistration("definitely-not-registered");
    assert(reg === undefined, "getRegistration returns undefined for unknown name");
    pass("K5: Unknown name returns undefined (not throw)");
  }

  // ── K6: Factory receives config ───────────────────────────────────────────
  printSubSection("K6: Factory receives config");
  {
    const tool = build("search", { maxResults: 5 });
    assert(!!tool, "Tool built with config");
    pass("K6: build with config succeeds");
  }

  // ── K7: Factory receives credentialPayload ────────────────────────────────
  printSubSection("K7: Factory receives credentialPayload");
  {
    const tool = build("search", {}, { credentialPayload: { apiKey: "sk-test", provider: "test" } });
    assert(!!tool, "Tool built with credentialPayload");
    pass("K7: build with credentialPayload succeeds");
  }

  // ── K8: Credential requirement fields ─────────────────────────────────────
  printSubSection("K8: Credential requirement fields");
  {
    const searchReg = getRegistration("search");
    if (searchReg?.credentialRequirement) {
      assert(Array.isArray(searchReg.credentialRequirement.providers), "credentialRequirement.providers is array");
      assert(Array.isArray(searchReg.credentialRequirement.authMethods), "credentialRequirement.authMethods is array");
      pass("K8: search tool has valid credentialRequirement structure");
    } else {
      pass("K8: search tool has no credentialRequirement (skipped)");
    }
  }

  // ── K9: Verify all 22+ tools are registered ──────────────────────────────
  printSubSection("K9: Tool registration count");
  {
    const allTools = list();
    assert(allTools.length >= 20, `At least 20 tools registered (found ${allTools.length})`);
    pass(`K9: ${allTools.length} tools registered`);
  }

  // ── K10: Verify specific registrations ─────────────────────────────────────
  printSubSection("K10: Verify specific tool registrations");
  {
    const requiredTools = ["search", "webscraper", "sendMail", "chart", "sheet", "readSheet", "postgresDB", "mysqlDB", "mongoDB", "vectorDB", "memory", "imageGenerator", "imageReader"];
    for (const name of requiredTools) {
      const reg = getRegistration(name);
      assert(!!reg, `Tool "${name}" is registered`);
    }
    pass("K10: All required tools are registered");
  }

  pass("All Test K cases passed");
}

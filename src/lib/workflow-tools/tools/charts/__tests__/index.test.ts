import { describe, it, expect } from "vitest";
import { handleGenerate } from "../handlers";
import { createChartTool, handlerMap } from "../index";
import { chartSchema, chartActions } from "../schema";

describe("chart schema", () => {
  it("has one action: generate", () => {
    expect(chartActions).toEqual(["generate"]);
  });

  it("parses valid input with defaults", () => {
    const parsed = chartSchema.parse({ action: "generate" });
    expect(parsed.action).toBe("generate");
    expect(parsed.chartType).toBe("pie");
    expect(parsed.width).toBe(600);
    expect(parsed.height).toBe(400);
  });

  it("accepts all chart types", () => {
    for (const t of ["pie", "doughnut", "line", "bar", "radar", "polarArea", "bubble"]) {
      const parsed = chartSchema.parse({ chartType: t });
      expect(parsed.chartType).toBe(t);
    }
  });
});

describe("chart handler", () => {
  it("generates a pie chart URL", async () => {
    const result = await handleGenerate(
      {
        chartType: "pie",
        data: "[10, 20, 30]",
        labels: '["A", "B", "C"]',
        title: "Test Pie",
      },
      {},
    );
    expect(result.action).toBe("generate");
    expect(result.data.url).toContain("quickchart.io/chart");
    expect(result.data.url).toContain("width=600");
    expect(result.data.url).toContain("height=400");
    expect(result.data.chartType).toBe("pie");
    expect(result.data.markdown).toContain("![Test Pie]");
  });

  it("generates a line chart URL", async () => {
    const result = await handleGenerate(
      {
        chartType: "line",
        datasets: '[{"label": "Series A", "data": [1, 2, 3]}]',
        labels: '["X", "Y", "Z"]',
      },
      {},
    );
    expect(result.data.url).toContain("%22line%22");
  });

  it("generates a bar chart URL", async () => {
    const result = await handleGenerate(
      { chartType: "bar", data: "[5, 10]", labels: '["a", "b"]' },
      {},
    );
    expect(result.data.url).toContain("%22bar%22");
  });

  it("generates a doughnut chart URL", async () => {
    const result = await handleGenerate(
      { chartType: "doughnut", data: "[1, 2, 3]", labels: '["a", "b", "c"]' },
      {},
    );
    expect(result.data.chartType).toBe("doughnut");
    expect(result.data.url).toContain("%22doughnut%22");
  });

  it("generates a radar chart URL", async () => {
    const result = await handleGenerate(
      { chartType: "radar", data: "[4, 5, 6]", labels: '["a", "b", "c"]' },
      {},
    );
    expect(result.data.url).toContain("%22radar%22");
  });

  it("generates a polar area chart URL", async () => {
    const result = await handleGenerate(
      { chartType: "polarArea", data: "[7, 8, 9]", labels: '["a", "b", "c"]' },
      {},
    );
    expect(result.data.url).toContain("%22polarArea%22");
  });

  it("generates a bubble chart URL", async () => {
    const result = await handleGenerate(
      {
        chartType: "bubble",
        data: '[{"x": 10, "y": 20, "r": 5}]',
      },
      {},
    );
    expect(result.data.url).toContain("%22bubble%22");
  });

  it("injects apiKey when provided in config", async () => {
    const result = await handleGenerate(
      { chartType: "pie", data: "[1]", labels: '["x"]' },
      { apiKey: "qc_test123" },
    );
    expect(result.data.url).toContain("key=qc_test123");
  });

  it("handles missing data and labels gracefully", async () => {
    const result = await handleGenerate({ chartType: "pie" }, {});
    expect(result.data.url).toBeDefined();
    expect(result.data.chartType).toBe("pie");
  });

  it("throws for invalid JSON data", async () => {
    await expect(
      handleGenerate({ chartType: "pie", data: "not-json" }, {}),
    ).rejects.toThrow("not valid JSON");
  });

  it("throws for invalid JSON labels", async () => {
    await expect(
      handleGenerate({ chartType: "pie", labels: "bad" }, {}),
    ).rejects.toThrow("not valid JSON");
  });

  it("throws for invalid JSON colors", async () => {
    await expect(
      handleGenerate({ chartType: "pie", data: "[1]", labels: '["x"]', colors: "bad" }, {}),
    ).rejects.toThrow("not valid JSON");
  });

  it("applies custom colors", async () => {
    const result = await handleGenerate(
      {
        chartType: "pie",
        data: "[10, 20]",
        labels: '["A", "B"]',
        colors: '["#FF0000", "#00FF00"]',
      },
      {},
    );
    expect(result.data.url).toContain("%23FF0000");
    expect(result.data.url).toContain("%2300FF00");
  });

  it("includes markdown in result", async () => {
    const result = await handleGenerate(
      { chartType: "bar", data: "[1, 2]", labels: '["a", "b"]', title: "Sales" },
      {},
    );
    expect(result.data.markdown).toContain("![Sales](");
    expect(result.data.markdown).toContain("quickchart.io");
  });

  it("respects custom dimensions", async () => {
    const result = await handleGenerate(
      { chartType: "pie", data: "[1]", labels: '["x"]', width: 800, height: 600 },
      {},
    );
    expect(result.data.url).toContain("width=800");
    expect(result.data.url).toContain("height=600");
  });

  it("falls back to config values", async () => {
    const result = await handleGenerate(
      {},
      { chartType: "doughnut", data: "[5]", labels: '["x"]', title: "From Config" },
    );
    expect(result.data.chartType).toBe("doughnut");
    expect(result.data.markdown).toContain("From Config");
  });
});

describe("chart handler map", () => {
  it("has generate registered", () => {
    expect(handlerMap.generate).toBeDefined();
    expect(typeof handlerMap.generate).toBe("function");
  });
});

describe("chart tool factory", () => {
  it("creates a tool with chart name", () => {
    const chartTool = createChartTool({});
    expect(chartTool.name).toBe("chart");
  });
});

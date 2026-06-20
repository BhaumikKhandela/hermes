import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolFactory } from "../types";

const QUICKCHART_URL = "https://quickchart.io/chart";

function buildChartUrl(type: string, data: number[], labels: string[], title?: string): string {
  const chartConfig: Record<string, any> = {
    type: type === "pieChart" ? "pie" : "line",
    data: {
      labels,
      datasets: [
        {
          label: title || "",
          data,
          backgroundColor: [
            "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
            "#FF9F40", "#E7E9ED", "#76A346",
          ],
        },
      ],
    },
    options: {
      plugins: {
        ...(title ? { title: { display: true, text: title } } : {}),
      },
    },
  };

  const url = new URL(QUICKCHART_URL);
  url.searchParams.set("c", JSON.stringify(chartConfig));
  url.searchParams.set("width", "600");
  url.searchParams.set("height", "400");
  url.searchParams.set("devicePixelRatio", "2");
  return url.toString();
}

export const createChartTool: ToolFactory = () => {
  return tool(
    async ({ type, data, labels, title }) => {
      const chartUrl = buildChartUrl(type, data, labels, title);
      return `![${title || type}](${chartUrl})`;
    },
    {
      name: "chart",
      description:
        "Generate a pie or line chart from data. Returns a markdown image URL rendered via QuickChart.",
      schema: z.object({
        type: z
          .enum(["pieChart", "lineChart"])
          .describe("Chart type: pieChart or lineChart"),
        data: z
          .array(z.number())
          .describe("Array of numeric values"),
        labels: z
          .array(z.string())
          .describe("Array of labels matching the data"),
        title: z.string().optional().describe("Chart title"),
      }),
    },
  );
};

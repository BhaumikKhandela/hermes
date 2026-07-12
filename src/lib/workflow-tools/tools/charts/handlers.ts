import type { z } from "zod";
import type { partialChartSchema } from "./schema";
import type { ChartType, ChartToolResult } from "./types";

const QUICKCHART_URL = "https://quickchart.io/chart";

function parseJson(raw: string | undefined, label: string): any {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Chart generate: ${label} is not valid JSON`);
  }
}

function buildChartConfig(
  chartType: ChartType,
  data: any,
  labels: any,
  datasets: any,
  datasetLabel: string | undefined,
  colors: string[] | undefined,
  title: string | undefined,
): Record<string, any> {
  const hasColors = colors && colors.length > 0;

  const makeBackgroundColors = (count: number): string[] => {
    if (hasColors) {
      return Array.from({ length: count }, (_, i) => colors![i % colors!.length]);
    }
    const defaults = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#E7E9ED", "#76A346"];
    return Array.from({ length: count }, (_, i) => defaults[i % defaults.length]);
  };

  const makeTitle = () => title
    ? { display: true, text: title }
    : undefined;

  if (chartType === "bubble") {
    return {
      type: "bubble",
      data: {
        datasets: datasets || [{ data: data || [] }],
      },
      options: {
        plugins: { title: makeTitle() },
      },
    };
  }

  if (chartType === "line" || chartType === "bar") {
    if (datasets) {
      return {
        type: chartType,
        data: {
          labels: labels || [],
          datasets: datasets.map((ds: any, i: number) => ({
            ...ds,
            backgroundColor: hasColors ? colors![i % colors!.length] : ds.backgroundColor,
          })),
        },
        options: {
          plugins: { title: makeTitle() },
        },
      };
    }
    const values = Array.isArray(data) ? data : (data || []);
    const bgColors = makeBackgroundColors(values.length);
    return {
      type: chartType,
      data: {
        labels: labels || [],
        datasets: [{
          label: datasetLabel || "",
          data: values,
          backgroundColor: chartType === "bar" ? bgColors : undefined,
          borderColor: chartType === "line" ? (hasColors ? colors![0] : "#36A2EB") : undefined,
          fill: chartType === "line" ? false : undefined,
        }],
      },
      options: {
        plugins: { title: makeTitle() },
      },
    };
  }

  if (chartType === "radar") {
    const values = Array.isArray(data) ? data : (data || []);
    const bg = hasColors ? colors![0] + "33" : "rgba(54, 162, 235, 0.2)";
    const border = hasColors ? colors![0] : "#36A2EB";
    return {
      type: "radar",
      data: {
        labels: labels || [],
        datasets: [{
          label: datasetLabel || "",
          data: values,
          backgroundColor: bg,
          borderColor: border,
        }],
      },
      options: {
        plugins: { title: makeTitle() },
      },
    };
  }

  if (chartType === "polarArea") {
    const values = Array.isArray(data) ? data : (data || []);
    return {
      type: "polarArea",
      data: {
        labels: labels || [],
        datasets: [{
          data: values,
          backgroundColor: makeBackgroundColors(values.length),
        }],
      },
      options: {
        plugins: { title: makeTitle() },
      },
    };
  }

  if (chartType === "doughnut") {
    const values = Array.isArray(data) ? data : (data || []);
    return {
      type: "doughnut",
      data: {
        labels: labels || [],
        datasets: [{
          data: values,
          backgroundColor: makeBackgroundColors(values.length),
        }],
      },
      options: {
        plugins: { title: makeTitle() },
      },
    };
  }

  const values = Array.isArray(data) ? data : (data || []);
  return {
    type: "pie",
    data: {
      labels: labels || [],
      datasets: [{
        data: values,
        backgroundColor: makeBackgroundColors(values.length),
      }],
    },
    options: {
      plugins: { title: makeTitle() },
    },
  };
}

type Input = z.input<typeof partialChartSchema>;

export async function handleGenerate(
  input: Input,
  config: Record<string, any>,
): Promise<ChartToolResult> {
  const chartType = (input.chartType ?? config?.chartType ?? "pie") as ChartType;
  const data = parseJson(input.data ?? config?.data, "data");
  const labels = parseJson(input.labels ?? config?.labels, "labels");
  const datasets = parseJson(input.datasets ?? config?.datasets, "datasets");
  const colors = parseJson(input.colors ?? config?.colors, "colors");
  const title = input.title ?? config?.title;
  const datasetLabel = input.datasetLabel ?? config?.datasetLabel;
  const width = input.width ?? config?.width ?? 600;
  const height = input.height ?? config?.height ?? 400;

  const apiKey = config?.apiKey;

  const chartConfig = buildChartConfig(chartType, data, labels, datasets, datasetLabel, colors, title);

  const url = new URL(QUICKCHART_URL);
  url.searchParams.set("c", JSON.stringify(chartConfig));
  url.searchParams.set("width", String(width));
  url.searchParams.set("height", String(height));
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const chartUrl = url.toString();
  const alt = title || chartType;

  return {
    action: "generate",
    data: {
      url: chartUrl,
      markdown: `![${alt}](${chartUrl})`,
      chartType,
      width,
      height,
    },
  };
}

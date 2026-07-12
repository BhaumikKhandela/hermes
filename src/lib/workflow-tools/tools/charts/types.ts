export const CHART_TYPES = ["pie", "doughnut", "line", "bar", "radar", "polarArea", "bubble"] as const;
export const ACTIONS = ["generate"] as const;

export type ChartType = typeof CHART_TYPES[number];
export type ChartAction = typeof ACTIONS[number];

export type ChartToolResult = {
  action: string;
  data: Record<string, any>;
};

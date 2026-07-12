import { z } from "zod";
import { CHART_TYPES, ACTIONS } from "./types";

export const chartActions = [...ACTIONS] as [string, ...string[]];
export const chartTypeOptions = [...CHART_TYPES] as [string, ...string[]];

export const partialChartSchema = z.object({
  action: z.enum(chartActions).optional(),
  chartType: z.enum(chartTypeOptions).optional().default("pie"),
  data: z.string().optional(),
  labels: z.string().optional(),
  datasets: z.string().optional(),
  title: z.string().optional(),
  colors: z.string().optional(),
  width: z.number().optional().default(600),
  height: z.number().optional().default(400),
  datasetLabel: z.string().optional(),
});

export const chartSchema = partialChartSchema;

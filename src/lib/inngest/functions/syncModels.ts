import { inngest } from "../client";
import { syncModelsFromOpenRouter } from "@/lib/models/modelService";

export const syncModels = inngest.createFunction(
  { id: "sync-models-from-openrouter" },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    const count = await step.run("sync-models", async () => {
      return await syncModelsFromOpenRouter();
    });

    return { success: true, synced: count };
  },
);
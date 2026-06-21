import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { executeWorkflow } from "@/lib/inngest/functions/executeWorkflow";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow],
});

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { listModels, syncModelsFromOpenRouter, syncEmbeddingModels } from "@/lib/models/modelService";

export const GET = withAuth(async (req: Request, session: any) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || undefined;
  const type = url.searchParams.get("type") || undefined;

  let models = await listModels(provider, type);

  if (models.length === 0) {
    if (type === "embedding") {
      await syncEmbeddingModels();
    } else {
      await syncModelsFromOpenRouter();
    }
    models = await listModels(provider, type);
  }

  return NextResponse.json({ models });
});
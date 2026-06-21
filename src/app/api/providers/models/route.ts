import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import { decryptById } from "@/lib/credentials/credentialService";
import {
  getProvider,
  getCachedModels,
  setCachedModels,
} from "@/lib/providers";

export const GET = withAuth(
  async (req: Request, session: any) => {
    const url = new URL(req.url);
    const credentialId = url.searchParams.get("credentialId");

    if (!credentialId) {
      return NextResponse.json(
        { error: "credentialId query parameter is required" },
        { status: 400 },
      );
    }

    const payload = await decryptById({
      credentialId,
      actorId: session.user.id,
    });

    const provider = payload.provider as string;
    const revision = (payload.revision as number) ?? 1;

    const cacheKey = `${credentialId}:${revision}`;
    const cached = getCachedModels(cacheKey);
    if (cached) {
      return NextResponse.json({ provider, models: cached });
    }

    const adapter = getProvider(provider);
    const models = await adapter.listModels(payload);

    setCachedModels(cacheKey, models);
    return NextResponse.json({ provider, models });
  },
);

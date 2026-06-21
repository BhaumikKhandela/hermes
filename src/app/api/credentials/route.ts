import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import {
  saveCredential,
  listCredentials,
} from "@/lib/credentials/credentialService";

export const GET = withAuth(async (req: Request, session: any) => {
  const url = new URL(req.url);
  const provider = url.searchParams.get("provider") || undefined;
  const authMethod = url.searchParams.get("authMethod") || undefined;

  const credentials = await listCredentials({
    ownerId: session.user.id,
    provider,
    authMethod,
  });

  return NextResponse.json({ credentials });
});

export const POST = withAuth(async (req: Request, session: any) => {
  const body = await req.json();
  const { provider, authMethod, name, providerAccountId, payload } = body;

  if (!provider || !authMethod || !name || !payload) {
    return NextResponse.json(
      { error: "provider, authMethod, name, and payload are required" },
      { status: 400 },
    );
  }

  const credential = await saveCredential({
    ownerId: session.user.id,
    provider,
    authMethod,
    name,
    providerAccountId,
    payload,
  });

  return NextResponse.json({ credential }, { status: 201 });
});

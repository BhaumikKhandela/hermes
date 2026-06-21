import { NextResponse } from "next/server";
import { withAuth } from "@/lib/mongodb/withAuth";
import {
  updateCredential,
  softDeleteCredential,
} from "@/lib/credentials/credentialService";

export const PUT = withAuth(
  async (req: Request, session: any, { params }: any) => {
    const { id } = params;
    const body = await req.json();
    const { revision, name, providerAccountId, payload } = body;

    if (revision === undefined) {
      return NextResponse.json(
        { error: "revision is required for optimistic concurrency" },
        { status: 400 },
      );
    }

    const credential = await updateCredential({
      credentialId: id,
      actorId: session.user.id,
      revision,
      name,
      providerAccountId,
      payload,
    });

    return NextResponse.json({ credential });
  },
);

export const DELETE = withAuth(
  async (req: Request, session: any, { params }: any) => {
    const { id } = params;

    await softDeleteCredential({
      credentialId: id,
      actorId: session.user.id,
    });

    return NextResponse.json({ success: true });
  },
);

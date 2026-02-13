import { NextResponse } from "next/server";
import { getLeaderboardFromChain } from "../_lib/chain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLeaderboardFromChain();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

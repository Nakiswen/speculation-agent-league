import { NextResponse } from "next/server";
import { getLastStandFromChain } from "../_lib/chain";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getLastStandFromChain();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { active: false, epochRemainingPct: 100, epochRemainingSeconds: 0, endangeredAgents: [] },
      { status: 200 }
    );
  }
}

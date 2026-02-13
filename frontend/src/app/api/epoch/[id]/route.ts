import { NextResponse } from "next/server";
import { getEpochFromChain } from "../../_lib/chain";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const epochId = Number(id);
  if (isNaN(epochId) || epochId < 1) {
    return NextResponse.json({ error: "Invalid epoch id" }, { status: 400 });
  }

  try {
    const data = await getEpochFromChain(epochId);
    if (!data) {
      return NextResponse.json({ error: "Epoch not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/localDb";

function safeRead() {
  try { return readJson("skills.json"); }
  catch { return {}; }
}

export async function GET() {
  return NextResponse.json(safeRead());
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    writeJson("skills.json", body);
    return NextResponse.json(body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

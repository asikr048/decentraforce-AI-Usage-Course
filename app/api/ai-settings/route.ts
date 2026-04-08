import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/localDb";
import { cookies } from "next/headers";

const DEFAULTS: Record<string, string> = {
  provider: "", assistantName: "Portfolio Assistant", greeting: "",
  openaiKey: "", openaiModel: "gpt-4.1-mini",
  geminiKey: "", geminiModel: "gemini-2.5-flash",
  claudeKey: "", claudeModel: "claude-haiku-4-5-20251001",
  openrouterKey: "", openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
};

function safeRead(): Record<string, string> {
  try { return readJson<Record<string, string>>("ai-settings.json"); }
  catch { return { ...DEFAULTS }; }
}

export async function GET() {
  try {
    const data = safeRead();
    const { assistantName, greeting, provider,
      openaiModel, geminiModel, claudeModel, openrouterModel } = data;
    return NextResponse.json({ assistantName, greeting, provider,
      openaiModel, geminiModel, claudeModel, openrouterModel });
  } catch {
    return NextResponse.json({}, { status: 500 });
  }
}

// Admin-only: returns full settings including keys
export async function POST() {
  const jar = await cookies();
  if (!jar.get("admin_session"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(safeRead());
}

export async function PUT(req: Request) {
  const jar = await cookies();
  if (!jar.get("admin_session"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const updated = { ...safeRead(), ...body };
    writeJson("ai-settings.json", updated);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { readJson } from "@/lib/localDb";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Prefer environment variables (set these in Vercel dashboard)
    const validUser = process.env.ADMIN_USERNAME || readJson<{ username: string; password: string }>("credentials.json").username;
    const validPass = process.env.ADMIN_PASSWORD || readJson<{ username: string; password: string }>("credentials.json").password;

    if (username === validUser && password === validPass) {
      const jar = await cookies();
      jar.set("admin_session", "1", {
        httpOnly: true, path: "/", maxAge: 60 * 60 * 24,
      });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

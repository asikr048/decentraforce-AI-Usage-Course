import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const jar = await cookies();
  if (!jar.get("admin_session"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // On Vercel, passwords are managed via the ADMIN_PASSWORD environment variable.
  // File-based password changes are not persisted across deployments.
  return NextResponse.json({
    error:
      "Password changes are not supported on Vercel. Update the ADMIN_PASSWORD environment variable in your Vercel project settings instead.",
  }, { status: 400 });
}

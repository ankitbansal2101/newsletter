import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  // Verify session
  const sessionCookie = request.cookies.get("studio-session");
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parts = sessionCookie.value.split(".");
  if (parts.length !== 2) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Add timestamp
    const issue = {
      ...body,
      meta: {
        ...body.meta,
        publishedAt: new Date().toISOString(),
      },
    };

    // Write to data/current-issue.json
    const dataDir = path.join(process.cwd(), "data");
    await mkdir(dataDir, { recursive: true });
    await writeFile(
      path.join(dataDir, "current-issue.json"),
      JSON.stringify(issue, null, 2),
      "utf-8"
    );

    return NextResponse.json({ ok: true, publishedAt: issue.meta.publishedAt });
  } catch {
    return NextResponse.json({ error: "Failed to publish" }, { status: 500 });
  }
}

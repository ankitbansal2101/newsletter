async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${hex}`;
}

function getSecret() {
  return process.env.SESSION_SECRET || "sunday-data-default-secret-change-me";
}

export async function POST(request: Request) {
  const password = process.env.STUDIO_PASSWORD;
  if (!password) {
    return Response.json(
      { error: "STUDIO_PASSWORD is not configured in .env.local" },
      { status: 503 },
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.password !== password) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const payload = `studio:${Date.now()}`;
  const token = await sign(payload, getSecret());

  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = 60 * 60 * 24 * 7; // 7 days
  const cookieParts = [
    `studio-session=${encodeURIComponent(token)}`,
    `Path=/`,
    `Max-Age=${maxAge}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];
  if (isProduction) cookieParts.push("Secure");

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieParts.join("; "),
    },
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "studio-session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
    },
  });
}

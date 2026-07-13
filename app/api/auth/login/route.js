import { NextResponse } from "next/server";
import { COOKIE_NAME, USER_COOKIE_NAME, getSessionSecret, validateCredentials } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    return NextResponse.json(
      { error: "Login is not configured yet. Set AUTH_PASSWORD and SESSION_SECRET in the server environment." },
      { status: 500 }
    );
  }

  const { username, password } = body || {};
  const matchedUser = validateCredentials(username, password);

  if (!matchedUser) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, user: matchedUser });
  const maxAge = 60 * 60 * 24 * 14; // 14 days

  response.cookies.set(COOKIE_NAME, sessionSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  response.cookies.set(USER_COOKIE_NAME, matchedUser, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge,
  });

  return response;
}

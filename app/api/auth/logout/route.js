import { NextResponse } from "next/server";
import { COOKIE_NAME, USER_COOKIE_NAME } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(COOKIE_NAME);
  response.cookies.delete(USER_COOKIE_NAME);
  return response;
}

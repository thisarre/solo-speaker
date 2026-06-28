import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// TEMP diagnostic: determine which cookie-write method survives a redirect through Caddy.
export async function GET() {
  const store = await cookies();
  store.set("test-nextheaders", "viaNextHeaders", { path: "/", secure: true, sameSite: "lax" });
  const res = NextResponse.redirect("https://solospeaker.com/fr/login");
  res.cookies.set("test-response", "viaResponse", { path: "/", secure: true, sameSite: "lax" });
  // replicate the real auth cookie: same name, ~2003-char value, same options @supabase/ssr uses
  res.cookies.set("sb-ejcodslgnvmffektxhzg-auth-token", "base64-" + "A".repeat(1996), {
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 34560000
  });
  return res;
}

import { NextRequest, NextResponse } from "next/server";
import { getOidcConfig, createSession, upsertUser, SessionData } from "@/lib/auth";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  try {
    const config = await getOidcConfig();
    const clientId = process.env.REPL_ID!;
    
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    const callbackUrl = `${protocol}://${host}/api/callback`;

    const state = request.cookies.get("oauth_state")?.value;
    const nonce = request.cookies.get("oauth_nonce")?.value;
    const codeVerifier = request.cookies.get("oauth_code_verifier")?.value;

    if (!state || !nonce || !codeVerifier) {
      console.error("Missing OAuth cookies");
      return NextResponse.redirect(new URL("/api/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const returnedState = searchParams.get("state");
    
    if (state !== returnedState) {
      console.error("State mismatch");
      return NextResponse.redirect(new URL("/api/login", request.url));
    }

    const code = searchParams.get("code");
    if (!code) {
      console.error("No code in callback");
      return NextResponse.redirect(new URL("/api/login", request.url));
    }

    const tokenResponse = await client.authorizationCodeGrant(config, new URL(request.url), {
      pkceCodeVerifier: codeVerifier,
      expectedState: state,
      expectedNonce: nonce,
      idTokenExpected: true,
    });

    const claims = tokenResponse.claims();
    if (!claims) {
      console.error("No claims in token response");
      return NextResponse.redirect(new URL("/api/login", request.url));
    }

    const sessionClaims = {
      sub: String(claims.sub),
      email: claims.email as string | undefined,
      first_name: claims.first_name as string | undefined,
      last_name: claims.last_name as string | undefined,
      profile_image_url: claims.profile_image_url as string | undefined,
    };

    const userId = await upsertUser(sessionClaims);

    const sessionData: SessionData = {
      userId,
      replitId: sessionClaims.sub,
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token ?? "",
      expiresAt: claims.exp ?? Math.floor(Date.now() / 1000) + 3600,
      claims: sessionClaims,
    };

    const sessionId = await createSession(sessionData);

    const response = NextResponse.redirect(new URL("/", request.url));
    
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_nonce");
    response.cookies.delete("oauth_code_verifier");

    return response;
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

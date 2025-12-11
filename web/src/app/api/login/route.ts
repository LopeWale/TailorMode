import { NextRequest, NextResponse } from "next/server";
import { getOidcConfig } from "@/lib/auth";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  try {
    const config = await getOidcConfig();
    const clientId = process.env.REPL_ID!;
    
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    const callbackUrl = `${protocol}://${host}/api/callback`;

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const authUrl = client.buildAuthorizationUrl(config, {
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: "openid email profile offline_access",
      response_type: "code",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "login consent",
    });

    const response = NextResponse.redirect(authUrl.href);
    
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    response.cookies.set("oauth_nonce", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    response.cookies.set("oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

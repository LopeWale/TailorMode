import { NextRequest, NextResponse } from "next/server";
import { getOidcConfig, deleteSession } from "@/lib/auth";
import * as client from "openid-client";

export async function GET(request: NextRequest) {
  try {
    await deleteSession();

    const config = await getOidcConfig();
    const clientId = process.env.REPL_ID!;
    
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    const postLogoutRedirectUri = `${protocol}://${host}`;

    const endSessionUrl = client.buildEndSessionUrl(config, {
      client_id: clientId,
      post_logout_redirect_uri: postLogoutRedirectUri,
    });

    const response = NextResponse.redirect(endSessionUrl.href);
    
    response.cookies.delete("session_id");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("session_id");
    
    return response;
  }
}

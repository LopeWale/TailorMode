import { cookies } from "next/headers";
import { prisma } from "./prisma";
import * as client from "openid-client";

export interface ReplitUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  replitId: string;
}

export interface SessionData {
  userId: string;
  replitId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  claims: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

const SESSION_COOKIE_NAME = "session_id";
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week

let oidcConfigCache: Awaited<ReturnType<typeof client.discovery>> | null = null;
let oidcConfigExpiry = 0;

export async function getOidcConfig() {
  const now = Date.now();
  if (oidcConfigCache && now < oidcConfigExpiry) {
    return oidcConfigCache;
  }

  const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
  const clientId = process.env.REPL_ID!;
  
  oidcConfigCache = await client.discovery(new URL(issuerUrl), clientId);
  oidcConfigExpiry = now + 3600 * 1000; // Cache for 1 hour
  
  return oidcConfigCache;
}

export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSession(sessionData: SessionData): Promise<string> {
  const sessionId = generateSessionId();
  const expire = new Date(Date.now() + SESSION_TTL);

  await prisma.session.create({
    data: {
      sid: sessionId,
      sess: sessionData as any,
      expire,
      userId: sessionData.userId,
    },
  });

  return sessionId;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sid: sessionId },
  });

  if (!session || new Date() > session.expire) {
    if (session) {
      await prisma.session.delete({ where: { sid: sessionId } });
    }
    return null;
  }

  return session.sess as unknown as SessionData;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.session.delete({ where: { sid: sessionId } }).catch(() => {});
  }
}

export async function getCurrentUser(): Promise<ReplitUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > session.expiresAt && session.refreshToken) {
    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, session.refreshToken);
      const claims = tokenResponse.claims();
      
      if (claims) {
        const cookieStore = await cookies();
        const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
        
        if (sessionId) {
          const updatedSession: SessionData = {
            ...session,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token ?? session.refreshToken,
            expiresAt: claims.exp ?? session.expiresAt,
            claims: {
              sub: String(claims.sub),
              email: claims.email as string | undefined,
              first_name: claims.first_name as string | undefined,
              last_name: claims.last_name as string | undefined,
              profile_image_url: claims.profile_image_url as string | undefined,
            },
          };

          await prisma.session.update({
            where: { sid: sessionId },
            data: { sess: updatedSession as any },
          });
        }
      }
    } catch {
      return null;
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      replitId: true,
    },
  });

  if (!user || !user.replitId) {
    return null;
  }

  return user as ReplitUser;
}

export async function upsertUser(claims: SessionData["claims"]): Promise<string> {
  const replitId = claims.sub;
  
  const existingUser = await prisma.user.findUnique({
    where: { replitId },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: claims.email ?? existingUser.email,
        firstName: claims.first_name ?? existingUser.firstName,
        lastName: claims.last_name ?? existingUser.lastName,
        profileImageUrl: claims.profile_image_url ?? existingUser.profileImageUrl,
        updatedAt: new Date(),
      },
    });
    return existingUser.id;
  }

  const newUser = await prisma.user.create({
    data: {
      email: claims.email,
      firstName: claims.first_name,
      lastName: claims.last_name,
      profileImageUrl: claims.profile_image_url,
      replitId,
    },
  });

  return newUser.id;
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

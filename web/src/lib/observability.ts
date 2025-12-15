import { PostHog } from "posthog-node";

import { env } from "./env";

let posthogClient: PostHog | null = null;

function getPosthogClient() {
  if (!env.posthogServerKey) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(env.posthogServerKey, {
      host: env.POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

export async function flushPosthogIfNeeded(hasCapturedEvent: boolean) {
  if (!hasCapturedEvent) {
    return;
  }

  const client = getPosthogClient();

  if (!client) {
    return;
  }

  await client.shutdown();
}

export function trackCaptureSessionCreated(
  session: Pick<
    import("@prisma/client").CaptureSession,
    "organizationId" | "captureMode" | "id" | "status"
  >,
) {
  const client = getPosthogClient();

  if (!client) {
    return false;
  }

  client.capture({
    distinctId: session.organizationId,
    event: "capture_session.created",
    properties: {
      captureMode: session.captureMode,
      captureSessionId: session.id,
      status: session.status,
    },
  });

  return true;
}

export function trackCaptureSessionRejected(
  organizationSlug: string,
  reason: "organization_not_found" | "unexpected_error",
) {
  const client = getPosthogClient();

  if (!client) {
    return false;
  }

  client.capture({
    distinctId: organizationSlug,
    event: "capture_session.rejected",
    properties: {
      reason,
    },
  });

  return true;
}

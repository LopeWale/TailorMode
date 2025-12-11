import { NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { ZodError } from "zod";

import {
  CreateCaptureSessionInput,
  OrganizationNotFoundError,
  createCaptureSession,
  createCaptureSessionInputSchema,
} from "@/lib/capture-sessions";
import {
  flushPosthogIfNeeded,
  trackCaptureSessionCreated,
  trackCaptureSessionRejected,
} from "@/lib/observability";

const CREATED_STATUS = 201;

function formatValidationError(error: ZodError<CreateCaptureSessionInput>) {
  return Object.entries(error.flatten().fieldErrors).reduce(
    (acc, [field, messages]) => {
      if (!messages || messages.length === 0) {
        return acc;
      }

      return {
        ...acc,
        [field]: messages,
      };
    },
    {} as Record<string, string[]>,
  );
}

export async function POST(request: Request) {
  let payload: unknown;
  let needsPosthogFlush = false;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  const parsed = createCaptureSessionInputSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: formatValidationError(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const session = await createCaptureSession(parsed.data);

    needsPosthogFlush =
      trackCaptureSessionCreated({
        captureMode: session.captureMode,
        id: session.id,
        organizationId: session.organizationId,
        status: session.status,
      }) || needsPosthogFlush;

    return NextResponse.json(
      {
        session,
      },
      { status: CREATED_STATUS },
    );
  } catch (error: unknown) {
    if (error instanceof OrganizationNotFoundError) {
      needsPosthogFlush =
        trackCaptureSessionRejected(
          parsed.data.organizationSlug,
          "organization_not_found",
        ) || needsPosthogFlush;

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 },
      );
    }

    captureException(error);

    needsPosthogFlush =
      trackCaptureSessionRejected(
        parsed.data.organizationSlug,
        "unexpected_error",
      ) || needsPosthogFlush;

    return NextResponse.json(
      {
        error: "Unable to create capture session",
      },
      { status: 500 },
    );
  } finally {
    await flushPosthogIfNeeded(needsPosthogFlush);
  }
}

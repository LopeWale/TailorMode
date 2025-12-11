import { captureException } from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  CaptureSessionNotFoundError,
  CaptureSessionOwnershipError,
  OrganizationNotFoundError,
  createMeasurementJob,
  createMeasurementJobInputSchema,
} from "@/lib/measurement-jobs";
import {
  flushPosthogIfNeeded,
  trackMeasurementJobQueued,
  trackMeasurementJobRejected,
} from "@/lib/observability";

const CREATED_STATUS = 201;

type MeasurementValidationError = ZodError<
  import("@/lib/measurement-jobs").CreateMeasurementJobInput
>;

function formatValidationError(error: MeasurementValidationError) {
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

  const parsed = createMeasurementJobInputSchema.safeParse(payload);

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
    const job = await createMeasurementJob(parsed.data);

    needsPosthogFlush =
      trackMeasurementJobQueued(job) || needsPosthogFlush;

    return NextResponse.json(
      { job },
      { status: CREATED_STATUS },
    );
  } catch (error) {
    if (error instanceof OrganizationNotFoundError) {
      needsPosthogFlush =
        trackMeasurementJobRejected(
          parsed.data.organizationSlug,
          "organization_not_found",
        ) || needsPosthogFlush;

      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof CaptureSessionNotFoundError) {
      needsPosthogFlush =
        trackMeasurementJobRejected(
          parsed.data.organizationSlug,
          "capture_session_not_found",
        ) || needsPosthogFlush;

      return NextResponse.json(
        { error: error.message },
        { status: 404 },
      );
    }

    if (error instanceof CaptureSessionOwnershipError) {
      needsPosthogFlush =
        trackMeasurementJobRejected(
          parsed.data.organizationSlug,
          "capture_session_mismatch",
        ) || needsPosthogFlush;

      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    captureException(error);

    needsPosthogFlush =
      trackMeasurementJobRejected(
        parsed.data.organizationSlug,
        "unexpected_error",
      ) || needsPosthogFlush;

    return NextResponse.json(
      { error: "Unable to create measurement job" },
      { status: 500 },
    );
  } finally {
    await flushPosthogIfNeeded(needsPosthogFlush);
  }
}

import { CaptureMode, CaptureStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "./prisma";
import { createCaptureUploadTarget } from "./storage";

const DEFAULT_PAYLOAD_CONTENT_TYPE = "application/octet-stream";

export const deviceProfileSchema = z
  .object({
    deviceModel: z.string().min(1, "deviceModel is required"),
    osVersion: z.string().min(1, "osVersion is required"),
    lidarEnabled: z.boolean().optional(),
    trueDepthEnabled: z.boolean().optional(),
    objectCaptureSupported: z.boolean().optional(),
  })
  .passthrough();

export const createCaptureSessionInputSchema = z.object({
  organizationSlug: z.string().min(1, "organizationSlug is required"),
  clientLabel: z
    .string()
    .min(1, "clientLabel is required")
    .max(120, "clientLabel must be 120 characters or fewer"),
  captureMode: z.nativeEnum(CaptureMode),
  captureStartedAt: z.coerce.date().optional(),
  deviceProfile: deviceProfileSchema,
  payloadContentType: z
    .string()
    .max(255, "payloadContentType must be 255 characters or fewer")
    .refine(
      (value) => value.includes("/"),
      "payloadContentType must be a valid MIME type",
    )
    .optional(),
});

export type CreateCaptureSessionInput = z.infer<
  typeof createCaptureSessionInputSchema
>;

export interface CreateCaptureSessionResult {
  session: import("@prisma/client").CaptureSession;
  uploadTarget: Awaited<ReturnType<typeof createCaptureUploadTarget>>;
}

export class OrganizationNotFoundError extends Error {
  constructor(slug: string) {
    super(`Organization with slug '${slug}' was not found`);
    this.name = "OrganizationNotFoundError";
  }
}

export async function createCaptureSession(
  input: CreateCaptureSessionInput,
): Promise<CreateCaptureSessionResult> {
  const organization = await prisma.organization.findUnique({
    where: { slug: input.organizationSlug },
  });

  if (!organization) {
    throw new OrganizationNotFoundError(input.organizationSlug);
  }

  const session = await prisma.captureSession.create({
    data: {
      organizationId: organization.id,
      clientLabel: input.clientLabel,
      captureMode: input.captureMode,
      deviceProfile: input.deviceProfile as any,
      status: CaptureStatus.CREATED,
      captureStartedAt: input.captureStartedAt ?? new Date(),
    },
  });

  const uploadTarget = await createCaptureUploadTarget({
    organizationSlug: input.organizationSlug,
    sessionId: session.id,
    contentType: input.payloadContentType ?? DEFAULT_PAYLOAD_CONTENT_TYPE,
  });

  const updatedSession = await prisma.captureSession.update({
    where: { id: session.id },
    data: {
      uploadObjectKey: uploadTarget.key,
      uploadUrlExpiresAt: uploadTarget.expiresAt,
      uploadContentType:
        input.payloadContentType ?? DEFAULT_PAYLOAD_CONTENT_TYPE,
    },
  });

  return { session: updatedSession, uploadTarget };
}

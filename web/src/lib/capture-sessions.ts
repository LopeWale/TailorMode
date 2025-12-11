import { CaptureMode, CaptureStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "./prisma";
import { OrganizationNotFoundError } from "./errors";

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
});

export type CreateCaptureSessionInput = z.infer<
  typeof createCaptureSessionInputSchema
>;

export async function createCaptureSession(
  input: CreateCaptureSessionInput,
) {
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
      deviceProfile: input.deviceProfile,
      status: CaptureStatus.CREATED,
      captureStartedAt: input.captureStartedAt ?? new Date(),
    },
  });

  return session;
}

export { OrganizationNotFoundError };

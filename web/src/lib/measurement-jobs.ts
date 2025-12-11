import { MeasurementJobStatus } from "@prisma/client";
import { z } from "zod";

import {
  CaptureSessionNotFoundError,
  CaptureSessionOwnershipError,
  OrganizationNotFoundError,
} from "./errors";
import { prisma } from "./prisma";

export const measurementJobKindSchema = z.enum([
  "SMPL_FIT",
  "MEASUREMENT_EXTRACTION",
  "QUALITY_AUDIT",
]);

const measurementJobParametersSchema = z
  .record(z.string(), z.unknown())
  .optional();

export const createMeasurementJobInputSchema = z.object({
  organizationSlug: z.string().min(1, "organizationSlug is required"),
  captureSessionId: z.string().cuid("captureSessionId must be a valid cuid").optional(),
  kind: measurementJobKindSchema,
  parameters: measurementJobParametersSchema,
});

export type CreateMeasurementJobInput = z.infer<
  typeof createMeasurementJobInputSchema
>;

export async function createMeasurementJob(input: CreateMeasurementJobInput) {
  const organization = await prisma.organization.findUnique({
    where: { slug: input.organizationSlug },
    select: { id: true },
  });

  if (!organization) {
    throw new OrganizationNotFoundError(input.organizationSlug);
  }

  if (input.captureSessionId) {
    const captureSession = await prisma.captureSession.findUnique({
      where: { id: input.captureSessionId },
      select: { id: true, organizationId: true },
    });

    if (!captureSession) {
      throw new CaptureSessionNotFoundError(input.captureSessionId);
    }

    if (captureSession.organizationId !== organization.id) {
      throw new CaptureSessionOwnershipError(captureSession.id);
    }
  }

  const job = await prisma.measurementJob.create({
    data: {
      organizationId: organization.id,
      captureSessionId: input.captureSessionId ?? null,
      kind: input.kind,
      parameters: input.parameters ?? null,
      status: MeasurementJobStatus.QUEUED,
    },
  });

  return job;
}

export {
  CaptureSessionNotFoundError,
  CaptureSessionOwnershipError,
  OrganizationNotFoundError,
};

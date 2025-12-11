import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  const organizationFindUnique = vi.fn();
  const captureSessionFindUnique = vi.fn();
  const measurementJobCreate = vi.fn();

  return {
    prisma: {
      organization: { findUnique: organizationFindUnique },
      captureSession: { findUnique: captureSessionFindUnique },
      measurementJob: { create: measurementJobCreate },
    },
  };
});

const {
  CaptureSessionNotFoundError,
  CaptureSessionOwnershipError,
  OrganizationNotFoundError,
  createMeasurementJob,
  createMeasurementJobInputSchema,
} = await import("./measurement-jobs");

const { prisma } = await import("./prisma");

describe("createMeasurementJob", () => {
  beforeEach(() => {
    prisma.organization.findUnique.mockReset();
    prisma.captureSession.findUnique.mockReset();
    prisma.measurementJob.create.mockReset();
  });

  it("creates a measurement job when organization and capture session are valid", async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: "org_123" });
    prisma.captureSession.findUnique.mockResolvedValue({
      id: "session_456",
      organizationId: "org_123",
    });

    const fakeJob = { id: "job_789", kind: "SMPL_FIT" };
    prisma.measurementJob.create.mockResolvedValue(fakeJob);

    const result = await createMeasurementJob({
      organizationSlug: "atelier-x",
      captureSessionId: "session_456",
      kind: "SMPL_FIT",
      parameters: { strategy: "smpl-x" },
    });

    expect(result).toBe(fakeJob);
    expect(prisma.measurementJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_123",
        captureSessionId: "session_456",
        kind: "SMPL_FIT",
        parameters: { strategy: "smpl-x" },
        status: "QUEUED",
      }),
    });
  });

  it("allows creating jobs without an associated capture session", async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: "org_123" });
    prisma.measurementJob.create.mockResolvedValue({ id: "job_001" });

    const result = await createMeasurementJob({
      organizationSlug: "atelier-x",
      kind: "QUALITY_AUDIT",
    });

    expect(result).toEqual({ id: "job_001" });
    expect(prisma.captureSession.findUnique).not.toHaveBeenCalled();
    expect(prisma.measurementJob.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_123",
        captureSessionId: null,
        parameters: null,
      }),
    });
  });

  it("throws when the organization is missing", async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      createMeasurementJob({
        organizationSlug: "missing",
        kind: "SMPL_FIT",
      }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });

  it("throws when the capture session cannot be found", async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: "org_123" });
    prisma.captureSession.findUnique.mockResolvedValue(null);

    await expect(
      createMeasurementJob({
        organizationSlug: "atelier-x",
        captureSessionId: "session_missing",
        kind: "SMPL_FIT",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
  });

  it("throws when the capture session belongs to another organization", async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: "org_123" });
    prisma.captureSession.findUnique.mockResolvedValue({
      id: "session_456",
      organizationId: "other_org",
    });

    await expect(
      createMeasurementJob({
        organizationSlug: "atelier-x",
        captureSessionId: "session_456",
        kind: "MEASUREMENT_EXTRACTION",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionOwnershipError);
  });
});

describe("createMeasurementJobInputSchema", () => {
  it("requires a recognized kind", () => {
    const result = createMeasurementJobInputSchema.safeParse({
      organizationSlug: "atelier-x",
      kind: "UNKNOWN",
    });

    expect(result.success).toBe(false);
  });
});

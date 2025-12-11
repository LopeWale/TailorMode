import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  const organizationFindUnique = vi.fn();
  const captureSessionCreate = vi.fn();

  return {
    prisma: {
      organization: { findUnique: organizationFindUnique },
      captureSession: { create: captureSessionCreate },
    },
  };
});

const {
  OrganizationNotFoundError,
  createCaptureSession,
  createCaptureSessionInputSchema,
} = await import("./capture-sessions");

const { prisma } = await import("./prisma");

describe("createCaptureSession", () => {
  beforeEach(() => {
    prisma.organization.findUnique.mockReset();
    prisma.captureSession.create.mockReset();
  });

  it("creates a capture session when the organization exists", async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: "org_123",
    });

    const fakeSession = { id: "session_123" };

    prisma.captureSession.create.mockResolvedValue(fakeSession);

    const result = await createCaptureSession({
      organizationSlug: "atelier-x",
      clientLabel: "Jane Doe", 
      captureMode: "LIDAR",
      deviceProfile: {
        deviceModel: "iPhone 15 Pro",
        osVersion: "17.4",
        lidarEnabled: true,
      },
    });

    expect(result).toBe(fakeSession);
    expect(prisma.captureSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org_123",
        clientLabel: "Jane Doe",
        captureMode: "LIDAR",
        deviceProfile: expect.objectContaining({
          deviceModel: "iPhone 15 Pro",
        }),
        captureStartedAt: expect.any(Date),
      }),
    });
  });

  it("throws when the organization cannot be found", async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(
      createCaptureSession({
        organizationSlug: "missing",
        clientLabel: "Jane Doe",
        captureMode: "LIDAR",
        deviceProfile: {
          deviceModel: "iPhone 15 Pro",
          osVersion: "17.4",
        },
      }),
    ).rejects.toBeInstanceOf(OrganizationNotFoundError);
  });
});

describe("createCaptureSessionInputSchema", () => {
  it("rejects empty labels", () => {
    const result = createCaptureSessionInputSchema.safeParse({
      organizationSlug: "atelier-x",
      clientLabel: "",
      captureMode: "LIDAR",
      deviceProfile: {
        deviceModel: "iPhone 15 Pro",
        osVersion: "17.4",
      },
    });

    expect(result.success).toBe(false);
  });
});

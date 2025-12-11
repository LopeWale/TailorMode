import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./prisma", () => {
  const organizationFindUnique = vi.fn();
  const captureSessionCreate = vi.fn();
  const captureSessionUpdate = vi.fn();

  return {
    prisma: {
      organization: { findUnique: organizationFindUnique },
      captureSession: {
        create: captureSessionCreate,
        update: captureSessionUpdate,
      },
    },
  };
});

const uploadTargetMock = {
  url: "https://uploads.example",
  key: "captures/org/session/file.bin",
  bucket: "tailormode-test",
  expiresAt: new Date("2024-01-01T00:10:00Z"),
  method: "PUT" as const,
  headers: { "Content-Type": "application/octet-stream" },
};

vi.mock("./storage", () => ({
  createCaptureUploadTarget: vi.fn(async () => uploadTargetMock),
}));

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
    prisma.captureSession.update.mockReset();
  });

  it("creates a capture session when the organization exists", async () => {
    prisma.organization.findUnique.mockResolvedValue({
      id: "org_123",
    });

    const fakeSession = { id: "session_123" };

    prisma.captureSession.create.mockResolvedValue(fakeSession);

    const updatedSession = { ...fakeSession, uploadObjectKey: uploadTargetMock.key };
    prisma.captureSession.update.mockResolvedValue(updatedSession);

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

    expect(result.session).toBe(updatedSession);
    expect(result.uploadTarget).toEqual(uploadTargetMock);
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
    expect(prisma.captureSession.update).toHaveBeenCalledWith({
      where: { id: "session_123" },
      data: {
        uploadObjectKey: uploadTargetMock.key,
        uploadUrlExpiresAt: uploadTargetMock.expiresAt,
        uploadContentType: uploadTargetMock.headers["Content-Type"],
      },
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
    expect(prisma.captureSession.update).not.toHaveBeenCalled();
  });
});

describe("createCaptureSessionInputSchema", () => {
  it("rejects invalid MIME types", () => {
    const result = createCaptureSessionInputSchema.safeParse({
      organizationSlug: "atelier-x",
      clientLabel: "Jane Doe",
      captureMode: "LIDAR",
      deviceProfile: {
        deviceModel: "iPhone 15 Pro",
        osVersion: "17.4",
      },
      payloadContentType: "not-a-mime",
    });

    expect(result.success).toBe(false);
  });

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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("createCaptureUploadTarget", () => {
  const getSignedUrl = vi.fn(async () => "https://signed.example");
  const putObjectCommand = vi.fn();
  const clientInstance = {} as Record<string, unknown>;
  const s3Constructor = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    getSignedUrl.mockClear();
    putObjectCommand.mockClear();

    vi.doMock("./env", () => ({
      env: {
        awsRegion: "af-south-1",
        captureUploadBucket: "tailormode-captures-dev",
        captureUploadPrefix: "captures",
        captureUploadUrlTtlSeconds: 600,
        captureUploadEndpoint: undefined,
      },
    }));

    vi.doMock("@aws-sdk/client-s3", () => ({
      S3Client: class {
        constructor(config: unknown) {
          s3Constructor(config);
          return clientInstance;
        }
      },
      PutObjectCommand: class {
        input: unknown;

        constructor(input: unknown) {
          this.input = input;
          putObjectCommand(input);
        }
      },
    }));

    vi.doMock("@aws-sdk/s3-request-presigner", () => ({
      getSignedUrl,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a signed PUT upload target scoped to the organization and session", async () => {
    const { createCaptureUploadTarget } = await import("./storage");

    const target = await createCaptureUploadTarget({
      organizationSlug: "atelier-x",
      sessionId: "session_123",
      contentType: "application/zip",
    });

    expect(target.url).toBe("https://signed.example");
    expect(target.bucket).toBe("tailormode-captures-dev");
    expect(target.method).toBe("PUT");
    expect(target.headers["Content-Type"]).toBe("application/zip");
    expect(target.key.startsWith("captures/atelier-x/session_123/")).toBe(
      true,
    );
    expect(target.expiresAt.toISOString()).toBe(
      new Date("2024-01-01T00:10:00Z").toISOString(),
    );

    expect(putObjectCommand).toHaveBeenCalledWith({
      Bucket: "tailormode-captures-dev",
      Key: target.key,
      ContentType: "application/zip",
    });
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
    const [, commandArg, presignOptions] = getSignedUrl.mock.calls[0];
    expect(getSignedUrl.mock.calls[0][0]).toBe(clientInstance);
    expect((commandArg as { input: unknown }).input).toEqual({
      Bucket: "tailormode-captures-dev",
      Key: target.key,
      ContentType: "application/zip",
    });
    expect(presignOptions).toEqual({ expiresIn: 600 });
    expect(s3Constructor).toHaveBeenCalledWith({ region: "af-south-1" });
  });
});

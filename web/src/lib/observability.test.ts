import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CaptureSessionShape = Pick<
  import("@prisma/client").CaptureSession,
  "organizationId" | "captureMode" | "id" | "status"
>;

const baseSession: CaptureSessionShape = {
  id: "session-id",
  organizationId: "org-id",
  captureMode: "LIDAR",
  status: "CREATED",
};

describe("observability", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips PostHog capture when no server key is configured", async () => {
    vi.doMock("./env", () => ({
      env: {
        POSTHOG_HOST: "https://app.posthog.com",
        posthogServerKey: undefined,
      },
    }));

    const captureSpy = vi.fn();

    function MockPostHog(this: unknown) {
      Object.assign(this, {
        capture: captureSpy,
        flushAsync: vi.fn(),
      });
    }

    vi.doMock("posthog-node", () => ({
      PostHog: vi.fn(MockPostHog),
    }));

    const { trackCaptureSessionCreated } = await import("./observability");

    const result = trackCaptureSessionCreated(baseSession);

    expect(result).toBe(false);
    expect(captureSpy).not.toHaveBeenCalled();
  });

  it("captures events and flushes when PostHog is configured", async () => {
    const flushSpy = vi.fn();
    const captureSpy = vi.fn();
    const constructorSpy = vi.fn();

    function MockPostHog(this: unknown, key: string, options: unknown) {
      constructorSpy(key, options);
      Object.assign(this, {
        capture: captureSpy,
        flushAsync: flushSpy,
      });
    }

    vi.doMock("./env", () => ({
      env: {
        POSTHOG_HOST: "https://app.posthog.com",
        posthogServerKey: "phc_test",
      },
    }));

    vi.doMock("posthog-node", () => ({
      PostHog: vi.fn(MockPostHog),
    }));

    const { flushPosthogIfNeeded, trackCaptureSessionCreated } = await import(
      "./observability"
    );

    const result = trackCaptureSessionCreated(baseSession);
    await flushPosthogIfNeeded(result);

    expect(result).toBe(true);
    expect(constructorSpy).toHaveBeenCalledWith("phc_test", {
      flushAt: 1,
      flushInterval: 0,
      host: "https://app.posthog.com",
    });
    expect(captureSpy).toHaveBeenCalledWith({
      distinctId: "org-id",
      event: "capture_session.created",
      properties: {
        captureMode: "LIDAR",
        captureSessionId: "session-id",
        status: "CREATED",
      },
    });
    expect(flushSpy).toHaveBeenCalled();
  });

  it("records rejection reasons for observability", async () => {
    const captureSpy = vi.fn();

    vi.doMock("./env", () => ({
      env: {
        POSTHOG_HOST: "https://app.posthog.com",
        posthogServerKey: "phc_test",
      },
    }));

    function MockPostHog(this: unknown) {
      Object.assign(this, {
        capture: captureSpy,
        flushAsync: vi.fn(),
      });
    }

    vi.doMock("posthog-node", () => ({
      PostHog: vi.fn(MockPostHog),
    }));

    const { trackCaptureSessionRejected } = await import("./observability");

    const result = trackCaptureSessionRejected(
      "atelier-slug",
      "organization_not_found",
    );

    expect(result).toBe(true);
    expect(captureSpy).toHaveBeenCalledWith({
      distinctId: "atelier-slug",
      event: "capture_session.rejected",
      properties: {
        reason: "organization_not_found",
      },
    });
  });
});

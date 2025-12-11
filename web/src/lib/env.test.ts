import { describe, expect, it } from "vitest";

import { env } from "./env";

describe("env", () => {
  it("exposes a boolean flag for the measurement assistant", () => {
    expect(typeof env.measurementAssistantEnabled).toBe("boolean");
  });

  it("falls back to the local Postgres connection string when not provided", () => {
    expect(env.DATABASE_URL).toContain("tailormode");
  });

  it("includes a placeholder for the server-side PostHog key", () => {
    expect(env).toHaveProperty("posthogServerKey");
  });

  it("normalizes the capture upload prefix for storage keys", () => {
    expect(env.captureUploadPrefix).not.toMatch(/^\//);
    expect(env.captureUploadPrefix.endsWith("/")).toBe(false);
  });

  it("exposes bucket and region details for storage signing", () => {
    expect(env.captureUploadBucket.length).toBeGreaterThan(0);
    expect(env.awsRegion.length).toBeGreaterThan(0);
  });
});

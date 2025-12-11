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
});

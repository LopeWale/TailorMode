import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateMeasurementJob = vi.fn();
const mockTrackMeasurementJobQueued = vi.fn();
const mockTrackMeasurementJobRejected = vi.fn();
const mockFlushPosthogIfNeeded = vi.fn();

vi.mock("@/lib/measurement-jobs", async () => {
  const actual = await vi.importActual<
    typeof import("../../../lib/measurement-jobs")
  >("../../../lib/measurement-jobs");

  return {
    ...actual,
    createMeasurementJob: mockCreateMeasurementJob,
  };
});

vi.mock("@/lib/observability", async () => {
  const actual = await vi.importActual<
    typeof import("../../../lib/observability")
  >("../../../lib/observability");

  return {
    ...actual,
    trackMeasurementJobQueued: mockTrackMeasurementJobQueued,
    trackMeasurementJobRejected: mockTrackMeasurementJobRejected,
    flushPosthogIfNeeded: mockFlushPosthogIfNeeded,
  };
});

const measurementJobsModule = await import("@/lib/measurement-jobs");
const {
  CaptureSessionNotFoundError,
  CaptureSessionOwnershipError,
  OrganizationNotFoundError,
} = measurementJobsModule;

const { POST } = await import("./route");

describe("POST /api/measurement-jobs", () => {
  beforeEach(() => {
    mockCreateMeasurementJob.mockReset();
    mockTrackMeasurementJobQueued.mockReset();
    mockTrackMeasurementJobRejected.mockReset();
    mockFlushPosthogIfNeeded.mockReset();
    mockFlushPosthogIfNeeded.mockResolvedValue(undefined);
  });

  it("creates measurement jobs and returns the payload", async () => {
    const fakeJob = {
      id: "job_123",
      organizationId: "org_123",
      kind: "SMPL_FIT",
      status: "QUEUED",
      captureSessionId: "cksz5q7xg0000abcd1234567",
    };
    mockCreateMeasurementJob.mockResolvedValue(fakeJob);
    mockTrackMeasurementJobQueued.mockReturnValue(true);

    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "atelier-x",
        captureSessionId: "cksz5q7xg0000abcd1234567",
        kind: "SMPL_FIT",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ job: fakeJob });
    expect(mockCreateMeasurementJob).toHaveBeenCalledWith({
      organizationSlug: "atelier-x",
      captureSessionId: "cksz5q7xg0000abcd1234567",
      kind: "SMPL_FIT",
    });
    expect(mockFlushPosthogIfNeeded).toHaveBeenCalledWith(true);
  });

  it("returns validation errors when payload is invalid", async () => {
    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({ organizationSlug: "", kind: "" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mockCreateMeasurementJob).not.toHaveBeenCalled();
  });

  it("returns 404 when the organization is missing", async () => {
    mockCreateMeasurementJob.mockRejectedValue(
      new OrganizationNotFoundError("missing"),
    );
    mockTrackMeasurementJobRejected.mockReturnValue(true);

    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "missing",
        kind: "SMPL_FIT",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(mockFlushPosthogIfNeeded).toHaveBeenCalledWith(true);
  });

  it("returns 404 when the capture session cannot be found", async () => {
    mockCreateMeasurementJob.mockRejectedValue(
      new CaptureSessionNotFoundError("missing"),
    );
    mockTrackMeasurementJobRejected.mockReturnValue(true);

    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "atelier-x",
        captureSessionId: "cksz5q7xg0000missing",
        kind: "SMPL_FIT",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(mockFlushPosthogIfNeeded).toHaveBeenCalledWith(true);
  });

  it("returns 400 when the capture session belongs to another organization", async () => {
    mockCreateMeasurementJob.mockRejectedValue(
      new CaptureSessionOwnershipError("cksz5q7xg0000abcd1234567"),
    );
    mockTrackMeasurementJobRejected.mockReturnValue(true);

    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "atelier-x",
        captureSessionId: "cksz5q7xg0000abcd1234567",
        kind: "MEASUREMENT_EXTRACTION",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(mockFlushPosthogIfNeeded).toHaveBeenCalledWith(true);
  });

  it("surfaces unexpected errors", async () => {
    mockCreateMeasurementJob.mockRejectedValue(new Error("boom"));
    mockTrackMeasurementJobRejected.mockReturnValue(true);

    const request = new Request("http://localhost/api/measurement-jobs", {
      method: "POST",
      body: JSON.stringify({
        organizationSlug: "atelier-x",
        kind: "QUALITY_AUDIT",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(mockFlushPosthogIfNeeded).toHaveBeenCalledWith(true);
  });
});

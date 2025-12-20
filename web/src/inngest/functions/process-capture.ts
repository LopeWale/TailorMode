import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/prisma";
import { CaptureStatus } from "@prisma/client";
import { normalizeMeshRemote } from "@/lib/geometry-client";
import { getCaptureDownloadUrl } from "@/lib/storage";

export const processCapture = inngest.createFunction(
  { id: "process-capture" },
  { event: "capture.uploaded" },
  async ({ event, step }) => {
    const { sessionId } = event.data;

    const session = await step.run("fetch-session", async () => {
      return prisma.captureSession.findUnique({
        where: { id: sessionId },
      });
    });

    if (!session || !session.uploadObjectKey) {
      throw new Error(`Session ${sessionId} not found or missing upload`);
    }

    await step.run("update-status-processing", async () => {
      await prisma.captureSession.update({
        where: { id: sessionId },
        data: { status: CaptureStatus.PROCESSING },
      });
    });

    // 1. Get Download URL
    const meshUrl = await step.run("get-mesh-url", async () => {
      return getCaptureDownloadUrl(session.uploadObjectKey!);
    });

    // 2. Call Normalize
    const validation = await step.run("validate-mesh", async () => {
      return normalizeMeshRemote(meshUrl);
    });

    if (validation.status !== "valid") {
       await step.run("mark-failed", async () => {
         await prisma.captureSession.update({
           where: { id: sessionId },
           data: {
             status: CaptureStatus.FAILED,
             qcFindings: { error: "Mesh validation failed", details: validation }
           }
         });
       });
       return { success: false, error: "Validation Failed" };
    }

    // 3. Mark Complete
    await step.run("update-status-completed", async () => {
      await prisma.captureSession.update({
        where: { id: sessionId },
        data: {
          status: CaptureStatus.COMPLETED,
          qcFindings: { ...validation, status: "passed" }
        },
      });
    });

    return { success: true, sessionId, validation };
  }
);

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processCapture } from "@/inngest/functions/process-capture";

// We will export functions here as we create them
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processCapture, // We will create this next
  ],
});

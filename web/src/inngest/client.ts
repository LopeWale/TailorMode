import { Inngest, EventSchemas } from "inngest";

// Define the event payloads
export type Events = {
  "capture.uploaded": {
    data: {
      sessionId: string;
      organizationSlug: string;
    };
  };
  "measurement.requested": {
    data: {
      sessionId: string;
      measurementIds: string[];
    };
  };
};

export const inngest = new Inngest({
    id: "tailormode-app",
    schemas: new EventSchemas().fromRecord<Events>()
});

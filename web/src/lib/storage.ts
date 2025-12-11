import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";

import { env } from "./env";

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: env.awsRegion,
    };

    if (env.captureUploadEndpoint) {
      clientConfig.endpoint = env.captureUploadEndpoint;
      clientConfig.forcePathStyle = true;
    }

    s3Client = new S3Client(clientConfig);
  }

  return s3Client;
}

export interface CaptureUploadTarget {
  url: string;
  key: string;
  bucket: string;
  expiresAt: Date;
  method: "PUT";
  headers: Record<string, string>;
}

function buildObjectKey(organizationSlug: string, sessionId: string) {
  const prefix = env.captureUploadPrefix.length
    ? `${env.captureUploadPrefix}/`
    : "";
  const sanitizedPrefix = prefix.replace(/\/+/g, "/");
  const uniqueSuffix = crypto.randomUUID();

  return `${sanitizedPrefix}${organizationSlug}/${sessionId}/${uniqueSuffix}`;
}

export async function createCaptureUploadTarget(options: {
  organizationSlug: string;
  sessionId: string;
  contentType?: string;
}): Promise<CaptureUploadTarget> {
  const contentType = options.contentType || "application/octet-stream";
  const key = buildObjectKey(options.organizationSlug, options.sessionId);
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: env.captureUploadBucket,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: env.captureUploadUrlTtlSeconds,
  });

  const expiresAt = new Date(
    Date.now() + env.captureUploadUrlTtlSeconds * 1000,
  );

  return {
    url,
    key,
    bucket: env.captureUploadBucket,
    expiresAt,
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
  };
}

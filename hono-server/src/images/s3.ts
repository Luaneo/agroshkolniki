import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const s3Client = new S3Client({
  // client config is read from ~/.aws/config and ~/.aws/credentials
  // TODO: option to read config from .env
});

export type S3ObjectBody = string | Uint8Array | Buffer | Readable;

export async function uploadObjectToS3(key: string, body: S3ObjectBody) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: "agroshkolniki-images",
      Key: key,
      Body: body,
    })
  );
}

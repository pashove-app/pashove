import { readFile } from "node:fs/promises";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const [, , filePath, key, contentType = "video/mp4"] = process.argv;
if (!filePath || !key) {
  console.error("Usage: node --env-file=.env.local scripts/upload-home-video.mjs <fichier> <clé>");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const body = await readFile(filePath);
await client.send(
  new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }),
);

const head = await client.send(
  new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }),
);

const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
console.log(
  JSON.stringify({
    key,
    size: head.ContentLength,
    contentType: head.ContentType,
    cacheControl: head.CacheControl,
    url: `${base}/${key}`,
  }),
);

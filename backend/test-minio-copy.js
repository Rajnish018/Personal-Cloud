import "dotenv/config";
import { minioClient } from "./src/config/minio.js";

const bucket = process.env.MINIO_BUCKET || "users";

const originalObject = process.argv[2];
const copiedObject = process.argv[3];

if (!originalObject || !copiedObject) {
  console.log(
    'Usage: node test-minio-copy.js "ORIGINAL_PATH" "COPIED_PATH"'
  );
  process.exit(1);
}

const readObject = async (objectName) => {
  const stream = await minioClient.getObject(
    bucket,
    objectName
  );

  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk)
    );
  }

  return Buffer.concat(chunks);
};

const inspectObject = async (label, objectName) => {
  console.log(`\n========== ${label} ==========`);

  const stat = await minioClient.statObject(
    bucket,
    objectName
  );

  console.log("Object:", objectName);
  console.log("Size from MinIO:", stat.size);
  console.log("Metadata:", stat.metaData);

  const buffer = await readObject(objectName);

  console.log("Downloaded size:", buffer.length);
  console.log(
    "First 16 bytes:",
    buffer.subarray(0, 16).toString("hex")
  );

  console.log(
    "First 4 bytes:",
    buffer.subarray(0, 4).toString("hex")
  );

  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  console.log("Valid JPEG header:", isJpeg);

  return buffer;
};

try {
  const originalBuffer = await inspectObject(
    "ORIGINAL",
    originalObject
  );

  const copiedBuffer = await inspectObject(
    "COPIED",
    copiedObject
  );

  console.log("\n========== COMPARISON ==========");

  console.log(
    "Original size:",
    originalBuffer.length
  );

  console.log(
    "Copied size:",
    copiedBuffer.length
  );

  console.log(
    "Same size:",
    originalBuffer.length === copiedBuffer.length
  );

  console.log(
    "Original JPEG:",
    originalBuffer
      .subarray(0, 3)
      .toString("hex")
  );

  console.log(
    "Copied JPEG:",
    copiedBuffer
      .subarray(0, 3)
      .toString("hex")
  );
} catch (error) {
  console.error("\nERROR:");
  console.error(error);
  process.exit(1);
}

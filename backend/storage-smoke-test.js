import "./src/config/env.js";
import storageClient from "./src/config/storageClient.js";
import { isMinioAvailable } from "./src/services/minioReplicaService.js";

try {
  console.log(`Storage provider: ${storageClient.provider}`);

  if (storageClient.provider === "dual") {
    await storageClient.bucketExists();
    console.log("MEGA primary: OK");
    console.log(`MinIO replica: ${(await isMinioAvailable()) ? "ONLINE" : "OFFLINE (pending sync is supported)"}`);
  } else {
    await storageClient.bucketExists();
    console.log("Storage connection: OK");
  }
} catch (error) {
  console.error("Storage check failed:", error.message);
  process.exitCode = 1;
}

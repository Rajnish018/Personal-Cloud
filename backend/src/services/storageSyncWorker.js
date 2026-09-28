import { storageClient } from "../config/storageClient.js";
import File from "../models/file.model.js";

import {
  ensureMinioBucket,
  isMinioAvailable,
  processPendingMinioSync,
  queueMinioSync,
} from "./minioReplicaService.js";

let timer = null;
let running = false;

const reconcileActiveFiles = async (limit = 100) => {
  if (!(await isMinioAvailable())) {
    return {
      checked: 0,
      queued: 0,
    };
  }

  const files = await File.find({
    isDeleted: false,
  })
    .select("publicId")
    .sort({
      updatedAt: -1,
    })
    .limit(limit);

  let queued = 0;

  for (const file of files) {
    try {
      await storageClient.statMegaObject(
        file.publicId
      );

      try {
        await storageClient.statMinioObject(
          file.publicId
        );
      } catch {
        await queueMinioSync(
          file.publicId,
          "UPLOAD"
        );

        queued += 1;
      }
    } catch {
      // MEGA is authoritative.
      // If the MEGA object is missing,
      // do not recreate it from MinIO.
    }
  }

  return {
    checked: files.length,
    queued,
  };
};

export const runStorageSync = async () => {
  if (
    running ||
    storageClient.provider !== "dual"
  ) {
    return;
  }

  running = true;

  try {
    const available =
      await isMinioAvailable();

    if (!available) {
      return;
    }

    await ensureMinioBucket();

    const result =
      await processPendingMinioSync({
        getMegaObject:
          storageClient.getMegaObject,
        limit: 20,
      });

    const reconciliation =
      await reconcileActiveFiles(100);

    if (
      result.processed ||
      result.failed ||
      reconciliation.queued
    ) {
      console.log(
        `[storage-sync] processed=${result.processed} failed=${result.failed} queued=${reconciliation.queued}`
      );
    }
  } catch (error) {
    console.warn(
      `[storage-sync] ${error.message}`
    );
  } finally {
    running = false;
  }
};

export const startStorageSyncWorker = () => {
  if (
    storageClient.provider !== "dual" ||
    timer
  ) {
    return;
  }

  const interval = Math.max(
    Number(
      process.env.MINIO_SYNC_INTERVAL_MS
    ) || 60000,
    10000
  );

  console.log(
    `[storage-sync] worker started; interval=${interval}ms`
  );

  void runStorageSync();

  timer = setInterval(
    () => void runStorageSync(),
    interval
  );

  timer.unref?.();
};

export const stopStorageSyncWorker = () => {
  if (timer) {
    clearInterval(timer);
  }

  timer = null;
};
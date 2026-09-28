import { EventEmitter } from "node:events";
import { Storage } from "megajs";

import { minioClient } from "./minio.js";

import {
  replicateBufferToMinio,
  deleteFromMinio,
  queueMinioSync,
} from "../services/minioReplicaService.js";

const provider = (process.env.STORAGE_PROVIDER || "minio")
  .trim()
  .toLowerCase();

const bucket = process.env.MINIO_BUCKET || "users";

const megaRootName = (
  process.env.MEGA_ROOT_FOLDER || "PersonalCloud"
).trim();

if (!["minio", "mega", "dual"].includes(provider)) {
  throw new Error(
    `Unsupported STORAGE_PROVIDER: ${provider}. Use minio, mega, or dual.`
  );
}

let megaStoragePromise;
let megaRootPromise;

/* -------------------------------------------------------------------------- */
/*                                MEGA HELPERS                                */
/* -------------------------------------------------------------------------- */

const getMegaStorage = async () => {
  if (!process.env.MEGA_EMAIL || !process.env.MEGA_PASSWORD) {
    throw new Error(
      "MEGA_EMAIL and MEGA_PASSWORD are required when MEGA storage is enabled"
    );
  }

  if (!megaStoragePromise) {
    megaStoragePromise = new Storage({
      email: process.env.MEGA_EMAIL,
      password: process.env.MEGA_PASSWORD,
      keepalive: true,
      autoload: true,
    }).ready.catch((error) => {
      megaStoragePromise = null;
      throw error;
    });
  }

  return megaStoragePromise;
};

const getMegaRoot = async () => {
  if (!megaRootPromise) {
    megaRootPromise = (async () => {
      const storage = await getMegaStorage();

      let root = storage.root.children?.find(
        (node) => node.directory && node.name === megaRootName
      );

      if (!root) {
        root = await storage.root.mkdir(megaRootName);
      }

      return root;
    })().catch((error) => {
      megaRootPromise = null;
      throw error;
    });
  }

  return megaRootPromise;
};

/* -------------------------------------------------------------------------- */
/*                              PATH NORMALIZATION                             */
/* -------------------------------------------------------------------------- */

const normalizeParts = (value) => {
  const parts = String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean);

  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("Invalid storage path");
  }

  return parts;
};

/* -------------------------------------------------------------------------- */
/*                                MEGA OBJECTS                                */
/* -------------------------------------------------------------------------- */

const getMegaNode = async (objectName) => {
  const root = await getMegaRoot();
  const parts = normalizeParts(objectName);

  return parts.length ? root.navigate(parts) : root;
};

const ensureMegaFolder = async (folderName) => {
  const root = await getMegaRoot();
  const parts = normalizeParts(folderName);

  let current = root;

  for (const part of parts) {
    let next = current.children?.find(
      (node) => node.directory && node.name === part
    );

    if (!next) {
      next = await current.mkdir(part);
    }

    current = next;
  }

  return current;
};

const createMegaFolderFromObjectName = async (objectName) => {
  const parts = normalizeParts(objectName);

  if (!parts.length) {
    return getMegaRoot();
  }

  return ensureMegaFolder(parts.join("/"));
};

const createMegaFile = async (objectName, buffer, size) => {
  const parts = normalizeParts(objectName);

  if (!parts.length) {
    throw new Error("Storage object name is required");
  }

  const name = parts.pop();

  const folder = await ensureMegaFolder(parts.join("/"));

  const upload = folder.upload(
    {
      name,
      size: Number.isFinite(size) ? size : buffer?.length,
    },
    buffer
  );

  return upload.complete;
};

const listMegaObjects = async (prefix) => {
  const root = await getMegaRoot();
  const parts = normalizeParts(prefix);

  if (!parts.length) {
    return [];
  }

  const folder = root.navigate(parts);

  if (!folder?.directory) {
    return [];
  }

  const base = parts.join("/");
  const result = [];

  const walk = (node, currentPath) => {
    for (const child of node.children || []) {
      const childPath = `${currentPath}/${child.name}`;

      if (child.directory) {
        walk(child, childPath);
      } else {
        result.push({
          name: childPath,
          size: child.size,
        });
      }
    }
  };

  walk(folder, base);

  return result;
};

/* -------------------------------------------------------------------------- */
/*                              EVENT EMITTER                                 */
/* -------------------------------------------------------------------------- */

const createEmitter = (work) => {
  const emitter = new EventEmitter();

  Promise.resolve()
    .then(work)
    .then((items) => {
      for (const item of items || []) {
        emitter.emit("data", item);
      }

      emitter.emit("end");
    })
    .catch((error) => {
      emitter.emit("error", error);
    });

  return emitter;
};

/* -------------------------------------------------------------------------- */
/*                              STORAGE HELPERS                               */
/* -------------------------------------------------------------------------- */

const statMegaObject = async (objectName) => {
  const node = await getMegaNode(objectName);

  if (!node || node.directory) {
    throw new Error("MEGA storage file not found");
  }

  return node;
};

const statMinioObject = async (objectName) => {
  return minioClient.statObject(bucket, objectName);
};

/* -------------------------------------------------------------------------- */
/*                           MINIO METADATA HELPERS                            */
/* -------------------------------------------------------------------------- */

const getMetadataValue = (metadata = {}, ...keys) => {
  for (const key of keys) {
    if (metadata[key]) {
      return metadata[key];
    }
  }

  return undefined;
};

const buildObjectMetadata = (metadata = {}) => {
  const contentType =
    getMetadataValue(
      metadata,
      "Content-Type",
      "content-type",
      "ContentType"
    ) || "application/octet-stream";

  const contentDisposition =
    getMetadataValue(
      metadata,
      "Content-Disposition",
      "content-disposition",
      "ContentDisposition"
    ) || "inline";

  return {
    "Content-Type": contentType,
    "Content-Disposition": contentDisposition,
  };
};

/* -------------------------------------------------------------------------- */
/*                              STORAGE CLIENT                                */
/* -------------------------------------------------------------------------- */

export const storageClient = {
  provider,

  bucket,

  /* ------------------------------------------------------------------------ */
  /*                              BUCKET METHODS                              */
  /* ------------------------------------------------------------------------ */

  async bucketExists() {
    if (provider === "minio") {
      return minioClient.bucketExists(bucket);
    }

    await getMegaRoot();

    return true;
  },

  async makeBucket() {
    if (provider === "minio") {
      return minioClient.makeBucket(bucket, "us-east-1");
    }

    await getMegaRoot();
  },

  /* ------------------------------------------------------------------------ */
  /*                              STAT OBJECT                                 */
  /* ------------------------------------------------------------------------ */

  async statObject(_bucket, objectName) {
    if (provider === "minio") {
      return minioClient.statObject(bucket, objectName);
    }

    if (provider === "dual") {
      // MEGA is authoritative.
      return statMegaObject(objectName);
    }

    const node = await getMegaNode(objectName);

    if (!node) {
      throw new Error("Object not found");
    }

    return node;
  },

  /* ------------------------------------------------------------------------ */
  /*                              PUT OBJECT                                  */
  /* ------------------------------------------------------------------------ */

  async putObject(
    _bucket,
    objectName,
    buffer,
    size,
    metaData = {}
  ) {
    const objectMetadata = buildObjectMetadata(metaData);

    /* ------------------------------- MINIO -------------------------------- */

    if (provider === "minio") {
      return minioClient.putObject(
        bucket,
        objectName,
        buffer,
        size,
        objectMetadata
      );
    }

    /* ------------------------------ FOLDER -------------------------------- */

    if (String(objectName).endsWith("/")) {
      await createMegaFolderFromObjectName(objectName);

      if (provider === "dual") {
        try {
          await replicateBufferToMinio(
            objectName,
            Buffer.alloc(0),
            0,
            objectMetadata
          );
        } catch (error) {
          await queueMinioSync(
            objectName,
            "UPLOAD",
            error
          );
        }
      }

      return;
    }

    /* -------------------------------- MEGA -------------------------------- */

    const result = await createMegaFile(
      objectName,
      buffer,
      size
    );

    /* -------------------------------- DUAL -------------------------------- */

    if (provider === "dual") {
      // MEGA is authoritative.
      // MinIO failure must never fail the user's upload.

      try {
        await replicateBufferToMinio(
          objectName,
          buffer,
          size,
          objectMetadata
        );
      } catch (error) {
        await queueMinioSync(
          objectName,
          "UPLOAD",
          error
        );
      }
    }

    return result;
  },

  /* ------------------------------------------------------------------------ */
  /*                             REMOVE OBJECT                                */
  /* ------------------------------------------------------------------------ */

  async removeObject(_bucket, objectName) {
    if (provider === "minio") {
      return minioClient.removeObject(
        bucket,
        objectName
      );
    }

    const node = await getMegaNode(objectName);

    if (node) {
      await node.delete(true);
    }

    if (provider === "dual") {
      await deleteFromMinio(objectName);
    }
  },

  /* ------------------------------------------------------------------------ */
  /*                              LIST OBJECTS                                 */
  /* ------------------------------------------------------------------------ */

  listObjects(_bucket, prefix) {
    if (provider === "minio") {
      return minioClient.listObjects(
        bucket,
        prefix,
        true
      );
    }

    return createEmitter(() =>
      listMegaObjects(prefix)
    );
  },

  /* ------------------------------------------------------------------------ */
  /*                           PRESIGNED GET OBJECT                            */
  /* ------------------------------------------------------------------------ */

  async presignedGetObject(_bucket, objectName) {
    if (provider === "minio") {
      return minioClient.presignedGetObject(
        bucket,
        objectName,
        5 * 60
      );
    }

    const node = await getMegaNode(objectName);

    if (!node || node.directory) {
      throw new Error("Storage file not found");
    }

    // Regular MEGA does not provide an S3-style
    // presigned URL.
    //
    // link() creates a MEGA download link.

    return node.link();
  },

  /* ------------------------------------------------------------------------ */
  /*                              COPY OBJECT                                 */
  /* ------------------------------------------------------------------------ */

  async copyObject(
    _bucket,
    sourceObjectName,
    destinationObjectName,
    metaData = {}
  ) {
    if (!sourceObjectName || !destinationObjectName) {
      throw new Error("Source and destination object names are required");
    }

    /* ---------------------------------------------------------------------- */
    /*                                MINIO                                   */
    /* ---------------------------------------------------------------------- */

    if (provider === "minio") {
      /*
       * IMPORTANT:
       * Do not getObject() -> Buffer.concat() -> putObject() here.
       * MinIO can copy the object server-side. This keeps the exact binary
       * bytes intact and preserves the source object's HTTP metadata.
       *
       * The previous implementation re-streamed the object through Node.js.
       * That path was responsible for copied files that existed in MinIO but
       * were not valid JPEGs when downloaded.
       */
      const result = await minioClient.copyObject(
        bucket,
        destinationObjectName,
        `/${bucket}/${sourceObjectName}`
      );

      // Verify that MinIO created the destination object successfully.
      const [sourceStat, destinationStat] = await Promise.all([
        minioClient.statObject(bucket, sourceObjectName),
        minioClient.statObject(bucket, destinationObjectName),
      ]);

      if (sourceStat.size !== destinationStat.size) {
        // Never leave a partially/incorrectly copied object behind.
        await minioClient.removeObject(
          bucket,
          destinationObjectName
        );

        throw new Error(
          `MinIO copy verification failed: source size=${sourceStat.size}, destination size=${destinationStat.size}`
        );
      }

      return result;
    }

    /* ---------------------------------------------------------------------- */
    /*                                 MEGA                                   */
    /* ---------------------------------------------------------------------- */

    const source = await getMegaNode(sourceObjectName);

    if (!source || source.directory) {
      throw new Error("Source file not found");
    }

    const parts = normalizeParts(destinationObjectName);

    if (!parts.length) {
      throw new Error("Destination object name is required");
    }

    const name = parts.pop();
    const folder = await ensureMegaFolder(parts.join("/"));

    const uploadStream = folder.upload({
      name,
      size: source.size,
    });

    const downloadStream = source.download();

    downloadStream.on("error", (error) => {
      uploadStream.destroy(error);
    });

    const result = await uploadStream.complete;

    /* ---------------------------------------------------------------------- */
    /*                            DUAL REPLICATION                             */
    /* ---------------------------------------------------------------------- */

    if (provider === "dual") {
      try {
        /*
         * MEGA is authoritative in dual mode.
         * Download the newly-created MEGA object and create the MinIO
         * replica from those exact bytes.
         */
        const replicaStream = await getMegaObject(
          destinationObjectName
        );

        const chunks = [];

        for await (const chunk of replicaStream) {
          chunks.push(
            Buffer.isBuffer(chunk)
              ? chunk
              : Buffer.from(chunk)
          );
        }

        const buffer = Buffer.concat(chunks);

        if (buffer.length !== source.size) {
          throw new Error(
            `MEGA copy verification failed: expected ${source.size} bytes, received ${buffer.length} bytes`
          );
        }

        /*
         * Prefer metadata supplied by the controller (from the MongoDB
         * File record). If it isn't supplied, preserve metadata from the
         * existing MinIO source replica. Finally, minioReplicaService can
         * infer Content-Type from the destination extension.
         */
        let metadata = { ...metaData };

        if (!metadata["Content-Type"] && !metadata["content-type"]) {
          try {
            const sourceMinioStat =
              await statMinioObject(sourceObjectName);

            const sourceMetadata =
              sourceMinioStat.metaData || {};

            metadata = {
              ...metadata,
              "Content-Type":
                sourceMetadata["content-type"] ||
                sourceMetadata["Content-Type"],
              "Content-Disposition":
                sourceMetadata["content-disposition"] ||
                sourceMetadata["Content-Disposition"] ||
                "inline",
            };
          } catch {
            // MinIO source replica may be unavailable. The extension-based
            // fallback in minioReplicaService will determine the type.
          }
        }

        await replicateBufferToMinio(
          destinationObjectName,
          buffer,
          buffer.length,
          metadata
        );
      } catch (error) {
        await queueMinioSync(
          destinationObjectName,
          "UPLOAD",
          error
        );
      }
    }

    return result;
  },

  /* ------------------------------------------------------------------------ */
  /*                          MEGA-SPECIFIC METHODS                           */
  /* ------------------------------------------------------------------------ */

  async statMegaObject(objectName) {
    return statMegaObject(objectName);
  },

  async statMinioObject(objectName) {
    return statMinioObject(objectName);
  },

  async getMegaObject(objectName) {
    const node = await getMegaNode(objectName);

    if (!node || node.directory) {
      throw new Error(
        "MEGA storage file not found"
      );
    }

    return node.download();
  },

  /* ------------------------------------------------------------------------ */
  /*                              GET OBJECT                                  */
  /* ------------------------------------------------------------------------ */

  async getObject(_bucket, objectName) {
    if (provider === "minio") {
      return minioClient.getObject(
        bucket,
        objectName
      );
    }

    const node = await getMegaNode(objectName);

    if (!node || node.directory) {
      throw new Error("Storage file not found");
    }

    return node.download();
  },

  /* ------------------------------------------------------------------------ */
  /*                             ACCOUNT INFO                                 */
  /* ------------------------------------------------------------------------ */

  async getAccountInfo() {
    if (provider === "minio") {
      return null;
    }

    const storage = await getMegaStorage();

    return storage.getAccountInfo();
  },

  /* ------------------------------------------------------------------------ */
  /*                                  CLOSE                                   */
  /* ------------------------------------------------------------------------ */

  async close() {
    if (
      provider === "minio" ||
      !megaStoragePromise
    ) {
      return;
    }

    const storage =
      await megaStoragePromise.catch(
        () => null
      );

    megaStoragePromise = null;
    megaRootPromise = null;

    storage?.close();
  },
};

export default storageClient;
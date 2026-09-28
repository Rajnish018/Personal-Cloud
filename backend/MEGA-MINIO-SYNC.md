# MEGA + MinIO Production Storage

## Architecture

- **MEGA is the authoritative/primary file store.**
- **MinIO is an asynchronous replica.**
- MongoDB stores application metadata and the MinIO sync queue.

## Provider

```env
STORAGE_PROVIDER=dual
```

MEGA credentials are required. MinIO is optional at runtime: it can be offline and the application continues to serve files from MEGA.

## Upload behavior

1. Upload is committed to MEGA first.
2. If MinIO is reachable, the same object is copied to MinIO.
3. If MinIO is unavailable, a `StorageSync` job with `UPLOAD` is written to MongoDB.
4. The sync worker retries the job when MinIO becomes available.

## Delete behavior

1. The MEGA object is deleted first.
2. MinIO deletion is attempted.
3. If MinIO is unavailable, a `DELETE` sync job is queued.

## Reconciliation

The worker periodically checks active MongoDB files. If an active file exists in MEGA but is missing in MinIO, it queues an `UPLOAD` job. This repairs MinIO even if the replica was manually deleted or lost.

## Development

Use:

```env
STORAGE_PROVIDER=minio
```

The existing local MinIO startup remains available.

## Production

Use:

```env
STORAGE_PROVIDER=dual
MEGA_EMAIL=...
MEGA_PASSWORD=...
MEGA_ROOT_FOLDER=PersonalCloud
MINIO_ENDPOINT=...
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=...
MINIO_SECRET_KEY=...
MINIO_BUCKET=users
MINIO_SYNC_INTERVAL_MS=60000
```

The MEGA credentials must stay on the backend. Never expose them as `VITE_*` variables.

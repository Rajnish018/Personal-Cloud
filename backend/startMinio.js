import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const minioExecutable =
  process.platform === "win32"
    ? path.join(__dirname, "minio", "minio.exe")
    : "minio";

const dataDir = path.join(__dirname, "minio-data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function startMinio() {
  const rootUser = process.env.MINIO_ACCESS_KEY ;
  const rootPassword = process.env.MINIO_SECRET_KEY ;

    if (!rootUser || !rootPassword) {
    console.error(
        "MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables must be set."
    );
    process.exit(1);
  }


  const child = spawn(
    minioExecutable,
    ["server", dataDir, "--console-address", ":9001"],
    {
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        MINIO_ROOT_USER: rootUser,
        MINIO_ROOT_PASSWORD: rootPassword,
      },
    }
  );

  child.unref();
  console.log("Starting MinIO server...");
}

export default startMinio;
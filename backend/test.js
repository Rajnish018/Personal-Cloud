import {minioClient} from './src/config/minio.js'

async function test() {
  try {
    const exists = await minioClient.bucketExists("users");

    console.log("Bucket exists:", exists);
  } catch (err) {
    console.error(err);
  }
}

test();
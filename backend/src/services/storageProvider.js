import storageClient from "../config/storageClient.js";

export const getStorageInfo = () => ({
  provider: storageClient.provider,
  bucket: storageClient.bucket,
  primary: storageClient.provider === "dual" ? "mega" : storageClient.provider,
  replica: storageClient.provider === "dual" ? "minio" : null,
});

export const assertStorageReady = async () => {
  await storageClient.bucketExists();
  return getStorageInfo();
};

export default getStorageInfo;

import axios from "axios";
import { handleApiError } from "../utils/errorHandler";
import tokenService from "../services/tokenService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT || 30000);
const MAX_NETWORK_RETRIES = Number(import.meta.env.VITE_API_RETRIES || 2);

let isRefreshing = false;
let refreshQueue = [];

const resolveRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  refreshQueue = [];
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenService.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");

    if (!error.response && originalRequest.__retryCount < MAX_NETWORK_RETRIES) {
      originalRequest.__retryCount = (originalRequest.__retryCount || 0) + 1;
      await new Promise((resolve) =>
        setTimeout(resolve, 500 * originalRequest.__retryCount)
      );
      return apiClient(originalRequest);
    }

    if (status === 401 && !originalRequest.__isRetryRequest && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest.__isRetryRequest = true;
      isRefreshing = true;

      try {
        const response = await refreshClient.post("/auth/refresh");
        const accessToken = response.data?.accessToken || response.data?.token;

        tokenService.setAccessToken(accessToken);
        resolveRefreshQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        tokenService.clear();
        resolveRefreshQueue(refreshError);
        handleApiError(refreshError, { redirectOnAuthError: true });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (!originalRequest.skipGlobalError) {
      handleApiError(error);
    }
    return Promise.reject(error);
  }
);

export const downloadFile = async (url, filename, config = {}) => {
  const response = await apiClient.get(url, {
    ...config,
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(response);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default apiClient;

import toast from "react-hot-toast";
import tokenService from "../services/tokenService";
import { ROUTES } from "./constants";

const statusMessages = {
  400: "The request could not be processed.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "The requested resource was not found.",
  409: "This item already exists.",
  422: "Please check the highlighted fields and try again.",
  429: "Too many requests. Please slow down and try again.",
  500: "The server hit an error. Please try again shortly.",
};

export const getApiErrorMessage = (error) => {
  if (typeof error === "string") return error;

  if (error?.code === "ECONNABORTED") {
    return "The request timed out. Please try again.";
  }

  if (!error?.response) {
    return "Cannot reach the server. Check your connection and try again.";
  }

  return (
    error.response.data?.message ||
    statusMessages[error.response.status] ||
    "Something went wrong. Please try again."
  );
};

export const handleApiError = (error, options = {}) => {
  const status = error?.response?.status;
  const message = getApiErrorMessage(error);

  if (!options.silent) {
    toast.error(message);
  }

  if (status === 401 || options.redirectOnAuthError) {
    tokenService.clear();

    if (!window.location.pathname.startsWith(ROUTES.LOGIN)) {
      window.location.assign(ROUTES.LOGIN);
    }
  }

  return message;
};

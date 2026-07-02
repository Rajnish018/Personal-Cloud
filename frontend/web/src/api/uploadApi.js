import apiClient from "../api/apiClient";

export const uploadFile = async (
  file,
  onProgress
) => {

  const formData = new FormData();

  formData.append("file", file);

  return apiClient.post(

    "/upload",

    formData,

    {

      onUploadProgress: (event) => {

        const progress = Math.round(

          (event.loaded * 100) /
          event.total

        );

        onProgress?.(progress);

      },

    }

  );

};
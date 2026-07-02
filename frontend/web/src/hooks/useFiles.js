import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fileApi } from "../api";
import { QUERY_KEYS } from "../utils/constants";
import { refreshDriveQueries } from "../utils/queryInvalidation";

export const useFiles = (params = {}, { enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.files(params),
    queryFn: () => fileApi.getFiles(params),
    enabled,
    staleTime: 60 * 1000,
    select: (data) => data.files || [],
  });

export const useRecentFiles = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.recentFiles,
    queryFn: fileApi.getRecentFiles,
    enabled,
    staleTime: 60 * 1000,
    select: (data) => data.files || [],
  });

export const useStarredFiles = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.starredFiles,
    queryFn: fileApi.getStarredFiles,
    enabled,
    staleTime: 60 * 1000,
    select: (data) => data.files || [],
  });

export const useTrashFiles = () =>
  useQuery({
    queryKey: QUERY_KEYS.trashFiles,
    queryFn: fileApi.getTrashFiles,
    staleTime: 60 * 1000,
    select: (data) => data.files || [],
  });

export const useUploadFile = (params = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables) => {
      // 1. Extract and find the real string ID cleanly
      let explicitFolderId = null;

      if (variables?.folderId && typeof variables.folderId === 'string' && variables.folderId.trim() !== '') {
        explicitFolderId = variables.folderId;
      } else if (params?.folderId && typeof params.folderId === 'string' && params.folderId.trim() !== '') {
        explicitFolderId = params.folderId;
      }

      // 2. Forward clean payload to your API client layer
      return fileApi.uploadFile({
        file: variables.file,
        folderId: explicitFolderId,
        parentFolder: explicitFolderId,
        onUploadProgress: variables.onUploadProgress
      });
    },
    onSuccess: (response, variables) => {
      // Extract target folder identifier context from hook parameters or variables
      const targetFolderId = params.folderId || variables.folderId;

      if (targetFolderId && typeof targetFolderId === 'string') {
        // Invalidates any folder-contents query key arrays matching this folder context id
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.folders({ folderId: targetFolderId }),
          exact: false
        });
      }

      // Refresh broad collections fallback query lists
      if (typeof refreshDriveQueries === "function") {
        refreshDriveQueries(queryClient);
      } else {
        queryClient.invalidateQueries({ queryKey: ["files"] });
      }

      toast.success("File uploaded successfully");
    },
  });
};
export const useToggleStarFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.toggleStarFile,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Star updated");
    },
  });
};

export const useRenameFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, name }) => fileApi.renameFile(fileId, { name }),
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("File renamed");
    },
  });
};

export const useCopyFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.copyFile,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("File copied");
    },
  });
};

export const useRestoreFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.restoreFile,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("File restored");
    },
  });
};

export const usePermanentlyDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.permanentlyDeleteFile,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("File permanently deleted");
    },
  });
};

export const useEmptyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.emptyTrash,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Trash emptied");
    },
  });
};


export const useStorageMetrics = () =>
  useQuery({
    queryKey: QUERY_KEYS.storageMetrics,
    queryFn: async () => {
      const response = await fileApi.getStorageMetrics();
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useDeleteFile = (params = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fileApi.deleteFile,
    
    onMutate: async (fileId) => {
      const queryKey = QUERY_KEYS.files(params);
      
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value for rollbacks if the network fails
      const previous = queryClient.getQueryData(queryKey);

      // SAFE OPTIMISTIC UPDATE: Check cache data structure before filtering
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;

        // Case 1: Backend wrapped your data in an object like { files: [...] }
        if (old.files && Array.isArray(old.files)) {
          return {
            ...old,
            files: old.files.filter((file) => file._id !== fileId)
          };
        }

        // Case 2: Backend wrapped your data in an object like { data: [...] }
        if (old.data && Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.filter((file) => file._id !== fileId)
          };
        }

        // Case 3: Data is actually a flat array [...]
        if (Array.isArray(old)) {
          return old.filter((file) => file._id !== fileId);
        }

        // Fallback: If structure matches none of the above, return as-is to avoid a crash
        return old;
      });

      return { previous, queryKey };
    },
    
    onError: (_error, _fileId, context) => {
      // Revert cache back to pristine state if server errors out
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      
      console.error("Delete backend error details:", _error?.response?.data || _error);

      // Cleaned up double toast: Use descriptive message if available, otherwise use a fallback
      const serverErrorMessage = _error?.response?.data?.message || "Unable to move file to trash";
      toast.error(serverErrorMessage);
    },
    
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Moved to trash");
    },
    
    onSettled: () => {
      refreshDriveQueries(queryClient);
    },
  });
};

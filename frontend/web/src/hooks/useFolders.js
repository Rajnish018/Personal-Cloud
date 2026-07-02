import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { folderApi } from "../api";
import { QUERY_KEYS } from "../utils/constants";
import { refreshDriveQueries } from "../utils/queryInvalidation";

export const useFolders = (params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.folders({ root: true, ...params }),
    queryFn: () => folderApi.getRootFolders(params),
    staleTime: 60 * 1000,
    select: (data) => data.folders || [],
  });

export const useTrashFolders = () =>
  useQuery({
    queryKey: QUERY_KEYS.trashFolders,
    queryFn: folderApi.getTrashFolders,
    staleTime: 60 * 1000,
    select: (data) => data.folders || [],
  });

export const useFolderContents = (folderId, params = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.folders({ folderId, ...params }),
    queryFn: () => folderApi.getFolderContents(folderId, params),
    enabled: Boolean(folderId),
    staleTime: 60 * 1000,
  });

export const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.createFolder,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Folder created");
    },
  });
};

export const useRenameFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, name }) => folderApi.renameFolder(folderId, { name }),
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Folder renamed");
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.deleteFolder,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Moved folder to trash");
    },
    onSettled: () => {
      refreshDriveQueries(queryClient);
    },
  });
};

export const useRestoreFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.restoreFolder,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Folder restored");
    },
  });
};

export const usePermanentlyDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.permanentlyDeleteFolder,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Folder permanently deleted");
    },
  });
};

export const useEmptyTrashFolders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: folderApi.emptyTrash,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Folder trash emptied");
    },
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { shareApi } from "../api";
import { QUERY_KEYS } from "../utils/constants";
import { refreshDriveQueries } from "../utils/queryInvalidation";

export const useSharedFiles = () =>
  useQuery({
    queryKey: QUERY_KEYS.sharedFiles,
    queryFn: shareApi.getSharedWithMe,
    staleTime: 60 * 1000,
  });

export const useSharedResource = (shareToken) =>
  useQuery({
    queryKey: ["share", shareToken],
    queryFn: () => shareApi.getSharedResource(shareToken),
    enabled: Boolean(shareToken),
    retry: false,
    staleTime: 60 * 1000,
  });

export const useMyShares = () =>
  useQuery({
    queryKey: QUERY_KEYS.shares,
    queryFn: shareApi.getMyShares,
    staleTime: 60 * 1000,
    select: (data) => data.shares || [],
  });


export const useShareFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // Make sure 'fileId' is passed explicitly so your API helper sends it either via path or body
    mutationFn: ({ fileId, permission = "view" }) =>
      shareApi.shareFile(fileId, { 
        permission, 
        isPublic: true,
        fileId // Explicitly appending this ensures it doesn't get lost in translation
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["share", data?.share?.shareToken] }); // Dynamic entry if needed
      queryClient.invalidateQueries({ queryKey: ["file", data?.share?.resourceId] });
      refreshDriveQueries(queryClient);
      
      toast.success("Share link created successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create share link");
    }
  });
};

export const useShareFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, permission = "view" }) =>
      shareApi.shareFolder(folderId, {
        permission,
        isPublic: true,
        folderId,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["share", data?.share?.shareToken] });
      refreshDriveQueries(queryClient);
      toast.success("Folder share link created successfully!");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create folder share link");
    },
  });
};

export const useUpdateSharePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ shareId, permission }) =>
      shareApi.updatePermission(shareId, { permission }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["share", data?.share?.shareToken] });
      refreshDriveQueries(queryClient);
      toast.success("Permission updated");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update permission");
    },
  });
};

export const useRevokeShare = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: shareApi.revokeShare,
    onSuccess: () => {
      refreshDriveQueries(queryClient);
      toast.success("Sharing link removed");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to remove sharing link");
    },
  });
};

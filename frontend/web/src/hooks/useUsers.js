import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi, userApi } from "../api";
import tokenService from "../services/tokenService";
import { QUERY_KEYS } from "../utils/constants";

// --- REINFORCED STRUCTURAL CALCULATIONS FALLBACK ---
const mergeProfileData = (previous, next) => ({
  ...previous,
  ...next,
  // Safely preserves current state or updates to incoming structural fields
  storage: next?.storage || previous?.storage || {
    used: next?.user?.storageUsed ?? previous?.user?.storageUsed ?? 0,
    total: next?.user?.storageLimit ?? previous?.user?.storageLimit ?? (15 * 1024 ** 3),
    remaining: Math.max(
      (next?.user?.storageLimit ?? previous?.user?.storageLimit ?? (15 * 1024 ** 3)) - 
      (next?.user?.storageUsed ?? previous?.user?.storageUsed ?? 0), 
      0
    ),
  },
});

export const useProfile = () =>
  useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: userApi.getProfile,
    staleTime: 30000,
    refetchOnMount: "always",
    select: (data) => data,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.profile, (previous) =>
        mergeProfileData(previous, data)
      );
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      toast.success("Profile updated");
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.profile, (previous) =>
        mergeProfileData(previous, data)
      );
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Profile photo updated");
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.verifyEmail,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.profile, (previous) =>
        mergeProfileData(previous, data)
      );
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Email verified");
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed");
    },
  });

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      tokenService.clear();
      queryClient.clear();
      toast.success("Account deleted");
    },
  });
};

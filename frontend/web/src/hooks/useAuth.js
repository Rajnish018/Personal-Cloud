import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { authApi } from "../api";
import tokenService from "../services/tokenService";
import { QUERY_KEYS } from "../utils/constants";

export const useAuthUser = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.authUser,
    queryFn: authApi.getProfile,
    enabled: enabled && Boolean(tokenService.getAccessToken()),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data) => data.user,
  });

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenService.setAccessToken(data.accessToken || data.token);
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Welcome back");
    },
  });
};

export const useRegisterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      tokenService.setAccessToken(data.accessToken || data.token);
      queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Account created");
    },
  });
};

export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      tokenService.clear();
      queryClient.clear();
    },
  });
};

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import {
  useAuthUser,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "../hooks/useAuth";
import tokenService from "../services/tokenService";
import { QUERY_KEYS } from "../utils/constants";

const AuthContext = createContext(null);

const isPublicAuthPage = () =>
  ["/login", "/register"].includes(window.location.pathname);

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [bootstrapping, setBootstrapping] = useState(
    !tokenService.getAccessToken() && !isPublicAuthPage()
  );
  const authUserQuery = useAuthUser({ enabled: !bootstrapping });
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    let isMounted = true;

    if (tokenService.getAccessToken() || isPublicAuthPage()) {
      return undefined;
    }

    authApi
      .refresh()
      .then((data) => {
        if (!isMounted) return;
        tokenService.setAccessToken(data.accessToken || data.token);
        queryClient.setQueryData(QUERY_KEYS.authUser, { user: data.user });
      })
      .catch(() => {
        tokenService.clear();
      })
      .finally(() => {
        if (isMounted) {
          setBootstrapping(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  const value = useMemo(
    () => ({
      user: authUserQuery.data || null,
      isAuthenticated:
        Boolean(authUserQuery.data) || Boolean(tokenService.getAccessToken()),
      loading:
        bootstrapping ||
        authUserQuery.isLoading ||
        loginMutation.isPending ||
        registerMutation.isPending ||
        logoutMutation.isPending,
      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
    }),
    [
      authUserQuery.data,
      authUserQuery.isLoading,
      bootstrapping,
      loginMutation.isPending,
      registerMutation.isPending,
      logoutMutation.isPending,
      loginMutation.mutateAsync,
      registerMutation.mutateAsync,
      logoutMutation.mutateAsync,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};

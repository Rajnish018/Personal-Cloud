import { QUERY_KEYS } from "./constants";

export const refreshDriveQueries = (queryClient) => {
  const queryFilters = [
    { queryKey: ["files"], exact: false },
    { queryKey: ["folders"], exact: false },
    { queryKey: ["share"], exact: false },
    { queryKey: ["notifications"], exact: false },
    { queryKey: QUERY_KEYS.authUser, exact: false },
    { queryKey: QUERY_KEYS.profile, exact: false },
    { queryKey: QUERY_KEYS.recentFiles, exact: false },
    { queryKey: QUERY_KEYS.starredFiles, exact: false },
    { queryKey: QUERY_KEYS.trashFiles, exact: false },
    { queryKey: QUERY_KEYS.trashFolders, exact: false },
    { queryKey: QUERY_KEYS.sharedFiles, exact: false },
    { queryKey: QUERY_KEYS.shares, exact: false },
  ];

  queryFilters.forEach((filters) => {
    queryClient.invalidateQueries(filters);
    queryClient.refetchQueries({ ...filters, type: "active" });
  });
};

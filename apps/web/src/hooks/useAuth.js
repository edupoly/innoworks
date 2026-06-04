import { useQuery } from "@tanstack/react-query";
import { useSelector, useDispatch } from "react-redux";
import api from "../lib/api";
import { setCredentials } from "../store/slices/authSlice";
import { useEffect } from "react";

export const useMe = () => {
  const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await api.get("/auth/me");
      return response.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes stale time for user session info
    gcTime: 1000 * 60 * 60,
    retry: 1
  });

  // Sync React Query data back to Redux if they differ or if we need to restore session
  useEffect(() => {
    if (query.data && (!isAuthenticated || authUser?._id !== query.data?._id)) {
      dispatch(setCredentials({ user: query.data, token: token || localStorage.getItem("token") }));
    }
  }, [query.data, isAuthenticated, authUser?._id, dispatch, token]);

  return {
    ...query,
    user: authUser || query.data,
    isAuthenticated: isAuthenticated || !!query.data,
  };
};

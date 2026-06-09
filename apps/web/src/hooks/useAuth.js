import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setCredentials, logout, setLoading } from "../store/slices/authSlice";
import { useGetMeQuery } from "../store/api/authApiSlice";
import { initiateSocket } from "../lib/socket";

export const useMe = () => {
  const { isAuthenticated, user: authUser, loading } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const { data, isLoading, isFetching, isSuccess, isError, error, refetch } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Timeout protection: ensure initialization screen always terminates
  useEffect(() => {
    if (token && loading) {
      const timer = setTimeout(() => {
        console.warn("useMe: session restoration timed out. Failsafe activated.");
        dispatch(setLoading(false));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [token, loading, dispatch]);

  // Sync RTK Query data back to Redux if they differ or if we need to restore session
  useEffect(() => {
    if (token) {
      if (isSuccess && data) {
        if (!isAuthenticated || authUser?._id !== data?._id) {
          dispatch(setCredentials({ user: data, token: token || localStorage.getItem("token") }));
          initiateSocket(data._id);
        } else {
          dispatch(setLoading(false));
          initiateSocket(data._id);
        }
      } else if (isError) {
        if (error.status === 'FETCH_ERROR') {
           console.warn("useMe: Network error during session restoration. Retrying may be required.");
           dispatch(setLoading(false));
        } else {
           console.error("useMe: session restoration error:", error);
           if (error.status === 401) {
             localStorage.removeItem("token");
             localStorage.removeItem("refreshToken");
             dispatch(logout());
           } else {
             dispatch(setLoading(false));
           }
        }
      } else if (!isLoading && !isFetching) {
        dispatch(setLoading(false));
      }
    }
  }, [token, isSuccess, isError, isLoading, isFetching, data, error, dispatch, isAuthenticated, authUser?._id]);

  return {
    data,
    user: authUser || data,
    isLoading,
    error,
    refetch,
    isAuthenticated: isAuthenticated || !!data,
  };
};

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
          console.log("useMe: session restored successfully for", data.username);
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
           console.error("useMe: session restoration error status:", error.status);
           
           // If we get a 401, it means the token is invalid and refresh failed (since baseQueryWithReauth handles refresh)
           if (error.status === 401) {
             console.warn("useMe: Session unrecoverable. Clearing credentials.");
             localStorage.removeItem("token");
             localStorage.removeItem("refreshToken");
             dispatch(logout());
           } else {
             // For other errors (500, etc.), just stop loading but don't force logout
             dispatch(setLoading(false));
           }
        }
      } else if (!isLoading && !isFetching && !data) {
        // No longer loading but no data and no success/error yet (edge case)
        dispatch(setLoading(false));
      }
    } else {
      // No token, ensure we're not stuck in loading
      if (loading) dispatch(setLoading(false));
    }
  }, [token, isSuccess, isError, isLoading, isFetching, data, error, dispatch, isAuthenticated, authUser?._id, loading]);

  return {
    data,
    user: authUser || data,
    isLoading,
    error,
    refetch,
    isAuthenticated: isAuthenticated || !!data,
  };
};

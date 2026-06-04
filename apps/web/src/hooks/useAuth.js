import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setCredentials, logout, setLoading } from "../store/slices/authSlice";
import { useGetMeQuery } from "../store/api/authApiSlice";

export const useMe = () => {
  const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const { data, isLoading, isSuccess, isError, error, refetch } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Sync RTK Query data back to Redux if they differ or if we need to restore session
  useEffect(() => {
    if (token) {
      if (isSuccess && data) {
        if (!isAuthenticated || authUser?._id !== data?._id) {
          dispatch(setCredentials({ user: data, token: token || localStorage.getItem("token") }));
        }
      } else if (isError) {
        console.error("useMe: session restoration error:", error);
        if (error.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          dispatch(logout());
        } else {
          dispatch(setLoading(false));
        }
      }
    }
  }, [token, isSuccess, isError, data, error, dispatch, isAuthenticated, authUser?._id]);

  return {
    data,
    user: authUser || data,
    isLoading,
    error,
    refetch,
    isAuthenticated: isAuthenticated || !!data,
  };
};

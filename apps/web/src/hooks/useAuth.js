import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { setCredentials } from "../store/slices/authSlice";
import { useGetMeQuery } from "../store/api/authApiSlice";

export const useMe = () => {
  const { isAuthenticated, user: authUser } = useSelector((state) => state.auth);
  const token = localStorage.getItem("token");
  const dispatch = useDispatch();

  const { data, isLoading, error, refetch } = useGetMeQuery(undefined, {
    skip: !token,
  });

  // Sync RTK Query data back to Redux if they differ or if we need to restore session
  useEffect(() => {
    if (data && (!isAuthenticated || authUser?._id !== data?._id)) {
      dispatch(setCredentials({ user: data, token: token || localStorage.getItem("token") }));
    }
  }, [data, isAuthenticated, authUser?._id, dispatch, token]);

  return {
    data,
    user: authUser || data,
    isLoading,
    error,
    refetch,
    isAuthenticated: isAuthenticated || !!data,
  };
};

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import api from "../lib/api.js";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    let token = searchParams.get("token");
    let refreshToken = searchParams.get("refreshToken");

    // Fallback: If token is not in searchParams, try to parse it from the URL string
    // This handles cases where the '?' might be missing or malformed
    if (!token) {
      const fullUrl = window.location.href;
      if (fullUrl.includes("token=")) {
        const tokenMatch = fullUrl.match(/token=([^&]+)/);
        if (tokenMatch) token = tokenMatch[1];
      }
      if (fullUrl.includes("refreshToken=")) {
        const refreshMatch = fullUrl.match(/refreshToken=([^&]+)/);
        if (refreshMatch) refreshToken = refreshMatch[1];
      }
    }

    if (token) {
      // Store tokens
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken || "");

      const fetchUser = async () => {
        try {
          const response = await api.get('/auth/me');
          dispatch(setCredentials({ user: response.data, token }));
          navigate("/dashboard");
        } catch (error) {
          console.error("Failed to fetch user", error);
          // Fallback if /me fails but token exists
          dispatch(setCredentials({ user: { username: "Developer" }, token }));
          navigate("/dashboard");
        }
      };

      fetchUser();
    } else {
      navigate("/");
    }
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight mb-2">Authenticating</h2>
          <p className="text-muted-foreground">Syncing your GitHub profile with Platform...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import api from "../lib/api.js";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [debugInfo, setDebugInfo] = useState("Initializing...");

  useEffect(() => {
    const runAuth = async () => {
      try {
        setDebugInfo("Component mounted, parsing tokens...");
        let token = searchParams.get("token");
        let refreshToken = searchParams.get("refreshToken");

        if (!token) {
          const fullUrl = window.location.href;
          setDebugInfo(`No token in params. Checking URL: ${fullUrl}`);
          const tokenMatch = fullUrl.match(/token=([^&]+)/);
          if (tokenMatch) token = tokenMatch[1];
          const refreshMatch = fullUrl.match(/refreshToken=([^&]+)/);
          if (refreshMatch) refreshToken = refreshMatch[1];
        }

        if (token) {
          setDebugInfo("Token found, storing and fetching user...");
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken || "");

          try {
            const response = await api.get('/auth/me');
            setDebugInfo("User fetched, updating store and navigating...");
            dispatch(setCredentials({ user: response.data, token }));
            navigate("/dashboard");
          } catch (error) {
            console.error("AuthCallback: Profile fetch failed", error);
            setDebugInfo("Profile fetch failed, using fallback...");
            dispatch(setCredentials({ user: { username: "Developer" }, token }));
            navigate("/dashboard");
          }
        } else {
          setDebugInfo("No token found in URL. Redirecting home in 3s...");
          setTimeout(() => navigate("/"), 3000);
        }
      } catch (err) {
        setDebugInfo(`CRITICAL ERROR: ${err.message}`);
        console.error("AuthCallback critical error:", err);
      }
    };

    runAuth();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight mb-2">Authenticating</h2>
          <p className="text-muted-foreground text-sm mb-4">Syncing your GitHub profile...</p>
          <div className="p-4 bg-muted rounded-xl text-[10px] font-mono break-all text-left border border-border">
            <p className="font-bold text-primary mb-1">Debug Status:</p>
            {debugInfo}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;

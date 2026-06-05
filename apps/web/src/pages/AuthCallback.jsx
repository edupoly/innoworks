import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { authApiSlice } from "../store/api/authApiSlice";

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
          setDebugInfo(`No token in params. Parsing raw URL...`);
          // Support both ?token= and callbacktoken= (malformed)
          const tokenMatch = fullUrl.match(/[?&]token=([^&]+)/) || fullUrl.match(/token=([^&]+)/);
          if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
            setDebugInfo("Token extracted from raw URL");
          }
          
          const refreshMatch = fullUrl.match(/[?&]refreshToken=([^&]+)/) || fullUrl.match(/refreshToken=([^&]+)/);
          if (refreshMatch) {
            refreshToken = decodeURIComponent(refreshMatch[1]);
          }
        }

        if (token) {
          setDebugInfo("Storing tokens in localStorage...");
          try {
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken || "");
            
            // VERIFICATION
            const savedToken = localStorage.getItem("token");
            if (savedToken === token) {
              setDebugInfo("Tokens VERIFIED in localStorage. Fetching user...");
            } else {
              setDebugInfo("CRITICAL: localStorage.setItem failed to persist data!");
              throw new Error("localStorage verification failed");
            }
          } catch (storageErr) {
            setDebugInfo(`Storage Error: ${storageErr.message}`);
            throw storageErr;
          }

          try {
            // Force fetch user profile using RTK Query imperative dispatch
            const result = await dispatch(authApiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true })).unwrap();
            setDebugInfo("User fetched, updating store and navigating...");
            dispatch(setCredentials({ user: result, token }));
            navigate("/dashboard", { replace: true });
          } catch (error) {
            console.error("AuthCallback: Profile fetch failed", error);
            setDebugInfo(`Profile fetch failed: ${error?.data?.message || error.message}. Redirecting home...`);
            // Remove tokens since they are invalid or profile fetch failed
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setTimeout(() => navigate("/", { replace: true }), 4000);
          }
        } else {
          setDebugInfo("No token found in URL. Redirecting home in 3s...");
          setTimeout(() => navigate("/", { replace: true }), 3000);
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

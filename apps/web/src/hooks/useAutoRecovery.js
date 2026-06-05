import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { apiSlice } from "../store/api/apiSlice";

export const useAutoRecovery = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const [isInactive, setIsInactive] = useState(false);
  
  const lastActivityRef = useRef(Date.now());
  const lastTickRef = useRef(Date.now());

  const triggerRefetch = () => {
    console.log("useAutoRecovery: Triggering full revalidation & data recovery...");
    
    // 1. Refetch all active queries in TanStack React Query
    queryClient.invalidateQueries();

    // 2. Refetch all active queries in RTK Query by invalidating tag types
    dispatch(
      apiSlice.util.invalidateTags([
        "User",
        "Project",
        "Submission",
        "Notification",
        "Leaderboard",
        "Repos",
      ])
    );
  };

  useEffect(() => {
    // 1. Visibility API Event Listener (Tab Switch / Re-entering App)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("useAutoRecovery: Visibility changed to visible");
        triggerRefetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Focus Event Listener (Window Focus)
    const handleFocus = () => {
      console.log("useAutoRecovery: Window focused");
      triggerRefetch();
    };
    window.addEventListener("focus", handleFocus);

    // 3. Network Reconnect Event Listener (Online)
    const handleOnline = () => {
      console.log("useAutoRecovery: Network connection restored (online)");
      triggerRefetch();
    };
    window.addEventListener("online", handleOnline);

    // 4. Inactivity & Active Re-engagement Detector
    const activityEvents = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    
    const updateActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If the user was marked inactive and is now engaging again, refresh data
      if (isInactive || timeSinceLastActivity > 300000) { // 5 minutes
        console.log("useAutoRecovery: User returned from inactivity. Refreshing data...");
        setIsInactive(false);
        triggerRefetch();
      }
      
      lastActivityRef.current = now;
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Inactivity check interval
    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > 300000) { // 5 minutes of no activity
        if (!isInactive) {
          console.log("useAutoRecovery: User marked as inactive");
          setIsInactive(true);
        }
      }
    }, 10000);

    // 5. Sleep/Wake Detector
    const sleepInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      
      if (delta > 25000) { // Expected check is 10s. If delta > 25s, computer slept
        console.log(`useAutoRecovery: Wake from sleep detected (tick delta: ${delta}ms)`);
        triggerRefetch();
      }
      
      lastTickRef.current = now;
    }, 10000);

    // 6. Automatic Background Refresh (5m polling when visible and active)
    const backgroundRefreshInterval = setInterval(() => {
      if (document.visibilityState === "visible" && !isInactive) {
        console.log("useAutoRecovery: Performing scheduled background refresh");
        triggerRefetch();
      }
    }, 300000);

    // Cleanup all event listeners and intervals
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityInterval);
      clearInterval(sleepInterval);
      clearInterval(backgroundRefreshInterval);
    };
  }, [queryClient, dispatch, isInactive, triggerRefetch]);

  return { isInactive };
};

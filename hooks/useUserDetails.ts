import { getUser } from "@/api/dashboardApi";
import { useCallback, useEffect, useState } from "react";

export function useUserDetails(enabled = true) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(enabled);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUser();
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    fetchUser();
  }, [enabled, fetchUser]);

  return { userData, loading, setUserData, refetch: fetchUser };
}


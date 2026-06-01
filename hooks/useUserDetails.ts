import { getUser } from "@/api/dashboardApi";
import { useEffect, useState } from "react";

export function useUserDetails(enabled = true) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const data = await getUser();
        if (mounted) setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { userData, loading, setUserData };
}

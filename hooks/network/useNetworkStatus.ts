import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(
        state.isConnected === true &&
        (state.isInternetReachable ?? true)
      );
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(
        state.isConnected === true &&
        (state.isInternetReachable ?? true)
      );
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}
    
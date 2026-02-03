import { useNetworkStatus } from "@/hooks/network/useNetworkStatus";
import React from "react";
import NoInternet from "../app/(common)/noInternet";

export function NetworkGate({ children }: { children: React.ReactNode }) {
  const isConnected = useNetworkStatus();

  if (isConnected === null) {
    return null; // or splash screen
  }

  if (isConnected === false) {
    return <NoInternet />;
  }

  return <>{children}</>;
}

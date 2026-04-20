import "react-native-gesture-handler"; // MUST BE FIRST
import "react-native-reanimated";
import "../global.css";

import { useEffect, useRef } from "react";

import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { setTokenGetter } from "@/lib/authToken";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedView } from "@/components/themed-view";
import * as Linking from "expo-linking";
import { ActivityIndicator, AppState, Image } from "react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { NetworkGate } from "../network/networkGate";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import Toast from "react-native-toast-message";
import { useApprovalStore } from "@/store/useApprovalStore";

/* ---------------- TOKEN CACHE ---------------- */

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      console.log(
        item
          ? `[TokenCache] Token found for key: ${key}`
          : `[TokenCache] No token found for key: ${key}`,
      );
      return item;
    } catch (err) {
      console.error(`[TokenCache] Error getting token for key: ${key}`, err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`[TokenCache] SAVE SUCCESS for key: ${key}`);
    } catch (err) {
      console.error(`[TokenCache] SAVE FAILED for key: ${key}`, err);
    }
  },
};

/* ---------------- AUTH GUARD ---------------- */

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !pathname) return;

    console.log("[AuthGuard]", { isSignedIn, pathname });

    const authRoutes = ["/", "/login", "/changePassword", "/editProfile"];

    if (
      !isSignedIn &&
      !authRoutes.includes(pathname) &&
      pathname !== "/auth-callback"
    ) {
      router.replace("/(auth)/login");
    }

    if (isSignedIn && authRoutes.includes(pathname)) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isLoaded, isSignedIn, router, pathname]);

  if (!isLoaded) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Image
          source={require("../assets/app-images/camp-logo.png")}
          style={{
            width: 200,
            height: 80,
            resizeMode: "contain",
            marginBottom: 20,
          }}
        />
        <ActivityIndicator size="large" color="#dc2626" />
      </ThemedView>
    );
  }

  return <>{children}</>;
}

/* ---------------- AUTH BRIDGE ---------------- */

function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return null;
}

function ApprovalGuard({ children }: { children: React.ReactNode }) {
  const { isApproved, isChecking, checkApproval } = useApprovalStore();
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  // Routes that should NOT be blocked by approval check
  const bypassRoutes = ["/", "/login", "/expiredPlan", "/auth-callback", "/changePassword"];

  const isBypassRoute = bypassRoutes.includes(pathname);

  // 1) Check approval on mount when signed in
  useEffect(() => {
    if (isSignedIn) {
      console.log("[ApprovalGuard] Checking approval on mount...");
      checkApproval();
    }
  }, [isSignedIn]);

  // 2) Re-check approval when app comes back to foreground (e.g., returning from browser after purchasing plan)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        isSignedIn
      ) {
        console.log("[ApprovalGuard] App returned to foreground, re-checking approval...");
        checkApproval();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isSignedIn]);

  // 3) Handle redirects based on approval status
  useEffect(() => {
    if (!isSignedIn || isChecking || isApproved === null || !pathname) return;

    console.log("[ApprovalGuard]", { isApproved, pathname, isBypassRoute });

    if (!isApproved && !isBypassRoute) {
      // Plan expired/not purchased — redirect to expiredPlan
      console.log("[ApprovalGuard] Plan expired, redirecting to expiredPlan");
      router.replace("/(auth)/expiredPlan");
    }

    if (isApproved && pathname === "/expiredPlan") {
      // Plan is now active but user is still on expiredPlan page — redirect to dashboard
      console.log("[ApprovalGuard] Plan active, redirecting to dashboard");
      router.replace("/(tabs)/dashboard");
    }
  }, [isApproved, isChecking, isSignedIn, pathname]);

  // Show loading while checking approval for signed-in users (on non-bypass routes)
  if (isSignedIn && (isChecking || isApproved === null) && !isBypassRoute) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: "#ffffff" }}
      >
        <Image
          source={require("../assets/app-images/camp-logo.png")}
          style={{
            width: 200,
            height: 80,
            resizeMode: "contain",
            marginBottom: 20,
          }}
        />
        <ActivityIndicator size="large" color="#dc2626" />
      </ThemedView>
    );
  }

  return <>{children}</>;
}



/* ---------------- LINKING DEBUG ---------------- */

function GlobalLinkingHandler() {
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("[Linking] URL received:", event.url);
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      console.log("[Linking] Initial URL:", url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

/* ---------------- ROOT LAYOUT ---------------- */

export default function RootLayout() {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthBridge />

        <NetworkGate>
          <AuthGuard>
            <ApprovalGuard>
            <GlobalLinkingHandler />
            <GluestackUIProvider config={config}>
              <OverlayProvider>
                <SafeAreaProvider>
                  <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                  >
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <QueryClientProvider client={queryClient}>
                        <Stack screenOptions={{ headerShown: false }}>
                          <Stack.Screen name="(auth)" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen name="auth-callback" />
                        </Stack>
                        <Toast />
                        <StatusBar style="auto" />
                      </QueryClientProvider>
                    </GestureHandlerRootView>
                  </ThemeProvider>
                </SafeAreaProvider>
              </OverlayProvider>
            </GluestackUIProvider>
            </ApprovalGuard>
          </AuthGuard>
        </NetworkGate>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

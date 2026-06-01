import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";

import React, { useEffect } from "react";

import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedView } from "@/components/themed-view";
import * as Linking from "expo-linking";
import { ActivityIndicator, Image } from "react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { NetworkGate } from "../network/networkGate";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import Toast from "react-native-toast-message";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";


/* ---------------- AUTH GUARD ---------------- */

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Run the reusable subscription verification hook
  useSubscriptionCheck();

  useEffect(() => {
    if (!isLoaded || !pathname) return;

    const publicRoutes = [
      "/",
      "/login",
      "/auth-callback",
      "/expiredPlan",
      "/(auth)/login",
      "/(auth)/expiredPlan",
      "/changePassword",
      "/(auth)/changePassword",
    ];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Only redirect to dashboard after login — not from expired-plan screen
    const postLoginRoutes = ["/", "/login", "/auth-callback", "/(auth)/login"];

    if (!isSignedIn && !isPublicRoute && pathname !== "/") {
      router.replace("/(auth)/login");
    }

    if (isSignedIn && postLoginRoutes.includes(pathname)) {
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
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();

  return (
    <NetworkGate>
      <AuthProvider>
        <AuthGuard>
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
                      <StatusBar style="auto" />
                      <Toast />
                    </QueryClientProvider>
                  </GestureHandlerRootView>
                </ThemeProvider>
              </SafeAreaProvider>
            </OverlayProvider>
          </GluestackUIProvider>
        </AuthGuard>
      </AuthProvider>
    </NetworkGate>
  );
}

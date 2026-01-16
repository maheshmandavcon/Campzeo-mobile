import "react-native-gesture-handler"; // 🔥 MUST BE FIRST
import "react-native-reanimated";
import "../global.css";

// import { OverlayProvider } from "@gluestack-ui/core/overlay";

import React, { useEffect } from "react";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";

import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

import { setTokenGetter } from "@/lib/authToken";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedView } from "@/components/themed-view";
import * as Linking from "expo-linking";
import { ActivityIndicator, Image } from "react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import { ThemedText } from "@/components/themed-text";

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`[TokenCache] Token found for key: ${key}`);
      } else {
        console.log(`[TokenCache] No token found for key: ${key}`);
      }
      return item;
    } catch (err) {
      console.error(`[TokenCache] Error getting token for key: ${key}`, err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      console.log(`[TokenCache] ATTEMPTING SAVE for key: ${key}`);
      await SecureStore.setItemAsync(key, value);
      console.log(`[TokenCache] SAVE SUCCESS for key: ${key}`);
    } catch (err) {
      console.error(`[TokenCache] SAVE FAILED for key: ${key}`, err);
      return;
    }
  },
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("[AuthGuard] State Change:", { isLoaded, isSignedIn, segments });
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      console.log("[AuthGuard] Redirecting to Dashboard (Signed In)");
      router.replace("/(tabs)/dashboard");
    } else if (!isSignedIn && !inAuthGroup) {
      console.log("[AuthGuard] Redirecting to Login (Not Signed In)");
      router.replace("/(auth)/login");
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <ThemedView className="flex-1 items-center justify-center" style={{ backgroundColor: "#ffffff" }}>
        <Image
          source={require("../assets/app-images/camp-logo.png")}
          style={{ width: 200, height: 80, resizeMode: "contain", marginBottom: 20 }}
        />
        <ActivityIndicator size="large" color="#dc2626" />
      </ThemedView>
    );
  }

  return <>{children}</>;
}

function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return null;
}

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

export default function RootLayout() {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  const colorScheme = useColorScheme(); // "light" | "dark"
  const queryClient = new QueryClient();

  if (!publishableKey) {
    throw new Error("Missing Clerk Publishable Key");
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthBridge />

        <AuthGuard>
          <GlobalLinkingHandler />
          <GluestackUIProvider config={config}>
            <SafeAreaProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <QueryClientProvider client={queryClient}>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                    <StatusBar style="auto" />
                  </QueryClientProvider>
                </GestureHandlerRootView>
              </ThemeProvider>
            </SafeAreaProvider>
          </GluestackUIProvider>
        </AuthGuard>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

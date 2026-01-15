import "react-native-gesture-handler"; // 🔥 MUST BE FIRST
import "react-native-reanimated";
import "../global.css";

import React, { useEffect } from "react";
import { ActivityIndicator } from "react-native";

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
import { ThemedText } from "@/components/themed-text";

import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";

/* -------------------------------------------------------------------------- */
/*                               Clerk Token Cache                             */
/* -------------------------------------------------------------------------- */

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
  async clearToken(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

/* -------------------------------------------------------------------------- */
/*                                   Guards                                    */
/* -------------------------------------------------------------------------- */

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isLoaded, isSignedIn, segments]);

  if (!isLoaded) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#dc2626" />
        <ThemedText style={{ marginTop: 12, fontSize: 14 }}>
          Loading dashboard…
        </ThemedText>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*                                Token Bridge                                 */
/* -------------------------------------------------------------------------- */

function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                 Root Layout                                 */
/* -------------------------------------------------------------------------- */

export default function RootLayout() {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  const colorScheme = useColorScheme(); // "light" | "dark"
  const queryClient = new QueryClient();

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthBridge />

        <GluestackUIProvider
          config={config}
          colorMode={colorScheme === "dark" ? "dark" : "light"}
        >
          <SafeAreaProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <GestureHandlerRootView style={{ flex: 1 }}>
                <QueryClientProvider client={queryClient}>
                  <AuthGuard>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(auth)" />
                      <Stack.Screen name="(tabs)" />
                    </Stack>
                  </AuthGuard>
                  <StatusBar style="auto" />
                </QueryClientProvider>
              </GestureHandlerRootView>
            </ThemeProvider>
          </SafeAreaProvider>
        </GluestackUIProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

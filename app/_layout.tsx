import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";

import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";

import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import React, { useEffect } from "react";
import { setTokenGetter } from "@/lib/authToken";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemedView } from "@/components/themed-view";
import { ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/themed-text";

// Secure token cache for Clerk
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error("SecureStore getToken error:", err);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore saveToken error:", err);
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("SecureStore clearToken error:", err);
    }
  },
};

// function AuthGuard({ children }: { children: React.ReactNode }) {
//   const { isSignedIn, isLoaded } = useAuth();
//   const segments = useSegments();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoaded) return;

//     const inAuthGroup = segments[0] === "(auth)";

//     if (!isSignedIn && !inAuthGroup) {
//       router.replace("/(auth)/login");
//     } else if (isSignedIn && inAuthGroup) {
//       router.replace("/(tabs)/dashboard");
//     }
//   }, [isLoaded, isSignedIn, segments]);

//   // 🔑 IMPORTANT: block render while auth loads
//   if (!isLoaded) {
//     return null; // or loading spinner
//   }

//   return <>{children}</>;
// }

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
        <ThemedText
          style={{
            marginTop: 12,
            fontSize: 14,
            color: "#6b7280",
          }}
        >
          Loading dashboard…
        </ThemedText>
      </ThemedView>
    ); // or spinner
  }

  return <>{children}</>;
}

// set token getter function
function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  return null;
}

export default function RootLayout() {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey;
  const colorScheme = useColorScheme();
  const queryClient = new QueryClient();

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AuthBridge />

        <AuthGuard>
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

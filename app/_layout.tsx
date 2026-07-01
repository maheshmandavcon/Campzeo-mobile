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
import * as SplashScreen from "expo-splash-screen";
import { ActivityIndicator, Image, Animated, StyleSheet } from "react-native";
import { Megaphone, Calendar, Users, FileText, BarChart, Mail, MessageSquare } from "lucide-react-native";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { config } from "@gluestack-ui/config";
import { NetworkGate } from "../network/networkGate";
import { OverlayProvider } from "@gluestack-ui/core/overlay/creator";
import Toast from "react-native-toast-message";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { useApprovalStore } from "@/store/useApprovalStore";


// Prevent native splash screen from auto-hiding until our JS splash takes over
SplashScreen.preventAutoHideAsync().catch(() => {});

/* ---------------- SPLASH SCREEN ---------------- */
function LoadingSplash() {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    // Hide the native splash screen seamlessly before starting our custom animations
    SplashScreen.hideAsync().catch(() => {});

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.25,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, opacityAnim, floatAnim]);

  const isDark = colorScheme === "dark";
  const bgColor = isDark ? "#0f1115" : "#fef2f2"; 
  const iconColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(220,38,38,0.18)";

  // Decorative circles for a glow/depth effect
  const circle1Color = isDark ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.12)";
  const circle2Color = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)";

  const icons = [
    { Icon: Megaphone, top: "12%", left: "10%", size: 64, rotation: "-15deg", offset: 12 },
    { Icon: Calendar, top: "20%", left: "72%", size: 58, rotation: "10deg", offset: -15 },
    { Icon: FileText, top: "65%", left: "12%", size: 70, rotation: "-5deg", offset: 14 },
    { Icon: Users, top: "72%", left: "72%", size: 60, rotation: "20deg", offset: -12 },
    { Icon: BarChart, top: "42%", left: "82%", size: 54, rotation: "45deg", offset: 8 },
    { Icon: Mail, top: "45%", left: "6%", size: 52, rotation: "-25deg", offset: -10 },
    { Icon: MessageSquare, top: "8%", left: "42%", size: 48, rotation: "5deg", offset: 6 },
    { Icon: Calendar, top: "82%", left: "40%", size: 62, rotation: "-10deg", offset: -8 },
  ];

  return (
    <ThemedView
      className="flex-1 items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Background Decorative Shapes */}
      <Animated.View
        style={{
          position: "absolute",
          top: "-15%",
          left: "-25%",
          width: 450,
          height: 450,
          borderRadius: 225,
          backgroundColor: circle1Color,
          opacity: opacityAnim,
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 25],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-15%",
          width: 350,
          height: 350,
          borderRadius: 175,
          backgroundColor: circle1Color,
          opacity: opacityAnim,
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          position: "absolute",
          top: "35%",
          left: "20%",
          width: 600,
          height: 600,
          borderRadius: 300,
          backgroundColor: circle2Color,
          opacity: opacityAnim,
          transform: [
            {
              scale: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.05],
              }),
            },
          ],
        }}
      />

      {/* Floating Icons Pattern */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
        {icons.map((item, index) => {
          const { Icon, top, left, size, rotation, offset } = item;
          return (
            <Animated.View
              key={index}
              style={{
                position: "absolute",
                top: top as any,
                left: left as any,
                transform: [
                  { rotate: rotation },
                  { scale: scaleAnim },
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, offset],
                    }),
                  },
                ],
              }}
            >
              <Icon size={size} color={iconColor} strokeWidth={2} />
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.Image
        source={require("../assets/app-images/camp-logo.png")}
        style={{
          width: 250,
          height: 100,
          resizeMode: "contain",
          transform: [{ scale: scaleAnim }],
        }}
      />
    </ThemedView>
  );
}

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

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      queryClient.clear();
      useApprovalStore.getState().reset();
    }
  }, [isLoaded, isSignedIn]);



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
  const postLoginRoutes = ["/", "/login", "/auth-callback", "/(auth)/login"];
  const isPublicRoute = publicRoutes.includes(pathname || "");
  const isPostLoginRoute = postLoginRoutes.includes(pathname || "");

  const pendingRedirectToLogin = !isSignedIn && !isPublicRoute && pathname !== "/";
  const pendingRedirectToDashboard = isSignedIn && isPostLoginRoute;

  const showSplash = !isLoaded || pendingRedirectToLogin || pendingRedirectToDashboard;

  if (showSplash) {
    return <LoadingSplash />;
  }

  return <>{children}</>;
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

/* ---------------- ROOT LAYOUT ---------------- */

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

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

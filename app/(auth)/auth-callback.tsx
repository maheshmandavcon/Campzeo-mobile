import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedText } from "@/components/themed-text";
import * as WebBrowser from "expo-web-browser";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/(tabs)/dashboard");
    } else {
      router.replace("/(auth)/login");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedText>Verifying session...</ThemedText>
      <ActivityIndicator size="large" style={{ marginTop: 20 }} />
    </View>
  );
}



// import { useEffect } from "react";
// import { View, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo";

// export default function AuthCallback() {
//   const { isSignedIn, isLoaded } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoaded) return;

//     if (isSignedIn) {
//       router.replace("/(tabs)/dashboard");
//     } else {
//       router.replace("/login");
//     }
//   }, [isLoaded, isSignedIn]);

//   return (
//     <View style={{ flex: 1, justifyContent: "center" }}>
//       <ActivityIndicator />
//     </View>
//   );
// }


import { useEffect } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      router.replace("/(tabs)/dashboard");
    }
  }, [isLoaded, isSignedIn]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ThemedText>Auth callback page</ThemedText>  <ActivityIndicator />
    </ThemedView>
  );
}



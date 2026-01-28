import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
// import { useRouter } from "expo-router";
// import { Pressable } from "react-native";

export default function NotFound() {
  // const routePage = useRouter();
  // ✅ Prevents crashes when OAuth redirect URL is temporarily unmatched
  return (
    <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedText>Page Not Found...</ThemedText>
    {/* <Pressable onPress={() => {routePage.push("/(tabs)/dashboard")}}><ThemedText>Go to dashboard</ThemedText></Pressable> */}
    </ThemedView>
  );
}

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function NotFound() {
  // ✅ Prevents crashes when OAuth redirect URL is temporarily unmatched
  return (
    <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedText>Not Found...</ThemedText>
    </ThemedView>
  );
}

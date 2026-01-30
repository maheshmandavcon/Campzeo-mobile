import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function NotFound() {

  return (
    <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ThemedText>Page Not Found...</ThemedText>
    </ThemedView>
  );
}

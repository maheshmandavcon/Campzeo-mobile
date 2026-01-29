import { View, Text, TouchableOpacity } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WifiOff } from "lucide-react-native";

export default function NoInternet() {
  const retry = () => {
    NetInfo.fetch(); // re-triggers network check
  };

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: 24,
      }}
    >
      <WifiOff size={64} color="#dc2626" strokeWidth={2} />

      <ThemedText style={{ fontSize: 22, fontWeight: "600", marginVertical: 8 }}>
        No Internet Connection
      </ThemedText>

      <ThemedText
        style={{
          fontSize: 14,
          color: "#666",
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Please check your internet connection and try again.
      </ThemedText>

      <TouchableOpacity
        onPress={retry}
        style={{
          backgroundColor: "#dc2626",
          paddingHorizontal: 28,
          paddingVertical: 12,
          borderRadius: 8,
        }}
      >
        <ThemedText style={{ color: "#fff", fontSize: 16 }}>Retry</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

import { View, Text } from "react-native";

export default function NotFound() {
  // ✅ Prevents crashes when OAuth redirect URL is temporarily unmatched
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Redirecting...</Text>
    </View>
  );
}

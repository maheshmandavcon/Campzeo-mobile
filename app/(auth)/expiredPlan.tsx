// import { useUser } from "@clerk/clerk-expo";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Linking, Pressable } from "react-native";

export default function ExpiredPlan() {
  // const { user } = useUser();

  return (
    <>
      <ThemedView>
        <ThemedText>Your plan has expired</ThemedText>
        <ThemedText>
          Please renew your plan to continue using the app
        </ThemedText>
        <Pressable
          onPress={() => {
            Linking.openURL("https://campzeo.com/select-plan");
          }}
          style={{
            borderWidth: 1,
            borderColor: "#dc2626",
            padding: 10,
            borderRadius: 10,
            backgroundColor: "#dc2626",
          }}
        >
          Choose Your Plan
        </Pressable>
      </ThemedView>
    </>
  );
}

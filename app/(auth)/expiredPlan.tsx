// import { useUser } from "@/context/AuthContext";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useApprovalStore } from "@/store/useApprovalStore";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Linking, Pressable, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExpiredPlan() {
  // const { user } = useUser();
const { checkApproval } = useApprovalStore();
useFocusEffect(useCallback(() => {
  checkApproval();
}, [checkApproval]));

  return (
    <>
    <SafeAreaView className="flex-1">
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
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: "#dc2626",
          }}
        >
          <Text className="text-white text-center">Choose Your Plan</Text>
          Choose Your Plan
        </Pressable>
        
        <Pressable onPress={() => {
          checkApproval();
        }}
        style={{
          borderWidth: 1,
          borderColor: "#dc2626",
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: "#dc2626",
        }}
        >
          <Text className="text-white text-center">Refresh if already purchased</Text>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
    </>
  );
}

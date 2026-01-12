import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Linking } from "react-native";
// import { Slot } from "expo-router";
import { Image } from "react-native";

import BottomBar from "../(common)/bottomBar";
import Sidebar from "../(common)/sideBar";
import TopBar from "../(common)/topBar";

import { useApprovalStore } from "@/store/useApprovalStore";
import { ThemedView } from "@/components/themed-view";

export default function TabLayout() {
  const { isApproved, isChecking, checkApproval } = useApprovalStore();

  // ✅ HOOK 1 — always runs
  useEffect(() => {
    if (isApproved === null) {
      checkApproval();
    }
  }, [isApproved]);

  // ✅ HOOK 2 — always runs
  useEffect(() => {
    if (isApproved === false) {
      Linking.openURL("https://www.campzeo.com");
    }
  }, [isApproved]);

  // ⏳ Loading
  if (isChecking || isApproved === null) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Image
          source={require("../../assets/app-images/camp-logo.png")}
          style={{ width: 330, height: 170 }}
          resizeMode="contain"
        />
      </ThemedView>
    );
  }

  // 🚫 Not approved → app UI blocked
  if (isApproved === false) {
    return null;
  }

  // ✅ Approved → normal app
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <TopBar />
      {/* <Slot /> */}
      <BottomBar />
      <Sidebar />
    </SafeAreaView>
  );
}

import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Linking } from "react-native";

import BottomBar from "../(common)/bottomBar";
import Sidebar from "../(common)/sideBar";
import TopBar from "../(common)/topBar";

import { useApprovalStore } from "@/store/useApprovalStore";
import { ThemedView } from "@/components/themed-view";
import { Image } from "react-native";

export default function TabLayout() {
  const { isApproved, isChecking, checkApproval } = useApprovalStore();

  // 🔁 Check approval once
  useEffect(() => {
    if (isApproved === null) {
      checkApproval();
    }
  }, [isApproved]);

  // ⏳ While checking approval
  if (isChecking || isApproved === null) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Image
          source={require("../../assets/app-images/camp-logo.png")}
          style={{ width: 330, height: 170, borderRadius: 6 }}
          resizeMode="contain"
          alt="CampZeo logo"
        />
      </ThemedView>
    );
  }

  // Not approved → redirect to website
  if (isApproved === false) {
    Linking.openURL("https://camp-zeo-testing-git-testing-mandav-consultancy.vercel.app");
    // another url :  https://www.campzeo.com
    return null;
  }

  // Approved → render app UI
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <TopBar />
      <BottomBar />
      <Sidebar />
    </SafeAreaView>
  );
}

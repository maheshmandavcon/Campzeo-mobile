import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HapticTab } from "@/components/haptic-tab";

import { SafeAreaView } from "react-native-safe-area-context";
import TopBar from "../(common)/topBar";
import Sidebar from "../(common)/sideBar";

export default function TabsLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      {/* UI overlays */}
      <TopBar />
      <Sidebar />

      {/* Bottom tab navigator */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#dc2626",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarStyle: {
            height: 75,
            paddingTop: 5,
            backgroundColor: "#fff",
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.08,
            shadowRadius: 8,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="chart.bar" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="logs"
          options={{
            title: "Logs",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="doc.text" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="campaigns"
          options={{
            title: "Campaigns",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="map" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="envelope" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: "Accounts",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="manage-accounts" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

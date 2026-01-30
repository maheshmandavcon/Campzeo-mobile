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

      {/* REAL bottom tab navigator */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#dc2626",
          tabBarInactiveTintColor: "#777777ff",
          tabBarButton: HapticTab,
          tabBarStyle: {
            paddingTop: 5,
            height: 75,
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
          name="invoices"
          options={{
            title: "Invoices",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name="receipt" color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

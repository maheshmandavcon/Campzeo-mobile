import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Tabs } from "expo-router";

/* ----------------------------- TAB CONFIG ----------------------------- */

const TAB_CONFIG = [
  {
    name: "dashboard",
    title: "Dashboard",
    icon: "chart.bar",
  },
  {
    name: "logs",
    title: "Logs",
    icon: "doc.text",
  },
  {
    name: "campaigns",
    title: "Campaigns",
    icon: "map",
  },
  {
    name: "contacts",
    title: "Contacts",
    icon: "envelope",
  },
  {
    name: "invoices",
    title: "Invoices",
    icon: "receipt",
  },
] as const;

/* ----------------------------- COMPONENT ----------------------------- */

export default function BottomBar() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#dc2626",
        tabBarInactiveTintColor: "#777777ff",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 5, // 👈 vertical padding
          height: 75, // 👈 IMPORTANT: increase height
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={29} name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

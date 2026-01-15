import CalendarWrapper from "@/app/(common)/calendarWrapper";
import { ThemedView } from "@/components/themed-view";
import { useState } from "react";
import { View, useColorScheme, useWindowDimensions } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import Insights from "./dashboardComponents/insights";

export default function Dashboard() {
  const layout = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [index, setIndex] = useState(0);

  /* ---------------- TAB SCENES ---------------- */

  const FirstRoute = () => (
    <ThemedView className="flex-1">
      <Insights />
    </ThemedView>
  );

  const SecondRoute = () => (
    <ThemedView className="flex-1">
      <CalendarWrapper />
    </ThemedView>
  );

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  });

  const routes = [
    { key: "first", title: "Dashboard" },
    { key: "second", title: "Calendar" },
  ];

  /* ---------------- TAB HEADER ---------------- */

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
      indicatorStyle={{
        backgroundColor: "#dc2626",
        height: 3,
      }}
      activeColor="#dc2626"
      inactiveColor="#777777ff"
      labelStyle={{
        fontSize: 14,
        fontWeight: "600",
        textTransform: "none",
        lineHeight: 16,
      }}
    />
  );

  /* ---------------- ROOT WRAPPER ---------------- */
  // 🔥 MUST be a native View (NOT ThemedView)

  return (
    <View style={{ flex: 1 }}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
}

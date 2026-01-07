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

  const FirstRoute = () => (
    <View style={{ flex: 1 }}>
      <Insights />
    </View>
  );

  const SecondRoute = () => (
    <View style={{ flex: 1 }}>
      <CalendarWrapper />
    </View>
  );

  const renderScene = SceneMap({
    first: FirstRoute,
    second: SecondRoute,
  });

  const routes = [
    { key: "first", title: "Dashboard" },
    { key: "second", title: "Calendar" },
  ];

  /* ---------------- TAB HEADER (TAB BAR) ---------------- */
  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      style={{
        backgroundColor: isDark ? "#020617" : "#ffffff", // header bg
        elevation: 0,          // Android shadow
        shadowOpacity: 0,      // iOS shadow
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
      }}
      indicatorStyle={{
        backgroundColor: "#dc2626", // active tab underline
        height: 3,
      }}
      activeColor={"#dc2626"}
      inactiveColor={isDark ? "#777777ff" : "#777777ff"}
      labelStyle={{
        fontSize: 14,
        fontWeight: "600",
        textTransform: "none",
        lineHeight: 7
      }}
    />
  );

  return (
    <ThemedView className="flex-1">
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}  
      />
    </ThemedView>
  );
}

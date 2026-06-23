import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { HStack, VStack } from "@gluestack-ui/themed";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, useColorScheme } from "react-native";
import CalendarView from "../CalendarComponents/calendarView";
import Insights from "@/app/(tabs)/dashboard/dashboardComponents/insights";
import CalendarWrapper from "@/app/(common)/calendarWrapper";
import CalendarInsights from "./calendarInsights";
import CalendarExports from "./calendarExport";

export default function CalendarParent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeCalendarTab, setActiveCalendarTab] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs = [
    { key: 1, label: "Planner", icon: "calendar" },
    { key: 2, label: "Insights", icon: "stats-chart" },
    { key: 3, label: "Export", icon: "download" },
  ];

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);

    await new Promise<void>((resolve) =>
      setTimeout(resolve, 800)
    );

    setRefreshing(false);
  }, []);

  return (
    <>
      <ThemedView
        style={{
          flex: 1,
          padding: 15,
        }}
      >
        <HStack
          className="rounded-full mb-6"
          style={{
            paddingVertical: 3,
            paddingHorizontal: 3,
            borderRadius: 130,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: isDark ? "#334155" : "#e5e7eb",
          }}
        >
          {tabs.map((tab) => {
            const active = activeCalendarTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  setActiveCalendarTab(tab.key);
                }}
                className="flex-1 px-4 py-3 rounded-full flex-row items-center justify-center"
                style={active ? { backgroundColor: "#dc2626" } : {}}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={active ? "#fff" : isDark ? "#aaa" : "#6b7280"}
                  className="mr-1"
                />
                <Text
                  className={`text-md font-medium ${active ? "text-white" : isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </HStack>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#dc2626"
              colors={["#dc2626"]}
            />
          }
        >
          <VStack>
            {activeCalendarTab === 1 && <CalendarWrapper key={`planner-${refreshKey}`} />}
            {activeCalendarTab === 2 && <CalendarInsights key={`insights-${refreshKey}`} />}
            {activeCalendarTab === 3 && <CalendarExports key={`export-${refreshKey}`} />}
          </VStack>
        </ScrollView>
      </ThemedView>
    </>
  );
}


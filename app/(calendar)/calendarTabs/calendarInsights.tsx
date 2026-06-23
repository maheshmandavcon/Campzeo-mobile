import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useRef, useState } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { getPostsInsights } from "@/api/dashboardApi";


export default function CalendarInsights() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Date states
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [insightsData, setInsightsData] = useState<any>([]);
  // Picker states
  const [platform, setPlatform] = useState("all");
  const [showPicker, setShowPicker] = useState(false);
  const [pickingMode, setPickingMode] = useState<"from" | "to">("from");
  const [refreshing, setRefreshing] = useState(false);

  const pieRef = useRef<any>(null);
  const barRef = useRef<any>(null);

  const [showFilters, setShowFilters] = useState(false);

  // const platformColors: any = {
  //   FACEBOOK: "#3b82f6",
  //   INSTAGRAM: "#22c55e",
  //   LINKEDIN: "#f59e0b",
  //   PINTEREST: "#ef4444",
  //   YOUTUBE: "#8b5cf6",
  // };

  const platformColors: any = {
    FACEBOOK: "#1877F2",
    INSTAGRAM: "#E4405F",
    LINKEDIN: "#0A66C2",
    PINTEREST: "#BD081C",
    YOUTUBE: "#FF0000",
    WHATSAPP: "#25D366",
    EMAIL: "#F59E0B",
    SMS: "#8B5CF6",
  };

  const barData =
    insightsData?.platformMix?.map((item: any) => ({
      value: item.count,
      label: item.platform,
      frontColor: platformColors[item.platform] || "#999",
    })) || [];

  const total = insightsData?.totalPosts || 1;

  const pieData =
    insightsData?.platformMix?.map((item: any) => ({
      value: item.count,
      color: platformColors[item.platform] || "#999",
      text: `${Math.round((item.count / total) * 100)}%`,
      // shiftTextX: -10,
    })) || [];

  const fetchInsights = async () => {
    try {
      const from = fromDate ? fromDate.toISOString() : "";
      const to = toDate ? toDate.toISOString() : "";

      const response = await getPostsInsights(platform, from, to);
      console.log("Insights Data:", response);
      setInsightsData(response);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  }, [platform, fromDate, toDate]);

  useEffect(() => {
    fetchInsights();
  }, [platform, fromDate, toDate]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickingMode === "from") {
        setFromDate(selectedDate);
      } else {
        setToDate(selectedDate);
      }
    }
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const maxCount = Math.max(
    ...barData.map((item: any) => item.value),
    1
  );

  return (
    <ThemedView
      style={{
        justifyContent: "flex-start",
      }}
    >
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
      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 15,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 16,
          marginBottom: 10,
        }}
      >
        <HStack style={{ alignItems: "center", gap: 8 }}>
          <Ionicons
            name="options-outline"
            size={20}
            color={isDark ? "#fff" : "#000"}
          />
          <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
            Filters
          </ThemedText>
        </HStack>

        <Ionicons
          name={showFilters ? "chevron-up" : "chevron-down"}
          size={20}
          color={isDark ? "#fff" : "#000"}
        />
      </TouchableOpacity>

      {/* Date Filter */}
      {showFilters && (
        <VStack
          style={{
            gap: 5,
            marginBottom: 10,
            width: "100%",
            padding: 15,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
          }}
        >
          <HStack style={{ gap: 10, width: "100%" }}>
            {/* From Date */}
            <VStack style={{ flex: 1, gap: 4 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>From</ThemedText>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#333" : "rgba(0,0,0,0.1)",
                  borderRadius: 14,
                  backgroundColor: isDark ? "#1a1a1a" : "rgba(255,255,255,0.9)",
                  height: 45,
                  paddingHorizontal: 12,
                }}
                onPress={() => {
                  setPickingMode("from");
                  setShowPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={isDark ? "#aaa" : "rgba(0,0,0,0.4)"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 13 }}>
                  {fromDate ? formatDate(fromDate) : "Select Date"}
                </Text>
              </TouchableOpacity>
            </VStack>

            {/* To Date */}
            <VStack style={{ flex: 1, gap: 4 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>To</ThemedText>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: isDark ? "#333" : "rgba(0,0,0,0.1)",
                  borderRadius: 14,
                  backgroundColor: isDark ? "#1a1a1a" : "rgba(255,255,255,0.9)",
                  height: 45,
                  paddingHorizontal: 12,
                }}
                onPress={() => {
                  setPickingMode("to");
                  setShowPicker(true);
                }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={isDark ? "#aaa" : "rgba(0,0,0,0.4)"}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 13 }}>
                  {toDate ? formatDate(toDate) : "Select Date"}
                </Text>
              </TouchableOpacity>
            </VStack>

            {showPicker && (
              <DateTimePicker
                value={
                  pickingMode === "from"
                    ? fromDate || new Date()
                    : toDate || new Date()
                }
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onDateChange}
              />
            )}
          </HStack>
          {/* Platform Dropdown and Refresh */}
          <HStack
            style={{
              alignItems: "flex-end",
              gap: 10,
            }}
          >
            <VStack style={{ flex: 1, gap: 4 }}>
              <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                Platform
              </ThemedText>
              <Dropdown
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#333" : "#ddd",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 45,
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                }}
                placeholderStyle={{
                  color: isDark ? "#777" : "#999",
                  fontSize: 14,
                }}
                selectedTextStyle={{
                  color: isDark ? "white" : "black",
                  fontSize: 14,
                }}
                containerStyle={{
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                  borderColor: isDark ? "#333" : "#ddd",
                  borderRadius: 12,
                }}
                itemTextStyle={{ color: isDark ? "white" : "black" }}
                activeColor={isDark ? "#333" : "#f0f0f0"}
                data={[
                  { label: "All Platforms", value: "all" },
                  { label: "Email", value: "EMAIL" },
                  { label: "SMS", value: "SMS" },
                  { label: "Facebook", value: "FACEBOOK" },
                  { label: "WhatsApp", value: "WHATSAPP" },
                  { label: "Instagram", value: "INSTAGRAM" },
                  { label: "LinkedIn", value: "LINKEDIN" },
                  { label: "YouTube", value: "YOUTUBE" },
                  { label: "Pinterest", value: "PINTEREST" },
                ]}
                labelField="label"
                valueField="value"
                placeholder="Select Platform"
                value={platform}
                onChange={(item) => {
                  setPlatform(item.value);
                }}
              />
            </VStack>

            <TouchableOpacity
              onPress={fetchInsights}
              style={{
                height: 45,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: "#dc2626",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                Refresh
              </Text>
            </TouchableOpacity>
          </HStack>
        </VStack>
      )}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginBottom: 8,
          rowGap: 12,
        }}
      >
        {/* Total Posts */}
        <VStack
          style={{
            padding: 15,
            gap: 9,
            width: "48%",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            minHeight: 120,
            backgroundColor: isDark ? "#0f172a" : "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 22 }}>
              {insightsData?.totalPosts ?? "-"}
            </ThemedText>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#6b728022", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="document-text-outline" size={18} color="#6b7280" />
            </View>
          </View>
          <ThemedText style={{ fontWeight: "600", fontSize: 13, color: isDark ? "#cbd5e1" : "#374151" }}>
            Total Posts
          </ThemedText>
          <HStack className="items-center gap-2">
            <Ionicons name="trending-up" size={12} color={"#6a7282"} />
            <ThemedText style={{ fontSize: 11, color: "#6a7282" }}>
              All records
            </ThemedText>
          </HStack>
        </VStack>

        {/* Upcoming Posts */}
        <VStack
          style={{
            padding: 15,
            gap: 9,
            width: "48%",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            minHeight: 120,
            backgroundColor: isDark ? "#0f172a" : "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 22 }}>
              {insightsData?.stats?.upcoming ?? "-"}
            </ThemedText>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#00a63e22", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="time-outline" size={18} color="#00a63e" />
            </View>
          </View>
          <ThemedText style={{ fontWeight: "600", fontSize: 13, color: isDark ? "#cbd5e1" : "#374151" }}>
            Upcoming
          </ThemedText>
          <HStack className="items-center gap-2">
            <Ionicons name="trending-up" size={12} color={"#00a63e"} />
            <ThemedText style={{ fontSize: 11, color: "#00a63e" }}>
              Scheduled
            </ThemedText>
          </HStack>
        </VStack>

        {/* Past (Published) */}
        <VStack
          style={{
            padding: 15,
            gap: 9,
            width: "48%",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            minHeight: 120,
            backgroundColor: isDark ? "#0f172a" : "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 22 }}>
              {insightsData?.stats?.past ?? "-"}
            </ThemedText>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#155dfc22", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="bar-chart-outline" size={18} color="#155dfc" />
            </View>
          </View>
          <ThemedText style={{ fontWeight: "600", fontSize: 13, color: isDark ? "#cbd5e1" : "#374151" }}>
            Published
          </ThemedText>
          <HStack className="items-center gap-2">
            <Ionicons name="checkmark-circle-outline" size={12} color={"#155dfc"} />
            <ThemedText style={{ fontSize: 11, color: "#155dfc" }}>
              Sent
            </ThemedText>
          </HStack>
        </VStack>

        {/* Drafts */}
        <VStack
          style={{
            padding: 15,
            gap: 9,
            width: "48%",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            minHeight: 120,
            backgroundColor: isDark ? "#0f172a" : "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <ThemedText style={{ fontWeight: "bold", fontSize: 22 }}>
              {insightsData?.stats?.drafts ?? "-"}
            </ThemedText>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#f54a0022", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="create-outline" size={18} color="#f54a00" />
            </View>
          </View>
          <ThemedText style={{ fontWeight: "600", fontSize: 13, color: isDark ? "#cbd5e1" : "#374151" }}>
            Drafts
          </ThemedText>
          <HStack className="items-center gap-2">
            <Ionicons name="calendar-outline" size={12} color={"#f54a00"} />
            <ThemedText style={{ fontSize: 11, color: "#f54a00" }}>
              Pending
            </ThemedText>
          </HStack>
        </VStack>
      </View>

      {/* Charts Section */}
      <VStack style={{ marginTop: 20, gap: 15 }}>
        {/* Pie Chart */}

        <VStack
          style={{
            padding: 15,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
          }}
        >
          <VStack>
            <HStack className="justify-between mb-2 items-center">
              <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
                Platform Distribution
              </ThemedText>

            </HStack>
            <ThemedText
              style={{ fontSize: 12, color: "#6a7282", marginBottom: 10 }}
            >
              Distribution of posts across different social platforms.
            </ThemedText>
          </VStack>

          <View collapsable={false} renderToHardwareTextureAndroid>
            <HStack
              style={{
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* Pie Chart */}
              <PieChart
                data={pieData}
                donut
                innerRadius={30}
                radius={90}
                showText
                textColor="white"
                textSize={12}
              />

              {/* Legend */}
              <VStack style={{ marginLeft: 10, gap: 8 }}>
                {insightsData?.platformMix?.map((item: any) => {
                  const percentage = Math.round(
                    (item.count / (insightsData?.totalPosts || 1)) *
                    100,
                  );

                  return (
                    <HStack
                      key={item.platform}
                      style={{
                        alignItems: "center",
                        width: 120,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: platformColors[item.platform] || "#999",
                          marginRight: 8,
                        }}
                      />

                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                        }}
                      >
                        {item.platform}
                      </Text>

                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginLeft: 6,
                        }}
                      >
                        {percentage}%
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </HStack>
          </View>
        </VStack>

        {/* Bar Chart */}

        <VStack
          style={{
            padding: 15,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <VStack>
            <HStack className="justify-between mb-2 items-center">
              <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
                Platform Distribution
              </ThemedText>
            </HStack>
            <ThemedText
              style={{ fontSize: 12, color: "#6a7282", marginBottom: 10 }}
            >
              Compare post volumes across different social platforms.
            </ThemedText>
          </VStack>

          <BarChart
            data={barData}
            barWidth={30}
            spacing={25}
            rulesType="dashed"
            dashWidth={4}
            dashGap={4}
            rulesColor="#d1d5db"
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: "#888" }}
            noOfSections={maxCount}
            maxValue={maxCount}
            stepValue={1}
          />

        </VStack>
      </VStack>
    </ScrollView>
    </ThemedView>
  );
}

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useRef, useState } from "react";
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

  const pieRef = useRef<any>(null);
  const barRef = useRef<any>(null);


  const platformColors: any = {
    FACEBOOK: "#3b82f6",
    INSTAGRAM: "#22c55e",
    LINKEDIN: "#f59e0b",
    PINTEREST: "#ef4444",
    YOUTUBE: "#8b5cf6",
  };
  const barData =
    insightsData?.insights?.platformMix?.map((item: any) => ({
      value: item.count,
      label: item.platform,
    })) || [];

  const total = insightsData?.insights?.totalPosts || 1;

  const pieData =
    insightsData?.insights?.platformMix?.map((item: any) => ({
      value: item.count,
      color: platformColors[item.platform] || "#999",
      text: `${Math.round((item.count / total) * 100)}%`,
    })) || [];

  const fetchInsights = async () => {
    try {
      const from = fromDate ? fromDate.toISOString() : "";
      const to = toDate ? toDate.toISOString() : "";

      const response = await getPostsInsights(platform, from, to);
      setInsightsData(response);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

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

  return (
    <ThemedView
      style={{
        justifyContent: "flex-start",
      }}
    >
      {/* Date Filter */}
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
        {/* Time Header - Two Calendars */}
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

      {/* Stats */}
      <VStack className="gap-4">
        <HStack className="justify-between">
          <VStack
            style={{
              padding: 15,
              gap: 9,
              width: "48%",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              minHeight: 130,
            }}
          >
            <ThemedText style={{ fontWeight: "medium", fontSize: 17 }}>
              Total Posts
            </ThemedText>
            <ThemedText style={{ fontWeight: "bold", fontSize: 20 }}>
              {insightsData?.insights?.totalPosts ?? "-"}
            </ThemedText>
            <HStack className="items-center gap-2">
              <Ionicons name="trending-up" size={14} color={"#6a7282"} />
              <ThemedText style={{ fontSize: 13, color: "#6a7282" }}>
                All matched records
              </ThemedText>
            </HStack>
          </VStack>

          <VStack
            style={{
              padding: 15,
              gap: 9,
              width: "48%",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              minHeight: 130,
            }}
          >
            <ThemedText style={{ fontWeight: "medium", fontSize: 17 }}>
              Upcoming Posts
            </ThemedText>
            <ThemedText style={{ fontWeight: "bold", fontSize: 20 }}>
              {insightsData?.insights?.stats?.upcoming ?? "-"}
            </ThemedText>
            <HStack className="items-center gap-2">
              <Ionicons name="trending-up" size={14} color={"#00a63e"} />
              <ThemedText style={{ fontSize: 13, color: "#00a63e" }}>
                Next scheduled{"\n"}post soon
              </ThemedText>
            </HStack>
          </VStack>
        </HStack>

        <HStack className="justify-between">
          <VStack
            style={{
              padding: 15,
              gap: 9,
              width: "48%",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              minHeight: 130,
            }}
          >
            <ThemedText style={{ fontWeight: "medium", fontSize: 17 }}>
              Past (Published)
            </ThemedText>
            <ThemedText style={{ fontWeight: "bold", fontSize: 20 }}>
              {insightsData?.insights?.stats?.past ?? "-"}
            </ThemedText>
            <HStack className="items-center gap-2">
              <Ionicons name="bar-chart" size={14} color={"#155dfcfc"} />
              <ThemedText style={{ fontSize: 13, color: "#155dfcfc" }}>
                Engagement synced
              </ThemedText>
            </HStack>
          </VStack>

          <VStack
            style={{
              padding: 15,
              gap: 9,
              width: "48%",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 16,
              minHeight: 130,
            }}
          >
            <ThemedText style={{ fontWeight: "medium", fontSize: 17 }}>
              Drafts
            </ThemedText>
            <ThemedText style={{ fontWeight: "bold", fontSize: 20 }}>
              {insightsData?.insights?.stats?.drafts ?? "-"}
            </ThemedText>
            <HStack className="items-center gap-2">
              <Ionicons name="calendar" size={14} color={"#f54a00"} />
              <ThemedText style={{ fontSize: 13, color: "#f54a00" }}>
                Pending scheduling
              </ThemedText>
            </HStack>
          </VStack>
        </HStack>
      </VStack>

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
                  showText
                  textColor="white"
                  radius={90}
                  textSize={12}
                />

                {/* Legend */}
                <VStack style={{ marginLeft: 10, gap: 8 }}>
                  {insightsData?.insights?.platformMix?.map((item: any) => {
                    const percentage = Math.round(
                      (item.count / (insightsData?.insights?.totalPosts || 1)) *
                        100,
                    );

                    return (
                      <HStack
                        key={item.platform}
                        style={{ alignItems: "center", gap: 8 }}
                      >
                        {/* Color Dot */}
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor:
                              platformColors[item.platform] || "#999",
                          }}
                        />

                        {/* Platform Name */}
                        <Text style={{ fontSize: 12 }}>{item.platform}</Text>

                        {/* Percentage */}
                        <Text style={{ fontSize: 12, color: "#6b7280" }}>
                          ({percentage}%)
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
              frontColor="#2563eb"
              barWidth={30}
              spacing={25}
              rulesType="dashed"
              dashWidth={4}
              dashGap={4}
              rulesColor="#d1d5db"
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: "#888" }}
              noOfSections={5}
              maxValue={6}
            />
          
        </VStack>
      </VStack>
    </ThemedView>
  );
}

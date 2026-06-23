import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useState } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import {
  getPostsExportPreview,
  exportPostsExcel,
  exportPostsCSV,
  getDataPreview,
} from "@/api/dashboardApi";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

interface PostPreview {
  campaign: string;
  platform: string;
  subject: string;
  status: string;
  scheduled: string;
}

export default function CalendarExports() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Date states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Picker states
  const [platform, setPlatform] = useState("all");
  const [showPicker, setShowPicker] = useState(false);
  const [pickingMode, setPickingMode] = useState<"start" | "end">("start");

  // Data states
  const [previewData, setPreviewData] = useState<any>({
    summary: [],
    posts: [],
    analytics: [],
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, "0");
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const [showFilters, setShowFilters] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      if (pickingMode === "start") {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const from = startDate ? startDate.toISOString() : "";
      const to = endDate ? endDate.toISOString() : "";
      const response = await getDataPreview();
      console.log("resspp", response);

      setPreviewData(
        response || {
          summary: [],
          posts: [],
          analytics: [],
        },
      );
    } catch (error) {
      console.error("Error fetching export preview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [platform, startDate, endDate]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPreview();
    setRefreshing(false);
  }, [platform, startDate, endDate]);

  const handleExport = async (type: "xlsx" | "csv") => {
    try {
      setExporting(true);

      const from = startDate ? startDate.toISOString() : "";
      const to = endDate ? endDate.toISOString() : "";

      let response;

      if (type === "xlsx") {
        response = await exportPostsExcel(platform, from, to);
        console.log("rrrssspp1", response);

      } else {
        response = await exportPostsCSV(platform, from, to);
        console.log("rrrssspp2", response);
      }

      const blob = response;

      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(",")[1];

          const fileUri =
            FileSystem.documentDirectory + `posts_export_${Date.now()}.${type}`;

          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          await Sharing.shareAsync(fileUri);
        } catch (error) {
          console.error("File Save Error:", error);
        }
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Export Error:", error);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "published":
        return "#16a34a";
      case "scheduled":
        return "#2563eb";
      case "draft":
        return "#f59e0b";
      case "failed":
        return "#dc2626";
      default:
        return isDark ? "#aaa" : "#6b7280";
    }
  };

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
      {/* Header */}
      {/* <VStack
        style={{
          gap: 5,
          marginBottom: 12,
          width: "100%",
          padding: 15,
          borderWidth: 1,
          borderColor: isDark ? "#333" : "#e5e7eb",
          borderRadius: 16,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
        }}
      >
        <HStack style={{ alignItems: "center", gap: 8, marginBottom: 2 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: isDark
                ? "rgba(220, 38, 38, 0.15)"
                : "rgba(220, 38, 38, 0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="download-outline" size={18} color="#dc2626" />
          </View>
          <ThemedText style={{ fontSize: 17, fontWeight: "700" }}>
            Export Posts
          </ThemedText>
        </HStack>
        <ThemedText style={{ fontSize: 12, color: "#6a7282", marginLeft: 40 }}>
          Filter and download your post data for reporting and analysis.
        </ThemedText>
      </VStack> */}

      {/* Filters Section */}
      <VStack style={{ marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            padding: 15,
            borderWidth: 1,
            borderColor: isDark ? "#333" : "#e5e7eb",
            borderRadius: 16,
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
          }}
        >
          <HStack style={{ alignItems: "center", gap: 8 }}>
            <Ionicons
              name="options-outline"
              size={20}
              color={isDark ? "#fff" : "#000"}
            />
            <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
              Filters & Export
            </ThemedText>
          </HStack>

          <Ionicons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={20}
            color={isDark ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        {showFilters && (
          <VStack
            style={{
              gap: 10,
              marginBottom: 12,
              width: "100%",
              padding: 15,
              borderWidth: 1,
              borderColor: isDark ? "#333" : "#e5e7eb",
              borderRadius: 16,
              backgroundColor: isDark ? "#1a1a1a" : "#fff",
            }}
          >
            <HStack style={{ alignItems: "center", gap: 8, marginBottom: 2 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: isDark
                    ? "rgba(220, 38, 38, 0.15)"
                    : "rgba(220, 38, 38, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="download-outline" size={18} color="#dc2626" />
              </View>
              <ThemedText style={{ fontSize: 17, fontWeight: "700" }}>
                Export Posts
              </ThemedText>
            </HStack>
            <VStack style={{ gap: 4 }}>
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
                placeholder="All Platforms"
                value={platform}
                onChange={(item) => {
                  setPlatform(item.value);
                }}
              />
            </VStack>

            {/* Date Pickers */}
            <HStack style={{ gap: 10, width: "100%" }}>
              {/* Start Date */}
              <VStack style={{ flex: 1, gap: 4 }}>
                <ThemedText
                  style={{ fontSize: 12, opacity: 0.6, fontWeight: "600" }}
                >
                  Start Date
                </ThemedText>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark ? "#333" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1a1a1a" : "rgba(255,255,255,0.9)",
                    height: 45,
                    paddingHorizontal: 12,
                  }}
                  onPress={() => {
                    setPickingMode("start");
                    setShowPicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={isDark ? "#aaa" : "rgba(0,0,0,0.4)"}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: startDate
                        ? isDark
                          ? "#fff"
                          : "#000"
                        : isDark
                          ? "#555"
                          : "#999",
                      fontSize: 13,
                    }}
                  >
                    {startDate ? formatDate(startDate) : "dd-mm-yyyy"}
                  </Text>
                </TouchableOpacity>
              </VStack>

              {/* End Date */}
              <VStack style={{ flex: 1, gap: 4 }}>
                <ThemedText
                  style={{ fontSize: 12, opacity: 0.6, fontWeight: "600" }}
                >
                  End Date
                </ThemedText>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isDark ? "#333" : "rgba(0,0,0,0.1)",
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1a1a1a" : "rgba(255,255,255,0.9)",
                    height: 45,
                    paddingHorizontal: 12,
                  }}
                  onPress={() => {
                    setPickingMode("end");
                    setShowPicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={isDark ? "#aaa" : "rgba(0,0,0,0.4)"}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: endDate
                        ? isDark
                          ? "#fff"
                          : "#000"
                        : isDark
                          ? "#555"
                          : "#999",
                      fontSize: 13,
                    }}
                  >
                    {endDate ? formatDate(endDate) : "dd-mm-yyyy"}
                  </Text>
                </TouchableOpacity>
              </VStack>

              {showPicker && (
                <DateTimePicker
                  value={
                    pickingMode === "start"
                      ? startDate || new Date()
                      : endDate || new Date()
                  }
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}
            </HStack>

            {/* Download Buttons */}
            <VStack style={{ gap: 10, marginTop: 5 }}>
              <TouchableOpacity
                onPress={() => handleExport("xlsx")}
                disabled={exporting}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 42,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: "#dc2626",
                }}
                activeOpacity={0.8}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="document-outline" size={16} color="#fff" />
                    <Text
                      style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}
                    >
                      Download Excel (.xlsx)
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleExport("csv")}
                disabled={exporting}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  height: 42,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isDark ? "#444" : "#ddd",
                  backgroundColor: isDark ? "#1a1a1a" : "#fff",
                }}
                activeOpacity={0.8}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <>
                    <Ionicons
                      name="funnel-outline"
                      size={16}
                      color={isDark ? "#ccc" : "#333"}
                    />
                    <Text
                      style={{
                        color: isDark ? "#ccc" : "#333",
                        fontWeight: "500",
                        fontSize: 13,
                      }}
                    >
                      Download CSV (.csv)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </VStack>
          </VStack>
        )}
      </VStack>

      {/* Data Preview Section */}
      <VStack
        style={{
          gap: 8,
          width: "100%",
          padding: 15,
          borderWidth: 1,
          borderColor: isDark ? "#333" : "#e5e7eb",
          borderRadius: 16,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
        }}
      >
        {/* Preview Header */}
        <VStack style={{ gap: 2, marginBottom: 8 }}>
          <ThemedText style={{ fontSize: 15, fontWeight: "700" }}>
            Data Preview
          </ThemedText>
          <ThemedText style={{ fontSize: 12, color: "#6a7282" }}>
            Preview of the "Posts Data" sheet based on current filters.
          </ThemedText>
        </VStack>

        {/* Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <VStack style={{ minWidth: 600 }}>
            {/* Table Header */}
            <HStack
              style={{
                borderBottomWidth: 1,
                borderBottomColor: isDark ? "#333" : "#e5e7eb",
                paddingBottom: 10,
                paddingHorizontal: 4,
              }}
            >
              <Text
                style={{
                  width: 120,
                  fontSize: 12,
                  fontWeight: "700",
                  color: isDark ? "#ccc" : "#374151",
                }}
              >
                Campaign
              </Text>
              <Text
                style={{
                  width: 100,
                  fontSize: 12,
                  fontWeight: "700",
                  color: isDark ? "#ccc" : "#374151",
                }}
              >
                Platform
              </Text>
              <Text
                style={{
                  width: 150,
                  fontSize: 12,
                  fontWeight: "700",
                  color: isDark ? "#ccc" : "#374151",
                }}
              >
                Subject
              </Text>
              <Text
                style={{
                  width: 100,
                  fontSize: 12,
                  fontWeight: "700",
                  color: isDark ? "#ccc" : "#374151",
                }}
              >
                Status
              </Text>
              <Text
                style={{
                  width: 120,
                  fontSize: 12,
                  fontWeight: "700",
                  color: isDark ? "#ccc" : "#374151",
                }}
              >
                Scheduled
              </Text>
            </HStack>

            {/* Table Body */}
            {loading ? (
              <View
                style={{
                  padding: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator size="small" color="#dc2626" />
              </View>
            ) : previewData?.posts?.length > 0 ? (
              previewData?.posts?.map((post: any, index: number) => (
                <HStack
                  key={index}
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#222" : "#f3f4f6",
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                  }}
                >
                  <Text
                    style={{
                      width: 120,
                      fontSize: 12,
                      color: isDark ? "#ddd" : "#374151",
                    }}
                    numberOfLines={1}
                  >
                    {post.campaign}
                  </Text>
                  <Text
                    style={{
                      width: 100,
                      fontSize: 12,
                      color: isDark ? "#ddd" : "#374151",
                    }}
                    numberOfLines={1}
                  >
                    {post.platform}
                  </Text>
                  <Text
                    style={{
                      width: 150,
                      fontSize: 12,
                      color: isDark ? "#ddd" : "#374151",
                    }}
                    numberOfLines={1}
                  >
                    {post.subject}
                  </Text>
                  <View style={{ width: 100 }}>
                    <View
                      style={{
                        backgroundColor: `${getStatusColor(post.status)}18`,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        alignSelf: "flex-start",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: getStatusColor(post.status),
                        }}
                      >
                        {post.status}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      width: 120,
                      fontSize: 12,
                      color: isDark ? "#ddd" : "#374151",
                    }}
                    numberOfLines={1}
                  >
                    {post.scheduledDate}
                  </Text>
                </HStack>
              ))
            ) : (
              <View
                style={{
                  padding: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: "#dc2626",
                    fontStyle: "italic",
                  }}
                >
                  No posts found for the selected filters.
                </Text>
              </View>
            )}
          </VStack>
        </ScrollView>
      </VStack>
      </ScrollView>
    </ThemedView>
  );
}

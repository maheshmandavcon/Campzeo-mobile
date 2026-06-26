import { getPlatform, getPosts, getFunnel, getEngagement } from "@/api/logsApi";
import { getSocialStatus } from "@/api/accountsApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
} from "react-native";
import DateTimePicker from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";
import LogsCard from "./logs-Components/logsCards";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";

const { width } = Dimensions.get("window");

export default function Logs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Auth context
  const { token, user } = useAuth();
  const orgId = user?.organisationId ? Number(user.organisationId) : 0;

  // Active filters states
  const [duration, setDuration] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [activePlatform, setActivePlatform] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Date picker visibility
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // Data states
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [socialStatus, setSocialStatus] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  // Page / Pagination states
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Loading states
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Date formatter: yyyy-MM-dd
  const getFormattedDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Check connection status
  const isPlatformConnected = (platformName: string) => {
    const name = platformName.toUpperCase();
    if (name === "EMAIL" || name === "SMS" || name === "WHATSAPP") {
      return true;
    }
    if (!socialStatus) return true; 
    const key = platformName.toLowerCase();
    const status = socialStatus[key];
    return status?.connected === true;
  };

  // Get dynamic premium icons
  const getPlatformIcon = (platformName: string) => {
    switch (platformName.toUpperCase()) {
      case "EMAIL": return "mail-outline";
      case "SMS": return "chatbubble-ellipses-outline";
      case "FACEBOOK": return "logo-facebook";
      case "INSTAGRAM": return "logo-instagram";
      case "LINKEDIN": return "logo-linkedin";
      case "YOUTUBE": return "logo-youtube";
      case "PINTEREST": return "logo-pinterest";
      case "WHATSAPP": return "logo-whatsapp";
      default: return "globe-outline";
    }
  };

  // Get platform specific brand colors
  const getPlatformColor = (platformName: string) => {
    switch (platformName.toUpperCase()) {
      case "EMAIL": return "#f59e0b";
      case "SMS": return "#10b981";
      case "FACEBOOK": return "#1877F2";
      case "INSTAGRAM": return "#c13584";
      case "LINKEDIN": return "#0A66C2";
      case "YOUTUBE": return "#FF0000";
      case "PINTEREST": return "#E60023";
      case "WHATSAPP": return "#25D366";
      default: return "#6b7280";
    }
  };

  // Compute start/end dates
  const getDateRange = () => {
    const now = new Date();
    let startStr = "";
    let endStr = "";

    if (duration === "7d") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      startStr = getFormattedDateString(past);
      endStr = getFormattedDateString(now);
    } else if (duration === "30d") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      startStr = getFormattedDateString(past);
      endStr = getFormattedDateString(now);
    } else if (duration === "90d") {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      startStr = getFormattedDateString(past);
      endStr = getFormattedDateString(now);
    } else if (duration === "custom") {
      if (customStartDate && customEndDate) {
        startStr = getFormattedDateString(customStartDate);
        endStr = getFormattedDateString(customEndDate);
      } else {
        const past = new Date();
        past.setDate(now.getDate() - 30);
        startStr = getFormattedDateString(past);
        endStr = getFormattedDateString(now);
      }
    }
    return { startStr, endStr };
  };

  const fetchMetadata = async () => {
    if (!token) return;
    try {
      const [platformList, socialAcc] = await Promise.all([
        getPlatform(token),
        getSocialStatus()
      ]);
      setPlatforms(platformList || []);
      setSocialStatus(socialAcc);
    } catch (err) {
      console.log("Error loading logs metadata:", err);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAnalyticsAndLogs = async (resetPosts = true) => {
    if (!token) return;
    const { startStr, endStr } = getDateRange();

    setAnalyticsLoading(true);
    try {
      // 1. Fetch funnel data
      const funnelRes = await getFunnel(token, startStr, endStr);
      setFunnelData(funnelRes?.funnel || []);

      // 2. Fetch engagement overview
      const engagementRes = await getEngagement(token, startStr, endStr, activePlatform);
      setEngagement(engagementRes);
    } catch (err) {
      console.log("Error loading performance charts:", err);
    } finally {
      setAnalyticsLoading(false);
    }

    if (resetPosts) {
      setPage(1);
      setHasMore(true);
      setFeedLoading(true);
      try {
        const postsRes = await getPosts(token, orgId, activePlatform, startStr, endStr, 1, 10);
        setPosts(postsRes?.posts || []);
        if ((postsRes?.posts || []).length < 10) {
          setHasMore(false);
        }
      } catch (err) {
        console.log("Error loading posts feed:", err);
        setPosts([]);
      } finally {
        setFeedLoading(false);
      }
    }
  };

  // Pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchMetadata(),
      fetchAnalyticsAndLogs(true)
    ]);
    setIsRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (feedLoading || !hasMore || !token) return;

    const nextPage = page + 1;
    setFeedLoading(true);
    const { startStr, endStr } = getDateRange();

    try {
      const postsRes = await getPosts(token, orgId, activePlatform, startStr, endStr, nextPage, 10);
      const newPosts = postsRes?.posts || [];
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
        if (newPosts.length < 10) {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.log("Error appending paginated logs:", err);
    } finally {
      setFeedLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMetadata();
    }, [token])
  );

  useEffect(() => {
    if (!initialLoading) {
      fetchAnalyticsAndLogs(true);
    }
  }, [duration, activePlatform, customStartDate, customEndDate, initialLoading]);

  const handlePlatformPress = (platformName: string) => {
    const name = platformName.toUpperCase();
    if (name === "ALL") {
      setActivePlatform("all");
      return;
    }

    if (!isPlatformConnected(platformName)) {
      Toast.show({
        type: "error",
        text1: "Account Not Connected",
        text2: `Please connect your ${platformName} account to get stats.`,
        position: "bottom",
      });
      return;
    }

    setActivePlatform(name);
  };

  // Render Segmented top duration buttons
  const renderDurationFilter = () => {
    const segments: Array<{ key: typeof duration; label: string }> = [
      { key: "7d", label: "7 Days" },
      { key: "30d", label: "30 Days" },
      { key: "90d", label: "90 Days" },
      { key: "custom", label: "Custom" },
    ];

    return (
      <View
        style={{
          flexDirection: "row",
          backgroundColor: isDark ? "#0f172a" : "#f1f5f9",
          borderRadius: 25,
          padding: 4,
          marginHorizontal: 12,
          marginVertical: 12,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
        }}
      >
        {segments.map((seg) => {
          const isActive = duration === seg.key;
          return (
            <TouchableOpacity
              key={seg.key}
              activeOpacity={0.8}
              onPress={() => setDuration(seg.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 22,
                backgroundColor: isActive ? "#dc2626" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: isActive ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                }}
              >
                {seg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render Horizontal platform tabs
  const renderPlatformTabs = () => {
    if (initialLoading) {
      return (
        <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 12, marginVertical: 8 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <ShimmerSkeleton key={idx} height={40} width={85} borderRadius={20} />
          ))}
        </View>
      );
    }

    const allTabs = [
      { platformName: "ALL", isEnabled: true },
      ...platforms.filter((p) => p.isEnabled)
    ];

    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={allTabs}
        keyExtractor={(item) => item.platformName}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 10 }}
        renderItem={({ item }) => {
          const isSelected = activePlatform.toUpperCase() === item.platformName.toUpperCase();
          const connected = isPlatformConnected(item.platformName);
          const brandColor = getPlatformColor(item.platformName);
          const iconName = getPlatformIcon(item.platformName);

          return (
            <TouchableOpacity
              activeOpacity={connected ? 0.8 : 0.6}
              onPress={() => handlePlatformPress(item.platformName)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: isSelected
                  ? "#dc2626"
                  : isDark
                  ? "#0f172a"
                  : "#ffffff",
                borderWidth: 1,
                borderColor: isSelected
                  ? "#dc2626"
                  : isDark
                  ? "#1e293b"
                  : "#cbd5e1",
                opacity: connected ? 1 : 0.45,
              }}
            >
              {item.platformName !== "ALL" && (
                <Ionicons
                  name={iconName as any}
                  size={16}
                  color={isSelected ? "#fff" : brandColor}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: isSelected ? "#fff" : isDark ? "#e2e8f0" : "#334155",
                }}
              >
                {item.platformName === "ALL" ? "All Platforms" : item.platformName}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    );
  };

  // Render Visual Stack Funnel
  const renderFunnel = () => {
    if (analyticsLoading) {
      return (
        <VStack style={{ padding: 16, gap: 12 }}>
          <ShimmerSkeleton height={18} width="50%" />
          <ShimmerSkeleton height={35} borderRadius={8} />
          <ShimmerSkeleton height={35} borderRadius={8} />
          <ShimmerSkeleton height={35} borderRadius={8} />
        </VStack>
      );
    }

    if (funnelData.length === 0) {
      return null;
    }

    const maxVal = Math.max(...funnelData.map((d: any) => d.value), 1);

    return (
      <VStack
        style={{
          marginHorizontal: 12,
          marginBottom: 16,
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 10,
          elevation: 1,
        }}
      >
        <ThemedText style={{ fontSize: 15, fontWeight: "800", marginBottom: 14 }}>
          Acquisition Funnel Overview
        </ThemedText>
        <VStack style={{ gap: 12 }}>
          {funnelData.map((item: any, idx: number) => {
            const percent = (item.value / maxVal) * 100;
            const fill = item.fill || (idx === 0 ? "#8884d8" : idx === 1 ? "#82ca9d" : "#ffc658");
            return (
              <VStack key={item.name || idx} style={{ gap: 6 }}>
                <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText style={{ fontSize: 12, fontWeight: "700" }}>{item.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, fontWeight: "800", color: fill }}>
                    {item.value}
                  </ThemedText>
                </HStack>
                <View
                  style={{
                    height: 10,
                    width: "100%",
                    backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      backgroundColor: fill,
                      borderRadius: 5,
                    }}
                  />
                </View>
              </VStack>
            );
          })}
        </VStack>
      </VStack>
    );
  };

  // Render Metric Trend Grid
  const renderMetricsGrid = () => {
    if (analyticsLoading) {
      return (
        <VStack style={{ gap: 12, paddingHorizontal: 12, marginBottom: 16 }}>
          <HStack space="md">
            <View style={{ flex: 1 }}><ShimmerSkeleton height={95} borderRadius={16} /></View>
            <View style={{ flex: 1 }}><ShimmerSkeleton height={95} borderRadius={16} /></View>
          </HStack>
          <HStack space="md">
            <View style={{ flex: 1 }}><ShimmerSkeleton height={95} borderRadius={16} /></View>
            <View style={{ flex: 1 }}><ShimmerSkeleton height={95} borderRadius={16} /></View>
          </HStack>
        </VStack>
      );
    }

    const stats = [
      {
        label: "Total Reach",
        value: engagement?.totalReach ?? 0,
        trend: engagement?.reachTrend,
        icon: "eye-outline",
        color: "#3b82f6",
      },
      {
        label: "Engagement Rate",
        value: `${((engagement?.engagementRate ?? 0) * 100).toFixed(1)}%`,
        trend: engagement?.engagementTrend,
        icon: "trending-up-outline",
        color: "#10b981",
      },
      {
        label: "Total Followers",
        value: engagement?.totalFollowers ?? 0,
        newFollowers: engagement?.followersTrend?.newFollowers,
        icon: "people-outline",
        color: "#f59e0b",
      },
      {
        label: "New Contacts",
        value: engagement?.totalConversions ?? 0,
        trend: engagement?.conversionsTrend,
        icon: "person-add-outline",
        color: "#8b5cf6",
      },
    ];

    return (
      <View style={{ paddingHorizontal: 12, marginBottom: 16 }}>
        <HStack style={{ flexWrap: "wrap", justifyContent: "space-between" }}>
          {stats.map((stat, idx) => {
            const isPositive = stat.trend?.isPositive ?? true;
            const percent = stat.trend?.percentage ?? 0;
            return (
              <View
                key={idx}
                style={{
                  width: "48%",
                  backgroundColor: isDark ? "#0f172a" : "#ffffff",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#1e293b" : "#e2e8f0",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <HStack style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <ThemedText style={{ fontSize: 11, fontWeight: "700", opacity: 0.6 }}>
                    {stat.label}
                  </ThemedText>
                  <Ionicons name={stat.icon as any} size={16} color={stat.color} />
                </HStack>
                <ThemedText style={{ fontSize: 18, fontWeight: "800", marginBottom: 4 }}>
                  {stat.value}
                </ThemedText>
                
                {stat.newFollowers !== undefined ? (
                  <HStack style={{ alignItems: "center" }} space="xs">
                    <Ionicons name="arrow-up" size={12} color="#10b981" />
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#10b981" }}>
                      +{stat.newFollowers} new
                    </Text>
                  </HStack>
                ) : stat.trend ? (
                  <HStack style={{ alignItems: "center" }} space="xs">
                    <Ionicons
                      name={isPositive ? "arrow-up" : "arrow-down"}
                      size={12}
                      color={isPositive ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: isPositive ? "#10b981" : "#ef4444",
                      }}
                    >
                      {percent}% vs last period
                    </Text>
                  </HStack>
                ) : (
                  <Text style={{ fontSize: 10, opacity: 0.5 }}>Stable</Text>
                )}
              </View>
            );
          })}
        </HStack>
      </View>
    );
  };

  // Complete header render block
  const renderHeader = () => (
    <ThemedView style={{ paddingBottom: 8 }}>
      {/* Dynamic Date segments */}
      {renderDurationFilter()}

      {/* Inline calendars if "Custom" chosen */}
      {duration === "custom" && (
        <HStack space="md" style={{ marginBottom: 12, paddingHorizontal: 12 }}>
          <VStack style={{ flex: 1, gap: 4 }}>
            <ThemedText style={{ fontSize: 11, fontWeight: "600", opacity: 0.6 }}>From</ThemedText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpenFrom(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#cbd5e1",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 13 }}>
                {customStartDate ? getFormattedDateString(customStartDate) : "Start Date"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={isDark ? "#aaa" : "#64748b"} />
            </TouchableOpacity>
          </VStack>

          <VStack style={{ flex: 1, gap: 4 }}>
            <ThemedText style={{ fontSize: 11, fontWeight: "600", opacity: 0.6 }}>To</ThemedText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setOpenTo(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#cbd5e1",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
              }}
            >
              <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 13 }}>
                {customEndDate ? getFormattedDateString(customEndDate) : "End Date"}
              </Text>
              <Ionicons name="calendar-outline" size={16} color={isDark ? "#aaa" : "#64748b"} />
            </TouchableOpacity>
          </VStack>
        </HStack>
      )}

      {/* Date Pickers Modals */}
      <DateTimePicker
        isVisible={openFrom}
        mode="date"
        date={customStartDate || new Date()}
        onConfirm={(date) => {
          setOpenFrom(false);
          setCustomStartDate(date);
        }}
        onCancel={() => setOpenFrom(false)}
      />

      <DateTimePicker
        isVisible={openTo}
        mode="date"
        date={customEndDate || new Date()}
        minimumDate={customStartDate || undefined}
        onConfirm={(date) => {
          setOpenTo(false);
          setCustomEndDate(date);
        }}
        onCancel={() => setOpenTo(false)}
      />

      {/* Platforms selector */}
      {renderPlatformTabs()}

      {/* Acquisition funnel overview */}
      {renderFunnel()}

      {/* Metric trends grid */}
      {renderMetricsGrid()}

      {/* Logs section subtitle */}
      <View style={{ paddingHorizontal: 12, marginTop: 4, marginBottom: 8 }}>
        <ThemedText style={{ fontSize: 16, fontWeight: "800" }}>
          Recent Post Performance
        </ThemedText>
      </View>
    </ThemedView>
  );

  // Footer spinner for infinite scrolling
  const renderFooter = () => {
    if (!feedLoading) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <ActivityIndicator size="small" color="#dc2626" />
      </View>
    );
  };

  // Base loader when opening screen
  if (initialLoading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#dc2626" />
        <ThemedText style={{ marginTop: 12, fontSize: 14, opacity: 0.6 }}>
          Syncing Account Records...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, backgroundColor: isDark ? "#020617" : "#f8fafc" }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 12 }}>
            <LogsCard record={item} platformLabel={item.platform} />
          </View>
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !feedLoading ? (
            <View style={{ padding: 40, alignItems: "center", justifyContent: "center" }}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={44}
                color={isDark ? "#334155" : "#94a3b8"}
                style={{ marginBottom: 12 }}
              />
              <ThemedText style={{ fontSize: 14, fontWeight: "600", opacity: 0.6, textAlign: "center" }}>
                No posts found for the selected platform
              </ThemedText>
            </View>
          ) : null
        }
      />
      {/* Toast Notification Mount */}
      <Toast />
    </ThemedView>
  );
}

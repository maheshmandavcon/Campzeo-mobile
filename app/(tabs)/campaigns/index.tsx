import {
  deleteCampaignApi,
  getCampaignsApi,
  getPostsByCampaignIdApi,
} from "@/api/campaignApi";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Share,
  TextInput,
  TouchableOpacity

} from "react-native";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "react-native";
import Toast from "react-native-toast-message";
import * as Clipboard from "expo-clipboard";
import { View, Text } from "@gluestack-ui/themed";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { getUser } from "@/api/dashboardApi";

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "show" | "hide">("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFastScrolling, setIsFastScrolling] = useState(false);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const fastScrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const currentTime = Date.now();
    const distance = Math.abs(currentY - lastScrollY.current);
    const elapsed = currentTime - lastScrollTime.current || 1;
    const velocity = distance / elapsed;
    lastScrollY.current = currentY;
    lastScrollTime.current = currentTime;
    if (velocity > 1.5) {
      setIsFastScrolling(true);
      if (fastScrollTimeout.current) clearTimeout(fastScrollTimeout.current);
      fastScrollTimeout.current = setTimeout(() => setIsFastScrolling(false), 200);
    }
  };

  const { getToken } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch campaigns
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setPage(1);
        try {
          setLoading(true);
          const token = await getToken();
          if (!token) throw new Error("Authentication token not found");
          const user = await getUser();
          const orgId = user?.organisation?.id;

          const res = await getCampaignsApi(orgId, 1, 10, debouncedSearch);
          if (!isActive) return;

          const campaignsArray = res?.campaigns ?? [];

          const mapped: Campaign[] = campaignsArray.map((item: any) => {
            const formatDate = (dateString?: string) => {
              if (!dateString) return "";
              const date = new Date(dateString);
              const day = String(date.getDate()).padStart(2, "0");
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            };

            return {
              id: item.id,
              details: item.name ?? "Untitled Campaign",
              description: item.description ?? "No description available",
              startDate: item.startDate,
              endDate: item.endDate,
              dates: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
              posts: [],
              postsCount: item.postsCount ?? 0,
              contactCount: item.contactCount ?? 0,
              show: true,
            };
          });

          // Fetch dynamic posts count for each campaign in parallel
          const campaignsWithCounts = await Promise.all(
            mapped.map(async (c) => {
              try {
                const postsRes = await getPostsByCampaignIdApi(c.id, orgId);
                const postsArray = postsRes?.data || (Array.isArray(postsRes) ? postsRes : []);
                return {
                  ...c,
                  postsCount: postsArray.length,
                };
              } catch (e) {
                console.log(`Error getting posts count for campaign ${c.id}:`, e);
                return c;
              }
            })
          );
          if (!isActive) return;

          setCampaigns(campaignsWithCounts);
          setHasMore(campaignsArray.length >= 10);
        } catch (err) {
          console.log("GET CAMPAIGNS ERROR:", err);
          if (isActive) setCampaigns([]);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      load();
      return () => {
        isActive = false;
      };
    }, [debouncedSearch])
  );

  let visibleCampaigns = campaigns;
  if (filter === "show") visibleCampaigns = campaigns.filter((c) => c.show);
  else if (filter === "hide") visibleCampaigns = campaigns.filter((c) => !c.show);

  const getCampaignStatus = (c: Campaign) => {
    if (!c.startDate || !c.endDate) return "Scheduled";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(c.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(c.endDate);
    end.setHours(23, 59, 59, 999);
    if (today < start) return "Scheduled";
    if (today > end) return "Completed";
    return "Active";
  };

  const statusOrder: Record<string, number> = {
    "Active": 0,
    "Scheduled": 1,
    "Completed": 2,
  };

  visibleCampaigns = [...visibleCampaigns].sort((a, b) => {
    return statusOrder[getCampaignStatus(a)] - statusOrder[getCampaignStatus(b)];
  });

  // Delete
  const handleDelete = async (c: Campaign) => {
    Alert.alert("Delete Campaign?", "Are you sure you want to delete this campaign?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) throw new Error("Authentication token missing");
            const user = await getUser();
            const orgId = user?.organisation?.id;
            await deleteCampaignApi(c.id, orgId, token);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
          } catch (error: any) {
            console.error("Error deleting campaign:", error);
            Toast.show({ type: 'error', text1: "Failed to delete campaign", text2: error?.message || "Unknown error" });
          }
        },
      },
    ]);
  };

  const handleCopy = async (c: Campaign) => {
    const campaignData = `
Details: ${c.details}
Description: ${c.description}
Dates: ${c.dates}
Posts Count: ${c.postsCount ?? c.posts?.length ?? 0}
Contacts Count: ${c.contactCount ?? 0}
  `;
    await Clipboard.setStringAsync(campaignData);
    Toast.show({ type: 'info', text1: "Copied!", text2: "Campaign details copied to clipboard." });
  };

  const handleToggleShow = (c: Campaign) =>
    setCampaigns((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, show: !x.show } : x))
    );

  const handleShare = async () => {
    if (!campaigns.length) return;

    const message = campaigns
      .map(
        (c) =>
          `*DETAILS:* ${c.details ?? "N/A"}\n*DESCRIPTION:* ${c.description ?? "N/A"}\n*DATES:* ${c.dates ?? "N/A"}\n*CONTACTS:* ${c.contactCount ?? 0}`
      )
      .join("\n");

    try {
      await Share.share({ message });
    } catch (e) {
      console.log(e);
    }
  };

  const toggleFilter = () => {
    const next =
      filter === "all" ? "show" : filter === "show" ? "hide" : "all";
    setFilter(next);
  };

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    setIsRefreshing(true);
    try {
      setPage(1);
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const res = await getCampaignsApi(orgId, 1, 10, debouncedSearch);

      const campaignsArray = res?.campaigns ?? [];

      const mapped: Campaign[] = campaignsArray.map((item: any) => {
        const formatDate = (dateString?: string) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        return {
          id: item.id,
          details: item.name ?? "Untitled Campaign",
          description: item.description ?? "No description available",
          startDate: item.startDate,
          endDate: item.endDate,
          dates: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
          posts: [],
          postsCount: item.postsCount ?? 0,
          contactCount: item.contactCount ?? 0,
          show: true,
        };
      });

      const campaignsWithCounts = await Promise.all(
        mapped.map(async (c) => {
          try {
            const postsRes = await getPostsByCampaignIdApi(c.id, orgId);
            const postsArray = postsRes?.data || (Array.isArray(postsRes) ? postsRes : []);
            return {
              ...c,
              postsCount: postsArray.length,
            };
          } catch (e) {
            console.log(`Error getting posts count for campaign ${c.id}:`, e);
            return c;
          }
        })
      );

      setCampaigns(campaignsWithCounts);
      setHasMore(campaignsArray.length >= 10);
    } catch (err) {
      console.log("REFRESH CAMPAIGNS ERROR:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || isRefreshing || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);

      const token = await getToken();
      if (!token) return;
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const res = await getCampaignsApi(orgId, nextPage, 10, debouncedSearch);
      const campaignsArray = res?.campaigns ?? [];

      const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Map directly — no blocking N+1 posts-count calls, show data instantly
      const mapped: Campaign[] = campaignsArray.map((item: any) => ({
        id: item.id,
        details: item.name ?? "Untitled Campaign",
        description: item.description ?? "No description available",
        startDate: item.startDate,
        endDate: item.endDate,
        dates: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
        posts: [],
        postsCount: item.postsCount ?? 0,
        contactCount: item.contactCount ?? 0,
        show: true,
      }));

      setCampaigns((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newRecords = mapped.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newRecords];
      });
      setHasMore(campaignsArray.length >= 10);
    } catch (err) {
      console.log("LOAD MORE CAMPAIGNS ERROR:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2a2a32" : "#f1f5f9",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#1e1e24" : "#f8fafc",
    inputBorder: isDark ? "#2a2a32" : "#e2e8f0",
    inputText: isDark ? "#ffffff" : "#0f172a",
    newButtonBg: "#DC2626",
    newButtonText: "#ffffff",
  };

  const CampaignSkeletonCard = ({ isDark }: { isDark: boolean }) => (
    <ThemedView
      style={{
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark ? "#374151" : "#e5e7eb",
        backgroundColor: isDark ? "#161618" : "#ffffff",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Title */}
        <ShimmerSkeleton height={16} width="60%" />

        {/* 4 icon buttons */}
        <View style={{ flexDirection: "row" }}>
          {[1, 2, 3, 4].map((_, i) => (
            <View key={i} style={{ marginLeft: 8 }}>
              <ShimmerSkeleton height={28} width={28} borderRadius={14} />
            </View>
          ))}
        </View>
      </View>

      {/* 🔹 Description */}
      <View style={{ marginTop: 8 }}>
        <ShimmerSkeleton height={12} width="90%" />
      </View>

      {/* 🔹 Meta row + button */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        {/* Meta info */}
        <View style={{ flexDirection: "row" }}>
          <ShimmerSkeleton height={12} width={80} />
          <View style={{ marginLeft: 12 }}>
            <ShimmerSkeleton height={12} width={60} />
          </View>
        </View>

        {/* Right-side button */}
        <ShimmerSkeleton height={26} width={80} borderRadius={13} />
      </View>

      {/* 🔹 Actions (3 equal buttons) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <ShimmerSkeleton height={28} width={70} borderRadius={14} />
        <ShimmerSkeleton height={28} width={70} borderRadius={14} />
        <ShimmerSkeleton height={28} width={70} borderRadius={14} />
      </View>
    </ThemedView>
  );

  const renderLoadMoreFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ padding: 16, alignItems: "center" }}>
          <ActivityIndicator size="small" color={COLORS.textPrimary} />
        </View>
      );
    }
    return null;
  };

  const isInitialLoading = loading && page === 1;

  // Always show 4 skeleton slots at bottom when more data exists
  // so the user scrolls INTO skeletons rather than blank/stall
  type CampaignListItem = Campaign | { __skeleton: true; id: string };
  const skeletonSlots: CampaignListItem[] = Array.from({ length: 4 }, (_, i) => ({
    __skeleton: true as true,
    id: `skeleton-more-${i}`,
  }));

  const listData: CampaignListItem[] = isInitialLoading
    ? Array.from({ length: 6 }, (_, i) => ({ __skeleton: true as true, id: `skeleton-init-${i}` }))
    : hasMore
      ? [...visibleCampaigns, ...skeletonSlots]
      : visibleCampaigns;

  return (
    <View
      className="flex-1 p-4"
      style={{ backgroundColor: COLORS.screenBg }}
    >
      {/* Heading & New Campaign Button Row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          backgroundColor: "transparent",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "900",
            color: COLORS.textPrimary,
            letterSpacing: 0.3,
          }}
        >
          Campaigns
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/campaigns/createCampaign")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 99,
            backgroundColor: COLORS.newButtonBg,
            shadowColor: "#DC2626",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Ionicons
            name="add-circle"
            size={18}
            color={COLORS.newButtonText}
          />
          <Text
            style={{
              marginLeft: 6,
              fontWeight: "700",
              fontSize: 14,
              color: COLORS.newButtonText,
            }}
          >
            New Campaign
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search input box & 3 dots in single row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
          backgroundColor: "transparent",
        }}
      >
        {/* Search Bar */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.inputBg,
            borderRadius: 99,
            borderWidth: 1,
            borderColor: COLORS.inputBorder,
            paddingHorizontal: 12,
            height: 46,
          }}
        >
          <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={(value) => setSearch(value)}
            placeholder="Search campaigns..."
            placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
            style={{
              flex: 1,
              color: COLORS.inputText,
              fontSize: 14,
              fontWeight: "600",
              height: "100%",
              padding: 0,
            }}
          />
        </View>

        {/* 3-dot menu */}
        <TouchableOpacity
          onPress={() => setMenuVisible(!menuVisible)}
          style={{
            padding: 12,
            borderRadius: 23,
            backgroundColor: COLORS.cardBg,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            marginLeft: 10,
            alignItems: "center",
            justifyContent: "center",
            width: 46,
            height: 46,
          }}
        >
          <MaterialIcons
            name="more-vert"
            size={20}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <ThemedView
          style={{
            backgroundColor: COLORS.cardBg,
            borderColor: COLORS.cardBorder,
            borderWidth: 1,
            position: "absolute",
            right: 16,
            top: 124,
            borderRadius: 16,
            zIndex: 50,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
            minWidth: 150,
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setMenuVisible(false);
              handleShare();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.cardBorder,
            }}
          >
            <Ionicons name="share-social-outline" size={18} color="#16a34a" />
            <Text style={{ marginLeft: 10, fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 }}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setMenuVisible(false);
              toggleFilter();
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Ionicons name="funnel-outline" size={18} color="#f59e0b" />
            <Text style={{ marginLeft: 10, fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 }}>
              {filter === "show" ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* Fast-scroll skeleton overlay */}
      {isFastScrolling && (
        <View
          style={{
            position: "absolute",
            top: 130,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.screenBg,
            zIndex: 20,
            paddingHorizontal: 16,
            paddingTop: 8,
          }}
          pointerEvents="none"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <CampaignSkeletonCard key={i} isDark={isDark} />
          ))}
        </View>
      )}

      {/* Campaign List */}
      <FlatList<CampaignListItem>
        data={listData}
        keyExtractor={(item) => item.id?.toString() ?? "skeleton"}
        renderItem={({ item }) =>
          "__skeleton" in item ? (
            <CampaignSkeletonCard isDark={isDark} />
          ) : (
            <CampaignCard
              campaign={item as Campaign}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onToggleShow={handleToggleShow}
              statusPosition={"middle"}
              onEdit={(campaign) =>
                router.push({
                  pathname: "/campaigns/createCampaign",
                  params: { id: campaign.id.toString() },
                })
              }
            />
          )
        }
        contentContainerStyle={{
          paddingBottom: 20,
          flexGrow: listData.length === 0 ? 1 : 0,
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={3}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListFooterComponent={null}
        windowSize={10}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={30}
        removeClippedSubviews={false}
        ListEmptyComponent={
          !loading ? (
            <ThemedView
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: COLORS.screenBg,
                paddingVertical: 40,
              }}
            >
              <ThemedText style={{ fontSize: 18, fontWeight: "bold", color: COLORS.textPrimary }}>
                No campaigns yet
              </ThemedText>

              <ThemedText
                style={{
                  marginTop: 6,
                  opacity: 0.7,
                  color: COLORS.textSecondary,
                  textAlign: "center",
                  // width: "100%",`
                }}
              >
                Tap New Campaign to create your first campaign...
              </ThemedText>
            </ThemedView>
          ) : null
        }
      />
    </View>
  );
}

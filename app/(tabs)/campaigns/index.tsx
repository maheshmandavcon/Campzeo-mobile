import {
  deleteCampaignApi,
  getCampaignsApi,
} from "@/api/campaignApi";
import { useAuth } from "@/context/AuthContext";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import * as Clipboard from "expo-clipboard";
import { View, Text } from "@gluestack-ui/themed";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { getUser } from "@/api/dashboardApi";

export default function Campaigns() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "show" | "hide">("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const { getToken } = useAuth();

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const user = await getUser();
      const orgId = user?.organisation?.id;
      // console.log("uuu",orgId);

      const res = await getCampaignsApi(orgId,1, 50);
      const campaignsArray = res?.campaigns ?? [];
      if (!campaignsArray.length) {
        setCampaigns([]);
        return;
      }

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

      setCampaigns(mapped);
    } catch (err) {
      console.log("GET CAMPAIGNS ERROR:", err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCampaigns();
    }, [search])
  );

  // Filter + Search
  let filtered = campaigns.filter((c) =>
    c.details.toLowerCase().includes(search.toLowerCase())
  );
  if (filter === "show") filtered = filtered.filter((c) => c.show);
  else if (filter === "hide") filtered = filtered.filter((c) => !c.show);

  const visibleCampaigns = filtered.slice(0, visibleCount);
  const isAllVisible = visibleCount >= filtered.length;

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
            await deleteCampaignApi(c.id, orgId,token);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
            fetchCampaigns();
          } catch (error: any) {
            console.error("Error deleting campaign:", error);
            Alert.alert(
              "Failed to delete campaign",
              error?.message || "Unknown error"
            );
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
    Alert.alert("Copied!", "Campaign details copied to clipboard.");
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
    setVisibleCount(5);
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + 5);
  const handleShowLess = () => setVisibleCount(5);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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

  const INITIAL_COUNT = 5;

  const renderLoadMoreFooter = () => {
    if (loading || campaigns.length <= INITIAL_COUNT) return null;

    return (
      <TouchableOpacity
        onPress={() =>
          isAllVisible
            ? setVisibleCount(INITIAL_COUNT)
            : setVisibleCount((v) => v + INITIAL_COUNT)
        }
        style={{
          marginTop: 12,
          marginHorizontal: 12,
          paddingVertical: 14,
          borderRadius: 12,
          alignItems: "center",
          backgroundColor: isAllVisible
            ? isDark
              ? "rgba(239,68,68,0.15)"
              : "#fee2e2"
            : isDark
              ? "rgba(59,130,246,0.15)"
              : "#dbeafe",
        }}
      >
        <ThemedText
          style={{
            fontWeight: "600",
            color: isAllVisible
              ? isDark
                ? "#fca5a5"
                : "#b91c1c"
              : isDark
                ? "#93c5fd"
                : "#1d4ed8",
          }}
        >
          {isAllVisible ? "Load Less" : "Load More"}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  useFocusEffect(
    useCallback(() => {
      setVisibleCount(INITIAL_COUNT);
    }, [])
  );
  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2a2a32" : "#f1f5f9",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#1e1e24" : "#f8fafc",
    inputBorder: isDark ? "#2a2a32" : "#e2e8f0",
    inputText: isDark ? "#ffffff" : "#0f172a",
    newButtonBg: "#0284c7",
    newButtonText: "#ffffff",
  };

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
            shadowColor: "#0284c7",
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
            onChangeText={(value) => {
              setSearch(value);
              setVisibleCount(5);
            }}
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

      {/* Campaign List */}
      <FlatList<Campaign | null>
        data={loading ? Array(6).fill(null) : visibleCampaigns}
        keyExtractor={(item, index) =>
          loading || !item ? `skeleton-${index}` : item.id.toString()
        }
        renderItem={({ item }) =>
          loading || !item ? (
            <CampaignSkeletonCard isDark={isDark} />
          ) : (
            <CampaignCard
              campaign={item}
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
          flexGrow: loading || visibleCampaigns.length > 0 ? 0 : 1,
        }}
        ListFooterComponent={renderLoadMoreFooter}
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

              <ThemedText style={{ marginTop: 6, opacity: 0.7, color: COLORS.textSecondary }}>
                Tap New Campaign to create your first campaign...
              </ThemedText>
            </ThemedView>
          ) : null
        }
      />
    </View>
  );
}

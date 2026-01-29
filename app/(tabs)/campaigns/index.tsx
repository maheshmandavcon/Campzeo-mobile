import {
  deleteCampaignApi,
  getCampaignsApi,
} from "@/api/campaign/campaignApi";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Share,
  TextInput,
  TouchableOpacity,
} from "react-native";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "react-native";
import * as Clipboard from "expo-clipboard";
import { View } from "@gluestack-ui/themed";
import { Text } from "@gluestack-ui/themed";

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

      const res = await getCampaignsApi(1, 50, search);
      const campaignsArray = res?.campaigns ?? [];

      if (!campaignsArray.length) {
        setCampaigns([]);
        return;
      }

      const mapped: Campaign[] = campaignsArray.map((item: any) => {
        const today = new Date();

        let status: "Scheduled" | "Active" | "Completed" = "Scheduled";

        if (item.startDate && item.endDate) {
          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);

          if (today < startDate) status = "Scheduled";
          else if (today > endDate) status = "Completed";
          else status = "Active";
        }

        const formatDate = (dateString?: string) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const day = String(date.getDate()).padStart(2, "0");     // day
          const month = String(date.getMonth() + 1).padStart(2, "0"); // month (0-indexed)
          const year = date.getFullYear();                         // year
          return `${day}/${month}/${year}`;
        };

        return {
          id: item.id,
          details: item.name ?? "Untitled Campaign",
          dates: `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`,
          description: item.description ?? "No description available",
          posts: [],
          postsCount: item._count?.posts ?? 0,
          show: true,
          contactsCount: item._count?.contacts ?? 0,
          contacts: [],
          status,
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

            await deleteCampaignApi(c.id);
            setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
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
Contacts Count: ${c.contactsCount ?? 0}
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
          `*DETAILS:* ${c.details ?? "N/A"}\n*DESCRIPTION:* ${c.description ?? "N/A"}\n*DATES:* ${c.dates ?? "N/A"}\n*CONTACTS:* ${c.contactsCount ?? 0}`
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

  return (
    <View className="flex-1 p-4"
      style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
      {loading && (
        <ThemedView className="absolute inset-0 justify-center items-center bg-black/10 z-10">
          <ActivityIndicator color={isDark ? "#ffffff" : "#dc2626"} size="large" />
          <ThemedText
            style={{
              marginTop: 12,
              color: isDark ? "#fff" : "#111",
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            Loading campaigns...
          </ThemedText>
        </ThemedView>
      )}

      {/* Top Controls */}
      <View className="flex-row items-center mb-4 relative"
        style={{ backgroundColor: "transparent" }}>
        {/* New Campaign Button */}
        <TouchableOpacity
          onPress={() => router.push("/campaigns/createCampaign")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9999,
            marginRight: 8,

            backgroundColor: isDark ? "#161618" : "#dbeafe", // dark / blue-100
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? "#ffffff" : "transparent",
          }}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={isDark ? "#ffffff" : "#0284c7"}
          />

          <Text
            style={{
              marginLeft: 8,
              fontWeight: "600",
              color: isDark ? "#ffffff" : "#0284c7",
            }}
          >
            New
          </Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <TextInput
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setVisibleCount(5);
          }}
          placeholder="Search campaigns..."
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray-400 / gray-500
          style={{
            flex: 1,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 9999,

            backgroundColor: isDark ? "#161618" : "#ffffff",
            borderWidth: 1,
            borderColor: isDark ? "#ffffff" : "#d1d5db",

            color: isDark ? "#ffffff" : "#111827",
          }}
        />

        {/* 3-dot Menu */}
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          className="ml-2 rounded-full"
        >
          <MaterialIcons
            name="more-vert"
            size={24}
            color={isDark ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {menuVisible && (
          <ThemedView
            className="absolute top-12 right-2 w-40 bg-white rounded-md shadow-md z-50"
            style={{ elevation: 10 }}
          >
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                handleShare();
              }}
              className="flex-row items-center px-4 py-3 border-b border-gray-200"
            >
              <Ionicons name="share-social-outline" size={20} color="#16a34a" />
              <ThemedText className="ml-2 text-gray-800 font-semibold">Share</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                toggleFilter();
              }}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="funnel-outline" size={20} color="#f59e0b" />
              <ThemedText className="ml-2 text-gray-800 font-semibold">
                {filter === "all" ? "All" : filter === "show" ? "Show" : "Hide"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </View>

      {/* Campaign List */}
      <FlatList
        data={visibleCampaigns}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            onDelete={handleDelete}
            onCopy={handleCopy}
            onToggleShow={handleToggleShow}
            onEdit={(campaign) =>
              router.push({
                pathname: "/campaigns/createCampaign",
                params: { id: campaign.id.toString() },
              })
            }
          />
        )}
        ListEmptyComponent={
          loading ? null : (
            <ThemedText style={{ textAlign: "center", marginTop: 20 }}>
              No Campaigns Found
            </ThemedText>
          )
        }
        ListFooterComponent={
          filtered.length > 5 ? (
            <TouchableOpacity
              onPress={isAllVisible ? handleShowLess : handleLoadMore}
              className={`py-3 my-2 rounded-xl items-center ${isAllVisible ? "bg-red-100" : "bg-blue-100"
                }`}
            >
              <ThemedText
                className={`font-semibold ${isAllVisible ? "text-red-700" : "text-blue-700"
                  }`}
              >
                {isAllVisible ? "Show Less" : "Load More"}
              </ThemedText>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

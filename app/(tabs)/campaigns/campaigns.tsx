import {
    deleteCampaignApi,
    getCampaignsApi,
} from "@/api/campaign/campaignApi";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Text, View } from "@gluestack-ui/themed";
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

      const res = await getCampaignsApi(token, 1, 50, search);
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

        return {
          id: item.id,
          details: item.name ?? "Untitled Campaign",
          dates: `${item.startDate?.split("T")[0]} - ${item.endDate?.split("T")[0]}`,
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

            await deleteCampaignApi(c.id, token);
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

  const handleCopy = (c: Campaign) => {
    // disabled for now
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

  return (
    <View className="flex-1 p-4 bg-gray-100">
      {loading && (
        <View className="absolute inset-0 justify-center items-center bg-black/10 z-10">
          <ActivityIndicator color={"#dc2626"} size="large" />
        </View>
      )}

      {/* Top Controls */}
      <View className="flex-row items-center mb-4 relative">
        {/* New Campaign Button */}
        <TouchableOpacity
          onPress={() => router.push("/campaigns/createCampaign")}
          className="flex-row items-center justify-center px-3 py-2 rounded-full bg-blue-100 mr-2"
        >
          <Ionicons name="add-circle-outline" size={20} color="#0284c7" />
          <Text className="ml-2 font-semibold text-blue-500">New</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <TextInput
          value={search}
          onChangeText={(value) => {
            setSearch(value);
            setVisibleCount(5);
          }}
          placeholder="Search campaigns..."
          className="flex-1 px-3 py-2 rounded-full border border-gray-300 bg-white"
        />

        {/* 3-dot Menu */}
        <TouchableOpacity
          onPress={() => setMenuVisible((prev) => !prev)}
          className="ml-2 rounded-full"
        >
          <MaterialIcons name="more-vert" size={24} color="black" />
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {menuVisible && (
          <View
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
              <Text className="ml-2 text-gray-800 font-semibold">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                toggleFilter();
              }}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="funnel-outline" size={20} color="#f59e0b" />
              <Text className="ml-2 text-gray-800 font-semibold">
                {filter === "all" ? "All" : filter === "show" ? "Show" : "Hide"}
              </Text>
            </TouchableOpacity>
          </View>
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
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No Campaigns Found
            </Text>
          )
        }
        ListFooterComponent={
          filtered.length > 5 ? (
            <TouchableOpacity
              onPress={isAllVisible ? handleShowLess : handleLoadMore}
              className={`py-3 my-2 rounded-xl items-center ${
                isAllVisible ? "bg-red-100" : "bg-blue-100"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isAllVisible ? "text-red-700" : "text-blue-700"
                }`}
              >
                {isAllVisible ? "Show Less" : "Load More"}
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

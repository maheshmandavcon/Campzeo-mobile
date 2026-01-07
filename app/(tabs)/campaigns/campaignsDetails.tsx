import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import { useAuth } from "@clerk/clerk-expo";
import {
  deletePostForCampaignApi,
  getCampaignByIdApi,
  getPostsByCampaignIdApi,
} from "@/api/campaign/campaignApi";

// Map type to icon
const platformIcons: Record<
  string,
  { Icon: any; color: string; name: string }
> = {
  WHATSAPP: { Icon: Ionicons, name: "logo-whatsapp", color: "#25D366" },
  INSTAGRAM: { Icon: FontAwesome, name: "instagram", color: "#C13584" },
  FACEBOOK: { Icon: FontAwesome, name: "facebook-square", color: "#1877F2" },
  YOUTUBE: { Icon: FontAwesome, name: "youtube-play", color: "#FF0000" },
  LINKEDIN: { Icon: FontAwesome, name: "linkedin-square", color: "#0A66C2" },
  PINTEREST: { Icon: FontAwesome, name: "pinterest", color: "#E60023" },
  EMAIL: { Icon: Ionicons, name: "mail", color: "#F59E0B" },
  SMS: {
    Icon: Ionicons,
    name: "chatbubble-ellipses-outline",
    color: "#10B981",
  },
};

export default function CampaignsDetails() {
  const { getToken } = useAuth();
  const params = useLocalSearchParams();

  /** Safe param parsing */
  const campaignStr =
    typeof params.campaign === "string" ? params.campaign : null;
  const campaignIdParam =
    typeof params.campaignId === "string" ? params.campaignId : null;

  /** Try to parse campaign JSON string */
  const initialCampaign = useMemo<Campaign | null>(() => {
    if (!campaignStr) return null;
    try {
      return JSON.parse(campaignStr) as Campaign;
    } catch (e) {
      console.warn("Failed to parse campaign JSON", e);
      return null;
    }
  }, [campaignStr]);

  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign);
  const [posts, setPosts] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [loadingCampaign, setLoadingCampaign] = useState(false);

  /** Determine final campaignId */
  const resolvedCampaignId = useMemo<number | undefined>(() => {
    if (campaign?.id) return campaign.id;

    if (campaignIdParam) {
      const num = Number(campaignIdParam);
      return Number.isFinite(num) ? num : undefined;
    }
    return undefined;
  }, [campaign, campaignIdParam]);

  // ========= FETCH CAMPAIGN DETAILS =========
  useEffect(() => {
    const fetchCampaign = async () => {
      if (campaign || !resolvedCampaignId) return;

      setLoadingCampaign(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const data = await getCampaignByIdApi(resolvedCampaignId, token);
        if (!data) return;

        const mapped: Campaign = {
          id: Number(data.id ?? data._id ?? resolvedCampaignId),
          details: data.name ?? "Untitled Campaign",
          dates: `${(data.startDate || "").split("T")[0]} - ${(data.endDate || "").split("T")[0]
            }`,
          description: data.description ?? "",
          posts: data.posts ?? [],
          show: true,
        };

        setCampaign(mapped);
      } catch (error) {
        console.log("CAMPAIGN LOAD ERROR", error);
      } finally {
        setLoadingCampaign(false);
      }
    };

    fetchCampaign();
  }, [campaign, resolvedCampaignId]);

  // ========= FETCH POSTS =========
  const fetchPosts = useCallback(async () => {
    if (!resolvedCampaignId) return;
    try {
      const token = await getToken();
      if (!token) throw new Error("Token missing");

      const res = await getPostsByCampaignIdApi(resolvedCampaignId, token);
      const apiPosts = res?.posts ?? res?.data?.posts ?? [];

      // ✅ NORMALIZE POST ID HERE (IMPORTANT FIX)
      const normalizedPosts = apiPosts.map((p: any) => ({
        ...p,
        id: p.id ?? p.postId, // backend uses numeric postId
      }));

      setPosts(normalizedPosts);
    } catch (error) {
      console.log("POSTS LOAD ERROR:", error);
      setPosts([]);
    }
  }, [resolvedCampaignId, getToken]);

  // Refresh posts when coming back
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  // ========= POST ACTIONS =========
  const handleDeletePost = async (postId: number) => {
    if (!resolvedCampaignId) return;
    Alert.alert("Delete Post?", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getToken();
            if (!token) throw new Error("Token missing");

            // Call the DELETE API
            await deletePostForCampaignApi(resolvedCampaignId, postId, token);

            // Update local state to remove the post
            const updatedPosts = posts.filter((p) => p.id !== postId);
            setPosts(updatedPosts);

            // Adjust visible count if needed
            if (visibleCount > updatedPosts.length) setVisibleCount(updatedPosts.length);

            console.log(`Post ${postId} deleted successfully`);
          } catch (error) {
            console.error("Failed to delete post:", error);
            Alert.alert("Error", "Failed to delete post. Please try again.");
          }
        },
      },
    ]);
  };


  // ========= HANDLE CREATE / EDIT POST =========
  const handleCreatePost = (campaignId: number) => {
    router.push({
      pathname: "/campaigns/campaignComponents/campaignPost",
      params: {
        campaignId: String(campaignId),
      },
    });
  };

  const handleEditPost = (campaignId: number, post: any) => {
    if (!post?.id || !post?.type) {
      console.error("Post id or type missing", post);
      return;
    }

    router.push({
      pathname: "/campaigns/campaignComponents/campaignPost",
      params: {
        campaignId: String(campaignId),
        postId: String(post.id),
        type: post.type, // 🔥 THIS IS THE KEY
      },
    });
  };

  const handleSharePost = (postId: number) => {
    console.log("Share post clicked for ID:", postId);
  };

  // ========= RENDER POST =========
  const renderPostItem = ({ item }: { item: any }) => {
    const platform = platformIcons[item.type];

    return (
      <View className="bg-white p-4 rounded-xl mb-4 shadow relative">
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            flexDirection: "row",
            zIndex: 10,
            elevation: 10,
          }}
        >

          <TouchableOpacity
            onPress={() => handleSharePost(campaign!.id,)}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              // backgroundColor: "#ecfdf5",
            }}
          >
            <Ionicons name="share-social-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleEditPost(campaign!.id, item)}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              // backgroundColor: "#ecfdf5",
            }}
          >
            <Ionicons name="create-outline" size={22} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleDeletePost(item.id)}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              // backgroundColor: "#fee2e2",
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {item.subject ? (
          <Text
            className="text-lg font-bold mb-2"
            style={{ marginRight: 120 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.subject}
          </Text>
        ) : (
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#9ca3af"
            />
            <Text className="ml-2 text-gray-500 italic">
              No subject available
            </Text>
          </View>
        )}

        <Text className="font-semibold mb-1">Description</Text>
        {item.message ? (
          <Text className="mb-2" style={{ textAlign: "justify" }}>
            {item.message}
          </Text>
        ) : (
          <View className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#9ca3af"
            />
            <Text className="ml-2 text-gray-500 italic">
              No description available
            </Text>
          </View>
        )}

        <Text className="font-semibold mb-1">Schedule</Text>
        {item.scheduledPostTime ? (
          <Text className="mb-2">
            {new Date(item.scheduledPostTime).toLocaleString()}
          </Text>
        ) : (
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
            <Text className="ml-2 text-gray-500 italic">
              No schedule available
            </Text>
          </View>
        )}

        <View className="flex-row items-center">
          <Text className="font-semibold mr-2">Type</Text>
          {platform ? (
            <platform.Icon
              name={platform.name}
              size={22}
              color={platform.color}
            />
          ) : (
            <Text>{item.type}</Text>
          )}
        </View>
      </View>
    );
  };

  const visiblePosts = posts.slice(0, visibleCount);
  const isAllVisible = visibleCount >= posts.length;

  if (!campaign) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" />
        <Text className="mt-3">Loading campaign...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <Text className="text-xl font-bold mb-3">Campaign Details</Text>

      <CampaignCard
        campaign={campaign}
        // postsCount={posts.length}
        showActions={false}
        alwaysExpanded={true}
        postButtonTopRight={true}
        hidePostsHeading={true}
        onDelete={() => { }}
        onCopy={() => { }}
        onToggleShow={() => { }}
        onPressPost={() => handleCreatePost(campaign.id)}
      />

      {/* POSTS */}
      <View className="mt-4 flex-1">
        <Text className="text-xl font-bold mb-3">Created Posts</Text>

        {posts.length === 0 ? (
          <Text className="text-gray-500 text-center">No records found</Text>
        ) : (
          <FlatList
            data={visiblePosts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPostItem}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              posts.length > 5 ? (
                <TouchableOpacity
                  onPress={
                    isAllVisible
                      ? () => setVisibleCount(5)
                      : () => setVisibleCount((v) => v + 5)
                  }
                  className={`py-3 my-2 rounded-xl items-center ${isAllVisible ? "bg-red-100" : "bg-blue-100"
                    }`}
                >
                  <Text
                    className={`font-semibold ${isAllVisible ? "text-red-700" : "text-blue-700"
                      }`}
                  >
                    {isAllVisible ? "Show Less" : "Load More"}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

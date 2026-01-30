import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  TouchableOpacity,
  View,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import { useAuth } from "@clerk/clerk-expo";
import {
  deletePostForCampaignApi,
  getCampaignByIdApi,
  getPostsByCampaignIdApi,
  shareCampaignPostApi,
} from "@/api/campaignApi";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { getContactsApi } from "@/api/contactApi";
import { ContactsRecord } from "../contacts/contactComponents/contactCard";
import ShareCampaignPost from "./campaignComponents/shareCampaignPost";


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
  SMS: { Icon: Ionicons, name: "chatbubble-ellipses-outline", color: "#10B981" },
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
  const [publishing, setPublishing] = useState(false);

  const refreshCallback =
    typeof params.refreshCallback === "string";

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
        const data = await getCampaignByIdApi(resolvedCampaignId);
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
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!resolvedCampaignId) return;

    setLoadingPosts(true);
    try {
      const res = await getPostsByCampaignIdApi(resolvedCampaignId);
      const apiPosts = res?.posts ?? res?.data?.posts ?? [];

      const normalizedPosts = apiPosts.map((p: any) => ({
        ...p,
        id: p.id ?? p.postId,
      }));

      setPosts(normalizedPosts);
    } catch (error) {
      console.log("POSTS LOAD ERROR:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [resolvedCampaignId]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [fetchPosts])
  );

  useEffect(() => {
    if (refreshCallback) {
      fetchPosts();
    }
  }, [refreshCallback]);

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
            await deletePostForCampaignApi(resolvedCampaignId, postId);
            const updatedPosts = posts.filter((p) => p.id !== postId);
            setPosts(updatedPosts);

            if (visibleCount > updatedPosts.length) setVisibleCount(updatedPosts.length);
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
      params: { campaignId: String(campaignId), refreshCallback: "true" },
    });
  };

  const handleEditPost = (campaignId: number, post: any) => {
    if (!post?.id || !post?.type) return;

    router.push({
      pathname: "/campaigns/campaignComponents/campaignPost",
      params: {
        campaignId: String(campaignId),
        postId: String(post.id),
        type: post.type,
      },
    });
  };

  // ========= SHARE POST MODAL =========
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactsRecord[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentSharePostId, setCurrentSharePostId] = useState<number | null>(null);

  const fetchContactsForShare = async () => {
    try {
      setLoadingContacts(true);
      const res = await getContactsApi(1, 100, "");
      const mapped: ContactsRecord[] = (res.contacts ?? []).map((c: any) => ({
        id: c.id,
        name: c.contactName,
        email: c.contactEmail,
        mobile: c.contactMobile,
        whatsapp: c.contactWhatsApp,
        show: true,
        campaigns: c.campaigns ?? [],
      }));
      setContacts(mapped);
    } catch (e) {
      console.error("Failed to fetch contacts", e);
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleOpenShareModal = async (postId: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    setCurrentSharePostId(postId);

    if (["SMS", "EMAIL", "WHATSAPP"].includes(post.type)) {
      setSelectedContacts([]);
      await fetchContactsForShare();
      setShareModalVisible(true);
    } else {
      setShareModalVisible(true);
    }
  };

  const toggleContactSelection = (contactId: number) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  const sharePost = async () => {
    if (!resolvedCampaignId || !currentSharePostId) return;

    const post = posts.find((p) => p.id === currentSharePostId);
    if (!post) return;

    let contactsToSend: number[] = [];

    if (["SMS", "EMAIL", "WHATSAPP"].includes(post.type)) {
      if (selectedContacts.length === 0) {
        Alert.alert("Select contacts", "Please select at least one contact.");
        return;
      }
      contactsToSend = selectedContacts;
    }

    try {
      setPublishing(true);
      const result = await shareCampaignPostApi(
        resolvedCampaignId,
        currentSharePostId,
        contactsToSend,
      );

      if (result.success) {
        Alert.alert(
          "Success",
          contactsToSend.length > 0
            ? `Post sent to ${contactsToSend.length} contacts`
            : "Post sent Successfully"
        );
      } else {
        Alert.alert(
          "Failed",
          `Failed to send post to ${result.failed?.length || 0} contacts`
        );
      }

      setShareModalVisible(false);
    } catch (error: any) {
      console.error("Send error", error);
      Alert.alert("Error", error.message || "Failed to send post");
    } finally {
      setPublishing(false);
    }
  };

  // ========= RENDER POST ITEM =========
  const renderPostItem = ({ item }: { item: any }) => {
    const platform = platformIcons[item.type];

    return (
      <View className="p-4 rounded-xl mb-4 relative">
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
            onPress={() => handleOpenShareModal(item.id)}
            activeOpacity={0.6}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
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
              justifyContent: "center",
              alignItems: "center",
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
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {item.subject ? (
          <ThemedText
            className="text-lg font-bold mb-2"
            style={{ marginRight: 120 }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.subject}
          </ThemedText>
        ) : (
          <ThemedView className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#9ca3af"
            />
            <ThemedText className="ml-2 text-gray-500 italic">
              No subject available
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText className="font-semibold mb-1">Description</ThemedText>
        {item.message ? (
          <ThemedText
            className="mb-2"
            style={{
              textAlign: "justify",
              color: isDark ? "#e5e7eb" : "#111",
            }}
          >
            {item.message}
          </ThemedText>
        ) : (
          <ThemedView className="flex-row items-center mb-2">
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#9ca3af"
            />
            <ThemedText className="ml-2 text-gray-500 italic">
              No description available
            </ThemedText>
          </ThemedView>
        )}

        <ThemedText className="font-semibold mb-1">Schedule</ThemedText>
        {item.scheduledPostTime ? (
          <ThemedText
            className="mb-2"
            style={{
              color: isDark ? "#e5e7eb" : "#111",
            }}
          >
            {new Date(item.scheduledPostTime).toLocaleString()}
          </ThemedText>
        ) : (
          <ThemedView className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
            <ThemedText className="ml-2 text-gray-500 italic">
              No schedule available
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView className="flex-row items-center">
          <ThemedText className="font-semibold mr-2">Type</ThemedText>
          {platform ? (
            <platform.Icon
              name={platform.name}
              size={22}
              color={isDark ? "#ffffff" : platform.color}
            />
          ) : (
            <ThemedText
              style={{ color: isDark ? "#e5e7eb" : "#111" }}
            >
              {item.type}
            </ThemedText>
          )}
        </ThemedView>
      </View>
    );
  };

  const visiblePosts = posts.slice(0, visibleCount);
  const isAllVisible = visibleCount >= posts.length;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemedView className="flex-1 p-4" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
      <ThemedText
        style={{
          fontSize: 18,
          fontWeight: "bold",
        }}
        className="mb-3"
      >
        Campaign Details
      </ThemedText>

      {campaign && (
        <CampaignCard
          campaign={campaign}
          showActions={false}
          alwaysExpanded={true}
          postButtonTopRight={true}
          hidePostsHeading={true}
          onDelete={() => { }}
          onCopy={() => { }}
          onToggleShow={() => { }}
          onPressPost={() => handleCreatePost(campaign.id)}
        />
      )}

      {/* POSTS */}
      <ThemedView className="flex-1" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
        <ThemedText className="text-xl font-bold mb-3"
          style={{
            fontSize: 18,
            fontWeight: "bold",
          }}>Created Posts</ThemedText>
        {loadingPosts ? (
          <ThemedView className="flex-1 justify-center items-center" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
            <ActivityIndicator size="large" color="#dc2626" />
            <ThemedText className="mt-2" style={{ color: isDark ? "#e5e7eb" : "#111" }}>
              Loading posts...
            </ThemedText>
          </ThemedView>
        ) : posts.length === 0 ? (
          <ThemedView
            className="flex-1 justify-center items-center"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 6,
                color: isDark ? "#ffffff" : "#000000",
              }}
            >
              No posts yet
            </ThemedText>

            <ThemedText
              style={{
                fontSize: 14,
                textAlign: "center",
                color: isDark ? "#9ca3af" : "#6b7280",
                paddingHorizontal: 24,
              }}
            >
              You haven’t created any posts for this campaign yet.
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            data={visiblePosts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ThemedView className="mb-3 rounded-xl shadow" style={{ borderWidth: 1, borderColor: isDark ? "#ffffff" : "#e5e7eb" }}>
                {renderPostItem({ item })}
              </ThemedView>
            )}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              posts.length > 5 ? (
                <TouchableOpacity
                  onPress={isAllVisible ? () => setVisibleCount(5) : () => setVisibleCount((v) => v + 5)}
                  className={`py-3 my-2 rounded-xl items-center ${isAllVisible ? isDark ? "bg-red-900/30" : "bg-red-100" : isDark ? "bg-blue-900/30" : "bg-blue-100"}`}
                >
                  <ThemedText className={`font-semibold ${isAllVisible ? isDark ? "text-red-300" : "text-red-700" : isDark ? "text-blue-300" : "text-blue-700"}`}>
                    {isAllVisible ? "Show Less" : "Load More"}
                  </ThemedText>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </ThemedView>
      <ShareCampaignPost
        visible={shareModalVisible}
        isDark={isDark}
        post={posts.find(p => p.id === currentSharePostId) ?? null}
        contacts={contacts}
        selectedContacts={selectedContacts}
        loadingContacts={loadingContacts}
        publishing={publishing}
        onClose={() => setShareModalVisible(false)}
        onToggleContact={toggleContactSelection}
        onPublish={sharePost}
      />
    </ThemedView>
  );
}

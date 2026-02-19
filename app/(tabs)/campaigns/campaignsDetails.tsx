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
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

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

  // ========= ALERT WHEN YOUR CAMAPIGN COMPLETE AND TRY TO CLICK CREATE POST =========
  const getCampaignStatus = (campaign: Campaign | null) => {
    if (!campaign?.startDate || !campaign?.endDate) return "Scheduled";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(campaign.startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(campaign.endDate);
    end.setHours(23, 59, 59, 999);

    if (today < start) return "Scheduled";
    if (today > end) return "Completed";
    return "Active";
  };

  const campaignStatus = getCampaignStatus(campaign);
  const isCompleted = campaignStatus === "Completed";

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


  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const q = searchQuery.toLowerCase();
    return posts.filter(
      (p) =>
        p.subject?.toLowerCase().includes(q) ||
        p.message?.toLowerCase().includes(q) ||
        p.type?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const isAllVisible = visibleCount >= filteredPosts.length;

  // Post Status
  const getPostStatus = (item: any) => {
    if (item.isPostSent === true) return "SENT";

    if (item.publishedDate) return "SENT";

    if (item.scheduledPostTime && !item.isPostSent) {
      const scheduled = new Date(item.scheduledPostTime);
      if (scheduled > new Date()) return "SCHEDULED";
    }

    if (item.failureReason) return "PENDING";

    return "PENDING";
  };

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
            setDeletingPostId(postId);

            await deletePostForCampaignApi(resolvedCampaignId, postId);

            // ✅ Reload ALL posts after delete
            await fetchPosts();

            // optional: reset visible count
            setVisibleCount(5);
          } catch (error) {
            Alert.alert("Error", "Failed to delete post. Please try again.");
          } finally {
            setDeletingPostId(null);
          }
        },
      },
    ]);
  };


  // ========= HANDLE CREATE / EDIT POST =========
  const handleCreatePost = (campaignId: number) => {
    // console.log("campaignStartDate:", campaign?.startDate);
    // console.log("campaignEndDate:", campaign?.endDate);
    router.push({
      pathname: "/campaigns/campaignComponents/campaignPost",
      params: {
        campaignId: String(campaignId),
        campaignStartDate: campaign?.startDate,
        campaignEndDate: campaign?.endDate,
        // campaignStartDate: campaign.startDate, 
        refreshCallback: "true",
      },
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

  const PostSkeletonCard = ({ isDark }: { isDark: boolean }) => {
    const bg = isDark ? "#27272a" : "#e5e7eb";

    return (
      <ThemedView
        className="mb-3 rounded-xl p-4"
        style={{
          borderWidth: 1,
          borderColor: isDark ? "#3f3f46" : "#d1d5db",
          backgroundColor: isDark ? "#18181b" : "#ffffff",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          {/* Subject */}
          <View
            style={{
              height: 18,
              width: "65%",
              borderRadius: 6,
              backgroundColor: bg,
            }}
          />

          {/* Icons */}
          <View style={{ flexDirection: "row" }}>
            {[1, 2, 3].map((_, i) => (
              <View
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: bg,
                  marginLeft: 10,
                }}
              />
            ))}
          </View>
        </View>

        {/* ───────── Description ───────── */}
        {[1, 2].map((_, i) => (
          <View
            key={i}
            style={{
              height: 12,
              width: i === 1 ? "50%" : "80%",
              borderRadius: 6,
              backgroundColor: bg,
              marginBottom: 8,
            }}
          />
        ))}

        {/* ───────── Date & Time ───────── */}
        <View
          style={{
            height: 12,
            width: "60%",
            borderRadius: 6,
            backgroundColor: bg,
            marginTop: 6,
            marginBottom: 10,
          }}
        />

        {/* ───────── Type + Platform Icon ───────── */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Type text */}
          <View
            style={{
              height: 12,
              width: 70,
              borderRadius: 6,
              backgroundColor: bg,
              marginRight: 10,
            }}
          />

          {/* Platform icon */}
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: bg,
            }}
          />
        </View>
      </ThemedView>
    );
  };

  // ========= SHARE POST MODAL =========
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactsRecord[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentSharePostId, setCurrentSharePostId] = useState<number | null>(null);

  // 🔧 FIX: sanitize post data for share modal (Pinterest issue)
  const sharePostData = useMemo(() => {
    if (!currentSharePostId) return null;

    const rawPost = posts.find(p => p.id === currentSharePostId);
    if (!rawPost) return null;

    return {
      ...rawPost,
      mediaUrls:
        rawPost.type === "PINTEREST"
          ? rawPost.mediaUrls?.filter(
            (url: string) =>
              typeof url === "string" && url.startsWith("http")
          )
          : rawPost.mediaUrls,
    };
  }, [posts, currentSharePostId]);

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

    // ✅ PINTEREST VALIDATION (THIS WAS MISSING)
    // if (post.type === "PINTEREST") {
    //   const boardId =
    //     post.metadata?.boardId || post.boardId;

    //   const boardName =
    //     post.metadata?.boardName || post.boardName;

    //   if (!boardId || !boardName) {
    //     Alert.alert(
    //       "Pinterest Board Required",
    //       "Please select a board or create a new board before publishing."
    //     );
    //     return;
    //   }
    // }

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

      const res = await shareCampaignPostApi(
        resolvedCampaignId,
        currentSharePostId,
        contactsToSend
      );

      // ✅ THIS IS THE FIX
      const sent = res?.data?.sent ?? 0;
      const failed = res?.data?.failed ?? 0;

      if (sent > 0) {
        // ✅ Delivered
        setPosts((prev) =>
          prev.map((p) =>
            p.id === currentSharePostId
              ? {
                ...p,
                isPostSent: true,
                publishedDate: new Date().toISOString(),
              }
              : p
          )
        );

        Alert.alert("Success", "Post sent successfully");
      } else {
        Alert.alert(
          "Delivery failed",
          "Message could not be delivered. Scheduled time is preserved."
        );
      }

      // ✅ FORCE UI UPDATE
      // setPosts((prev) =>
      //   prev.map((p) =>
      //     p.id === currentSharePostId
      //       ? {
      //         ...p,
      //         status: "SENT",
      //         sentAt: new Date().toISOString(),
      //         scheduledPostTime: null, 
      //         isPostSent: true,
      //         publishedDate: new Date().toISOString(),
      //       }
      //       : p
      //   )
      // );

      setSelectedContacts([]);
      setShareModalVisible(false);

      await fetchPosts(); // optional but fine
    }
    catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send post");
    } finally {
      setPublishing(false);
    }
  };

  // ========= RENDER POST ITEM =========
  const renderPostItem = ({ item }: { item: any }) => {
    const platform = platformIcons[item.type];
    const status = getPostStatus(item);
    const canDelete = status !== "SENT";
    const canEdit = status !== "SENT";
    const canShare = status !== "SENT";

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
            onPress={() => {
              if (!canShare) return;
              handleOpenShareModal(item.id);
            }}
            disabled={!canShare}
            activeOpacity={canShare ? 0.6 : 1}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              opacity: !canShare ? 0.4 : 1,
            }}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color={isDark ? "#73a6f9" : "#3b82f6"}
            />
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => {
              if (!canEdit) return;
              handleEditPost(campaign!.id, item);
            }}
            disabled={!canEdit}
            activeOpacity={canEdit ? 0.6 : 1}
            style={{
              width: 44,
              height: 44,
              justifyContent: "center",
              alignItems: "center",
              opacity: !canEdit ? 0.4 : 1,
            }}
          >
            <Ionicons
              name="create-outline"
              size={22}
              color={isDark ? "#73f3c9" : "#10b981"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!canDelete) return;
              handleDeletePost(item.id);
            }}
            disabled={!canDelete || deletingPostId === item.id}
            activeOpacity={canDelete ? 0.6 : 1}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              justifyContent: "center",
              alignItems: "center",
              opacity: !canDelete ? 0.4 : 1,
            }}
          >

            {deletingPostId === item.id ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#f47a7a" : "#ef4444"}
              />
            ) : (
              <Ionicons
                name="trash-outline"
                size={22}
                color={isDark ? "#f47a7a" : "#ef4444"}
              />
            )}
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
        ) : item.type === "SMS" ? null : (
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

        {/* TYPE + STATUS ROW */}
        <ThemedView className="flex-row items-center justify-between mt-2">
          {/* TYPE */}
          <ThemedView className="flex-row items-center">
            <ThemedText
              className="font-semibold mr-2"
              style={{ color: isDark ? "#e5e7eb" : "#111827" }}
            >
              Type
            </ThemedText>

            {platform ? (
              <platform.Icon
                name={platform.name}
                size={20}
                color={isDark ? "#ffffff" : platform.color}
              />
            ) : (
              <ThemedText style={{ color: isDark ? "#e5e7eb" : "#111" }}>
                {item.type}
              </ThemedText>
            )}
          </ThemedView>

          {/* STATUS */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: isDark ? "#020617" : "#f9fafb",
            }}
          >
            <Ionicons
              name={
                status === "SENT"
                  ? "paper-plane"
                  : status === "SCHEDULED"
                    ? "alarm-outline"
                    // : "pencil-outline" || "hourglass-outline"
                    : "hourglass-outline"
              }
              size={14}
              style={{
                textShadowColor:
                  status === "SENT"
                    ? "#16a34a"
                    : status === "SCHEDULED"
                      ? "#2563eb"
                      : "#f59e0b",
                textShadowRadius: 8,
              }}
              color={
                status === "SENT"
                  ? "#22c55e"
                  : status === "SCHEDULED"
                    ? "#3b82f6"
                    : "#fbbf24"
              }
            />
            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#e5e7eb" : "#111827",
              }}
            >
              {status}
            </ThemedText>
          </View>

        </ThemedView>
      </View>
    );
  };

  // const visiblePosts = posts.slice(0, visibleCount);
  // const isAllVisible = visibleCount >= posts.length;

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
          createPostButton={true}
          hidePostsHeading={true}
          statusPosition={"top"}
          highlightBorder
          onDelete={() => { }}
          onCopy={() => { }}
          onToggleShow={() => { }}
          // onPressPost={() => campaign?.id && handleCreatePost(campaign.id)}
          onPressPost={() => {
            if (isCompleted) {
              Alert.alert(
                "Campaign Completed",
                "You cannot create posts for a completed campaign."
              );
              return;
            }
            campaign?.id && handleCreatePost(campaign.id);
          }}
        />
      )}

      {/* POSTS */}
      <ThemedView className="flex-1" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
        <ThemedView
          className="flex-row items-center justify-between mb-3"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        >
          {/* Title */}
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#000000",
            }}
          >
            Created Posts
          </ThemedText>

          {/* Search */}
          <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: isDark ? "#3f3f46" : "#e5e7eb",
              backgroundColor: isDark ? "#161618" : "#ffffff",
              borderRadius: 50,
              paddingHorizontal: 10,
              height: 40,
              width: 200,
            }}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search posts"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              style={{
                marginLeft: 6,
                flex: 1,
                fontSize: 13,
                color: isDark ? "#ffffff" : "#000000",
              }}
            />
          </ThemedView>
        </ThemedView>

        {loadingPosts ? (
          <FlatList
            data={Array(5).fill(null)}
            keyExtractor={(_, i) => `skeleton-${i}`}
            renderItem={() => <PostSkeletonCard isDark={isDark} />}
            showsVerticalScrollIndicator={false}
          />
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
              Tap create post to create your first post...
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
        post={sharePostData}
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

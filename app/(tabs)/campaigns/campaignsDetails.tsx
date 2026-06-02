import {
  deletePostForCampaignApi,
  getCampaignByIdApi,
  getPostsByCampaignIdApi,
  shareCampaignPostApi,
  updatePostForCampaignApi
} from "@/api/campaignApi";
import { getContactsApi } from "@/api/contactApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@clerk/clerk-expo";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ContactsRecord } from "../contacts/contactComponents/contactCard";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import ShareCampaignPost from "./campaignComponents/shareCampaignPost";
import BoostCampaignPost from "./campaignComponents/boostCampaignPost";
import Preview from "./campaignComponents/preview"; // ✅ Added Preview import
import { Linking, Modal, SafeAreaView, ScrollView } from "react-native";


// Map type to icon
const platformIcons: Record<
  string,
  { Icon: any; color: string; name: string }
> = {
  SMS: { Icon: Ionicons, name: "chatbubble-ellipses-outline", color: "#10B981" },
  EMAIL: { Icon: Ionicons, name: "mail", color: "#F59E0B" },
  WHATSAPP: { Icon: Ionicons, name: "logo-whatsapp", color: "#25D366" },
  INSTAGRAM: { Icon: FontAwesome, name: "instagram", color: "#C13584" },
  FACEBOOK: { Icon: FontAwesome, name: "facebook-square", color: "#1877F2" },
  YOUTUBE: { Icon: FontAwesome, name: "youtube-play", color: "#FF0000" },
  LINKEDIN: { Icon: FontAwesome, name: "linkedin-square", color: "#0A66C2" },
  PINTEREST: { Icon: FontAwesome, name: "pinterest", color: "#E60023" },
};

const FIXED_PLATFORMS = Object.keys(platformIcons);

export default function CampaignsDetails() {
  const { getToken } = useAuth();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const campaignStr =
    typeof params.campaign === "string" ? params.campaign : null;
  const campaignIdParam =
    typeof params.campaignId === "string" ? params.campaignId : null;

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
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [platformOrder, setPlatformOrder] = useState(FIXED_PLATFORMS);
  const platformScrollRef = useRef<ScrollView>(null);
  const flatListRef = useRef<FlatList>(null);

  const refreshCallback =
    typeof params.refreshCallback === "string";

  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [isCampaignCardVisible, setIsCampaignCardVisible] = useState(true);

  const resolvedCampaignId = useMemo<number | undefined>(() => {
    if (campaign?.id) return campaign.id;

    if (campaignIdParam) {
      const num = Number(campaignIdParam);
      return Number.isFinite(num) ? num : undefined;
    }
    return undefined;
  }, [campaign, campaignIdParam]);

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

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [contacts, setContacts] = useState<ContactsRecord[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [currentSharePostId, setCurrentSharePostId] = useState<number | null>(null);

  const fetchContactsForShare = useCallback(async () => {
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
  }, []);

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
      // Auto-collapse card if posts exist
      if (normalizedPosts.length > 0) {
        setIsCampaignCardVisible(false);
      } else {
        setIsCampaignCardVisible(true);
      }
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
      fetchContactsForShare();
    }, [fetchPosts, fetchContactsForShare])
  );

  useEffect(() => {
    if (refreshCallback) {
      fetchPosts();
    }
  }, [refreshCallback]);


  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((post) =>
        post.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Platform filter
    if (selectedPlatform !== "ALL") {
      filtered = filtered.filter((post) => post.type === selectedPlatform);
    }

    return filtered;
  }, [posts, searchQuery, selectedPlatform]);

  const visiblePosts = useMemo(() => {
    return filteredPosts.slice(0, visibleCount);
  }, [filteredPosts, visibleCount]);

  const handlePlatformPress = (plat: string, index: number) => {
    setSelectedPlatform(plat);
    if (plat !== "ALL") {
      setPlatformOrder((prev) => {
        // index 0 is 'ALL' in the UI, but platformOrder maps to tabs AFTER 'ALL'
        // Wait, in the UI: ['ALL', ...platformOrder]
        // So the tab at UI index 'index' is platformOrder[index - 1]

        const otherIndex = index - 1;
        if (otherIndex < 0) return prev;

        const rotated = [
          ...prev.slice(otherIndex),
          ...prev.slice(0, otherIndex)
        ];
        return rotated;
      });
    }
    platformScrollRef.current?.scrollTo({ x: 0, animated: true });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const isAllVisible = visibleCount >= filteredPosts.length;

  const getPostCount = (platform: string) => {
    if (platform === "ALL") return posts.length;
    return posts.filter((p) => p.type === platform).length;
  };

  const getPostStatus = (item: any) => {
    if (item.isPostSent === true || item.publishedDate || item.status?.toUpperCase() === "SENT") return "SENT";

    if (item.scheduledPostTime && !item.isPostSent) {
      const scheduled = new Date(item.scheduledPostTime);
      if (scheduled > new Date()) return "SCHEDULED";
    }

    if (item.failureReason) return "PENDING";

    return "PENDING";
  };

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
            await fetchPosts();

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

  const handleBoostPostAction = (post: any) => {
    const status = getPostStatus(post);
    if (status === "SENT") {
      // Open external link
      const adAccountId = post.metadata?.boosting?.adAccountId || "1237825278172670";
      const pageId = post.metadata?.facebookPageId || "814937711712427";
      const targetId = post.metadata?.facebookPostId || post.postId || "122129921193143563";

      const url = `https://www.facebook.com/ad_center/create/boostpost/?ad_account_id=${adAccountId}&page_id=${pageId}&target_id=${targetId}&entry_point=partner_campzeo`;
      Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open Facebook Boost page"));
    } else {
      // Open modal
      setCurrentBoostPostId(post.id);
      setBoostModalVisible(true);
    }
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

  // ========= BOOST POST MODAL =========
  const [boostModalVisible, setBoostModalVisible] = useState(false);
  const [currentBoostPostId, setCurrentBoostPostId] = useState<number | null>(null);

  const boostPostData = useMemo(() => {
    if (!currentBoostPostId) return null;
    return posts.find(p => p.id === currentBoostPostId);
  }, [posts, currentBoostPostId]);

  // ========= PREVIEW POST MODAL =========
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

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

    try {
      setPublishing(true);

      if (post.type === "PINTEREST") {
        const boardId =
          post.metadata?.boardId || post.boardId;
        const boardName =
          post.metadata?.boardName || post.boardName;

        if (!boardId && !boardName) {
          Alert.alert(
            "Pinterest Board Required",
            "Please select a board or create a new board before publishing."
          );
          setPublishing(false);
          return;
        }

        await updatePostForCampaignApi(
          resolvedCampaignId,
          currentSharePostId,
          {
            ...post,
            metadata: {
              ...post.metadata,
              boardId,
              boardName,
            },
          }
        );
      }

      let contactsToSend: number[] = [];
      if (["SMS", "EMAIL", "WHATSAPP"].includes(post.type)) {
        if (selectedContacts.length === 0) {
          Alert.alert("Select contacts", "Please select at least one contact.");
          setPublishing(false);
          return;
        }
        contactsToSend = selectedContacts;
      }

      const res = await shareCampaignPostApi(
        resolvedCampaignId,
        currentSharePostId,
        contactsToSend
      );

      Alert.alert("Success", "Post sent successfully");

      setShareModalVisible(false);
      setSelectedContacts([]);
      await fetchPosts();

    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send post");
    } finally {
      setPublishing(false);
    }
  };

  // ========= RENDER POST ITEM =========
  const renderPostItem = ({ item }: { item: any }) => {
    const platform = platformIcons[item.type];
    const status = getPostStatus(item);

    const isDirectPost = !item.scheduledPostTime;

    const canDelete = status !== "SENT" && !isDirectPost;
    const canEdit = status !== "SENT" && !isDirectPost;
    const canShare = status !== "SENT" && !isDirectPost;
    const isMeta = item.type === "FACEBOOK" || item.type === "INSTAGRAM";
    const canBoost = isMeta;

    return (
      <View className="p-4 rounded-xl mb-4 relative">
        {/* TOP RIGHT: PLATFORM + STATUS */}
        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 10,
          }}
        >

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 999,
              backgroundColor: isDark ? "#020617" : "#f9fafb",
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <Ionicons
              name={
                status === "SENT"
                  ? "paper-plane"
                  : status === "SCHEDULED"
                    ? "alarm-outline"
                    : "hourglass-outline"
              }
              size={10}
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
                fontSize: 9,
                fontWeight: "700",
                color: isDark ? "#e5e7eb" : "#111827",
              }}
            >
              {status}
            </ThemedText>
          </View>
        </View>

        {item.subject ? (
          <ThemedText
            className="text-lg font-bold mb-2"
            style={{ marginRight: canBoost ? 160 : 120 }}
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

        {item.message ? (
          <ThemedText
            className="mb-3"
            style={{
              textAlign: "justify",
              color: isDark ? "#9ca3af" : "#4b5563",
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {item.message}
          </ThemedText>
        ) : (
          <ThemedView className="flex-row items-center mb-3">
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#9ca3af"
            />
            <ThemedText className="ml-2 text-gray-500 italic" style={{ fontSize: 13 }}>
              No description available
            </ThemedText>
          </ThemedView>
        )}

        <ThemedView
          className="flex-row items-center justify-between mt-4 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: isDark ? "#3f3f46" : "#f3f4f6" }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {platform && (
              <platform.Icon
                name={platform.name}
                size={16}
                color={isDark ? "#9ca3af" : platform.color}
              />
            )}

            {item.scheduledPostTime || item.publishedDate || item.createdAt ? (
              <ThemedText
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontSize: 12,
                }}
              >
                {new Date(
                  item.scheduledPostTime || item.publishedDate || item.createdAt
                ).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </ThemedText>
            ) : (
              <ThemedText style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 12, fontStyle: "italic" }}>
                No schedule
              </ThemedText>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {canBoost && (
              <TouchableOpacity
                onPress={() => handleBoostPostAction(item)}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name={status === "SENT" ? "rocket" : "rocket-outline"}
                  size={20}
                  color={isDark ? "#fbbf24" : "#f59e0b"}
                />
              </TouchableOpacity>
            )}

            {(status === "SENT" || status === "SCHEDULED" || status === "PENDING") && (
              <TouchableOpacity
                onPress={() => {
                  setPreviewPost(item);
                  setPreviewModalVisible(true);
                }}
                style={{ padding: 6 }}
              >
                <Ionicons
                  name="eye-outline"
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => canShare && handleOpenShareModal(item.id)}
              disabled={!canShare}
              style={{ padding: 6, opacity: canShare ? 1 : 0.4 }}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={isDark ? "#73a6f9" : "#3b82f6"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => canEdit && handleEditPost(campaign!.id, item)}
              disabled={!canEdit}
              style={{ padding: 6, opacity: canEdit ? 1 : 0.4 }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={isDark ? "#73f3c9" : "#10b981"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => canDelete && handleDeletePost(item.id)}
              disabled={!canDelete || deletingPostId === item.id}
              style={{ padding: 6, opacity: canDelete ? 1 : 0.4 }}
            >
              {deletingPostId === item.id ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={isDark ? "#f47a7a" : "#ef4444"}
                />
              )}
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    );
  };

  return (
    <ThemedView
      className="flex-1"
      style={{
        backgroundColor: isDark ? "#161618" : "#f3f4f6",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <ThemedText
            style={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {isCampaignCardVisible ? "Campaign Details" : "Created Posts"}
          </ThemedText>
          {posts.length > 0 && (
            <TouchableOpacity
              onPress={() => setIsCampaignCardVisible(!isCampaignCardVisible)}
              style={{ marginLeft: 8 }}
            >
              <Ionicons
                name={
                  isCampaignCardVisible
                    ? "chevron-up-circle-outline"
                    : "chevron-down-circle-outline"
                }
                size={22}
                color={isDark ? "#ffffff" : "#000000"}
              />
            </TouchableOpacity>
          )}
        </View>

        {!isCampaignCardVisible && campaign && (
          <TouchableOpacity
            onPress={() => {
              if (isCompleted) {
                Alert.alert(
                  "Campaign Completed",
                  "You cannot create posts for a completed campaign."
                );
                return;
              }
              campaign?.id && handleCreatePost(campaign.id);
            }}
            style={{
              backgroundColor: "#2563eb",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <ThemedText
              style={{ color: "#ffffff", fontWeight: "600", fontSize: 12 }}
            >
              Create Post
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {isCampaignCardVisible && campaign && (
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

      <View style={{ flex: 1, justifyContent: "flex-start" }}>
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}
        >
          {isCampaignCardVisible && (
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#000000",
                marginRight: 12,
              }}
            >
              Created Posts
            </ThemedText>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
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
                flex: 1,
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
                placeholder="Search Posts..."
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  marginLeft: 6,
                  flex: 1,
                  fontSize: 13,
                  color: isDark ? "#ffffff" : "#000000",
                }}
              />
            </ThemedView>

            <TouchableOpacity
              onPress={() => fetchPosts()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "#161618" : "#f3f4f6",
                borderWidth: 1,
                borderColor: isDark ? "#3f3f46" : "#e5e7eb",
                justifyContent: "center",
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="sync" size={20} color={isDark ? "#ffffff" : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>

        {!isCampaignCardVisible && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => handlePlatformPress("ALL", 0)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                height: 38,
                justifyContent: "center",
                borderRadius: 20,
                backgroundColor: selectedPlatform === "ALL"
                  ? "#2563eb"
                  : (isDark ? "#161618" : "#ffffff"),
                borderWidth: 1.5,
                borderColor: selectedPlatform === "ALL" ? "#2563eb" : (isDark ? "#3f3f46" : "#e5e7eb"),
                marginRight: 8,
                marginLeft: 4,
              }}
            >
              <ThemedText style={{ color: selectedPlatform === "ALL" ? "#ffffff" : (isDark ? "#9ca3af" : "#6b7280"), fontWeight: "600", fontSize: 12 }}>
                All
              </ThemedText>
              {getPostCount("ALL") > 0 && (
                <View style={{
                  backgroundColor: selectedPlatform === "ALL" ? "rgba(255,255,255,0.2)" : (isDark ? "#374151" : "#f3f4f6"),
                  paddingHorizontal: 6,
                  height: 18,
                  minWidth: 18,
                  borderRadius: 9,
                  marginLeft: 4,
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <ThemedText style={{ fontSize: 10, fontWeight: "700", color: selectedPlatform === "ALL" ? "#fff" : (isDark ? "#fff" : "#666") }}>
                    {getPostCount("ALL")}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>

            <ScrollView
              ref={platformScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 16, paddingBottom: 10, paddingTop: 2 }}
            >
              {platformOrder.map((plat, index) => {
                const config = platformIcons[plat];
                const isSelected = selectedPlatform === plat;
                const count = getPostCount(plat);

                return (
                  <TouchableOpacity
                    key={plat}
                    onPress={() => handlePlatformPress(plat, index + 1)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      paddingHorizontal: 14,
                      height: 38,
                      borderRadius: 20,
                      backgroundColor: isSelected
                        ? "#2563eb"
                        : (isDark ? "#161618" : "#ffffff"),
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#2563eb" : (isDark ? "#3f3f46" : "#e5e7eb"),
                    }}
                  >
                    <config.Icon
                      name={config.name}
                      size={16}
                      color={isSelected ? "#ffffff" : (isDark ? "#9ca3af" : config.color)}
                    />
                    <ThemedText style={{
                      color: isSelected ? "#ffffff" : (isDark ? "#9ca3af" : "#6b7280"),
                      fontWeight: "600",
                      fontSize: 12,
                      textTransform: "capitalize"
                    }}>
                      {plat.toLowerCase()}
                    </ThemedText>

                    {count > 0 && (
                      <View style={{
                        backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : (isDark ? "#374151" : "#f3f4f6"),
                        paddingHorizontal: 6,
                        height: 18,
                        minWidth: 18,
                        borderRadius: 9,
                        marginLeft: 4,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <ThemedText style={{ fontSize: 10, fontWeight: "700", color: isSelected ? "#fff" : (isDark ? "#fff" : "#666") }}>
                          {count}
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {loadingPosts ? (
          <FlatList
            data={Array(5).fill(null)}
            keyExtractor={(_, i) => `skeleton-${i}`}
            renderItem={() => <PostSkeletonCard isDark={isDark} />}
            showsVerticalScrollIndicator={false}
          />
        ) : visiblePosts.length === 0 ? (
          <ThemedView
            className="flex-1 justify-center items-center"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6", paddingTop: 10 }}
          >
            <View style={{ marginBottom: 16 }}>
              {selectedPlatform !== "ALL" ? (
                (() => {
                  const config = platformIcons[selectedPlatform];
                  return (
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: isDark ? "#1e1e20" : "#ffffff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: isDark ? "#3f3f46" : "#e5e7eb" }}>
                      <config.Icon name={config.name} size={32} color={isDark ? "#4b5563" : "#9ca3af"} />
                    </View>
                  );
                })()
              ) : (
                <Ionicons name="documents-outline" size={64} color={isDark ? "#4b5563" : "#9ca3af"} />
              )}
            </View>

            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 6,
                color: isDark ? "#ffffff" : "#000000",
              }}
            >
              {selectedPlatform === "ALL"
                ? (searchQuery ? "No search results" : "No posts yet")
                : `No ${selectedPlatform.toLowerCase()} posts`}
            </ThemedText>

            <ThemedText
              style={{
                fontSize: 14,
                textAlign: "center",
                color: isDark ? "#9ca3af" : "#6b7280",
                paddingHorizontal: 24,
              }}
            >
              {selectedPlatform === "ALL"
                ? (searchQuery ? "Try a different search term." : "Tap create post to create your first post...")
                : `You haven't created any posts for ${selectedPlatform.toLowerCase()} yet.`}
            </ThemedText>
          </ThemedView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={visiblePosts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ThemedView className="mb-3 rounded-xl shadow" style={{ borderWidth: 1, borderColor: isDark ? "#ffffff" : "#e5e7eb" }}>
                {renderPostItem({ item })}
              </ThemedView>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListFooterComponent={
              filteredPosts.length > 5 ? (
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
      </View>
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
      <BoostCampaignPost
        visible={boostModalVisible}
        onClose={() => setBoostModalVisible(false)}
        post={boostPostData}
        campaignId={resolvedCampaignId || 0}
        isDark={isDark}
        onSuccess={fetchPosts}
      />

      <Modal
        visible={previewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setPreviewModalVisible(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          <View
            style={{
              height: "85%",
              backgroundColor: isDark ? "#18181b" : "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden"
            }}
          >
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#333" : "#eee"
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {previewPost && platformIcons[previewPost.type] && (
                  <>
                    {(() => {
                      const IconComp = platformIcons[previewPost.type].Icon;
                      return <IconComp name={platformIcons[previewPost.type].name} size={20} color={platformIcons[previewPost.type].color} />;
                    })()}
                    <ThemedText style={{ fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
                      {previewPost.type.charAt(0) + previewPost.type.slice(1).toLowerCase()} Preview
                    </ThemedText>
                  </>
                )}
                {!previewPost && <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>Post Preview</ThemedText>}
              </View>
              <TouchableOpacity onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 60 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {previewPost && (
                <View className="mb-8">
                  {!(
                    (previewPost.type === "INSTAGRAM" && (previewPost.mediaUrls?.length === 1 || previewPost.metadata?.mediaUrls?.length === 1)) ||
                    (previewPost.type === "YOUTUBE" && previewPost.metadata?.postType === "SHORT" && (previewPost.mediaUrls?.length === 1 || previewPost.metadata?.mediaUrls?.length === 1))
                  ) && (

                      <View className="p-4" style={{ paddingBottom: 0 }}>
                        {(previewPost.type === "FACEBOOK" || previewPost.type === "INSTAGRAM") && (
                          <View className="bg-blue-100/50 dark:bg-blue-900/40 p-3 rounded-xl flex-row items-center mb-4">
                            <Ionicons name="megaphone-outline" size={18} color="#3b82f6" />
                            <ThemedText className="ml-2 text-blue-800 dark:text-blue-200 font-semibold text-xs">
                              Posting to: {previewPost.metadata?.facebookPageName || previewPost.metadata?.facebookPage || "Connected Page"}
                            </ThemedText>
                          </View>
                        )}
                      </View>
                    )}

                  <View style={{
                    marginTop: (
                      (previewPost.type === "INSTAGRAM" && (previewPost.mediaUrls?.length === 1 || previewPost.metadata?.mediaUrls?.length === 1)) ||
                      (previewPost.type === "YOUTUBE" && previewPost.metadata?.postType === "SHORT" && (previewPost.mediaUrls?.length === 1 || previewPost.metadata?.mediaUrls?.length === 1))
                    ) ? 0 : -10
                  }}>


                    <Preview
                      platform={previewPost.type.toLowerCase()}
                      username="Campzeo User"
                      senderEmail={previewPost.senderEmail}
                      subject={previewPost.subject}
                      text={previewPost.message || ""}
                      status={getPostStatus(previewPost)}
                      contactName={(() => {
                        const firstContact = previewPost.contact || (typeof previewPost.contacts?.[0] === 'number' ? contacts.find(c => c.id === previewPost.contacts[0]) : previewPost.contacts?.[0]);
                        return firstContact?.name || firstContact?.contactName || previewPost.contactName || previewPost.metadata?.contactName;
                      })()}
                      contactEmail={(() => {
                        const firstContact = previewPost.contact || (typeof previewPost.contacts?.[0] === 'number' ? contacts.find(c => c.id === previewPost.contacts[0]) : previewPost.contacts?.[0]);
                        return firstContact?.email || firstContact?.contactEmail || previewPost.contactEmail || previewPost.metadata?.contactEmail;
                      })()}
                      contactPhone={(() => {
                        const firstContact = previewPost.contact || (typeof previewPost.contacts?.[0] === 'number' ? contacts.find(c => c.id === previewPost.contacts[0]) : previewPost.contacts?.[0]);
                        return firstContact?.mobile || firstContact?.whatsapp || firstContact?.contactMobile || firstContact?.contactWhatsApp || previewPost.contactMobile || previewPost.contactWhatsApp || previewPost.metadata?.contactMobile;
                      })()}
                      contactCompany={(() => {
                        const firstContact = previewPost.contact || (typeof previewPost.contacts?.[0] === 'number' ? contacts.find(c => c.id === previewPost.contacts[0]) : previewPost.contacts?.[0]);
                        return firstContact?.organisation?.name || firstContact?.company || previewPost.contactCompany || previewPost.metadata?.contactCompany;
                      })()}
                      media={(() => {
                        const allMedia = [
                          ...(previewPost.mediaUrls || []).map((url: string) => ({
                            uri: normalizeHelper(url),
                            type: url?.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg",
                            name: url?.split("/").pop() || "File",
                            size: undefined
                          })),
                          ...(previewPost.metadata?.mediaUrls || []).map((url: string) => ({
                            uri: normalizeHelper(url),
                            type: url?.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg",
                            name: url?.split("/").pop() || "File",
                            size: undefined
                          })),
                          ...(previewPost.attachments || []).map((a: any) => {
                            const uri = normalizeHelper(a.uploadedUrl || a.fileUrl || a.uri);
                            return {
                              uri,
                              type: a.mimeType || a.type || (uri?.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg"),
                              name: a.fileName || a.name || uri?.split("/").pop() || "File",
                              size: a.fileSize || a.size
                            };
                          }),
                          ...(previewPost.videoUrl ? [{
                            uri: normalizeHelper(previewPost.videoUrl),
                            type: "video/mp4",
                            name: "Video content",
                            size: undefined
                          }] : [])
                        ];

                        return allMedia.filter((item, index, self) =>
                          item.uri &&
                          self.findIndex(t => t.uri === item.uri) === index
                        );
                      })()}
                      timestamp="Just now"
                      youtubeContentType={previewPost.metadata?.postType}
                    />

                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );

  function normalizeHelper(url: string) {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("file:")) {
      // Google Drive check
      const dMatch = url.match(/\/d\/([^/?=]+)/);
      const idMatch = url.match(/[?&]id=([^?&]+)/);
      const id = dMatch ? dMatch[1] : (idMatch ? idMatch[1] : null);
      if (id) {
        return `https://storage.campzeo.com/api/upload/google-drive/view?id=${id}&file=media`;
      }
      return url;
    }
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace("/api/", "") || "https://campzeo.com";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }
}

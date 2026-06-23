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
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SectionList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
  Image,
  Text,
  RefreshControl,
} from "react-native";
import { ContactsRecord } from "../contacts/contactComponents/contactCard";
import CampaignCard, { Campaign } from "./campaignComponents/campaignCard";
import ShareCampaignPost from "./campaignComponents/shareCampaignPost";
import PostDetailsModal from "./campaignComponents/postDetailsModal";
import { getUser } from "@/api/dashboardApi";


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
  const [selectedDetailPost, setSelectedDetailPost] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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
        const token = await getToken();
        if (!token) throw new Error("Token missing");
        const user = await getUser();
        const orgId = user?.organisation?.id;
        const data = await getCampaignByIdApi(resolvedCampaignId,orgId, token);
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
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const res = await getPostsByCampaignIdApi(resolvedCampaignId, orgId);
      const apiPosts = res?.data ?? [];

      const normalizedPosts = apiPosts.map((p: any) => {
        let parsedMetadata = p.metadata;
        if (typeof p.metadata === "string" && p.metadata.trim().length > 0) {
          try {
            parsedMetadata = JSON.parse(p.metadata);
          } catch (e) {
            console.warn("Failed to parse metadata string for post:", p.id, e);
          }
        }
        return {
          ...p,
          id: p.id ?? p.postId,
          metadata: parsedMetadata,
        };
      });

      setPosts(normalizedPosts);
    } catch (error) {
      console.log("POSTS LOAD ERROR:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [resolvedCampaignId]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      if (resolvedCampaignId && token) {
        const user = await getUser();
        const orgId = user?.organisation?.id;
        await Promise.all([
          fetchPosts(),
          getCampaignByIdApi(resolvedCampaignId, orgId, token).then(data => {
            if (data) {
              setCampaign({
                id: Number(data.id ?? data._id ?? resolvedCampaignId),
                details: data.name ?? "Untitled Campaign",
                dates: `${(data.startDate || "").split("T")[0]} - ${(data.endDate || "").split("T")[0]}`,
                description: data.description ?? "",
                posts: data.posts ?? [],
                show: true,
              });
            }
          }).catch(() => {})
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [resolvedCampaignId, fetchPosts, getToken]);

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

  const postLength = posts.length;

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
  const getPostStatus = (item: any): "SENT" | "SCHEDULED" | "PENDING" | "FAILED" => {
    if (item.failureReason) return "FAILED";
    if (item.isPostSent === true) return "SENT";

    if (item.publishedDate) return "SENT";

    if (item.scheduledPostTime && !item.isPostSent) {
      const scheduled = new Date(item.scheduledPostTime);
      if (scheduled > new Date()) return "SCHEDULED";
    }

    return "PENDING";
  };

  // ========= POST ACTIONS =========
  const handleDeletePost = async (postId: number) => {
    const user = await getUser();
    const orgId = user?.organisation?.id;
    if (!resolvedCampaignId) return;

    Alert.alert("Delete Post?", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeletingPostId(postId);

            await deletePostForCampaignApi(orgId,resolvedCampaignId, postId);

            // ✅ Reload ALL posts after delete
            await fetchPosts();

            // optional: reset visible count
            setVisibleCount(5);
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to delete post. Please try again."
            });
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

  const fetchContactsForShare = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const user = await getUser();
      const orgId = user?.organisation?.id;
      const res = await getContactsApi(orgId);

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

  useFocusEffect(
    useCallback(() => {
      if (shareModalVisible) {
        fetchContactsForShare();
      }
    }, [shareModalVisible, fetchContactsForShare])
  );

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
    console.log("ppooosstt",post);
    
    if (!post) return;

    try {
      setPublishing(true);

      // 🔴 REQUIRED FOR PINTEREST
      if (post.type === "PINTEREST") {
        const boardId =
          post.metadata?.boardId || post.boardId || post.pinterestBoardId;
        const boardName =
          post.metadata?.boardName || post.boardName;

        if (!boardId && !boardName) {
          Toast.show({
            type: "error",
            text1: "Pinterest Board Required",
            text2: "Please select a board or create a new board before publishing."
          });
          setPublishing(false);
          return;
        }
        const user = await getUser();
        const orgId = user?.organisation?.id;
        const userId = user?.id;

        // Construct a clean, flat 22-field payload matching the ASP.NET DTO expectancy
        const postDataPayload: any = {
          id: post.id,
          campaignId: resolvedCampaignId,
          contentType: post.contentType || "POST",
          facebookPageAccessToken: post.facebookPageAccessToken || "",
          facebookPageId: post.facebookPageId || "",
          facebookPageName: post.facebookPageName || "",
          instagramBusinessId: post.instagramBusinessId || "",
          leadFormId: post.leadFormId || null,
          mediaUrls: post.mediaUrls || [],
          message: post.message || "",
          pinterestBoardId: boardId || "",
          pinterestLink: post.pinterestLink || post.metadata?.destinationLink || post.metadata?.link || "",
          scheduledPostTime: post.scheduledPostTime || new Date().toISOString(),
          senderEmail: post.senderEmail || null,
          subject: post.subject || "",
          thumbnailUrl: post.thumbnailUrl || null,
          type: post.type,
          youtubeContentType: post.youtubeContentType || "VIDEO",
          youtubePlaylistId: post.youtubePlaylistId || "",
          youtubePlaylistTitle: post.youtubePlaylistTitle || "",
          youtubePrivacy: post.youtubePrivacy || "public",
          youtubeTags: post.youtubeTags || [],
        };

        // ✅ UPDATE POST FIRST
        await updatePostForCampaignApi(
          resolvedCampaignId,
          currentSharePostId,
          orgId,
          userId,
          postDataPayload
        );
      }

      // ✅ CONTACT VALIDATION
      let contactsToSend: number[] = [];
      if (["SMS", "EMAIL", "WHATSAPP"].includes(post.type)) {
        if (selectedContacts.length === 0) {
          Toast.show({
            type: "error",
            text1: "Select Contacts",
            text2: "Please select at least one contact."
          });
          setPublishing(false);
          return;
        }
        contactsToSend = selectedContacts;
      }
      const user = await getUser();
      const orgId = user?.organisation?.id;
      // ✅ NOW SHARE
      await shareCampaignPostApi(
        orgId,
        resolvedCampaignId,
        currentSharePostId,
        contactsToSend
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Post sending has been queued in the background"
      });

      setShareModalVisible(false);
      setSelectedContacts([]);
      await fetchPosts();

    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to send post"
      });
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

    // Gather all media
    const allMedia: string[] = [];
    if (item.mediaUrls && Array.isArray(item.mediaUrls)) {
      item.mediaUrls.forEach((u: string) => {
        if (u && typeof u === "string" && !allMedia.includes(u)) {
          allMedia.push(u);
        }
      });
    }
    if (item.videoUrl && typeof item.videoUrl === "string" && !allMedia.includes(item.videoUrl)) {
      allMedia.push(item.videoUrl);
    }
    
    const firstMedia = allMedia[0];
    const isVideo = firstMedia && (firstMedia.toLowerCase().split("?")[0].match(/\.(mp4|mov|webm|avi|mkv|3gp|m4v)$/i) || firstMedia.includes("video"));

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedDetailPost(item);
          setDetailModalVisible(true);
        }}
        activeOpacity={0.8}
        style={{
          padding: 16,
          borderRadius: 16,
          marginBottom: 12,
          backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
          borderWidth: 1,
          borderColor: isDark ? "#2c2c2e" : "#e5e7eb",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* PLATFORM HEADER ROW */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {platform ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : platform.color + "10",
              }}
            >
              <platform.Icon
                name={platform.name}
                size={16}
                color={platform.color}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: platform.color,
                  letterSpacing: 0.3,
                }}
              >
                {item.type}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280" }}>{item.type}</Text>
          )}

          {/* QUICK ACTIONS ROW */}
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (!canShare) return;
                handleOpenShareModal(item.id);
              }}
              disabled={!canShare}
              activeOpacity={0.6}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                opacity: !canShare ? 0.3 : 1,
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={isDark ? "#73a6f9" : "#3b82f6"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (!canEdit) return;
                handleEditPost(campaign!.id, item);
              }}
              disabled={!canEdit}
              activeOpacity={0.6}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                opacity: !canEdit ? 0.3 : 1,
              }}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={isDark ? "#73f3c9" : "#10b981"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                if (!canDelete) return;
                handleDeletePost(item.id);
              }}
              disabled={!canDelete || deletingPostId === item.id}
              activeOpacity={0.6}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6",
                opacity: !canDelete ? 0.3 : 1,
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
                  size={16}
                  color={isDark ? "#f47a7a" : "#ef4444"}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CONTENT ROW */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            {item.subject ? (
              <ThemedText
                style={{ fontSize: 16, fontWeight: "700", color: isDark ? "#ffffff" : "#1f2937" }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.subject}
              </ThemedText>
            ) : item.type === "SMS" ? null : (
              <ThemedText style={{ fontSize: 14, fontStyle: "italic", color: "#9ca3af" }}>
                No subject available
              </ThemedText>
            )}

            {item.message ? (
              <ThemedText
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: isDark ? "#9ca3af" : "#4b5563",
                }}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item.message}
              </ThemedText>
            ) : (
              <ThemedText style={{ fontSize: 13, fontStyle: "italic", color: "#9ca3af" }}>
                No description available
              </ThemedText>
            )}
          </View>

          {/* Right-aligned Media Thumbnail */}
          {firstMedia && (
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 10,
                overflow: "hidden",
                backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
                position: "relative",
              }}
            >
              {isVideo ? (
                <View style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
                  <Ionicons name="play-circle" size={28} color="#fff" />
                </View>
              ) : (
                <Image
                  source={{ uri: firstMedia }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              )}

              {/* Media count indicator */}
              {allMedia.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 2,
                    right: 2,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                    +{allMedia.length - 1}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* BOTTOM METADATA & STATUS ROW */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: isDark ? "#2c2c2e" : "#f3f4f6", paddingTop: 10 }}>
          {/* SCHEDULE */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={{ fontSize: 11, color: "#9ca3af" }}>
              {item.scheduledPostTime || item.publishedDate || item.createdAt
                ? new Date(item.scheduledPostTime || item.publishedDate || item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "No schedule available"}
            </Text>
          </View>

          {/* STATUS PILL */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 20,
              backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb",
              borderWidth: 1,
              borderColor: isDark ? "#2c2c2e" : "#f3f4f6",
            }}
          >
            <Ionicons
              name={
                status === "SENT"
                  ? "paper-plane"
                  : status === "SCHEDULED"
                  ? "alarm-outline"
                  : status === "FAILED"
                  ? "alert-circle"
                  : "hourglass-outline"
              }
              size={12}
              color={
                status === "SENT"
                  ? "#22c55e"
                  : status === "SCHEDULED"
                  ? "#3b82f6"
                  : status === "FAILED"
                  ? "#ef4444"
                  : "#fbbf24"
              }
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: isDark ? "#e5e7eb" : "#4b5563",
              }}
            >
              {status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // const visiblePosts = posts.slice(0, visibleCount);
  // const isAllVisible = visibleCount >= posts.length;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ThemedView className="flex-1 p-4" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
      <SectionList
        sections={[
          { title: "Posts", data: loadingPosts ? Array(5).fill(null) : posts.length === 0 ? [] : visiblePosts }
        ]}
        keyExtractor={loadingPosts ? (_: any, i: number) => `skeleton-${i}` : (item: any, index: number) => item?.id ? String(item.id) : `idx-${index}`}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? "#ffffff" : "#dc2626"} />
        }
        ListHeaderComponent={
          <>
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
              <View style={{ marginBottom: 16 }}>
                <CampaignCard
                  postLength={postLength}
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
                      Toast.show({
                        type: "info",
                        text1: "Campaign Completed",
                        text2: "You cannot create posts for a completed campaign."
                      });
                      return;
                    }
                    campaign?.id && handleCreatePost(campaign.id);
                  }}
                />
              </View>
            )}
          </>
        }
        renderSectionHeader={() => (
          <ThemedView
            className="flex-row items-center justify-between mb-3"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6", paddingTop: 8, paddingBottom: 8 }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#000000",
              }}
            >
              Created Posts
            </ThemedText>

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
                width: "65%",
              }}
            >
              <Ionicons name="search-outline" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
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
        )}
        renderItem={loadingPosts ? () => <PostSkeletonCard isDark={isDark} /> : ({ item }: { item: any }) => renderPostItem({ item })}
        ListFooterComponent={
          <>
            {!loadingPosts && posts.length === 0 && (
              <ThemedView
                className="justify-center items-center py-10"
                style={{ backgroundColor: "transparent" }}
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
            )}
            {!loadingPosts && posts.length > 5 && (
              <TouchableOpacity
                onPress={isAllVisible ? () => setVisibleCount(5) : () => setVisibleCount((v) => v + 5)}
                className={`py-3 my-2 rounded-xl items-center ${isAllVisible ? isDark ? "bg-red-900/30" : "bg-red-100" : isDark ? "bg-blue-900/30" : "bg-blue-100"}`}
              >
                <ThemedText className={`font-semibold ${isAllVisible ? isDark ? "text-red-300" : "text-red-700" : isDark ? "text-blue-300" : "text-blue-700"}`}>
                  {isAllVisible ? "Show Less" : "Load More"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        }
      />
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
      <PostDetailsModal
        visible={detailModalVisible}
        post={selectedDetailPost}
        onClose={() => setDetailModalVisible(false)}
        onShare={(postId) => {
          setDetailModalVisible(false);
          handleOpenShareModal(postId);
        }}
        onEdit={(postId) => {
          setDetailModalVisible(false);
          const p = posts.find((item) => item.id === postId);
          if (p) handleEditPost(campaign!.id, p);
        }}
        onDelete={(postId) => {
          setDetailModalVisible(false);
          handleDeletePost(postId);
        }}
      />
    </ThemedView>
  );
}

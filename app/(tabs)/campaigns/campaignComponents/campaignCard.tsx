import { deleteCampaignApi } from "@/api/campaignApi";
import { getUser } from "@/api/dashboardApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getToken } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Alert, Text, TouchableOpacity, useColorScheme, View } from "react-native";

// Define Campaign type
export interface Campaign {
  id: number;
  details: string;
  description: string;
  startDate?: string;
  endDate?: string;
  dates: string;
  posts: string[];
  show?: boolean;
  contactCount?: number;
  postsCount?: number;
}

interface CampaignCardProps {
  postLength?: number;
  campaign: Campaign;
  postsCount?: number;
  onDelete: (c: Campaign) => void;
  onCopy: (c: Campaign) => void;
  onToggleShow: (c: Campaign) => void;
  showActions?: boolean;
  showPostButton?: boolean;
  alwaysExpanded?: boolean;
  hidePostsHeading?: boolean;
  statusPosition?: "top" | "middle" | "both" | "none";
  highlightBorder?: boolean;
  createPostButton?: boolean;
  onPressPost?: () => void;
  onEdit?: (campaign: Campaign) => void;
}

export default function CampaignCard({
  postLength,
  campaign,
  onDelete,
  onCopy,
  onToggleShow,
  showActions = true,
  showPostButton = true,
  alwaysExpanded = false,
  hidePostsHeading = false,
  statusPosition,
  highlightBorder = false,
  createPostButton = false,
  onPressPost,
  postsCount = 0,
  onEdit,
}: CampaignCardProps) {

  /* ---------------- STATUS LOGIC (FIXED) ---------------- */
  type CampaignStatus = "Scheduled" | "Active" | "Completed";

  const getStatus = (): CampaignStatus => {
    if (!campaign.startDate || !campaign.endDate) return "Scheduled";

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

  const status = getStatus();

  // ✅ FIXED POST COUNT LOGIC
  const totalPosts =
    postLength ?? campaign.postsCount ?? 0;

  const handleEdit = () => {
    // if (onEdit) {
    // onEdit(campaign); 
    console.log(campaign.id);
    router.push({
      pathname: "/campaigns/createCampaign",
      params: { Id: campaign.id },
    });
    // } else {
    //   router.push({
    //     pathname: "/campaigns/createCampaign",
    //     params: { Id: campaign.id },
    //   });
    // }
  };

  const handleDelete = async (cId: number) => {
    Alert.alert("Delete Campaign?", `Are you sure you want to delete this campaign?`, [
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
            await deleteCampaignApi(cId, orgId);
            // setCampaigns((prev) => prev.filter((x) => x.id !== c.id));
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
  const handleAddPost = () => {
    if (onPressPost) {
      onPressPost();
    } else {
      router.push({
        pathname: "/campaigns/campaignsDetails",
        params: {
          campaign: JSON.stringify(campaign),
          campaignStartDate: campaign.startDate,
        },
      });
    }
  };

  const isExpanded = alwaysExpanded || campaign.show;

  const statusStyles: Record<
    string,
    {
      bg: string;
      text: string;
      darkBg: string;
      darkText: string;
      border: string;
      darkBorder: string;
    }
  > = {
    Completed: {
      bg: "bg-green-100",
      text: "text-green-700",
      darkBg: "bg-green-900/30",
      darkText: "text-green-300",
      border: "border-green-300",
      darkBorder: "border-green-500",
    },
    Active: {
      bg: "bg-red-100",
      text: "text-red-700",
      darkBg: "bg-red-900/30",
      darkText: "text-red-300",
      border: "border-red-300",
      darkBorder: "border-red-500",
    },
    Scheduled: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      darkBg: "bg-yellow-900/30",
      darkText: "text-yellow-300",
      border: "border-yellow-300",
      darkBorder: "border-yellow-500",
    },
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const borderColorMap: Record<string, string> = {
    "green-300": "#86efac",
    "green-500": "#22c55e",
    "red-300": "#fca5a5",
    "red-500": "#ef4444",
    "yellow-300": "#fde047",
    "yellow-500": "#eab308",
  };

  const borderColorStyle =
    borderColorMap[
    (isDark
      ? statusStyles[status].darkBorder
      : statusStyles[status].border
    ).replace("border-", "")
    ];

  const StatusBadge = () => (
    <View
      className={`px-2.5 py-1 rounded-full border ${isDark
        ? `${statusStyles[status].darkBg} ${statusStyles[status].darkBorder}`
        : `${statusStyles[status].bg} ${statusStyles[status].border}`
        }`}
    >
      <Text
        className={`text-[12px] font-semibold ${isDark ? statusStyles[status].darkText : statusStyles[status].text
          }`}
      >
        {status}
      </Text>
    </View>
  );

  const finalBorderColor = campaign.show
    ? isDark
      ? "#ffffff"
      : "#e5e7eb"
    : borderColorStyle; // 👈 status-based color when hidden

  if (alwaysExpanded) {
    return (
      <View
        style={{
          borderRadius: 20,
          padding: 20,
          backgroundColor: isDark ? "#1e1e20" : "#ffffff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 4,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: isDark ? "#2c2c2e" : "#e5e7eb",
        }}
      >
        {/* Top Header Row with Status */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: isDark ? "#ffffff" : "#111827", flex: 1, marginRight: 10 }} numberOfLines={1}>
            {campaign.details ?? "Untitled Campaign"}
          </Text>
          <StatusBadge />
        </View>

        {/* Description Section */}
        {campaign.description ? (
          <Text style={{ fontSize: 14, color: isDark ? "#a1a1aa" : "#4b5563", lineHeight: 20, marginBottom: 16 }}>
            {campaign.description}
          </Text>
        ) : null}

        {/* Grid Stats Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: isDark ? "#262629" : "#f8fafc", padding: 16, borderRadius: 16, borderStyle: "solid", borderWidth: 1, borderColor: isDark ? "#2c2c2e" : "#f1f5f9", marginBottom: 16 }}>
          <View style={{ flex: 1.2, alignItems: "center" }}>
            <Ionicons name="calendar-outline" size={18} color="#ef4444" style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: "700", marginBottom: 2, letterSpacing: 0.5 }}>DURATION</Text>
            <Text style={{ fontSize: 11, fontWeight: "700", color: isDark ? "#e5e7eb" : "#1f2937", textAlign: "center" }}>
              {campaign.dates}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: isDark ? "#2c2c2e" : "#e5e7eb", marginHorizontal: 8 }} />
          <View style={{ flex: 0.9, alignItems: "center" }}>
            <Ionicons name="people-outline" size={18} color="#3b82f6" style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: "700", marginBottom: 2, letterSpacing: 0.5 }}>CONTACTS</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: isDark ? "#e5e7eb" : "#1f2937" }}>
              {campaign.contactCount ?? 0}
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: isDark ? "#2c2c2e" : "#e5e7eb", marginHorizontal: 8 }} />
          <View style={{ flex: 0.9, alignItems: "center" }}>
            <Ionicons name="albums-outline" size={18} color="#10b981" style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: "700", marginBottom: 2, letterSpacing: 0.5 }}>POSTS</Text>
            <Text style={{ fontSize: 14, fontWeight: "800", color: isDark ? "#e5e7eb" : "#1f2937" }}>
              {totalPosts}
            </Text>
          </View>
        </View>

        {/* Action Button Row */}
        {showPostButton && createPostButton && (
          <TouchableOpacity
            onPress={handleAddPost}
            activeOpacity={0.85}
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: "#2563eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              shadowColor: "#2563eb",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="add-circle" size={20} color="#ffffff" />
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 15 }}>
              Create Campaign Post
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2a2a32" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",

    actionEditBg: isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    actionEditBorder: isDark ? "rgba(16,185,129,0.25)" : "#d1fae5",
    actionEditIcon: "#10b981",

    actionDeleteBg: isDark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    actionDeleteBorder: isDark ? "rgba(239,68,68,0.25)" : "#fee2e2",
    actionDeleteIcon: "#ef4444",

    actionCopyBg: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    actionCopyBorder: isDark ? "rgba(59,130,246,0.25)" : "#dbeafe",
    actionCopyIcon: "#3b82f6",

    actionShowBg: isDark ? "rgba(156,163,175,0.12)" : "#f3f4f6",
    actionShowBorder: isDark ? "rgba(156,163,175,0.25)" : "#e5e7eb",
    actionShowIcon: isDark ? "#9ca3af" : "#4b5563",
  };

  return (
    <ThemedView
      style={{
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: COLORS.cardBg,
        borderWidth: 1,
        borderColor: highlightBorder ? borderColorStyle : COLORS.cardBorder,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.2 : 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Title + Actions */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: COLORS.textPrimary,
            }}
            numberOfLines={1}
          >
            {campaign.details ?? "Untitled Campaign"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {statusPosition === "top" && (
            <View style={{ marginRight: 8 }}>
              <StatusBadge />
            </View>
          )}

          {showActions && (
            <View style={{ flexDirection: "row", gap: 6 }}>
              {/* Edit Badge */}
              <TouchableOpacity
                onPress={handleEdit}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.actionEditBg,
                  borderWidth: 1,
                  borderColor: COLORS.actionEditBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.actionEditIcon} />
              </TouchableOpacity>

              {/* Delete Badge */}
              <TouchableOpacity
                onPress={() => onDelete(campaign)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.actionDeleteBg,
                  borderWidth: 1,
                  borderColor: COLORS.actionDeleteBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.actionDeleteIcon} />
              </TouchableOpacity>

              {/* Copy Badge */}
              <TouchableOpacity
                onPress={() => onCopy(campaign)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.actionCopyBg,
                  borderWidth: 1,
                  borderColor: COLORS.actionCopyBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="copy-outline" size={16} color={COLORS.actionCopyIcon} />
              </TouchableOpacity>

              {/* Toggle Show Badge */}
              <TouchableOpacity
                onPress={() => onToggleShow(campaign)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: COLORS.actionShowBg,
                  borderWidth: 1,
                  borderColor: COLORS.actionShowBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={campaign.show ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.actionShowIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {isExpanded && (
        <View style={{ marginTop: 4 }}>
          {/* Description */}
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: COLORS.textSecondary,
              marginBottom: 4,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Description
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#d1d5db" : "#475569",
              lineHeight: 20,
              marginBottom: 16,
            }}
          >
            {campaign.description ?? "No description available"}
          </Text>

          {/* Duration section */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Duration
            </Text>
            {statusPosition === "middle" && <StatusBadge />}
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: COLORS.textPrimary,
              marginBottom: 16,
            }}
          >
            {campaign.dates}
          </Text>

          {/* Stats Bar and Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: COLORS.cardBorder,
            }}
          >
            <View style={{ flexDirection: "row", gap: 16 }}>
              {/* Contacts Stat */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
                <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "700", color: COLORS.textPrimary }}>
                  {campaign.contactCount ?? 0}
                  <Text style={{ fontWeight: "500", color: COLORS.textSecondary }}> Contacts</Text>
                </Text>
              </View>

              {/* Posts Stat */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="albums-outline" size={16} color={COLORS.textSecondary} />
                <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: "700", color: COLORS.textPrimary }}>
                  {totalPosts}
                  <Text style={{ fontWeight: "500", color: COLORS.textSecondary }}> Posts</Text>
                </Text>
              </View>
            </View>

            {/* Post Buttons */}
            {showPostButton && !createPostButton && (
              <TouchableOpacity
                onPress={handleAddPost}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 99,
                  backgroundColor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(59,130,246,0.25)" : "#dbeafe",
                }}
              >
                <Ionicons name="add-circle-outline" size={14} color="#3b82f6" />
                <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "700", color: "#3b82f6" }}>
                  Post
                </Text>
              </TouchableOpacity>
            )}

            {createPostButton && showPostButton && (
              <TouchableOpacity
                onPress={handleAddPost}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 99,
                  backgroundColor: "#DC2626",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 13 }}>
                  Create Post
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ThemedView>
  );
}

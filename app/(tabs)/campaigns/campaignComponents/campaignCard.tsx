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
   postLength;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(campaign);      
    } else {
      router.push({
        pathname: "/campaigns/createCampaign",
        params: { campaign: JSON.stringify(campaign) },
      });
      // console.log("kempains",campaign);
    }
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

  return (
    // <ThemedView
    //   className="p-4 rounded-xl mb-4"
    //   style={{
    //     backgroundColor: isDark ? "#161618" : "#fff",
    //     borderWidth: 2,
    //     borderColor: highlightBorder ? borderColorStyle : isDark ? "#ffffff" : "#e5e7eb",
    //   }}
    // >
    <ThemedView
      className="p-4 rounded-xl mb-4"
      style={{
        backgroundColor: isDark ? "#161618" : "#ffffff", // unchanged
        borderWidth: 2,
        borderColor: highlightBorder
          ? borderColorStyle
          : finalBorderColor,
      }}
    >
      {/* Title + Actions */}
      <ThemedView className="flex-row mb-2 items-start">
        <ThemedView className="flex-1 pr-10">
          <ThemedText className="font-bold text-lg" numberOfLines={1}>
            {campaign.details ?? "Untitled Campaign"}
          </ThemedText>
        </ThemedView>

        <ThemedView className="flex-row items-start w-24 justify-end">
          {(statusPosition === "top") && (
            <StatusBadge />
          )}
          {showActions && (
            <ThemedView className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="mx-1">
                <Ionicons name="create-outline" size={22} style={{ color: isDark ? "#73f3c9" : "#10b981" }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleDelete(campaign.id)} className="mx-1">
                <Ionicons name="trash-outline" size={22} style={{ color: isDark ? "#f47a7a" : "#ef4444" }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onCopy(campaign)} className="mx-1">
                <Ionicons name="copy-outline" size={22} style={{ color: isDark ? "#73a6f9" : "#3b82f6" }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onToggleShow(campaign)} className="mx-1">
                <Ionicons
                  name={campaign.show ? "eye-off-outline" : "eye-outline"} size={22} style={{ color: isDark ? "#b4b8c0" : "6b7280" }} />
              </TouchableOpacity>
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

      {isExpanded && (
        <ThemedView>
          <ThemedText className="font-bold text-gray-900 mb-1">Description</ThemedText>
          <Text className={`mb-3 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
            {campaign.description ?? "No description available"}
          </Text>

          <ThemedView className="mb-3">
            {/* Duration + Status */}
            <ThemedView className="flex-row justify-between items-center mb-2">
              <ThemedText className="font-bold text-gray-900">Duration</ThemedText>
              {(statusPosition === "middle") && (
                <StatusBadge />
              )}

            </ThemedView>

            <Text className={`mb-3 ${isDark ? "text-gray-200" : "text-gray-700"}`}>{campaign.dates}</Text>

            <ThemedView className="flex-row justify-between items-center">
              <ThemedView className="flex-row items-center">
                <Ionicons name="people-outline" size={18} color={isDark ? "#ffffff" : "#4b5563"} />
                <Text className={`ml-1.5 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {campaign.contactCount ?? 0} Contacts
                </Text>
              </ThemedView>

              <ThemedView className="flex-row items-center">
                <Ionicons name="albums-outline" size={18} color={isDark ? "#ffffff" : "#4b5563"} />
                <Text className={`ml-1.5 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {totalPosts} Posts
                </Text>
              </ThemedView>

              {showPostButton && !createPostButton && (
                <TouchableOpacity
                  onPress={handleAddPost}
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(59,130,246,0.18)",
                    borderWidth: 1,
                    borderColor: isDark ? "#ffffff" : "transparent",
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={isDark ? "#ffffff" : "#3b82f6"}
                  />

                  <Text
                    className="ml-1.5 text-[12px] font-semibold"
                    style={{ color: isDark ? "#e5e7eb" : "#3b82f6" }}
                  >
                    Post
                  </Text>
                </TouchableOpacity>
              )}

              {createPostButton && showPostButton && (
                <TouchableOpacity
                  onPress={handleAddPost}
                  className="px-4 py-2 rounded-full bg-blue-100 items-center justify-center"
                  style={{ minWidth: 100 }}
                >
                  <Text className="text-blue-500 font-semibold text-sm text-center">
                    Create Post
                  </Text>
                </TouchableOpacity>
              )}
            </ThemedView>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}

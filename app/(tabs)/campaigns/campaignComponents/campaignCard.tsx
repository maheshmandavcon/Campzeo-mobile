import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Define Campaign type
export interface Campaign {
  id: number;
  details: string;
  dates: string; 
  description: string;
  posts: string[];
  show?: boolean;
  contactsCount?: number;
  contacts?: any[];
  postsCount?: number; 
}

interface CampaignCardProps {
  campaign: Campaign;
  postsCount?: number;
  onDelete: (c: Campaign) => void;
  onCopy: (c: Campaign) => void;
  onToggleShow: (c: Campaign) => void;
  showActions?: boolean;
  showPostButton?: boolean;
  alwaysExpanded?: boolean;
  hidePostsHeading?: boolean;
  postButtonTopRight?: boolean;
  onPressPost?: () => void;
  onEdit?: (campaign: Campaign) => void;
}

export default function CampaignCard({
  campaign,
  onDelete,
  onCopy,
  onToggleShow,
  showActions = true,
  showPostButton = true,
  alwaysExpanded = false,
  hidePostsHeading = false,
  postButtonTopRight = false,
  onPressPost,
  postsCount = 0,
  onEdit,
}: CampaignCardProps) {

  /* ---------------- STATUS LOGIC (FIXED) ---------------- */
  const getStatus = () => {
    if (!campaign.dates) return "Scheduled";

    const [startStr, endStr] = campaign.dates.split(" - ").map(s => s.trim());
    if (!startStr) return "Scheduled";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(startStr);
    startDate.setHours(0, 0, 0, 0);

    const endDate = endStr ? new Date(endStr) : startDate;
    endDate.setHours(23, 59, 59, 999);

    if (today < startDate) return "Scheduled";
    if (today > endDate) return "Completed";
    return "Active";
  };

  const status = getStatus();

  // ✅ FIXED POST COUNT LOGIC
  const totalPosts =
    campaign.postsCount ??
    postsCount ??
    campaign.posts?.length ??
    0;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(campaign);
    } else {
      router.push({
        pathname: "/campaigns/createCampaign",
        params: { campaign: JSON.stringify(campaign) },
      });
    }
  };

  const handleAddPost = () => {
    if (onPressPost) {
      onPressPost();
    } else {
      router.push({
        pathname: "/campaigns/campaignsDetails",
        params: { campaign: JSON.stringify(campaign) },
      });
    }
  };

  const isExpanded = alwaysExpanded || campaign.show;

  const statusStyles: Record<string, { bg: string; text: string }> = {
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Active: { bg: "bg-red-100", text: "text-red-700" },
    Scheduled: { bg: "bg-yellow-100", text: "text-yellow-700" },
  };

  return (
    <View className="bg-gray-200 p-4 rounded-xl mb-4 shadow">
      {/* Title + Actions */}
      <View className="flex-row mb-2 items-start">
        <View className="flex-1 pr-10">
          <Text className="font-bold text-lg" numberOfLines={1}>
            {campaign.details ?? "Untitled Campaign"}
          </Text>
        </View>

        <View className="flex-row items-start w-24 justify-end">
          {postButtonTopRight && showPostButton && (
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

          {showActions && (
            <View className="flex-row">
              <TouchableOpacity onPress={handleEdit} className="mx-1">
                <Ionicons name="create-outline" size={22} color="#10b981" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onDelete(campaign)} className="mx-1">
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onCopy(campaign)} className="mx-1">
                <Ionicons name="copy-outline" size={22} color="#3b82f6" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onToggleShow(campaign)} className="mx-1">
                <Ionicons
                  name={campaign.show ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {isExpanded && (
        <View>
          <Text className="font-bold text-gray-900 mb-1">Description</Text>
          <Text className="text-gray-700 mb-3">
            {campaign.description ?? "No description available"}
          </Text>

          <View className="mb-3">
            {/* Duration + Status */}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-gray-900">Duration</Text>
              <View className={`px-2.5 py-1 rounded-full ${statusStyles[status].bg}`}>
                <Text className={`text-[12px] font-semibold ${statusStyles[status].text}`}>
                  {status}
                </Text>
              </View>
            </View>

            <Text className="text-gray-700">{campaign.dates}</Text>

            <View className="flex-row justify-between items-center mt-3">
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={18} color="#4b5563" />
                <Text className="ml-1.5 text-gray-700">
                  {campaign.contactsCount ?? 0} Contacts
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="albums-outline" size={18} color="#4b5563" />
                <Text className="ml-1.5 text-gray-700">
                  {totalPosts} Posts
                </Text>
              </View>

              {showPostButton && !postButtonTopRight && (
                <TouchableOpacity
                  onPress={handleAddPost}
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(59,130,246,0.18)" }}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#3b82f6" />
                  <Text className="ml-1.5 text-[12px] text-blue-500 font-semibold">
                    Post
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

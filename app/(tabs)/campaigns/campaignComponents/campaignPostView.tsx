import React from "react";
import { View, Text } from "react-native";

interface CampaignPostViewProps {
  post?: {
    subject: string;
    message: string;
    postDate: string;
    platform: string;
    description?: string; 
  } | null;
}

export default function CampaignPostView({ post }: CampaignPostViewProps) {
  // If no post data → show empty message
  if (!post) {
    return (
      <View className="bg-white p-4 rounded-lg shadow mt-4">
        <Text className="text-center text-gray-500 font-medium">
          No record found 
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white p-4 rounded-lg shadow mt-4">

      {/* Heading */}
      <Text className="text-xl font-bold mb-4 text-black">
        Campaign Post Details
      </Text>

      {/* Description */}
      {post.description && (
        <View className="mb-3">
          <Text className="text-gray-600 font-semibold">Description</Text>
          <Text className="text-gray-900">{post.description}</Text>
        </View>
      )}

      {/* Subject */}
      <View className="mb-3">
        <Text className="text-gray-600 font-semibold">Subject</Text>
        <Text className="text-gray-900">{post.subject}</Text>
      </View>

      {/* Message / Post */}
      <View className="mb-3">
        <Text className="text-gray-600 font-semibold">Post / Message</Text>
        <Text className="text-gray-900">{post.message}</Text>
      </View>

      {/* Schedule Time */}
      <View className="mb-3">
        <Text className="text-gray-600 font-semibold">Schedule Time</Text>
        <Text className="text-gray-900">{post.postDate}</Text>
      </View>

      {/* Platform */}
      <View className="mb-3">
        <Text className="text-gray-600 font-semibold">Type</Text>
        <Text className="text-gray-900">{post.platform}</Text>
      </View>

      {/* Action - Read only */}
      <View className="mb-2">
        <Text className="text-gray-600 font-semibold">Action</Text>
        {/* <Text className="text-gray-500">Read-only view</Text> */}
      </View>

    </View>
  );
}

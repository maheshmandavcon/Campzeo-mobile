import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  ScrollView,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
} from "react-native";
import { View, Text } from "@gluestack-ui/themed";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import CampaignPostForm from "./campaignPostForm";
import { useRoute } from "@react-navigation/native";
import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

export default function CampaignPost() {
  const [selected, setSelected] = useState<string | null>(null);
  const [existingPost, setExistingPost] = useState<any>(null);

  const route = useRoute();
  const { campaignId, postId, type } = route.params as {
    campaignId: string;
    postId?: string;
    type?: string;
  };

  const { getToken } = useAuth();

  // ---------- FETCH EXISTING POST IF postId EXISTS ----------
  useEffect(() => {
    if (!campaignId || !postId) return;

    let isMounted = true;

    const fetchPostDetails = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const url = `https://campzeo-v1-oym2.vercel.app/api/campaigns/${campaignId}/posts/${postId}`;
        console.log("Fetching post details from:", url);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        console.log("Post details API response:", data);

        if (isMounted && data?.post) {
          setExistingPost(data.post);
          setSelected((prev) => prev || data.post.type);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching post details:", error.message);
        } else {
          console.error("Unexpected error:", error);
        }
      }
    };

    fetchPostDetails();

    return () => { isMounted = false };
  }, [campaignId, postId]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ---------- SOCIAL MEDIA ICONS ----------
  const icons = [
    { name: "mail", label: "EMAIL", library: Ionicons, color: "#f59e0b" },
    { name: "chatbubble-ellipses-outline", label: "SMS", library: Ionicons, color: "#10b981" },
    { name: "instagram", label: "INSTAGRAM", library: FontAwesome, color: "#c13584" },
    { name: "logo-whatsapp", label: "WHATSAPP", library: Ionicons, color: "#25D366" },
    { name: "facebook-square", label: "FACEBOOK", library: FontAwesome, color: "#1877F2" },
    { name: "youtube-play", label: "YOUTUBE", library: FontAwesome, color: "#FF0000" },
    { name: "linkedin-square", label: "LINKEDIN", library: FontAwesome, color: "#0A66C2" },
    { name: "pinterest", label: "PINTEREST", library: FontAwesome, color: "#E60023" },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        className="flex-1 p-4"
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 12,
            color: isDark ? "#fff" : "#000",
          }}
        >
          {postId ? "Edit Campaign Post" : "Create Campaign Post"}
        </ThemedText>

        {/* ---------- ICON SECTION ---------- */}
        <ThemedView className="flex-row flex-wrap justify-between mb-4"
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
          {icons.map((icon, index) => {
            const IconComponent = icon.library;
            const isSelected = selected === icon.label;

            return (
              <ThemedView key={index} className="w-1/4 mb-6 items-center"
              style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
                <RNView
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: icon.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isSelected ? 0.5 : 0,
                    shadowRadius: isSelected ? 12 : 0,
                    elevation: isSelected ? 12 : 0,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setSelected(icon.label)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: isSelected ? icon.color : "#d1d5db",
                      backgroundColor: isDark ? "#161618" : "#ffffff",
                    }}
                  >
                    <IconComponent
                      name={icon.name as any}
                      size={28}
                      color={isDark ? "#ffffff" : icon.color}
                    />
                  </TouchableOpacity>
                </RNView>

                <ThemedText
                  style={{
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {icon.label}
                </ThemedText>
              </ThemedView>
            );
          })}
        </ThemedView>

        {/* ---------- FORM ---------- */}
        {selected && (
          <ThemedView style={{ marginTop: 0, marginBottom: 5 }}>
            <CampaignPostForm
              key={selected} // ✅ this forces remount on platform change
              platform={selected}
              campaignId={campaignId.toString()}
              existingPost={existingPost}
              onClose={() => {
                setSelected(null);
                setExistingPost(null);
              }}
            />
          </ThemedView>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

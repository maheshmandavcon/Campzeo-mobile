import React, { useState, useEffect } from "react";
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
  Modal,
  ActivityIndicator,
  FlatList,
  Text,
} from "react-native";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadMediaApi, generateAIContentApi, generateAIImageApi } from "@/api/campaignApi";
import { getUser } from "@/api/dashboardApi";
import Video from "react-native-video";
import { createTemplateApi, updateTemplateApi } from "@/api/templetsApi";


// ─── Constants ─────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

// ─── Types ──────────────────────────────────────────────────────────────────

type PlatformType =
  | "EMAIL"
  | "SMS"
  | "FACEBOOK"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "YOUTUBE"
  | "WHATSAPP"
  | "PINTEREST";

// ─── Platform config ─────────────────────────────────────────────────────────

const PLATFORMS: {
  value: PlatformType;
  label: string;
  icon: string;
  iconLib: "ionicons" | "fontawesome";
  color: string;
}[] = [
    { value: "EMAIL", label: "Email", icon: "mail", iconLib: "ionicons", color: "#f59e0b" },
    { value: "FACEBOOK", label: "Facebook", icon: "facebook-square", iconLib: "fontawesome", color: "#1877F2" },
    { value: "INSTAGRAM", label: "Instagram", icon: "instagram", iconLib: "fontawesome", color: "#c13584" },
    { value: "LINKEDIN", label: "LinkedIn", icon: "linkedin-square", iconLib: "fontawesome", color: "#0A66C2" },
    { value: "YOUTUBE", label: "YouTube", icon: "youtube-play", iconLib: "fontawesome", color: "#FF0000" },
    { value: "PINTEREST", label: "Pinterest", icon: "pinterest", iconLib: "fontawesome", color: "#E60023" },
    { value: "SMS", label: "SMS", icon: "chatbubble-ellipses-outline", iconLib: "ionicons", color: "#10b981" },
    { value: "WHATSAPP", label: "WhatsApp", icon: "logo-whatsapp", iconLib: "ionicons", color: "#25D366" },
  ];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPlatformConfig = (p: PlatformType) => PLATFORMS.find((x) => x.value === p)!;

const PlatformIcon = ({
  platform,
  size = 18,
  color,
}: {
  platform: PlatformType;
  size?: number;
  color?: string;
}) => {
  const cfg = getPlatformConfig(platform);
  const c = color ?? cfg.color;
  if (cfg.iconLib === "fontawesome") {
    return <FontAwesome name={cfg.icon as any} size={size} color={c} />;
  }
  return <Ionicons name={cfg.icon as any} size={size} color={c} />;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateTemplet() {
  const isDark = useColorScheme() === "dark";

  // ── Edit mode params ─────────────────────────────────────────────────────
  const params = useLocalSearchParams<{
    editId?: string;
    editName?: string;
    editPlatform?: string;
    editContent?: string;
    editSubject?: string;
    editMetadata?: string;
    editMediaUrls?: string;
  }>();
  const isEditMode = !!params.editId;

  const [templateName, setTemplateName] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("EMAIL");
  const [orderedPlatforms, setOrderedPlatforms] = useState<PlatformType[]>(PLATFORMS.map(p => p.value));
  const [preHeader, setPreHeader] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [content, setContent] = useState("");
  const [facebookContentType, setFacebookContentType] = useState<"STANDARD" | "REEL">("STANDARD");
  const [youtubeContentType, setYoutubeContentType] = useState<"VIDEO" | "SHORT">("VIDEO");
  const [tags, setTags] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("PUBLIC");
  const [playlist, setPlaylist] = useState("");
  const [destinationLink, setDestinationLink] = useState("");
  const [media, setMedia] = useState<{ uri: string; type: "image" | "video" | "pdf"; uploadedUrl?: string; name?: string }[]>([]);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [pinterestActiveIndex, setPinterestActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [organisationId, setOrganisationId] = useState<number | undefined>(undefined);

  // ================= AI TEXT =================
  const [aiPrompt, setAiPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<{subject: string, content: string, isLoading?: boolean}[]>([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // ================= AI IMAGE =================
  const [imagePrompt, setImagePrompt] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imageLoadingMap, setImageLoadingMap] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>({});
  const [selectingImage, setSelectingImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const { getToken } = useAuth();

  React.useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const user = await getUser();
        if (user?.organisation?.id) {
          setOrganisationId(user.organisation.id);
        }
      } catch (err) {
        console.warn("Could not fetch organisationId:", err);
      }
    };
    fetchOrgId();
  }, []);

  // ── Pre-fill fields when editing ─────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode) return;
    if (params.editName) setTemplateName(params.editName);
    if (params.editContent) setContent(params.editContent);
    if (params.editSubject) setEmailSubject(params.editSubject);
    if (params.editPlatform) {
      const platform = params.editPlatform as PlatformType;
      setSelectedPlatform(platform);
      setOrderedPlatforms(prev => {
        const filtered = prev.filter(p => p !== platform);
        return [platform, ...filtered];
      });
    }
    if (params.editMetadata) {
      try {
        const meta = JSON.parse(params.editMetadata);
        if (meta.preHeader) setPreHeader(meta.preHeader);
        if (meta.facebookContentType) setFacebookContentType(meta.facebookContentType);
        if (meta.youtubeContentType) setYoutubeContentType(meta.youtubeContentType);
        if (meta.tags) setTags(meta.tags);
        if (meta.privacyStatus) setPrivacyStatus(meta.privacyStatus);
        if (meta.playlist) setPlaylist(meta.playlist);
        if (meta.destinationLink) setDestinationLink(meta.destinationLink);
      } catch {}
    }
    if (params.editMediaUrls) {
      try {
        const urls: string[] = JSON.parse(params.editMediaUrls);
        const mediaItems = urls.map(url => {
          const lower = url.toLowerCase();
          const type: "image" | "video" | "pdf" = lower.includes(".mp4") || lower.includes(".mov")
            ? "video"
            : lower.includes(".pdf")
            ? "pdf"
            : "image";
          return { uri: url, uploadedUrl: url, type };
        });
        setMedia(mediaItems);
      } catch {}
    }
  }, [params.editId]);

  // ── style helpers ──────────────────────────────────────────────────────────

  const bg = isDark ? "#161618" : "#f3f4f6";
  const card = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f3f4f6" : "#111827";
  const textMuted = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#111827" : "#f9fafb";

  const inputStyle = {
    backgroundColor: inputBg,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: textPrimary,
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: "600" as const,
    color: textMuted,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleGenerateAIText = async () => {
    if (!aiPrompt.trim()) {
      Toast.show({ type: 'info', text1: "Enter instruction like: add emoji, make promotional" });
      return;
    }
    if (loadingAI) return;

    setLoadingAI(true);
    setAiResults([
      { subject: "", content: "Generating...", isLoading: true },
      { subject: "", content: "Generating...", isLoading: true },
      { subject: "", content: "Generating...", isLoading: true },
    ]);

    try {
      const user = await getUser();
      const orgId = organisationId || user?.orgId;
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const prompt = `Generate 3 distinct message variations for ${selectedPlatform || "social media"} about: \"${aiPrompt}\". \n    Return the response ONLY as a JSON array of objects with the exact structure: \n    [{\"title\": \"Creative Title\", \"content\": \"The main body content\", \"hashtags\": \"comma, separated, tags\"}]\n    Variation 1: Professional\n    Variation 2: Creative\n    Variation 3: Concise\n    Do not include any extra text outside the JSON array.`;

      const payload = {
        prompt,
        message: prompt,
        context: { platform: selectedPlatform, existingContent: content || "" },
        mode: "generate-multiple",
      };

      const res = await generateAIContentApi(orgId, payload, token);
      const rawMessage = res?.message || res?.content || "";
      if (!rawMessage) throw new Error("No content received from AI generator");

      const extractJsonArray = (str: string) => {
        try { return JSON.parse(str); } catch (e) {
          const match = str.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) { try { return JSON.parse(match[0]); } catch (innerError) {} }
          throw e;
        }
      };

      const parsedVariations = extractJsonArray(rawMessage);
      if (!Array.isArray(parsedVariations)) throw new Error("Invalid format");

      const results = parsedVariations.map((item: any) => {
        const subject = item.title || item.subject || "";
        const contentText = item.content || "";
        const formattedHashtags = item.hashtags
          ? item.hashtags.split(",").map((t: string) => t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`).filter(Boolean).join(" ")
          : "";
        return {
          subject,
          content: formattedHashtags ? `${contentText}\n\n${formattedHashtags}` : contentText,
          isLoading: false,
        };
      });

      while (results.length < 3) results.push({ subject: "", content: "No additional variation", isLoading: false });
      setAiResults(results.slice(0, 3));
    } catch (error: any) {
      const errorMsg = error?.message || "AI API request failed";
      setAiResults([
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
      ]);
      Toast.show({ type: 'error', text1: "Error", text2: errorMsg });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) {
      Toast.show({ type: 'info', text1: "Enter a prompt to generate an image" });
      return;
    }
    if (loadingImage) return;

    setLoadingImage(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const response: any = await generateAIImageApi({ prompt: imagePrompt }, token);
      const rawImageUrl = response?.imageUrl || response?.imagePrompt;
      if (!rawImageUrl) {
        Toast.show({ type: 'error', text1: "Failed", text2: "No image URL returned" });
        return;
      }
      setGeneratedImages((prev) => [...prev, rawImageUrl]);
      setImageLoadingMap((prev) => ({ ...prev, [rawImageUrl]: true }));
      setImageErrorMap((prev) => ({ ...prev, [rawImageUrl]: false }));
    } catch (error: any) {
      Toast.show({ type: 'error', text1: "Error", text2: error?.message || "Failed to generate image." });
    } finally {
      setLoadingImage(false);
    }
  };

  const handleSelectGeneratedImage = async (imageUrl: string) => {
    if (selectingImage) return;
    setSelectingImage(imageUrl);
    
    setMedia((prev) => [
      ...prev,
      {
        uri: imageUrl,
        uploadedUrl: imageUrl,
        name: `ai-image-${Date.now()}.webp`,
        type: "image",
      },
    ]);

    setTimeout(() => {
      setImageModalVisible(false);
      setSelectingImage(null);
    }, 300);
  };

  const handleCreate = async () => {
    if (!templateName.trim() || !selectedPlatform || !content.trim() || !organisationId) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      const metadataObj = {
        preHeader,
        facebookContentType,
        youtubeContentType,
        tags,
        privacyStatus,
        playlist,
        destinationLink,
      };

      const payload = {
        name: templateName,
        platform: selectedPlatform,
        category: "CUSTOM",
        isActive: true,
        content: content,
        subject: emailSubject,
        metadata: JSON.stringify(metadataObj),
        mediaUrls: media.filter(m => m.uploadedUrl).map(m => m.uploadedUrl as string),
      };

      if (isEditMode && params.editId) {
        await updateTemplateApi(organisationId, Number(params.editId), payload, token || undefined);
      } else {
        await createTemplateApi(organisationId, payload, token || undefined);
      }

      router.back();
    } catch (e: any) {
      console.error("Failed to save template:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const processUpload = async (asset: any, type: "image" | "video" | "pdf") => {
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token available");

      const fileName = asset.name || asset.fileName || `${type}-${Date.now()}`;
      const finalUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: fileName,
          type: type === "pdf" ? "application/pdf" : asset.type === "video" ? "video/mp4" : "image/jpeg",
        },
        token,
        undefined,
        {
          organisationId,
          platform: selectedPlatform,
        }
      );

      if (!finalUrl) throw new Error("Upload failed");

      setMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          uploadedUrl: finalUrl,
          type: type,
          name: fileName,
        },
      ]);
    } catch (error: any) {
      console.error("Upload error:", error);
      Toast.show({ type: 'error', text1: "Upload failed", text2: error.message || "Failed to select or upload media." });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    try {
      if (selectedPlatform === "EMAIL") {
        Alert.alert(
          "Upload Media",
          "What kind of file do you want to attach?",
          [
            {
              text: "Document (PDF)",
              onPress: async () => {
                const result = await DocumentPicker.getDocumentAsync({
                  type: "application/pdf",
                  copyToCacheDirectory: true,
                });
                if (result.canceled) return;
                processUpload(result.assets[0], "pdf");
              }
            },
            {
              text: "Photo / Video",
              onPress: async () => {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                  Toast.show({ type: 'info', text1: "Permission required", text2: "Please allow access to photos and videos." });
                  return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.All,
                  quality: 0.8,
                });
                if (result.canceled) return;
                const asset = result.assets[0];
                processUpload(asset, asset.type === "video" ? "video" : "image");
              }
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
        return;
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Toast.show({ type: 'info', text1: "Permission required", text2: "Please allow access to photos and videos." });
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: selectedPlatform === "YOUTUBE" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        processUpload(asset, asset.type === "video" ? "video" : "image");
      }
    } catch (error: any) {
      console.error("Picker error:", error);
      Toast.show({ type: 'error', text1: "Error", text2: error.message || "Failed to open picker." });
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlatformSelect = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setOrderedPlatforms((prev) => {
      if (platform === selectedPlatform) return prev;
      const filtered = prev.filter((p) => p !== platform && p !== selectedPlatform);
      return [platform, ...filtered, selectedPlatform];
    });
  };

  // ── preview label ─────────────────────────────────────────────────────────

  const contentPlaceholder = selectedPlatform
    ? `Enter your content for ${getPlatformConfig(selectedPlatform).label}...`
    : "Select a platform to start typing...";

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: bg,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 6,
              borderRadius: 10,
              backgroundColor: card,
              marginRight: 12,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={textPrimary} />
          </TouchableOpacity>

          <ThemedText
            style={{ fontSize: 20, fontWeight: "700", color: textPrimary, flex: 1 }}
          >
            {isEditMode ? "Edit Template" : "Create New Template"}
          </ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Select Platform ── */}
          <ThemedText style={labelStyle}>Select Platform</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 8,
              paddingBottom: 4,
            }}
            style={{ marginBottom: 20 }}
          >
            {orderedPlatforms.map((pValue) => {
              const p = getPlatformConfig(pValue);
              const isActive = selectedPlatform === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => handlePlatformSelect(p.value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 20,
                    borderWidth: 1.5,
                    borderColor: isActive ? p.color : border,
                    backgroundColor: isActive ? `${p.color}22` : card,
                  }}
                >
                  <PlatformIcon
                    platform={p.value}
                    size={15}
                    color={isActive ? p.color : textMuted}
                  />
                  <ThemedText
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? p.color : textMuted,
                    }}
                  >
                    {p.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Template Name ── */}
          <ThemedText style={labelStyle}>Template Name</ThemedText>
          <TextInput
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="e.g. Weekly Newsletter"
            placeholderTextColor={textMuted}
            style={[inputStyle, { marginBottom: 20 }]}
          />

          {/* ── Pre-header Text (Email only) ── */}
          {selectedPlatform === "EMAIL" && (
            <>
              <ThemedText style={labelStyle}>Pre-header Text</ThemedText>
              <TextInput
                value={preHeader}
                onChangeText={setPreHeader}
                placeholder="Summary text shown after the subject line..."
                placeholderTextColor={textMuted}
                style={[inputStyle, { marginBottom: 4 }]}
              />
              <ThemedText
                style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}
              >
                Short summary text shown in the inbox listing
              </ThemedText>
            </>
          )}

           {/* ── Subject / Title ── */}
          {(selectedPlatform === "EMAIL" || selectedPlatform === "FACEBOOK" || selectedPlatform === "INSTAGRAM" || selectedPlatform === "LINKEDIN" || selectedPlatform === "PINTEREST" || selectedPlatform === "YOUTUBE") && (
            <>
              <ThemedText style={labelStyle}>
                {selectedPlatform === "EMAIL" ? "Email Subject" : selectedPlatform === "YOUTUBE" ? "Video Title" : "Post Title"}
              </ThemedText>
              <TextInput
                value={emailSubject}
                onChangeText={setEmailSubject}
                placeholder={
                  selectedPlatform === "EMAIL" ? "Enter email subject" : 
                  selectedPlatform === "YOUTUBE" ? "Enter video title" : 
                  "Enter post title"
                }
                placeholderTextColor={textMuted}
                style={[inputStyle, { marginBottom: 20 }]}
              />
            </>
          )}

          {/* AI TEXT BUTTON FOR ALL PLATFORMS */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#4c1d95" : "#6d28d9",
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: isDark ? "#6d28d9" : "#8b5cf6",
              shadowColor: "#6d28d9",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons
              name="sparkles"
              size={18}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}
            >
              Generate Content with AI Assistant
            </Text>
          </TouchableOpacity>

          {/* ── Upload Media ── */}
          {selectedPlatform !== "SMS" && (
            <>
              <ThemedText style={labelStyle}>
                {selectedPlatform === "EMAIL" ? "Attachments (Optional)" : "Upload Media (Optional)"}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
                {selectedPlatform === "EMAIL"
                  ? "Attach PDFs, images, or videos to your email"
                  : "Upload Images/Videos"}
              </ThemedText>

          {selectedPlatform === "EMAIL" ? (
            <View style={{ marginBottom: 20 }}>
              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: border,
                  backgroundColor: card,
                  marginBottom: 12,
                  opacity: uploading ? 0.6 : 1,
                }}
              >
                {uploading ? (
                  <>
                    <Ionicons name="hourglass-outline" size={20} color={textMuted} />
                    <ThemedText style={{ color: textMuted, fontWeight: "600" }}>Uploading...</ThemedText>
                  </>
                ) : (
                  <>
                    <Ionicons name="attach-outline" size={20} color={textMuted} />
                    <ThemedText style={{ color: textMuted, fontWeight: "600" }}>Add Attachment</ThemedText>
                  </>
                )}
              </TouchableOpacity>

              {media.map((item, index) => {
                const isVideo = item.type === "video";
                const isPdf = item.type === "pdf";
                let filename = item.name || item.uri.split("/").pop() || "file";
                if (filename.includes("?")) filename = filename.split("?")[0];
                const sizeStr = isVideo ? "14.2 MB" : isPdf ? "1.1 MB" : "2.4 MB";
                const iconName: any = isVideo
                  ? "videocam-outline"
                  : isPdf
                  ? "document-text-outline"
                  : "image-outline";
                const iconColor = isVideo ? "#8b5cf6" : isPdf ? "#ef4444" : "#3b82f6";

                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isDark ? "#333" : "#e5e7eb",
                      backgroundColor: isDark ? "#2c2c2e" : "#fff",
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: `${iconColor}22`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={iconName} size={22} color={iconColor} />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <ThemedText
                        style={{ fontSize: 13, fontWeight: "600", color: isDark ? "#fff" : "#111827" }}
                        numberOfLines={1}
                      >
                        {filename}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                        {sizeStr}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeMedia(index)}
                      style={{
                        padding: 6,
                        borderRadius: 10,
                        backgroundColor: isDark ? "#444" : "#f3f4f6",
                      }}
                    >
                      <Ionicons name="close" size={16} color={isDark ? "#ccc" : "#555"} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 10 }}>
                <TouchableOpacity
                  onPress={handleUpload}
                  disabled={uploading}
                  style={{
                    width: 70,
                    height: 70,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: isDark ? "#4b5563" : "#d1d5db",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: card,
                    opacity: uploading ? 0.6 : 1,
                  }}
                >
                  {uploading ? (
                    <View style={{ alignItems: "center" }}>
                      <Ionicons name="hourglass-outline" size={20} color={textMuted} />
                      <ThemedText style={{ fontSize: 8, color: textMuted }}>UPLOADING</ThemedText>
                    </View>
                  ) : (
                    <Ionicons name="add" size={28} color={textMuted} />
                  )}
                </TouchableOpacity>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingVertical: 10, paddingHorizontal: 4 }}
                >
                  {media.map((item, index) => (
                    <View key={index} style={{ position: "relative", marginRight: 4 }}>
                      <View
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 12,
                          overflow: "hidden",
                          backgroundColor: inputBg,
                          borderWidth: 1,
                          borderColor: border,
                        }}
                      >
                        {item.type === "image" ? (
                          <Image
                            source={{ uri: item.uri || item.uploadedUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : item.type === "video" ? (
                          <View style={{ flex: 1 }}>
                            <Video
                              source={{ uri: item.uri || item.uploadedUrl || "" }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                              paused={false}
                              repeat
                              muted
                              controls={false}
                            />
                            <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.2)" }}>
                              <Ionicons name="play" size={24} color="#fff" />
                            </View>
                          </View>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: "#ef444411",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <Ionicons name="document-text-outline" size={24} color="#ef4444" />
                            <ThemedText style={{ fontSize: 9, fontWeight: "700", color: "#ef4444" }}>
                              PDF
                            </ThemedText>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => removeMedia(index)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          backgroundColor: "#ef4444",
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 20,
                          borderWidth: 2,
                          borderColor: "#fff",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                          elevation: 5,
                        }}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
                <ThemedText style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}>
                  Images and videos can be changed when creating posts
                </ThemedText>
              </>
            )}
            </>
          )}

          {/* AI IMAGE BUTTON */}
          {selectedPlatform !== "SMS" && selectedPlatform !== "YOUTUBE" && (
            <TouchableOpacity
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#064e3b" : "#0f766e",
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 14,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: isDark ? "#0f766e" : "#14b8a6",
                shadowColor: "#0f766e",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                Generate Image with AI Assistant
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Content Type (Facebook/Instagram only) ── */}
          {(selectedPlatform === "FACEBOOK" || selectedPlatform === "INSTAGRAM") && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={labelStyle}>Content Type</ThemedText>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(["STANDARD", "REEL"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFacebookContentType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: facebookContentType === type ? getPlatformConfig(selectedPlatform).color : border,
                      backgroundColor: facebookContentType === type ? `${getPlatformConfig(selectedPlatform).color}11` : card,
                      alignItems: "center",
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: 13, 
                      fontWeight: "600",
                      color: facebookContentType === type ? getPlatformConfig(selectedPlatform).color : textMuted
                    }}>
                      {type === "STANDARD" ? "Standard Post" : "Reel / Short Video"}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Content Type (YouTube only) ── */}
          {selectedPlatform === "YOUTUBE" && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={labelStyle}>Content Type</ThemedText>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {(["VIDEO", "SHORT"] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setYoutubeContentType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: youtubeContentType === type ? getPlatformConfig("YOUTUBE").color : border,
                      backgroundColor: youtubeContentType === type ? `${getPlatformConfig("YOUTUBE").color}11` : card,
                      alignItems: "center",
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: 13, 
                      fontWeight: "600",
                      color: youtubeContentType === type ? getPlatformConfig("YOUTUBE").color : textMuted
                    }}>
                      {type === "VIDEO" ? "Standard Video" : "YouTube Short"}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── Playlist & Privacy (YouTube only) ── */}
          {selectedPlatform === "YOUTUBE" && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={labelStyle}>Playlist</ThemedText>
                <TextInput
                  value={playlist}
                  onChangeText={setPlaylist}
                  placeholder="e.g. Tutorial"
                  placeholderTextColor={textMuted}
                  style={inputStyle}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={labelStyle}>Privacy Status</ThemedText>
                <TouchableOpacity
                  style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
                >
                  <ThemedText style={{ color: textPrimary }}>{privacyStatus}</ThemedText>
                  <Ionicons name="chevron-down" size={16} color={textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Tags (YouTube only) ── */}
          {selectedPlatform === "YOUTUBE" && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={labelStyle}>Tags (comma separated)</ThemedText>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="e.g. tutorial, vlog"
                placeholderTextColor={textMuted}
                style={inputStyle}
              />
            </View>
          )}

          {/* ── Destination Link (Pinterest only) ── */}
          {selectedPlatform === "PINTEREST" && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={labelStyle}>Destination Link</ThemedText>
              <TextInput
                value={destinationLink}
                onChangeText={setDestinationLink}
                placeholder="https://example.com/product"
                placeholderTextColor={textMuted}
                style={[inputStyle, { marginBottom: 4 }]}
              />
              <ThemedText style={{ fontSize: 12, color: textMuted }}>
                The URL people go to when they click your Pin
              </ThemedText>
            </View>
          )}

          {/* ── Custom Thumbnail (YouTube only) ── */}
          {selectedPlatform === "YOUTUBE" && (
            <View style={{ marginBottom: 20 }}>
              <ThemedText style={labelStyle}>Custom Thumbnail</ThemedText>
              <TouchableOpacity
                onPress={handleUpload}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: border,
                  backgroundColor: card,
                }}
              >
                <Ionicons name="image-outline" size={20} color={textMuted} />
                <ThemedText style={{ color: textMuted, fontWeight: "600" }}>Upload Thumbnail</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Live Preview ── */}
          <ThemedText style={labelStyle}>Live Preview</ThemedText>
          <ThemedText style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
            Type directly in the preview to see how your content will appear on {selectedPlatform}
          </ThemedText>

          {selectedPlatform === "EMAIL" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: `${getPlatformConfig("EMAIL").color}22`,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: border,
                }}
              >
                <ThemedText style={{ fontSize: 12, fontWeight: "600", color: getPlatformConfig("EMAIL").color }}>
                  Email Preview
                </ThemedText>
              </View>

              <View style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <ThemedText style={{ fontSize: 12, color: textMuted, width: 50 }}>Subject:</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: textPrimary, fontWeight: "600", flex: 1 }}>
                    {emailSubject || "Email subject..."}
                  </ThemedText>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <ThemedText style={{ fontSize: 12, color: textMuted, width: 50 }}>From:</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: textMuted }}>your-brand@company.com</ThemedText>
                </View>
                
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: border, paddingTop: 10 }}>
                   <TextInput
                     value={content}
                     onChangeText={setContent}
                     placeholder="Email content..."
                     placeholderTextColor={textMuted}
                     multiline
                     style={{
                       fontSize: 14,
                       color: textPrimary,
                       lineHeight: 20,
                       minHeight: 100,
                     }}
                   />
                   
                   {media.length > 0 && (
                     <View style={{ marginTop: 12 }}>
                       {media.map((item, index) => {
                         const isVideo = item.type === "video";
                         const isPdf = item.type === "pdf";
                         
                         let filename = item.name || item.uri.split('/').pop() || "file";
                         if (filename.includes('?')) filename = filename.split('?')[0];
                         
                         const sizeStr = isVideo ? "14.2 MB" : isPdf ? "1.1 MB" : "2.4 MB";
                         const iconName = isVideo ? "videocam-outline" : isPdf ? "document-text-outline" : "image-outline";
                         
                         return (
                           <View
                             key={index}
                             style={{
                               marginBottom: 12,
                               borderWidth: 1,
                               borderColor: isDark ? "#333" : "#e5e7eb",
                               borderRadius: 8,
                               overflow: "hidden"
                             }}
                           >
                             <View
                               style={{
                                 flexDirection: "row",
                                 alignItems: "center",
                                 padding: 12,
                                 backgroundColor: isDark ? "#2c2c2e" : "#fff"
                               }}
                             >
                               <Ionicons name={iconName} size={24} color={isDark ? "#ccc" : "#555"} />
                               
                               <View style={{ flex: 1, paddingHorizontal: 12 }}>
                                 <ThemedText
                                   style={{ fontSize: 14, fontWeight: "500", color: isDark ? "#fff" : "#111827" }}
                                   numberOfLines={1}
                                 >
                                   {filename}
                                 </ThemedText>
                                 <ThemedText style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
                                   {sizeStr}
                                 </ThemedText>
                               </View>
                               
                               <TouchableOpacity
                                 onPress={() => removeMedia(index)}
                                 style={{
                                   padding: 4,
                                   borderRadius: 12,
                                   backgroundColor: isDark ? "#444" : "#f3f4f6"
                                 }}
                               >
                                 <Ionicons name="close" size={16} color={isDark ? "#ccc" : "#555"} />
                               </TouchableOpacity>
                             </View>
                           </View>
                         );
                       })}
                     </View>
                   )}
                </View>
              </View>
            </ThemedView>
          ) : selectedPlatform === "FACEBOOK" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* FB Preview Header */}
              <View style={{ padding: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#E4E6EB", alignItems: "center", justifyContent: "center" }}>
                   <Ionicons name="person" size={20} color="#8A8D91" />
                </View>
                <View>
                  <ThemedText style={{ fontWeight: "700", fontSize: 14 }}>Your Brand</ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <ThemedText style={{ fontSize: 12, color: textMuted }}>Just now ·</ThemedText>
                    <Ionicons name="globe-outline" size={12} color={textMuted} />
                  </View>
                </View>
              </View>

              {/* FB Content */}
              <View style={{ padding: 12, paddingTop: 0 }}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Your message will appear here..."
                  placeholderTextColor={textMuted}
                  multiline
                  style={{
                    fontSize: 14,
                    color: textPrimary,
                    lineHeight: 20,
                    minHeight: 80,
                  }}
                />
              </View>

              {/* FB Media */}
              {media.length > 0 && (
                <View style={{ 
                  aspectRatio: facebookContentType === "REEL" ? 9/16 : 1.91, 
                  maxHeight: facebookContentType === "REEL" ? 400 : undefined,
                  backgroundColor: inputBg,
                  overflow: "hidden"
                }}>
                  {media[0].type === "video" ? (
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => setIsPlayingPreview(!isPlayingPreview)} 
                      style={{ flex: 1 }}
                    >
                      <Video
                        source={{ uri: media[0].uri || media[0].uploadedUrl || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                        paused={!isPlayingPreview}
                        repeat
                        muted
                        controls={false}
                      />
                      {!isPlayingPreview && (
                        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="play" size={40} color="#fff" style={{ opacity: 0.8 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : media[0].type === "image" ? (
                    <Image 
                      source={{ uri: media[0].uri || media[0].uploadedUrl || "" }} 
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              )}
              <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: border, paddingVertical: 10 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="thumbs-up-outline" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 12, color: textMuted }}>Like</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="chatbubble-outline" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 12, color: textMuted }}>Comment</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="share-social-outline" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 12, color: textMuted }}>Share</ThemedText>
                </View>
              </View>
            </ThemedView>
          ) : selectedPlatform === "INSTAGRAM" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* Instagram Header */}
              <View style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#E4E6EB", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="person" size={16} color="#8A8D91" />
                  </View>
                  <ThemedText style={{ fontWeight: "700", fontSize: 13 }}>yourbrand</ThemedText>
                </View>
                <Ionicons name="ellipsis-horizontal" size={18} color={textPrimary} />
              </View>

              {/* Instagram Media */}
              <View style={{ 
                aspectRatio: facebookContentType === "REEL" ? 9/16 : 1, 
                maxHeight: facebookContentType === "REEL" ? 400 : undefined,
                backgroundColor: isDark ? "#1f2937" : "#f1f5f9", 
                alignItems: "center", 
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {media.length > 0 ? (
                  media[0].type === "video" ? (
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => setIsPlayingPreview(!isPlayingPreview)} 
                      style={{ flex: 1, width: "100%" }}
                    >
                      <Video
                        source={{ uri: media[0].uri || media[0].uploadedUrl || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                        paused={!isPlayingPreview}
                        repeat
                        muted
                        controls={false}
                      />
                      {!isPlayingPreview && (
                        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="play" size={40} color="#fff" style={{ opacity: 0.8 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Image 
                      source={{ uri: media[0].uri || media[0].uploadedUrl || "" }} 
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <Ionicons name="image-outline" size={48} color={textMuted} />
                )}
              </View>

              {/* Instagram Interactions */}
              <View style={{ padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", gap: 16 }}>
                   <Ionicons name="heart-outline" size={24} color={textPrimary} />
                   <Ionicons name="chatbubble-outline" size={24} color={textPrimary} />
                   <Ionicons name="paper-plane-outline" size={24} color={textPrimary} />
                </View>
                <Ionicons name="bookmark-outline" size={24} color={textPrimary} />
              </View>

              {/* Instagram Caption Editor */}
              <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 4 }}>
                <ThemedText style={{ fontWeight: "700", fontSize: 13 }}>yourbrand</ThemedText>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Write a caption..."
                  placeholderTextColor={textMuted}
                  multiline
                  style={{
                    fontSize: 14,
                    color: textPrimary,
                    lineHeight: 20,
                    minHeight: 60,
                  }}
                />
              </View>
            </ThemedView>
          ) : selectedPlatform === "LINKEDIN" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* LinkedIn Header */}
              <View style={{ padding: 12, flexDirection: "row", gap: 10 }}>
                <View style={{ width: 48, height: 48, backgroundColor: "#0077B5", borderRadius: 4, alignItems: "center", justifyContent: "center" }}>
                   <Ionicons name="business" size={24} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontWeight: "700", fontSize: 14 }}>Your Brand</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: textMuted }}>1,234 followers</ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <ThemedText style={{ fontSize: 12, color: textMuted }}>Just now ·</ThemedText>
                    <Ionicons name="globe-outline" size={12} color={textMuted} />
                  </View>
                </View>
              </View>

              {/* LinkedIn Content */}
              <View style={{ padding: 12, paddingTop: 0, gap: 8 }}>
                {emailSubject && (
                  <ThemedText style={{ fontWeight: "700", fontSize: 15, color: textPrimary }}>
                    {emailSubject}
                  </ThemedText>
                )}
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Your post content..."
                  placeholderTextColor={textMuted}
                  multiline
                  style={{
                    fontSize: 14,
                    color: textPrimary,
                    lineHeight: 20,
                    minHeight: 100,
                  }}
                />
              </View>

              {/* LinkedIn Media */}
              {media.length > 0 && (
                <View style={{ aspectRatio: 1.91, backgroundColor: inputBg, overflow: "hidden" }}>
                  {media[0].type === "video" ? (
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => setIsPlayingPreview(!isPlayingPreview)} 
                      style={{ flex: 1 }}
                    >
                      <Video
                        source={{ uri: media[0].uri || media[0].uploadedUrl || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                        paused={!isPlayingPreview}
                        repeat
                        muted
                        controls={false}
                      />
                      {!isPlayingPreview && (
                        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="play" size={40} color="#fff" style={{ opacity: 0.8 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : media[0].type === "image" ? (
                    <Image 
                      source={{ uri: media[0].uri || media[0].uploadedUrl || "" }} 
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
              )}
              <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: border, paddingVertical: 10 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="thumbs-up-outline" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 11, color: textMuted, fontWeight: "600" }}>Like</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="chatbubble-outline" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 11, color: textMuted, fontWeight: "600" }}>Comment</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Ionicons name="repeat" size={18} color={textMuted} />
                  <ThemedText style={{ fontSize: 11, color: textMuted, fontWeight: "600" }}>Repost</ThemedText>
                </View>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                   <Ionicons name="paper-plane-outline" size={18} color={textMuted} />
                   <ThemedText style={{ fontSize: 11, color: textMuted, fontWeight: "600" }}>Send</ThemedText>
                </View>
              </View>
            </ThemedView>
          ) : selectedPlatform === "YOUTUBE" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <View style={{ 
                aspectRatio: youtubeContentType === "SHORT" ? 9/16 : 16/9, 
                maxHeight: youtubeContentType === "SHORT" ? 400 : undefined,
                backgroundColor: "#000", 
                alignItems: "center", 
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {media.length > 0 ? (
                  media[0].type === "video" ? (
                    <TouchableOpacity 
                      activeOpacity={0.9} 
                      onPress={() => setIsPlayingPreview(!isPlayingPreview)} 
                      style={{ flex: 1, width: "100%" }}
                    >
                      <Video
                        source={{ uri: media[0].uri || media[0].uploadedUrl || "" }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                        paused={!isPlayingPreview}
                        repeat
                        muted
                        controls={false}
                      />
                      {!isPlayingPreview && (
                        <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="play" size={48} color="#fff" style={{ opacity: 0.9 }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Image 
                      source={{ uri: media[0].uri || media[0].uploadedUrl || "" }} 
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <Ionicons name="play" size={48} color="#fff" />
                )}
              </View>

              <View style={{ padding: 12 }}>
                <ThemedText style={{ fontWeight: "700", fontSize: 16 }}>
                  {emailSubject || "Video title..."}
                </ThemedText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#E4E6EB", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="videocam" size={18} color="#8A8D91" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{ fontWeight: "700", fontSize: 14 }}>Your Channel</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: textMuted }}>10M subscribers</ThemedText>
                  </View>
                  <View style={{ backgroundColor: isDark ? "#fff" : "#000", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18 }}>
                    <ThemedText style={{ color: isDark ? "#000" : "#fff", fontWeight: "700", fontSize: 12 }}>Subscribe</ThemedText>
                  </View>
                </View>

                {/* Description Area */}
                <View style={{ marginTop: 16, backgroundColor: isDark ? "#2d3748" : "#f1f5f9", borderRadius: 12, padding: 12 }}>
                  <ThemedText style={{ fontSize: 12, fontWeight: "700", color: textPrimary, marginBottom: 4 }}>
                    Description
                  </ThemedText>
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Description..."
                    placeholderTextColor={textMuted}
                    multiline
                    style={{
                      fontSize: 13,
                      color: textPrimary,
                      lineHeight: 18,
                      minHeight: 80,
                    }}
                  />
                </View>
              </View>
            </ThemedView>
          ) : selectedPlatform === "PINTEREST" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              {/* Pinterest Image/Video Paging Carousel */}
              <View style={{ aspectRatio: 2/3, backgroundColor: isDark ? "#1f2937" : "#f1f5f9" }}>
                <ScrollView 
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                    setPinterestActiveIndex(index);
                  }}
                >
                  {media.length > 0 ? (
                    media.map((item, index) => (
                      <View key={index} style={{ width: CARD_WIDTH, height: CARD_WIDTH * (3/2) }}> 
                        {item.type === "video" ? (
                          <TouchableOpacity 
                            activeOpacity={0.9} 
                            onPress={() => setIsPlayingPreview(!isPlayingPreview)} 
                            style={{ flex: 1 }}
                          >
                            <Video
                              source={{ uri: item.uri || item.uploadedUrl || "" }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                              paused={!(isPlayingPreview && pinterestActiveIndex === index)}
                              repeat
                              muted
                              controls={false}
                            />
                            {(!isPlayingPreview || pinterestActiveIndex !== index) && (
                              <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="play" size={48} color="#fff" style={{ opacity: 0.8 }} />
                              </View>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <Image 
                            source={{ uri: item.uri || item.uploadedUrl || "" }} 
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))
                  ) : (
                    <View style={{ width: CARD_WIDTH, height: CARD_WIDTH * (3/2), alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="image-outline" size={64} color={textMuted} />
                    </View>
                  )}
                </ScrollView>

                {/* Save Button (Static Overlay) */}
                <View style={{ position: "absolute", top: 16, right: 16, backgroundColor: "#E60023", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
                   <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Save</ThemedText>
                </View>

                {/* Pagination Dots */}
                {media.length > 1 && (
                  <View style={{ 
                    position: "absolute", 
                    bottom: 12, 
                    left: 0, 
                    right: 0, 
                    flexDirection: "row", 
                    justifyContent: "center", 
                    gap: 6,
                    paddingHorizontal: 20 
                  }}>
                    {media.map((_, i) => (
                      <View 
                        key={i} 
                        style={{ 
                          width: 6, 
                          height: 6, 
                          borderRadius: 3, 
                          backgroundColor: pinterestActiveIndex === i ? "#fff" : "rgba(255,255,255,0.5)",
                          borderWidth: 0.5,
                          borderColor: "rgba(0,0,0,0.1)"
                        }} 
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Pinterest Info Area */}
              <View style={{ padding: 16, gap: 10 }}>
                <ThemedText style={{ fontWeight: "700", fontSize: 20, color: textPrimary }}>
                   {emailSubject || "Add a title"}
                </ThemedText>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#E4E6EB", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="person" size={16} color="#8A8D91" />
                  </View>
                  <ThemedText style={{ fontWeight: "600", fontSize: 14 }}>yourbrand</ThemedText>
                </View>

                <View style={{ marginTop: 4 }}>
                   <TextInput
                     value={content}
                     onChangeText={setContent}
                     placeholder="Add a detailed description..."
                     placeholderTextColor={textMuted}
                     multiline
                     style={{
                       fontSize: 14,
                       color: textPrimary,
                       lineHeight: 20,
                       minHeight: 60,
                     }}
                   />
                </View>
              </View>
            </ThemedView>
          ) : selectedPlatform === "SMS" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
                padding: 16,
              }}
            >
              <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: "#0B93F6", borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 12, paddingVertical: 8 }}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Message text..."
                  placeholderTextColor="#rgba(255, 255, 255, 0.7)"
                  multiline
                  style={{
                    fontSize: 15,
                    color: "#fff",
                    lineHeight: 20,
                  }}
                />
                <ThemedText style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.7)", alignSelf: "flex-end", marginTop: 2 }}>
                  12:34 PM
                </ThemedText>
              </View>
            </ThemedView>
          ) : selectedPlatform === "WHATSAPP" ? (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: border,
                overflow: "hidden",
                marginBottom: 20,
                padding: 16,
              }}
            >
              <View style={{ alignSelf: "flex-end", maxWidth: "85%", backgroundColor: isDark ? "#056162" : "#DCF8C6", borderRadius: 8, borderTopRightRadius: 0, paddingHorizontal: 10, paddingVertical: 6 }}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Message text..."
                  placeholderTextColor={isDark ? "#91a3a2" : "#8696a0"}
                  multiline
                  style={{
                    fontSize: 15,
                    color: isDark ? "#fff" : "#000",
                    lineHeight: 20,
                  }}
                />
                <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "flex-end", gap: 4, marginTop: 2 }}>
                   <ThemedText style={{ fontSize: 10, color: isDark ? "#91a3a2" : "#8696a0" }}>12:34 PM</ThemedText>
                   <Ionicons name="checkmark-done" size={14} color="#34B7F1" />
                </View>
              </View>
            </ThemedView>
          ) : (
            <ThemedView
              style={{
                backgroundColor: card,
                borderRadius: 12,
                padding: 20,
                borderWidth: 1,
                borderColor: border,
                marginBottom: 20,
              }}
            >
              <View style={{ alignItems: "center", marginBottom: 15 }}>
                <Ionicons name="time-outline" size={24} color={textMuted} />
                <ThemedText style={{ color: textMuted, marginTop: 4, fontWeight: "600", fontSize: 12 }}>
                  {selectedPlatform} Preview Coming Soon
                </ThemedText>
              </View>

              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder={`Enter ${selectedPlatform} template content...`}
                placeholderTextColor={textMuted}
                multiline
                style={{
                  backgroundColor: inputBg,
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: textPrimary,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </ThemedView>
          )}

          {/* ── Variables tip ── */}
          {/* <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              backgroundColor: isDark ? "#1e3a5f" : "#eff6ff",
              borderRadius: 10,
              padding: 12,
              marginBottom: 24,
            }}
          >
            <ThemedText style={{ fontSize: 16 }}>💡</ThemedText>
            <ThemedText style={{ fontSize: 12, color: isDark ? "#93c5fd" : "#1e40af", flex: 1, lineHeight: 18 }}>
              Use variables like{" "}
              <ThemedText style={{ fontWeight: "700" }}>{"{{firstName}}"}</ThemedText>
              {" "}or{" "}
              <ThemedText style={{ fontWeight: "700" }}>{"{{companyName}}"}</ThemedText>
              {" "}to personalize your template.
            </ThemedText>
          </View> */}
        </ScrollView>

        {/* ── Footer Buttons ── */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: border,
            backgroundColor: bg,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: border,
              alignItems: "center",
              backgroundColor: card,
            }}
          >
            <ThemedText style={{ fontWeight: "600", fontSize: 15, color: textPrimary }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={submitting}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              backgroundColor: submitting ? "#9ca3af" : "#dc2626",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {submitting ? (
              <Ionicons name="hourglass-outline" size={18} color="#fff" />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            )}
            <ThemedText style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {submitting
                ? isEditMode ? "Saving..." : "Creating..."
                : isEditMode ? "Save Changes" : "Create Template"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* AI TEXT MODAL */}
      <Modal visible={aiModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: isDark ? "#161618" : "#ffffff", borderRadius: 12, padding: 16, maxHeight: "70%", borderWidth: 1, borderColor: isDark ? "#ffffff" : "#d1d5db" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <TextInput
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="e.g. add emoji, make promotional"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: isDark ? "#4b5563" : "#d1d5db",
                  borderRightWidth: 0,
                  borderTopLeftRadius: 25,
                  borderBottomLeftRadius: 25,
                  paddingHorizontal: 16,
                  height: 48,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  color: isDark ? "#ffffff" : "#000000",
                }}
              />
              <TouchableOpacity
                disabled={loadingAI}
                onPress={handleGenerateAIText}
                style={{
                  backgroundColor: loadingAI ? "#6b7280" : "#dc2626",
                  borderWidth: 1,
                  borderColor: isDark ? "#4b5563" : "#d1d5db",
                  borderLeftWidth: 0,
                  borderTopRightRadius: 25,
                  borderBottomRightRadius: 25,
                  height: 48,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="sparkles" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {aiResults.length > 0 ? (
              <View style={{ flexShrink: 1, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 14, color: isDark ? '#ffffff' : '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    AI SUGGESTIONS ({aiResults.length})
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 12, marginLeft: 4 }}>Ready</Text>
                  </View>
                </View>
                <FlatList
                  data={aiResults}
                  keyExtractor={(_, index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 16 }}
                  renderItem={({ item, index }) => {
                    const STYLE_BADGES = ["PROFESSIONAL", "CREATIVE", "CONCISE"];
                    const badgeLabel = STYLE_BADGES[index] || "SUGGESTION";

                    return (
                      <View style={{ backgroundColor: isDark ? "#1e1e1e" : "#ffffff", borderRadius: 12, borderWidth: 1, borderColor: isDark ? "#333" : "#e5e7eb", padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <Text style={{ color: isDark ? "#9ca3af" : "#9ca3af", fontWeight: 'bold', fontSize: 12, marginTop: 4, letterSpacing: 0.5 }}>
                            {badgeLabel}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {item.isLoading ? (
                              <ActivityIndicator size="small" color="#dc2626" style={{ marginRight: 8 }} />
                            ) : (
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => {
                                  setEmailSubject(item.subject);
                                  setContent(item.content);
                                  setAiModalVisible(false);
                                }}
                                style={{ backgroundColor: "#dc2626", width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
                              >
                                <Ionicons name="checkmark" size={18} color="#fff" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        <Text style={{ fontSize: 14, color: isDark ? "#d1d5db" : "#374151", lineHeight: 22 }}>
                          {item.subject ? `Title: ${item.subject}\n` : ""}{item.content}
                        </Text>
                      </View>
                    );
                  }}
                />
              </View>
            ) : (
              <Text style={{ textAlign: "center", color: "#555", marginVertical: 12 }}>
                No AI suggestions yet. Enter a prompt and tap Generate.
              </Text>
            )}

            <TouchableOpacity onPress={() => setAiModalVisible(false)} style={{ backgroundColor: "#dc2626", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI IMAGE MODAL */}
      <Modal visible={imageModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: isDark ? "#161618" : "#ffffff", borderRadius: 12, padding: 16, maxHeight: "70%", borderWidth: 1, borderColor: isDark ? "#ffffff" : "#d1d5db" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <TextInput
                value={imagePrompt}
                onChangeText={setImagePrompt}
                placeholder="Enter prompt to generate image"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: isDark ? "#4b5563" : "#d1d5db",
                  borderRightWidth: 0,
                  borderTopLeftRadius: 25,
                  borderBottomLeftRadius: 25,
                  paddingHorizontal: 16,
                  height: 48,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  color: isDark ? "#ffffff" : "#000000",
                }}
              />
              <TouchableOpacity
                disabled={loadingImage}
                onPress={handleGenerateAIImage}
                style={{
                  backgroundColor: loadingImage ? (isDark ? "#4b5563" : "#aaa") : (isDark ? "#1e40af" : "#2563eb"),
                  height: 48,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                  alignItems: "center",
                  borderTopRightRadius: 25,
                  borderBottomRightRadius: 25,
                  borderWidth: 1,
                  borderLeftWidth: 0,
                  borderColor: isDark ? "#4b5563" : "#d1d5db",
                }}
              >
                <Ionicons name="sparkles" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {loadingImage ? (
              <View style={{ height: 150, justifyContent: "center", alignItems: "center", marginVertical: 20, borderRadius: 12 }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 12, fontWeight: "bold", color: isDark ? "#fff" : "#000" }}>
                  Generating image...
                </Text>
              </View>
            ) : generatedImages.length > 0 ? (
              <FlatList
                data={generatedImages}
                keyExtractor={(item, index) => item || index.toString()}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity
                    disabled={imageLoadingMap[item] || imageErrorMap[item]}
                    onPress={() => {
                      if (imageErrorMap[item]) return;
                      handleSelectGeneratedImage(item);
                    }}
                    style={{ opacity: imageErrorMap[item] ? 0.4 : 1 }}
                  >
                    <View style={{ width: 100, height: 100, marginRight: 8, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: imageLoadingMap[item] ? 2 : 0, borderColor: isDark ? "#3b82f6" : "#2563eb", backgroundColor: isDark ? "#1f2933" : "#f1f5f9" }}>
                      {imageLoadingMap[item] && <ActivityIndicator size="small" color={isDark ? "#60a5fa" : "#2563eb"} style={{ position: "absolute", zIndex: 10 }} />}
                      {selectingImage === item && (
                        <View style={{ position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", borderRadius: 8, zIndex: 20 }}>
                          <ActivityIndicator size="large" color="#fff" />
                        </View>
                      )}
                      <Image
                        source={{ uri: item }}
                        style={{ width: "100%", height: "100%", borderRadius: 6, opacity: imageLoadingMap[item] || imageErrorMap[item] ? 0 : 1 }}
                        resizeMode="cover"
                        onLoadEnd={() => setImageLoadingMap((prev) => ({ ...prev, [item]: false }))}
                        onError={() => {
                          setImageLoadingMap((prev) => ({ ...prev, [item]: false }));
                          setImageErrorMap((prev) => ({ ...prev, [item]: true }));
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={{ color: "#555", marginVertical: 8 }}>
                No images yet. Enter a prompt and generate.
              </Text>
            )}

            <TouchableOpacity onPress={() => setImageModalVisible(false)} style={{ backgroundColor: "#dc2626", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 12 }}>
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

import React, { useState } from "react";
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
} from "react-native";
import { Platform } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadMediaApi } from "@/api/campaignApi";
import { getUser } from "@/api/dashboardApi";
import Video from "react-native-video";


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

  const [templateName, setTemplateName] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("EMAIL");
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

  const handleCreate = async () => {
    if (!templateName.trim()) {
      Alert.alert("Validation", "Please enter a template name.");
      return;
    }
    if (!selectedPlatform) {
      Alert.alert("Validation", "Please select a platform.");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Validation", "Please enter template content.");
      return;
    }

    setSubmitting(true);
    try {
    console.log("Creating template:", {
      templateName,
      selectedPlatform,
      preHeader,
      emailSubject,
      content,
      facebookContentType,
      youtubeContentType,
      tags,
      privacyStatus,
      playlist,
      destinationLink,
      mediaCount: media.length,
    });
      Alert.alert("Success", "Template created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create template.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async () => {
    try {
      let asset: any;
      let type: "image" | "video" | "pdf" = "image";

      if (selectedPlatform === "EMAIL") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "application/pdf",
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        asset = result.assets[0];
        type = "pdf";
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission required", "Please allow access to photos and videos.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: selectedPlatform === "YOUTUBE" ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
        });
        if (result.canceled) return;
        asset = result.assets[0];
        type = asset.type === "video" ? "video" : "image";
      }

      setUploading(true);
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
      Alert.alert("Upload failed", error.message || "Failed to select or upload media.");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlatformSelect = (platform: PlatformType) => {
    if (platform === "SMS" || platform === "WHATSAPP") {
      Alert.alert(
        "Admin Approval Required",
        "You need admin approval and a credits pack to create templates for SMS/WhatsApp.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Purchase Pack",
            onPress: () => router.push("/(tabs)/accounts" as any),
          },
        ]
      );
      return;
    }
    setSelectedPlatform(platform);
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
            Create New Template
          </ThemedText>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Template Name ── */}
          <ThemedText style={labelStyle}>Template Name</ThemedText>
          <TextInput
            value={templateName}
            onChangeText={setTemplateName}
            placeholder="e.g. Weekly Newsletter"
            placeholderTextColor={textMuted}
            style={[inputStyle, { marginBottom: 20 }]}
          />

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
            {PLATFORMS.map((p) => {
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

          {/* ── Upload Media ── */}
          <ThemedText style={labelStyle}>Upload Media (Optional)</ThemedText>
          <ThemedText style={{ fontSize: 12, color: textMuted, marginBottom: 10 }}>
            Upload Images/Videos
          </ThemedText>
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
                    {/* Placeholder for actual image component */}
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
                        <Ionicons
                          name="document-text-outline"
                          size={24}
                          color="#ef4444"
                        />
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
          <ThemedText
            style={{ fontSize: 12, color: textMuted, marginBottom: 20 }}
          >
            Images and videos can be changed when creating posts
          </ThemedText>

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
              {/* YouTube Video Header (Player Mock) */}
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

              {/* YouTube Info Area */}
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
              <View style={{ alignSelf: "flex-start", maxWidth: "85%", backgroundColor: "#E9E9EB", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 }}>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Message text..."
                  placeholderTextColor="#8e8e93"
                  multiline
                  style={{
                    fontSize: 15,
                    color: "#000",
                    lineHeight: 20,
                  }}
                />
                <ThemedText style={{ fontSize: 10, color: "#8e8e93", alignSelf: "flex-end", marginTop: 2 }}>
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
              <View style={{ alignSelf: "flex-start", maxWidth: "85%", backgroundColor: isDark ? "#056162" : "#DCF8C6", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
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
              {submitting ? "Creating..." : "Create Template"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

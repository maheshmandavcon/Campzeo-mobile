import Toast from "react-native-toast-message";
import { getUser } from "@/api/dashboardApi";
import { useCampaignPostForm } from "@/hooks/useCampaignPostForm";
import { useUser } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@gluestack-ui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import { WebView } from "react-native-webview";
import React, { useEffect, useState } from "react";

const Video = ({
  source,
  style,
  poster,
  controls = false,
  ...rest
}: {
  source: { uri: string };
  style?: any;
  poster?: string;
  controls?: boolean;
  [key: string]: any;
}) => {
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <WebView
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background: #000000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                  }
                  video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                </style>
              </head>
              <body>
                <video
                  src="${source.uri}"
                  ${poster ? `poster="${poster}"` : ""}
                  autoplay
                  loop
                  muted
                  playsinline
                  ${controls ? "controls" : ""}
                />
              </body>
            </html>
          `,
        }}
        style={{
          flex: 1,
          backgroundColor: "#000000",
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
};
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import Preview from "./preview";
import { Picker } from "@react-native-picker/picker";

// ---------- Define Props Interface ----------
interface CampaignPostFormProps {
  platform:
  | "EMAIL"
  | "SMS"
  | "INSTAGRAM"
  | "WHATSAPP"
  | "FACEBOOK"
  | "YOUTUBE"
  | "LINKEDIN"
  | "PINTEREST";
  existingPost?: any;
  campaignId?: string;
  campaignStartDate?: string;
  campaignEndDate?: string;
  onClose?: () => void;
}

export const CampaignPostForm: React.FC<CampaignPostFormProps> = ({
  platform,
  existingPost = null,
  campaignId,
  campaignStartDate,
  campaignEndDate,
  onClose,
}) => {
  const isDark = useColorScheme() === "dark";

  const {
    // state
    platform: platformState,
    senderEmail,
    subject,
    message,
    attachments,
    postDate,
    loading,
    previewTimestamp,

    aiModalVisible,
    aiPrompt,
    aiResults,
    loadingAI,
    imageLoadingMap,

    imageModalVisible,
    imagePrompt,
    generatedImages,
    loadingImage,

    facebookPages,
    selectedFacebookPage,
    selectedFacebookPageId,
    selectedFacebookPageAccessToken,
    leadFormId,
    leadForms,
    isLoadingLeadForms,
    facebookContentType,
    isFacebookPageLoading,
    coverImage,
    coverUploading,
    setCoverImage,

    youTubeContentType,
    youTubeTags,
    youTubeStatus,
    showStatusDropdown,
    isCreatingPlaylist,
    customThumbnail,
    playlistId,
    playlistTitle,
    playlists,
    showPlaylistDropdown,
    selectedPlaylist,
    newPlaylistName,
    selectedAccount,
    hasVideo,
    hasImage,
    hasAttachment,
    canSelectStandard,
    canSelectReel,

    pinterestBoard,
    destinationLink,
    isCreatingPinterestBoard,
    pinterestModalVisible,
    newPinterestBoard,
    pinterestDescription,
    isPinterestBoardLoading,
    allPinterestBoards,
    loadingBoards,

    showPicker,
    showTimePicker,
    minSelectableStartDate,
    minSelectableEndDate,
    maxSelectableEndDate,
    imageErrorMap,
    selectingImage,

    // setters
    setSenderEmail,
    setSubject,
    setMessage,
    setPostDate,
    setAiModalVisible,
    setAiPrompt,
    setImageModalVisible,
    setImagePrompt,
    setAttachments,
    setFacebookContentType,
    setYouTubeContentType,
    setYouTubeTags,
    setYouTubeStatus,
    setShowStatusDropdown,
    setIsCreatingPlaylist,
    setPlaylistId,
    setPlaylistTitle,
    setCustomThumbnail,
    setIsCreatingPinterestBoard,
    setPinterestBoard,
    setPinterestBoardId,
    setPinterestModalVisible,
    setNewPinterestBoard,
    setPinterestDescription,
    setDestinationLink,
    setShowPicker,
    setShowTimePicker,
    setImageLoadingMap,
    setSelectedAccount,
    setShowPlaylistDropdown,
    setSelectedPlaylist,
    setNewPlaylistName,
    setImageErrorMap,
    setCanSelectStandard,
    setCanSelectReel,

    // handlers
    handleSubmit,
    handleAddAttachment,
    handleRemoveAttachment,
    handleGenerateAIText,
    handleGenerateAIImage,
    handleCoverImageUpload,
    handleCustomThumbnailUpload,
    handleCreatePinterestBoard,
    handleSelectGeneratedImage,
    handleSelectFacebookPage,
    setLeadFormId,
    handleCreateYoutubePlaylist,
  } = useCampaignPostForm({
    platform,
    campaignId,
    existingPost: existingPost
      ? existingPost
      : {
        campaign: { startDate: campaignStartDate, endDate: campaignEndDate },
      },
    // campaignStartDate,
    onClose,
  });

  const YOUTUBE_TYPES = [
    { label: "Standard Video", value: "VIDEO" },
    { label: "YouTube Short", value: "SHORT" },
  ] as const;

  const linkedinAccounts = [
    { id: "1", name: "Company Page" },
    { id: "2", name: "Personal Profile" },
  ];

  const [postText, setPostText] = React.useState<string>("");
  const [postImageUrl, setPostImageUrl] = React.useState<string | undefined>(
    undefined,
  );

  const [userData, setUserData] = useState<any>(null);

  // ================= RENDER ATTACHMENTS =================

  const renderAttachmentItem = ({ item, index }: any) => {
    const isImage = item.type.startsWith("image/");
    const isVideo = item.type.startsWith("video/");

    return (
      <View className="flex-row items-center bg-gray-200 rounded-lg px-2 py-1 mr-2 mb-2">
        {isImage && (
          <Image
            source={{ uri: item.uri }}
            style={{ width: 50, height: 50, borderRadius: 5, marginRight: 5 }}
          />
        )}

        {isVideo && (
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 5,
              marginRight: 5,
              overflow: "hidden",
            }}
          >
            <Video
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
              paused={false}
              muted
              controls={false}
              repeat
            />
            {/* Play icon overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <Ionicons name="play-circle" size={24} color="#fff" />
            </View>
          </View>
        )}

        <Text
          className="mr-2 text-gray-700"
          numberOfLines={1}
          style={{ maxWidth: 80 }}
        >
          {item.name}
        </Text>

        {/* <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
          <Ionicons name="close-circle" size={20} color="#dc2626" />
        </TouchableOpacity> */}

        <TouchableOpacity
          onPress={() => handleRemoveAttachment(item.uploadedUrl ?? item.uri)}
        >
          <Ionicons name="close-circle" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getUser();
        setUserData(user);
      } catch (e) {
        console.error(e);
      }
    };

    fetchUser();
  }, []);

  // post preview profile
  const { user } = useUser();

  // useEffect(() => {
  //   console.log("🚀 ~ CampaignPostForm ~ generatedImages:", generatedImages)
  //   console.log("🚀 ~ CampaignPostForm ~ aiResults:", aiResults)
  //   console.log("🚀 ~ CampaignPostForm ~ attachments:", attachments)
  // }, [generatedImages, aiResults, attachments]);

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        // keyboardShouldPersistTaps="never"
        // showsVerticalScrollIndicator={false}
        // contentContainerStyle={{ paddingBottom: 120 }}
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
      >
        <View
          className="flex-1"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        >
          {platformState === "EMAIL" && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontWeight: "700",
                  fontSize: 13,
                  marginBottom: 8,
                  marginLeft: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Sender Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e1e24" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isDark ? "#2a2a32" : "#cbd5e1",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 50,
                }}
              >
                <Ionicons name="mail-outline" size={18} color={isDark ? "#94a3b8" : "#64748b"} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="sender@eg.com"
                  placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                  value={senderEmail}
                  onChangeText={setSenderEmail}
                  keyboardType="email-address"
                  style={{
                    flex: 1,
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: 15,
                    fontWeight: "600",
                    height: "100%",
                    padding: 0,
                  }}
                />
              </View>
            </View>
          )}

          {/* SUBJECT */}
          {platformState !== "SMS" && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontWeight: "700",
                  fontSize: 13,
                  marginBottom: 8,
                  marginLeft: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {platformState === "EMAIL" ? "Subject" : "Title"}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e1e24" : "#ffffff",
                  borderWidth: 1,
                  borderColor: isDark ? "#2a2a32" : "#cbd5e1",
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  height: 50,
                }}
              >
                <Ionicons name="bookmark-outline" size={18} color={isDark ? "#94a3b8" : "#64748b"} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder={
                    platformState === "EMAIL" ? "Enter subject" : "Enter title"
                  }
                  placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                  value={subject}
                  onChangeText={setSubject}
                  style={{
                    flex: 1,
                    color: isDark ? "#ffffff" : "#0f172a",
                    fontSize: 15,
                    fontWeight: "600",
                    height: "100%",
                    padding: 0,
                  }}
                />
              </View>
            </View>
          )}

          {/* AI TEXT BUTTON FOR ALL PLATFORMS */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#581c87" : "#7c3aed",
              paddingVertical: 13,
              paddingHorizontal: 20,
              borderRadius: 14,
              marginBottom: 18,
              shadowColor: "#7c3aed",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            }}
          >
            <Ionicons
              name="sparkles"
              size={16}
              color="#ffffff"
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ color: "#ffffff", fontWeight: "700", fontSize: 13, letterSpacing: 0.3 }}
            >
              Generate Content with AI Assistant
            </Text>
          </TouchableOpacity>

          {/* MESSAGE */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: isDark ? "#ffffff" : "#0f172a",
                fontWeight: "700",
                fontSize: 13,
                marginBottom: 8,
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Message
            </Text>
            <View
              style={{
                backgroundColor: isDark ? "#1e1e24" : "#ffffff",
                borderWidth: 1,
                borderColor: isDark ? "#2a2a32" : "#cbd5e1",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                minHeight: 120,
              }}
            >
              <TextInput
                placeholder={`Enter your ${platformState} content here...`}
                placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                value={message}
                onChangeText={setMessage}
                multiline
                textAlignVertical="top"
                style={{
                  color: isDark ? "#ffffff" : "#0f172a",
                  fontSize: 15,
                  fontWeight: "600",
                  flex: 1,
                  minHeight: 100,
                }}
              />
            </View>
          </View>

          {/* AI IMAGE BUTTON */}
          {platformState !== "SMS" && platformState !== "YOUTUBE" && (
            <TouchableOpacity
              onPress={() => setImageModalVisible(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#064e3b" : "#0d9488",
                paddingVertical: 13,
                paddingHorizontal: 20,
                borderRadius: 14,
                marginBottom: 18,
                shadowColor: "#0d9488",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Ionicons
                name="sparkles"
                size={16}
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "700",
                  fontSize: 13,
                  letterSpacing: 0.3,
                }}
              >
                Generate Image with AI Assistant
              </Text>
            </TouchableOpacity>
          )}

          {/* AI TEXT MODAL */}
          <Modal visible={aiModalVisible} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  borderRadius: 12,
                  padding: 16,
                  maxHeight: "70%",
                  borderWidth: 1,
                  borderColor: isDark ? "#ffffff" : "#d1d5db",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  {/* AI Prompt Input */}
                  <TextInput
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    placeholder="e.g. add emoji, make promotional"
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray placeholder
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: isDark ? "#4b5563" : "#d1d5db",
                      borderRightWidth: 0, // remove right border to connect with button
                      borderTopLeftRadius: 25,
                      borderBottomLeftRadius: 25,
                      paddingHorizontal: 16,
                      height: 48,
                      backgroundColor: isDark ? "#161618" : "#ffffff",
                      color: isDark ? "#ffffff" : "#000000",
                    }}
                  />

                  {/* Generate Button */}
                  <TouchableOpacity
                    disabled={loadingAI}
                    onPress={handleGenerateAIText}
                    style={{
                      backgroundColor: loadingAI ? "#6b7280" : "#dc2626",
                      borderWidth: 1,
                      borderColor: isDark ? "#4b5563" : "#d1d5db",
                      borderLeftWidth: 0, // remove left border to connect with input
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
                          <View
                            style={{
                              backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isDark ? "#333" : "#e5e7eb",
                              padding: 16,
                              marginBottom: 12,
                            }}
                          >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                              <Text style={{ color: isDark ? "#9ca3af" : "#9ca3af", fontWeight: 'bold', fontSize: 12, marginTop: 4, letterSpacing: 0.5 }}>
                                {badgeLabel}
                              </Text>

                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                {item.isLoading ? (
                                  <ActivityIndicator size="small" color="#dc2626" style={{ marginRight: 8 }} />
                                ) : (
                                  <>
                                    {/* Red Check Button (Replace/Use) */}
                                    <TouchableOpacity
                                      activeOpacity={0.7}
                                      onPress={() => {
                                        setSubject(item.subject);
                                        setMessage(item.content);
                                        setAiModalVisible(false);
                                      }}
                                      style={{
                                        backgroundColor: "#dc2626", // red
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 8
                                      }}
                                    >
                                      <Ionicons name="checkmark" size={18} color="#fff" />
                                    </TouchableOpacity>

                                    {/* White Plus Button (Append) */}
                                    {/* <TouchableOpacity 
                                      activeOpacity={0.7}
                                      onPress={() => {
                                        if (!subject && item.subject) {
                                          setSubject(item.subject);
                                        }
                                        setMessage(message ? `${message}\n\n${item.content}` : item.content);
                                        setAiModalVisible(false);
                                      }}
                                      style={{
                                        backgroundColor: isDark ? "#374151" : "#ffffff",
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: isDark ? "#4b5563" : "#d1d5db",
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Ionicons name="add" size={18} color={isDark ? "#fff" : "#374151"} />
                                    </TouchableOpacity> */}
                                  </>
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
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#555",
                      marginVertical: 12,
                    }}
                  >
                    No AI suggestions yet. Enter a prompt and tap Generate.
                  </Text>
                )}

                <Button
                  onPress={() => setAiModalVisible(false)}
                  style={{ backgroundColor: "#dc2626", marginTop: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Close
                  </Text>
                </Button>
              </View>
            </View>
          </Modal>

          {/* AI IMAGE MODAL */}
          <Modal visible={imageModalVisible} transparent animationType="slide">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: isDark ? "#161618" : "#ffffff", // dark/light background
                  borderRadius: 12,
                  padding: 16,
                  maxHeight: "70%",
                  borderWidth: 1,
                  borderColor: isDark ? "#ffffff" : "#d1d5db", // white border in dark, gray in light
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  {/* AI Image Prompt Input */}
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

                  {/* Generate Image Button */}
                  <TouchableOpacity
                    disabled={loadingImage}
                    onPress={handleGenerateAIImage}
                    style={{
                      backgroundColor: loadingImage
                        ? isDark
                          ? "#4b5563"
                          : "#aaa"
                        : isDark
                          ? "#1e40af"
                          : "#2563eb",
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

                {/* AI GENERATED IMAGES */}
                {loadingImage ? (
                  <View
                    style={{
                      height: 150, // fixed height
                      justifyContent: "center",
                      alignItems: "center",
                      marginVertical: 20,
                      borderRadius: 12,
                    }}
                  >
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text
                      style={{
                        marginTop: 12,
                        fontWeight: "bold",
                        color: isDark ? "#fff" : "#000",
                      }}
                    >
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
                        // onPress={() => {
                        //   if (imageErrorMap[item]) return;

                        //   setAttachments((prev) => [
                        //     ...prev,
                        //     {
                        //       uri: item,
                        //       name: "ai-image.jpg",
                        //       type: "image/jpeg",
                        //       uploading: false,
                        //     },
                        //   ]);

                        //   setImageModalVisible(false);
                        // }}
                        onPress={() => {
                          if (imageErrorMap[item]) return;
                          handleSelectGeneratedImage(item);
                        }}
                        style={{
                          opacity: imageErrorMap[item] ? 0.4 : 1,
                        }}
                      >
                        <View
                          style={{
                            width: 100,
                            height: 100,
                            marginRight: 8,
                            borderRadius: 8,
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: imageLoadingMap[item] ? 2 : 0,
                            borderColor: isDark ? "#3b82f6" : "#2563eb",
                            backgroundColor: isDark ? "#1f2933" : "#f1f5f9",
                          }}
                        >
                          {/* Spinner */}
                          {imageLoadingMap[item] && (
                            <ActivityIndicator
                              size="small"
                              color={isDark ? "#60a5fa" : "#2563eb"}
                              style={{ position: "absolute", zIndex: 10 }}
                            />
                          )}

                          {selectingImage === item && (
                            <View
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                backgroundColor: "rgba(0,0,0,0.5)",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 8,
                                zIndex: 20,
                              }}
                            >
                              <ActivityIndicator size="large" color="#fff" />
                            </View>
                          )}

                          <Image
                            source={{ uri: item }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 6,
                              opacity:
                                imageLoadingMap[item] || imageErrorMap[item]
                                  ? 0
                                  : 1,
                            }}
                            resizeMode="cover"
                            onLoadEnd={() =>
                              setImageLoadingMap((prev) => ({
                                ...prev,
                                [item]: false,
                              }))
                            }
                            onError={() => {
                              console.log("Image failed to load", item);
                              setImageLoadingMap((prev) => ({
                                ...prev,
                                [item]: false,
                              }));
                              setImageErrorMap((prev) => ({
                                ...prev,
                                [item]: true,
                              }));
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

                <Button
                  onPress={() => setImageModalVisible(false)}
                  style={{ backgroundColor: "#dc2626", marginTop: 12 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Close
                  </Text>
                </Button>
              </View>
            </View>
          </Modal>

          {/* MEDIA */}
          {platformState !== "SMS" && (
            <>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontWeight: "bold",
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {platformState === "YOUTUBE"
                  ? "Media (Videos)"
                  : "Media (Photos / Videos)"}
              </Text>

              <DraggableFlatList
                data={attachments}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => String(index)}
                onDragEnd={({ data }) => setAttachments(data)}
                renderItem={({ item, drag, isActive }) => (
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    style={{
                      opacity: isActive ? 0.7 : 1,
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    {renderAttachmentItem({ item })}
                  </TouchableOpacity>
                )}
                ListHeaderComponent={
                  <TouchableOpacity
                    onPress={handleAddAttachment}
                    disabled={loading}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      backgroundColor: "#dbeafe",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : (
                      <Ionicons name="add" size={28} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                }
              />
            </>
          )}

          {/* ---------- Custom Video Thumbnail Section ---------- */}
          {hasVideo && (
            <View
              style={{
                marginTop: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#e2e8f0",
                borderRadius: 12,
                padding: 16,
                backgroundColor: isDark ? "#1a1a1c" : "#f8fafc",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text
                    style={{
                      color: isDark ? "#ffffff" : "#1e293b",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    Custom Video Thumbnail
                  </Text>
                  <Text
                    style={{
                      color: isDark ? "#94a3b8" : "#64748b",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    Upload an image to use as the custom thumbnail for your video.
                  </Text>
                </View>
                <Ionicons name="image-outline" size={22} color="#2563eb" />
              </View>

              {customThumbnail ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark ? "#27272a" : "#ffffff",
                    borderRadius: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: isDark ? "#3f3f46" : "#e2e8f0",
                  }}
                >
                  <Image
                    source={{ uri: customThumbnail }}
                    style={{ width: 60, height: 60, borderRadius: 6, marginRight: 12 }}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isDark ? "#e2e8f0" : "#334155",
                        fontWeight: "600",
                        fontSize: 13,
                      }}
                      numberOfLines={1}
                    >
                      {customThumbnail.substring(customThumbnail.lastIndexOf("/") + 1)}
                    </Text>
                    <Text
                      style={{
                        color: "#16a34a",
                        fontSize: 11,
                        fontWeight: "bold",
                        marginTop: 2,
                      }}
                    >
                      ✅ Uploaded & Active
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setCustomThumbnail(null)}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleCustomThumbnailUpload}
                  style={{
                    backgroundColor: "#2563eb",
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color="#ffffff" />
                  <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 13 }}>
                    Upload Custom Thumbnail
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* {platformState === "LINKEDIN" && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                backgroundColor: isDark ? "#161618" : "#f3f4f6",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="logo-linkedin"
                  size={24}
                  color="#0A66C2"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Post As
                </Text>
              </View>

              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 8,
                  backgroundColor: isDark ? "#1f1f22" : "#ffffff",
                  overflow: "hidden",
                }}
              >
                <Picker
                  selectedValue={selectedAccount}
                  onValueChange={(itemValue) => setSelectedAccount(itemValue)}
                  style={{
                    color: isDark ? "#fff" : "#000",
                  }}
                  dropdownIconColor={isDark ? "#fff" : "#000"}
                >
                  <Picker.Item
                    label="Select author"
                    value={null}
                    enabled={false}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />

                  {linkedinAccounts.map((account) => (
                    <Picker.Item
                      key={account.id}
                      label={account.name}
                      value={String(account.id)}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )} */}

          {(platformState === "FACEBOOK" || platformState === "INSTAGRAM") && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#2d2d30" : "#e5e7eb",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                backgroundColor: isDark ? "#1a1a1c" : "#ffffff",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* 🔵 Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={platformState === "FACEBOOK" ? "logo-facebook" : "logo-instagram"}
                  size={22}
                  color={platformState === "FACEBOOK" ? "#1877F2" : "#E1306C"}
                />
                <Text
                  style={{
                    marginLeft: 10,
                    fontSize: 15,
                    fontWeight: "700",
                    color: isDark ? "#ffffff" : "#1f2937",
                  }}
                >
                  {platformState === "FACEBOOK" ? "Facebook Page" : "Instagram Business Account"}
                </Text>
              </View>

              {/* 🔄 Pages Selector Dropdown */}
              {isFacebookPageLoading ? (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={platformState === "FACEBOOK" ? "#1877F2" : "#E1306C"} />
                </View>
              ) : (
                (() => {
                  const filteredPages = facebookPages.filter(
                    (p) => platformState !== "INSTAGRAM" || p.instagram_business_account
                  );
                  if (filteredPages.length > 0) {
                    return (
                      <View
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#3f3f46" : "#e4e4e7",
                          borderRadius: 10,
                          backgroundColor: isDark ? "#27272a" : "#f4f4f5",
                          overflow: "hidden",
                          marginBottom: 16,
                        }}
                      >
                        <Picker
                          selectedValue={selectedFacebookPageId}
                          onValueChange={(itemValue) => itemValue && handleSelectFacebookPage(String(itemValue))}
                          style={{
                            color: isDark ? "#fff" : "#000",
                            height: 50,
                          }}
                          dropdownIconColor={isDark ? "#fff" : "#000"}
                        >
                          <Picker.Item
                            label={platformState === "FACEBOOK" ? "Select Facebook Page" : "Select Connected Page"}
                            value={null}
                            enabled={false}
                            color={isDark ? "#a1a1aa" : "#71717a"}
                          />
                          {filteredPages.map((page) => (
                            <Picker.Item
                              key={page.id}
                              label={platformState === "FACEBOOK" ? page.name : `${page.name} (${page.instagram_business_account?.username || 'Instagram'})`}
                              value={String(page.id)}
                              color={isDark ? "#fff" : "#000"}
                            />
                          ))}
                        </Picker>
                      </View>
                    );
                  } else {
                    return (
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: isDark ? "#3f1a1a" : "#fee2e2",
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            color: isDark ? "#fca5a5" : "#b91c1c",
                            fontWeight: "500",
                          }}
                        >
                          {platformState === "INSTAGRAM"
                            ? "No connected Facebook Pages with linked Instagram Business accounts found."
                            : "No connected Facebook Pages found. Connect one in Accounts first."}
                        </Text>
                      </View>
                    );
                  }
                })()
              )}

              {/* 🟢 Lead Forms Section */}
              {(platformState === "FACEBOOK" || platformState === "INSTAGRAM") && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 12,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={22}
                      color="#10b981"
                    />
                    <Text
                      style={{
                        marginLeft: 10,
                        fontSize: 15,
                        fontWeight: "700",
                        color: isDark ? "#ffffff" : "#1f2937",
                      }}
                    >
                      Facebook Lead Form
                    </Text>
                  </View>

                  {isLoadingLeadForms ? (
                    <View style={{ paddingVertical: 12, alignItems: "center" }}>
                      <ActivityIndicator size="small" color="#10b981" />
                    </View>
                  ) : leadForms.length > 0 ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
                        borderRadius: 10,
                        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
                        overflow: "hidden",
                      }}
                    >
                      <Picker
                        selectedValue={leadFormId ? String(leadFormId) : null}
                        onValueChange={(itemValue) => setLeadFormId(itemValue)}
                        style={{
                          color: isDark ? "#fff" : "#000",
                          height: 50,
                        }}
                        dropdownIconColor={isDark ? "#fff" : "#000"}
                      >
                        <Picker.Item
                          label="None (Select Lead Form)"
                          value={null}
                          color={isDark ? "#a1a1aa" : "#71717a"}
                        />
                        {leadForms.map((form) => (
                          <Picker.Item
                            key={form.id}
                            label={form.name}
                            value={String(form.id)}
                            color={isDark ? "#fff" : "#000"}
                          />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <View
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: isDark ? "#18221b" : "#f0fdf4",
                        borderWidth: 1,
                        borderColor: isDark ? "#1b4d24" : "#bbf7d0",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: isDark ? "#86efac" : "#15803d",
                          fontWeight: "500",
                          fontStyle: "italic",
                        }}
                      >
                        No lead form found
                      </Text>
                    </View>
                  )}

                  {/* ℹ️ Page Footer Cues */}
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 11,
                      color: isDark ? "#a1a1aa" : "#71717a",
                    }}
                  >
                    Lead form data will dynamically map to selected pages.
                  </Text>
                </>
              )}
            </View>
          )}

          {/* FACEBOOK CONTENT TYPE */}
          {(platformState === "FACEBOOK" || platformState === "INSTAGRAM") && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db",
                borderRadius: 10,
                padding: 12,
                marginTop: 10,
                marginBottom: 10,
              }}
            >
              {/* Heading inside border */}
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontWeight: "bold",
                  marginBottom: 12,
                }}
              >
                Content Type
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {/* Standard Post */}
                <TouchableOpacity
                  onPress={() => setFacebookContentType("STANDARD")}
                  // disabled={!hasAttachment || hasVideo}
                  disabled={!canSelectStandard || !hasAttachment}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    marginRight: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      facebookContentType === "STANDARD"
                        ? "#3b82f6"
                        : isDark
                          ? "#374151"
                          : "#d1d5db",
                    backgroundColor:
                      facebookContentType === "STANDARD"
                        ? isDark
                          ? "#1e3a8a"
                          : "#eff6ff"
                        : isDark
                          ? "#161618"
                          : "#ffffff",
                    alignItems: "center",
                    // opacity: !hasAttachment || hasVideo ? 0.5 : 1,
                    opacity: !canSelectStandard || !hasAttachment ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      color:
                        facebookContentType === "STANDARD"
                          ? isDark
                            ? "#fff"
                            : "#2563eb"
                          : isDark
                            ? "#ffffff"
                            : "#000000",
                    }}
                  >
                    Standard Post
                  </Text>
                </TouchableOpacity>

                {/* Reel / Short Video */}
                <TouchableOpacity
                  onPress={() => setFacebookContentType("REEL")}
                  // disabled={!hasAttachment || hasImage}
                  disabled={!canSelectReel || !hasAttachment}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    marginLeft: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      facebookContentType === "REEL"
                        ? "#3b82f6"
                        : isDark
                          ? "#374151"
                          : "#d1d5db",
                    backgroundColor:
                      facebookContentType === "REEL"
                        ? isDark
                          ? "#1e3a8a"
                          : "#eff6ff"
                        : isDark
                          ? "#161618"
                          : "#ffffff",
                    alignItems: "center",
                    // opacity: !hasAttachment || hasImage ? 0.5 : 1,
                    opacity: !canSelectReel || !hasAttachment ? 0.5 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 12,
                      color:
                        facebookContentType === "REEL"
                          ? isDark
                            ? "#fff"
                            : "#2563eb"
                          : isDark
                            ? "#ffffff"
                            : "#000000",
                    }}
                  >
                    Reel / Short Video
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ---------- New section for Reel / Short Video ---------- */}
              {facebookContentType === "REEL" && (
                <View style={{ marginTop: 12 }}>
                  {/* Title */}
                  <Text
                    style={{
                      color: isDark ? "#ffffff" : "#000000",
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Cover Image (Optional)
                  </Text>

                  {/* Upload Button */}
                  <TouchableOpacity
                    disabled={coverUploading} // disable while uploading
                    onPress={() => {
                      console.log("[Cover] Upload button pressed");
                      handleCoverImageUpload();
                    }}
                    style={{
                      backgroundColor: isDark ? "#1e3a8a" : "#eff6ff",
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: isDark ? "#3b82f6" : "#2563eb",
                      opacity: coverUploading ? 0.6 : 1, // show visually disabled
                      flexDirection: "row",
                      justifyContent: "center",
                    }}
                  >
                    {coverUploading ? (
                      <>
                        <ActivityIndicator
                          size="small"
                          color={isDark ? "#fff" : "#2563eb"}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            color: isDark ? "#fff" : "#2563eb",
                            fontWeight: "bold",
                            fontSize: 12,
                          }}
                        >
                          Uploading…
                        </Text>
                      </>
                    ) : (
                      <Text
                        style={{
                          color: isDark ? "#fff" : "#2563eb",
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        Upload Cover
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Preview */}
                  {coverImage && !coverUploading && (
                    <View
                      style={{
                        position: "relative",
                        width: 100,
                        height: 100,
                        marginTop: 8,
                      }}
                    >
                      <Image
                        source={{ uri: coverImage }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isDark ? "#fff" : "#000",
                        }}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => setCoverImage(null)}
                        style={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          backgroundColor: "#ef4444",
                          borderRadius: 12,
                          padding: 4,
                          elevation: 5,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3.84,
                        }}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Helper Text */}
                  <Text
                    style={{
                      fontSize: 10,
                      marginTop: 8,
                      color: isDark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    Recommended for vertical videos (9:16) under 90 seconds
                  </Text>
                </View>
              )}
            </View>
          )}

          {platformState === "YOUTUBE" && (
            <View
              style={{
                backgroundColor: isDark ? "#161618" : "#f3f4f6",
                borderRadius: 12,
              }}
            >
              {/* ---------- YouTube Settings Heading ---------- */}
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontWeight: "bold",
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                YouTube Settings
              </Text>

              {/* ---------- Content Type ---------- */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  backgroundColor: isDark ? "#161618" : "#f3f4f6",
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#ffffff" : "#000000",
                    fontWeight: "bold",
                    marginBottom: 8,
                    marginLeft: 4,
                  }}
                >
                  Content Type
                </Text>

                <View style={{ marginBottom: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    {YOUTUBE_TYPES.map(({ label, value }) => {
                      const selected = youTubeContentType === value;

                      return (
                        <TouchableOpacity
                          key={value}
                          onPress={() => setYouTubeContentType(value)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            marginHorizontal: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: selected
                              ? "#2563eb"
                              : isDark
                                ? "#374151"
                                : "#d1d5db",
                            backgroundColor: selected
                              ? isDark
                                ? "#1e3a8a"
                                : "#eff6ff"
                              : isDark
                                ? "#161618"
                                : "#fff",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              fontSize: 12,
                              color: selected
                                ? isDark
                                  ? "#fff"
                                  : "#2563eb"
                                : isDark
                                  ? "#ffffff"
                                  : "#000000",
                            }}
                            numberOfLines={1}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Playlist Dropdown Section (Optional for Standard Video and Short) */}
                  {(youTubeContentType === "VIDEO" || youTubeContentType === "SHORT") && (
                    <View style={{ marginTop: 12 }}>
                      <Text
                        style={{
                          color: isDark ? "#ffffff" : "#000000",
                          fontWeight: "bold",
                          marginBottom: 8,
                          marginLeft: 4,
                        }}
                      >
                        YouTube Playlist (Optional)
                      </Text>

                      {/* Dropdown Toggle Button */}
                      {!isCreatingPlaylist && (
                        <TouchableOpacity
                          onPress={() =>
                            setShowPlaylistDropdown(!showPlaylistDropdown)
                          }
                          style={{
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#d1d5db",
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            backgroundColor: isDark ? "#161618" : "#ffffff",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: selectedPlaylist ? (isDark ? "#ffffff" : "#000") : "#9ca3af",
                              fontWeight: selectedPlaylist ? "600" : "normal",
                            }}
                          >
                            {selectedPlaylist
                              ? selectedPlaylist.name
                              : "Select a playlist (optional)"}
                          </Text>
                          <Ionicons
                            name={showPlaylistDropdown ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={isDark ? "#9ca3af" : "#6b7280"}
                          />
                        </TouchableOpacity>
                      )}

                      {/* Dropdown List */}
                      {showPlaylistDropdown && !isCreatingPlaylist && (
                        <View
                          style={{
                            marginTop: 8,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#d1d5db",
                            borderRadius: 8,
                            backgroundColor: isDark ? "#161618" : "#ffffff",
                            maxHeight: 200,
                            overflow: "hidden",
                          }}
                        >
                          {/* + Create New Playlist Button */}
                          <TouchableOpacity
                            onPress={() => {
                              setIsCreatingPlaylist(true);
                              setShowPlaylistDropdown(false);
                            }}
                            style={{
                              paddingVertical: 12,
                              paddingHorizontal: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: isDark ? "#374151" : "#e5e7eb",
                              backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                            }}
                          >
                            <Text
                              style={{ color: "#2563eb", fontWeight: "bold" }}
                            >
                              + Create New Playlist
                            </Text>
                          </TouchableOpacity>

                          {/* Playlist Items List */}
                          <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                            {playlists.length === 0 ? (
                              <View style={{ padding: 12, alignItems: "center" }}>
                                <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 13 }}>
                                  No playlists found. Create one above!
                                </Text>
                              </View>
                            ) : (
                              playlists.map((playlist) => (
                                <TouchableOpacity
                                  key={playlist.id}
                                  onPress={() => {
                                    setSelectedPlaylist(playlist);
                                    setPlaylistId(playlist.id);
                                    setPlaylistTitle(playlist.name);
                                    setShowPlaylistDropdown(false);
                                  }}
                                  style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: isDark ? "#ffffff" : "#000000",
                                      fontWeight: selectedPlaylist?.id === playlist.id ? "bold" : "normal",
                                    }}
                                  >
                                    {playlist.name}
                                  </Text>
                                  {selectedPlaylist?.id === playlist.id && (
                                    <Ionicons name="checkmark" size={16} color="#2563eb" />
                                  )}
                                </TouchableOpacity>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      )}

                      {/* New Playlist Form */}
                      {isCreatingPlaylist && (
                        <View
                          style={{
                            marginTop: 8,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#d1d5db",
                            borderRadius: 8,
                            backgroundColor: isDark ? "#1f2937" : "#f8fafc",
                          }}
                        >
                          <Text
                            style={{
                              color: isDark ? "#ffffff" : "#000000",
                              fontWeight: "bold",
                              fontSize: 13,
                              marginBottom: 8,
                            }}
                          >
                            Create New Playlist
                          </Text>
                          <TextInput
                            placeholder="Enter playlist name"
                            placeholderTextColor={
                              isDark ? "#9ca3af" : "#6b7280"
                            }
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            style={{
                              borderWidth: 1,
                              borderColor: isDark ? "#374151" : "#d1d5db",
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 10,
                              backgroundColor: isDark ? "#161618" : "#ffffff",
                              color: isDark ? "#ffffff" : "#000000",
                              marginBottom: 12,
                            }}
                          />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              onPress={handleCreateYoutubePlaylist}
                              style={{
                                flex: 1,
                                paddingVertical: 10,
                                backgroundColor: "#2563eb",
                                borderRadius: 8,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 13 }}>
                                Create
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => {
                                setIsCreatingPlaylist(false);
                                setShowPlaylistDropdown(true);
                              }}
                              style={{
                                flex: 1,
                                paddingVertical: 10,
                                backgroundColor: isDark ? "#27272a" : "#e2e8f0",
                                borderRadius: 8,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text style={{ color: isDark ? "#e2e8f0" : "#334155", fontWeight: "bold", fontSize: 13 }}>
                                Select Existing
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* ---------- Tags ---------- */}
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Tags
              </Text>
              <TextInput
                placeholder="Enter tags separated by commas"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={youTubeTags}
                onChangeText={setYouTubeTags}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  height: 48,
                  marginBottom: 16,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  color: isDark ? "#e5e7eb" : "#000000",
                }}
              />

              {/* ---------- Status ---------- */}
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Status
              </Text>
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  height: 48,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: isDark ? "#e5e7eb" : "#000" }}>
                  {youTubeStatus || "Public"}
                </Text>
                <Ionicons
                  name={showStatusDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={isDark ? "#e5e7eb" : "#000"}
                />
              </TouchableOpacity>

              {showStatusDropdown && (
                <View
                  style={{
                    backgroundColor: isDark ? "#161618" : "#ffffff",
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d1d5db",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                >
                  {["Public", "Private", "Unlisted"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => {
                        setYouTubeStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      style={{ padding: 10 }}
                    >
                      <Text style={{ color: isDark ? "#e5e7eb" : "#000" }}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            </View>
          )}

          {platformState === "PINTEREST" && (
            <View style={{ borderRadius: 8 }}>
              {/* Pinterest Settings Heading */}
              <Text
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                  fontSize: 16,
                  color: isDark ? "#ffffff" : "#000000",
                }}
              >
                Pinterest Settings
              </Text>

              {/* ---------- Select Board + Destination Link Section with Border ---------- */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                {/* Select Board */}
                <Text
                  style={{
                    fontWeight: "600",
                    marginBottom: 8,
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Select Board
                </Text>
                {/* Select Board Button */}
                <TouchableOpacity
                  onPress={() => setPinterestModalVisible(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d1d5db",
                    backgroundColor: isDark ? "#161618" : "#fff",
                    borderRadius: 9999,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: isDark ? "#9ca3af" : "#000000" }}>
                    {pinterestBoard || "Select a board"}
                  </Text>
                </TouchableOpacity>

                {/* Pinterest Modal */}
                <Modal
                  visible={pinterestModalVisible}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setPinterestModalVisible(false)}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      justifyContent: "center",
                      padding: 20,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderRadius: 12,
                        maxHeight: "80%",
                        padding: 16,
                      }}
                    >
                      {/* + Create New Board */}
                      <TouchableOpacity
                        onPress={() => setIsCreatingPinterestBoard(true)}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          marginBottom: 12,
                          backgroundColor: isDark ? "#161618" : "#f3f4f6",
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "#2563eb", fontWeight: "bold" }}>
                          + Create New Board
                        </Text>
                      </TouchableOpacity>

                      {/* Create Board Form */}
                      {isCreatingPinterestBoard && (
                        <View style={{ marginBottom: 16 }}>
                          <TextInput
                            value={newPinterestBoard}
                            onChangeText={setNewPinterestBoard}
                            placeholder="Board Name"
                            placeholderTextColor={
                              isDark ? "#9ca3af" : "#6b7280"
                            }
                            style={{
                              borderWidth: 1,
                              borderColor: isDark ? "#374151" : "#d1d5db",
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 8,
                              color: isDark ? "#e5e7eb" : "#000000",
                            }}
                          />
                          <TextInput
                            value={pinterestDescription}
                            onChangeText={setPinterestDescription}
                            placeholder="Description (optional)"
                            placeholderTextColor={
                              isDark ? "#9ca3af" : "#6b7280"
                            }
                            style={{
                              borderWidth: 1,
                              borderColor: isDark ? "#374151" : "#d1d5db",
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 8,
                              color: isDark ? "#e5e7eb" : "#000000",
                            }}
                          />
                          <TouchableOpacity
                            onPress={handleCreatePinterestBoard}
                            style={{
                              backgroundColor: "#2563eb",
                              paddingVertical: 12,
                              borderRadius: 8,
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>
                              Create
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Existing Boards List */}
                      <View style={{ maxHeight: 250 }}>
                        {loadingBoards ? (
                          <ActivityIndicator
                            size="small"
                            color="#2563eb"
                            style={{ margin: 20 }}
                          />
                        ) : allPinterestBoards.length === 0 ? (
                          <Text
                            style={{
                              color: isDark ? "#e5e7eb" : "#000",
                              margin: 12,
                            }}
                          >
                            No boards found
                          </Text>
                        ) : (
                          <FlatList
                            data={allPinterestBoards}
                            keyExtractor={(item: any) => item.id}
                            style={{ flexGrow: 0 }}
                            nestedScrollEnabled
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                onPress={() => {
                                  setPinterestBoardId(item.id);
                                  setPinterestBoard(item.name);
                                  setIsCreatingPinterestBoard(false);
                                  setPinterestModalVisible(false);
                                }}
                                style={{
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  borderRadius: 8,
                                  marginBottom: 6,
                                  backgroundColor: isDark
                                    ? "#161618"
                                    : "#f3f4f6",
                                }}
                              >
                                <Text
                                  style={{
                                    color: isDark ? "#e5e7eb" : "#000000",
                                  }}
                                >
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            )}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Destination Link */}
                <Text
                  style={{
                    fontWeight: "600",
                    marginBottom: 8,
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Destination Link (Optional)
                </Text>
                <TextInput
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  value={destinationLink}
                  onChangeText={setDestinationLink}
                  placeholder="Enter destination link"
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d1d5db",
                    backgroundColor: isDark ? "#161618" : "#fff",
                    borderRadius: 9999,
                    // paddingVertical: 10,
                    // paddingHorizontal: 12,
                    padding: 10,
                    marginBottom: 8,
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
              </View>

              {/* ---------- Modal ---------- */}
              {isCreatingPinterestBoard && (
                <Modal
                  visible={pinterestModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setPinterestModalVisible(false)}
                >
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 20,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        backgroundColor: isDark ? "#161618" : "#fff",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? "#fff" : "#d1d5db",
                        padding: 16,
                      }}
                    >
                      {/* Heading */}
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 20,
                          color: isDark ? "#ffffff" : "#000000",
                        }}
                      >
                        Create New Pinterest Board
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: isDark ? "#9ca3af" : "#6b7280",
                          marginBottom: 16,
                        }}
                      >
                        Create a new board to organize your pins
                      </Text>

                      {/* Board Name */}
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          marginBottom: 8,
                          color: isDark ? "#ffffff" : "#000000",
                        }}
                      >
                        Board Name
                      </Text>
                      <TextInput
                        placeholder="Enter board name"
                        placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                        value={newPinterestBoard}
                        onChangeText={setNewPinterestBoard}
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderRadius: 9999,
                          padding: 10,
                          marginBottom: 16,
                          color: isDark ? "#ffffff" : "#000000",
                        }}
                      />

                      {/* Description */}
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          marginBottom: 8,
                          color: isDark ? "#ffffff" : "#000000",
                        }}
                      >
                        Description (Optional)
                      </Text>
                      <TextInput
                        placeholder="What's this board about?"
                        placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                        value={pinterestDescription}
                        onChangeText={setPinterestDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 16,
                          minHeight: 80,
                          color: isDark ? "#ffffff" : "#000000",
                        }}
                      />

                      {/* Actions */}
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "flex-end",
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => setPinterestModalVisible(false)}
                          style={{ marginRight: 16 }}
                        >
                          <Text
                            style={{
                              color: isDark ? "#9ca3af" : "#6b7280",
                              fontWeight: "bold",
                            }}
                          >
                            Cancel
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={handleCreatePinterestBoard}
                          disabled={isPinterestBoardLoading}
                        >
                          {isPinterestBoardLoading ? (
                            <ActivityIndicator size="small" color="#2563eb" />
                          ) : (
                            <Text
                              style={{ color: "#2563eb", fontWeight: "bold" }}
                            >
                              Create board
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          )}

          {/* DATE & TIME PICKER */}
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#d1d5db",
              borderRadius: 9999,
              paddingHorizontal: 14,
              paddingVertical: 12,
              marginBottom: 16,
              backgroundColor: isDark ? "#161618" : "#fff",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
              {postDate ? postDate.toLocaleString() : "Select Date & Time"}
            </Text>

            {postDate && (
              <TouchableOpacity
                onPress={() => {
                  setPostDate(null);
                  setShowTimePicker(false);
                }}
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? "#ffffff" : "#6b7280"}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* DATE PICKER */}
          {showTimePicker && (
            <DateTimePicker
              value={postDate ?? minSelectableEndDate}
              mode="time"
              is24Hour={false}
              onChange={(_, time) => {
                setShowTimePicker(false);
                if (!time || !postDate) return;

                const selectedDateTime = new Date(
                  postDate.getFullYear(),
                  postDate.getMonth(),
                  postDate.getDate(),
                  time.getHours(),
                  time.getMinutes(),
                  0,
                  0,
                );

                // 🚨 STRICT FUTURE CHECK (not now, not past)
                // if (selectedDateTime.getTime() <= Date.now()) {
                //   Alert.alert(
                //     "Invalid Time",
                //     "Please select a future time (for example, 10:01 instead of 10:00)."
                //   );
                //   return;
                // }

                if (selectedDateTime.getTime() <= Date.now()) {
                  const now = new Date();

                  const currentTime = now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const future = new Date(now.getTime() + 60 * 1000);

                  const futureTime = future.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  Toast.show({
                    type: "info",
                    text1: "Invalid Time",
                    text2: `Please select a future time (for example, ${futureTime} instead of ${currentTime}).`,
                  });
                  return;
                }

                setPostDate(selectedDateTime);                                            
              }}
            />
          )}

          {/* TIME PICKER */}
          {showPicker && (
            <DateTimePicker
              value={postDate ?? minSelectableEndDate}
              // mode="date"
              minimumDate={minSelectableEndDate}
              maximumDate={maxSelectableEndDate}
              onChange={(_, date) => {
                setShowPicker(false);
                if (!date) return;

                const base = postDate ?? new Date();

                setPostDate(
                  new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate(),
                    base.getHours(),
                    base.getMinutes(),
                  ),
                );

                setShowTimePicker(true);
              }}
            />
          )}

          {/* {showTimePicker && (
            <DateTimePicker
              value={postDate || new Date()}
              mode="time"
              onChange={(_, time) => {
                setShowTimePicker(false);

                if (time && postDate) {
                  const now = new Date();

                  const selectedDateTime = new Date(
                    postDate.getFullYear(),
                    postDate.getMonth(),
                    postDate.getDate(),
                    time.getHours(),
                    time.getMinutes(),
                  );

                  //  Check if selected date is today
                  const isToday =
                    postDate.toDateString() === now.toDateString();

                  //  If today, time must be greater than current time
                  if (isToday && selectedDateTime <= now) {
                    alert("Please select a future time");
                    return;
                  }

                  setPostDate(selectedDateTime);
                }
              }}
            />
          )}  */}
        </View>

        {/* ---------- PREVIEW SLOT ---------- */}
        <View style={{ marginBottom: 20 }}>
          {/* ✅ Facebook Preview */}
          {platformState === "FACEBOOK" && (
            <Preview
              platform="facebook"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              coverImage={coverImage || undefined}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ Instagram Preview */}
          {platformState === "INSTAGRAM" && (
            <Preview
              platform="instagram"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              coverImage={coverImage || undefined}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ LinkedIn Preview */}
          {platformState === "LINKEDIN" && (
            <Preview
              platform="linkedin"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ WhatsApp Preview */}
          {platformState === "WHATSAPP" && (
            <Preview
              platform="whatsapp"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ Email Preview */}
          {platformState === "EMAIL" && (
            <Preview
              platform="email"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ SMS Preview */}
          {platformState === "SMS" && (
            <Preview
              platform="sms"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              timestamp={previewTimestamp}
            />
          )}

          {/* ✅ Pinterest Preview */}
          {platformState === "PINTEREST" && (
            <Preview
              platform="pinterest"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
            // timestamp={previewTimestamp}
            />
          )}

          {/* ✅ YouTube Preview */}
          {platformState === "YOUTUBE" && (
            <Preview
              platform="youtube"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
              timestamp={previewTimestamp}
            />
          )}
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#2563eb",
            borderRadius: 14,
            height: 52,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 32,
            marginTop: 16,
            shadowColor: "#2563eb",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            {loading && (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
              {existingPost ? "Update Campaign Post" : "Create Campaign Post"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CampaignPostForm;

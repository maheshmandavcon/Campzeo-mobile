import { getUser } from "@/api/dashboardApi";
import { useCampaignPostForm } from "@/hooks/useCampaignPostForm";
import { useUser } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Button, Switch } from "@gluestack-ui/themed";
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
import { ThemedText } from "@/components/themed-text";
import * as Linking from "expo-linking";

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
    aiModalVisible,
    aiPrompt,
    aiResults,
    loadingAI,
    imageLoadingMap,

    imageModalVisible,
    imagePrompt,
    generatedImages,
    loadingImage,
    imageModalVisible,
    imagePrompt,
    generatedImages,
    loadingImage,

    templates,
    loadingTemplates,
    templateModalVisible,
    selectedTemplate,

    metaAccounts,
    loadingMetaAccounts,
    isBoosting,
    selectedMetaAccount,
    boostingGoal,
    dailyBudget,
    boostingDuration,
    totalBudget,
    estimatedReach,

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
    facebookPages,
    selectedFacebookPage,
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
    showPicker,
    showTimePicker,
    minSelectableStartDate,
    minSelectableEndDate,
    maxSelectableEndDate,
    imageErrorMap,
    selectingImage,
    selectedLeadForm,
    allLeadForms,
    isLeadFormLoading,
    leadFormModalVisible,

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
    setTemplateModalVisible,
    setIsCreatingPinterestBoard,
    setSelectedFacebookPage,
    setSelectedLeadForm,
    setLeadFormModalVisible,

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

    setIsBoosting,
    setSelectedMetaAccount,
    setBoostingGoal,
    setDailyBudget,
    setBoostingDuration,

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
    handleSelectTemplate,
  } = useCampaignPostForm({
    platform,
    campaignId,
    existingPost: existingPost
      ? existingPost
      : {
          campaign: { startDate: campaignStartDate, endDate: campaignEndDate },
        },
    // campaignStartDate,
      : {
        campaign: { startDate: campaignStartDate, endDate: campaignEndDate },
      },

    onClose,
  });

  const [facebookPageModalVisible, setFacebookPageModalVisible] =
    useState(false);

  const YOUTUBE_TYPES = [
    { label: "Standard Video", value: "VIDEO" },
    { label: "YouTube Short", value: "SHORT" },
  ] as const;


  const [postText, setPostText] = React.useState<string>("");
  const [postImageUrl, setPostImageUrl] = React.useState<string | undefined>(
    undefined,
  );

  const [userData, setUserData] = useState<any>(null);
  const [metaAccountModalVisible, setMetaAccountModalVisible] = useState(false);

  const [linkedinPostAs, setLinkedinPostAs] = useState<"PERSONAL" | "COMPANY" | null>(null);
  const [linkedinModalVisible, setLinkedinModalVisible] = useState(false);

  const openMetaBilling = (accountId: string) => {
    const url = `https://business.facebook.com/latest/billing_hub/payment_settings/?payment_account_id=${accountId}&nav_ref=bizweb_billing_hub_accounts_details_page&asset_id=${accountId}&placement=standalone`;
    Linking.openURL(url);
  };

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
  const renderAttachmentItem = ({ item }: any) => {
    const isImage =
      item.type?.startsWith("image/") || item.type === "image";
    const isVideo =
      item.type?.startsWith("video/") || item.type === "video";

    return (
      <View style={{ width: 60, height: 60, position: "relative" }}>
        { }
        <View
          className="overflow-hidden rounded-lg bg-gray-200"
          style={{
            width: 60,
            height: 60,
            backgroundColor: isDark ? "#1f2937" : "#e5e7eb",
          }}
        >
          {isImage ? (
            <Image
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : isVideo ? (
            <View style={{ width: "100%", height: "100%" }}>
              <Video
                source={{ uri: item.uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted
              />
              <View className="absolute inset-0 items-center justify-center bg-black/20">
                <Ionicons name="play-circle" size={24} color="#fff" />
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons
                name="document-outline"
                size={24}
                color={isDark ? "#9ca3af" : "#4b5563"}
              />
            </View>
          )}

          { }
          {item.uploading && (
            <View className="absolute inset-0 items-center justify-center bg-black/60">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white text-[10px] font-bold mt-1">
                {Math.min(item.progress || 0, 100)}%
              </Text>
            </View>
          )}
        </View>

        { }
        <TouchableOpacity
          onPress={() => handleRemoveAttachment(item.uploadedUrl ?? item.uri)}
          onPress={() =>
            item.uploading
              ? Alert.alert("Wait", "Please wait for upload to complete")
              : handleRemoveAttachment(item.uploadedUrl ?? item.uri)
          }
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            zIndex: 10,
            backgroundColor: "#fff",
            borderRadius: 10,
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1.41,
          }}
        >
          <Ionicons
            name={item.uploading ? "hourglass-outline" : "close-circle"}
            size={20}
            color={item.uploading ? "#0668E1" : "#dc2626"}
          />
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
      <ScrollView style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
        <View
          className="flex-1"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        >
          { }
          <Text
            style={{
              color: isDark ? "#ffffff" : "#000000",
              fontWeight: "bold",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Quick start with template
          </Text>
          <TouchableOpacity
            onPress={() => setTemplateModalVisible(true)}
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#d1d5db",
              borderRadius: 9999,
              paddingHorizontal: 12,
              height: 48,
              marginBottom: 16,
              backgroundColor: isDark ? "#161618" : "#ffffff",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: selectedTemplate
                  ? isDark
                    ? "#e5e7eb"
                    : "#111111"
                  : isDark
                    ? "#9ca3af"
                    : "#6b7280",
                fontSize: 13,
              }}
            >
              {selectedTemplate
                ? selectedTemplate.name
                : "None (Start from scratch)"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>

          { }
          <Modal
            visible={templateModalVisible}
            transparent
            animationType="fade"
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
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  borderRadius: 16,
                  padding: 16,
                  maxHeight: "80%",
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: isDark ? "#ffffff" : "#000000",
                    }}
                  >
                    Select Template
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTemplateModalVisible(false)}
                  >
                    <Ionicons
                      name="close"
                      size={24}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  </TouchableOpacity>
                </View>

                {loadingTemplates ? (
                  <ActivityIndicator
                    size="large"
                    color="#dc2626"
                    style={{ marginVertical: 40 }}
                  />
                ) : (
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => {
                        handleSelectTemplate(null);
                        setTemplateModalVisible(false);
                      }}
                      style={{
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? "#ffffff" : "#000000",
                          fontWeight: "600",
                        }}
                      >
                        None (Restore original)
                      </Text>
                      {!selectedTemplate && (
                        <Ionicons name="checkmark" size={20} color="#dc2626" />
                      )}
                    </TouchableOpacity>

                    {templates.map((tpl) => (
                      <TouchableOpacity
                        key={tpl.id}
                        onPress={() => {
                          handleSelectTemplate(tpl);
                          setTemplateModalVisible(false);
                        }}
                        style={{
                          paddingVertical: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: isDark ? "#374151" : "#f3f4f6",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: isDark ? "#ffffff" : "#000000",
                              fontWeight: "600",
                            }}
                          >
                            {tpl.name}
                          </Text>
                          {tpl.description && (
                            <Text
                              style={{
                                color: isDark ? "#9ca3af" : "#6b7280",
                                fontSize: 12,
                                marginTop: 2,
                              }}
                            >
                              {tpl.description}
                            </Text>
                          )}
                        </View>
                        {selectedTemplate?.id === tpl.id && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#dc2626"
                          />
                        )}
                      </TouchableOpacity>
                    ))}

                    {templates.length === 0 && (
                      <View
                        style={{ paddingVertical: 40, alignItems: "center" }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={40}
                          color={isDark ? "#374151" : "#d1d5db"}
                        />
                        <Text
                          style={{
                            color: isDark ? "#9ca3af" : "#6b7280",
                            marginTop: 10,
                          }}
                        >
                          No templates found for this platform.
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {platformState === "EMAIL" && (
            <>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontWeight: "bold",
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                Sender Email
              </Text>
              <TextInput
                placeholder="sender@eg.com"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={senderEmail}
                onChangeText={setSenderEmail}
                keyboardType="email-address"
                className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white"
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  height: 48,
                  marginBottom: 16,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  color: isDark ? "#e5e7eb" : "#111111",
                }}
              />
            </>
          )}

          { }
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
                {platformState === "EMAIL" ? "Subject" : "Title"}
              </Text>

              <TextInput
                placeholder={
                  platformState === "EMAIL" ? "Enter subject" : "Enter title"
                }
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                value={subject}
                onChangeText={setSubject}
                className="border border-gray-300 rounded-full px-3 h-12 mb-2 bg-white"
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 9999,
                  paddingHorizontal: 12,
                  height: 48,
                  marginBottom: 16,
                  backgroundColor: isDark ? "#161618" : "#ffffff",
                  color: isDark ? "#e5e7eb" : "#111111",
                }}
              />
            </>
          )}

          { }
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

          { }
          <Text
            style={{
              color: isDark ? "#ffffff" : "#000000",
              fontWeight: "bold",
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            Message
          </Text>
          <TextInput
            placeholder={`Enter your ${platformState} content here...`}
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="border border-gray-300 rounded-lg p-3 mb-2 min-h-[120px] bg-white"
            style={{
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#d1d5db",
              borderRadius: 12,
              padding: 12,
              marginBottom: 8,
              minHeight: 120,
              backgroundColor: isDark ? "#161618" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#111111", // text color
            }}
          />

          {/* AI IMAGE BUTTON */}
          {platformState !== "SMS" && platformState !== "YOUTUBE" && (
              color: isDark ? "#e5e7eb" : "#111111",
            }}
          />

          {platformState === "EMAIL" && (
            <View style={{ marginBottom: 16, marginTop: 4 }}>
              <Text
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  fontSize: 12,
                  marginBottom: 8,
                  fontWeight: "600",
                  marginLeft: 4,
                }}
              >
                Insert variables:
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {["{{name}}", "{{email}}", "{{phone}}", "{{company}}"].map(
                  (variable) => (
                    <TouchableOpacity
                      key={variable}
                      onPress={() =>
                        setMessage((prev) => {
                          if (!prev) return variable;
                          const trimmed = prev.trimEnd();
                          if (trimmed.endsWith("}")) {
                            return trimmed + ", " + variable;
                          }
                          return (prev.endsWith(" ") ? prev : prev + " ") + variable;
                        })
                      }
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? "#e5e7eb" : "#374151",
                          fontSize: 12,
                          fontWeight: "500",
                        }}
                      >
                        {variable}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
              <Text
                style={{
                  color: isDark ? "#6b7280" : "#9ca3af",
                  fontSize: 10,
                  marginTop: 6,
                  marginLeft: 4,
                }}
              >
                Variables will be replaced with actual contact data when sent.
              </Text>
            </View>
          )}
          {platformState !== "SMS" && (
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
                marginBottom: 16,
                marginTop: 8,
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

          { }
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
                  { }
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

                  { }
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
                {loadingAI ? (
                  <View
                    style={{
                      height: 150,
                      justifyContent: "center",
                      alignItems: "center",
                      marginVertical: 20,
                      borderRadius: 12,
                    }}
                  >
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text
                      style={{
                        marginTop: 12,
                        fontWeight: "bold",
                        color: "#000",
                      }}
                    >
                      Generating AI suggestions...
                    </Text>
                  </View>
                ) : aiResults.length > 0 ? (
                  <FlatList
                    data={aiResults}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setMessage(item.content);
                          setSubject(item.subject);
                          setAiModalVisible(false);
                        }}
                        style={{
                          backgroundColor: "#f3f3f3",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontWeight: "bold" }}>
                          {item.subject}
                        </Text>
                        <Text>{item.content}</Text>
                      </TouchableOpacity>
                    )}
                  />
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

          { }
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
                  { }
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

                  { }
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

                { }
                {loadingImage ? (
                  <View
                    style={{
                      height: 150,
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
                          { }
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

          { }
          {platformState !== "SMS" && (
            <View style={{ marginBottom: 20 }}>
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
                  : platformState === "EMAIL"
                    ? "Attachments (Images / Videos / Files)"
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
                      marginRight: 12,
                      marginTop: 8,
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
                      backgroundColor: isDark ? "#1e3a8a" : "#dbeafe",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                      marginTop: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={isDark ? "#fff" : "#2563eb"}
                      />
                    ) : (
                      <Ionicons
                        name="add"
                        size={28}
                        color={isDark ? "#fff" : "#2563eb"}
                      />
                    )}
                  </TouchableOpacity>
                }
              />
            </View>
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

          {(platformState === "FACEBOOK" || platformState === "INSTAGRAM") && (
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
              { }
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="logo-facebook"
                  size={22}
                  color="#1877F2"
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    fontWeight: "bold",
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Select Facebook Page
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
              { }
              {isFacebookPageLoading ? (
                <ActivityIndicator size="small" color="#1877F2" />
              ) : facebookPages.length > 0 ? (
                <>
                  <TouchableOpacity
                    onPress={() => setFacebookPageModalVisible(true)}
                    style={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderRadius: 12,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: isDark ? "#374151" : "#e5e7eb",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: selectedFacebookPage
                          ? isDark ? "#e5e7eb" : "#000000"
                          : isDark ? "#9ca3af" : "#6b7280",
                        fontWeight: "600",
                      }}
                    >
                      {selectedFacebookPage?.name || "Select a page"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={isDark ? "#9ca3af" : "#6b7280"}
                    />
                  </TouchableOpacity>

                  { }
                  <Modal
                    visible={facebookPageModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setFacebookPageModalVisible(false)}
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
                          borderRadius: 16,
                          padding: 16,
                          maxHeight: "70%",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "bold",
                              color: isDark ? "#fff" : "#000",
                            }}
                          >
                            Select Facebook Page
                          </Text>
                          <TouchableOpacity
                            onPress={() => setFacebookPageModalVisible(false)}
                          >
                            <Ionicons
                              name="close"
                              size={24}
                              color={isDark ? "#fff" : "#000"}
                            />
                          </TouchableOpacity>
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
                        <FlatList
                          data={facebookPages}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => {
                            const isSelected = selectedFacebookPage?.id === item.id;
                            return (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedFacebookPage(item);
                                  setFacebookPageModalVisible(false);
                                }}
                                style={{
                                  padding: 16,
                                  borderRadius: 12,
                                  marginBottom: 10,
                                  backgroundColor: isSelected
                                    ? isDark
                                      ? "#1e3a8a"
                                      : "#eff6ff"
                                    : isDark
                                      ? "#111827"
                                      : "#f9fafb",
                                  borderWidth: 1,
                                  borderColor: isSelected
                                    ? "#0668E1"
                                    : isDark
                                      ? "#374151"
                                      : "#e5e7eb",
                                }}
                              >
                                <Text
                                  style={{
                                    fontWeight: "600",
                                    color: isDark ? "#fff" : "#000",
                                  }}
                                >
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                </>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#f87171",
                  }}
                >
                  No Facebook Pages found. Make sure you've connected your
                  account and granted permissions.
                </Text>
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
              { }
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Posts will be published to the selected page.
              </Text>

              {selectedFacebookPage && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: isDark ? "#374151" : "#e5e7eb",
                    paddingTop: 16,
                    marginTop: 16,
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#ffffff" : "#000000",
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Select a lead form
                  </Text>

                  <TouchableOpacity
                    onPress={() => setLeadFormModalVisible(true)}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: isDark ? "#374151" : "#d1d5db",
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: isDark ? "#161618" : "#fff",
                    }}
                  >
                    <Text
                      style={{
                        color: selectedLeadForm
                          ? isDark ? "#fff" : "#000"
                          : isDark ? "#9ca3af" : "#6b7280",
                      }}
                    >
                      {selectedLeadForm?.name || "No lead form"}
                    </Text>
                    {isLeadFormLoading ? (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    ) : (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                      />
                    )}
                  </TouchableOpacity>

                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: isDark ? "#9ca3af" : "#6b7280",
                      lineHeight: 18,
                    }}
                  >
                    Lead forms allow you to collect contact information directly from the post. Manage your lead forms in Leads Management.
                  </Text>

                  <Modal
                    visible={leadFormModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setLeadFormModalVisible(false)}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => setLeadFormModalVisible(false)}
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        padding: 20,
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={1}
                        style={{
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 16,
                          padding: 16,
                          maxHeight: "70%",
                        }}
                      >
                        <View style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                        }}>
                          <Text style={{ fontSize: 18, fontWeight: "bold", color: isDark ? "#fff" : "#000" }}>
                            Select Lead Form
                          </Text>
                          <TouchableOpacity onPress={() => setLeadFormModalVisible(false)}>
                            <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
                          </TouchableOpacity>
                        </View>

                        <FlatList
                          data={[{ id: "none", name: "No lead form" }, ...allLeadForms]}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => {
                            const isSelected = (!selectedLeadForm && item.id === "none") || (selectedLeadForm?.id === item.id);
                            return (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedLeadForm(item.id === "none" ? null : item);
                                  setLeadFormModalVisible(false);
                                }}
                                style={{
                                  padding: 16,
                                  borderRadius: 12,
                                  marginBottom: 10,
                                  backgroundColor: isSelected ? (isDark ? "#1e3a8a" : "#eff6ff") : (isDark ? "#111827" : "#f9fafb"),
                                  borderWidth: 1,
                                  borderColor: isSelected ? "#3b82f6" : (isDark ? "#374151" : "#e5e7eb"),
                                }}
                              >
                                <Text style={{ fontWeight: "600", color: isDark ? "#fff" : "#000" }}>
                                  {item.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </Modal>
                </View>
              )}
            </View>
          )}

          { }
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
              { }
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
                { }
                <TouchableOpacity
                  onPress={() => setFacebookContentType("STANDARD")}
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

                { }
                <TouchableOpacity
                  onPress={() => setFacebookContentType("REEL")}
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

              { }
              {facebookContentType === "REEL" && (
                <View style={{ marginTop: 12 }}>
                  { }
                  <Text
                    style={{
                      color: isDark ? "#ffffff" : "#000000",
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    Cover Image (Optional)
                  </Text>

                  { }
                  <TouchableOpacity
                    disabled={coverUploading}
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
                      opacity: coverUploading ? 0.6 : 1,
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

                  { }
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

                  { }
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
              { }
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

              { }
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
                  { }
                  {youTubeContentType === "PLAYLIST" && (
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
                      { }
                      <TouchableOpacity
                        onPress={() =>
                          setShowPlaylistDropdown(!showPlaylistDropdown)
                        }
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: isDark ? "#161618" : "#ffffff",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              selectedPlaylist || isCreatingPlaylist
                                ? isDark
                                  ? "#ffffff"
                                  : "#000"
                                : "#9ca3af",
                          }}
                        >
                          {isCreatingPlaylist
                            ? "Creating New Playlist..."
                            : selectedPlaylist
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

                      { }
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
                          { }
                          <TouchableOpacity
                            onPress={() => {
                              setIsCreatingPlaylist(true);
                              setShowPlaylistDropdown(false);
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
                          { }
                          {playlists.map((playlist) => (
                            <TouchableOpacity
                              key={playlist.id}
                              onPress={() => {
                                setSelectedPlaylist(playlist);
                                setShowPlaylistDropdown(false);
                                setIsCreatingPlaylist(false);
                              }}
                              style={{
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: isDark
                                  ? "#374151"
                                  : "#d1d5db",
                              }}
                            >
                              <Text
                                style={{
                                  color: isDark ? "#ffffff" : "#000000",
                                }}
                              >
                                {playlist.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* New Playlist Form */}
                      { }
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
                          { }
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              { }
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

              { }
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

              { }
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000",
                  fontWeight: "bold",
                  marginBottom: 8,
                }}
              >
                Custom Thumbnail
              </Text>

              <TouchableOpacity
                onPress={handleCustomThumbnailUpload}
                style={{
                  backgroundColor: isDark ? "#1e3a8a" : "#dbeafe",
                  paddingVertical: 12,
                  borderRadius: 9999,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: isDark ? "#ffffff" : "#2563eb",
                    fontWeight: "bold",
                  }}
                >
                  Upload Thumbnail
                </Text>
              </TouchableOpacity>

              { }
              {customThumbnail && (
                <Image
                  source={{ uri: customThumbnail }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    marginBottom: 16,
                    resizeMode: "cover",
                    borderWidth: 1,
                    borderColor: isDark ? "#ffffff" : "#000",
                  }}
                />
              )}
            </View>
          )}

          {platformState === "PINTEREST" && (
            <View style={{ borderRadius: 8 }}>
              { }
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

              { }
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                { }
                <Text
                  style={{
                    fontWeight: "600",
                    marginBottom: 8,
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                >
                  Select Board
                </Text>
                { }
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

                { }
                <Modal
                  visible={pinterestModalVisible}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setPinterestModalVisible(false)}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      justifyContent: "center",
                      padding: 20,
                    }}
                    activeOpacity={1}
                    onPress={() => setPinterestModalVisible(false)}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderRadius: 12,
                        maxHeight: "80%",
                        padding: 16,
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <Text style={{ fontWeight: "bold", fontSize: 18, color: isDark ? "#ffffff" : "#000000" }}>
                          Select Board
                        </Text>
                        <TouchableOpacity onPress={() => setPinterestModalVisible(false)}>
                          <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#000000"} />
                        </TouchableOpacity>
                      </View>
                      { }
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

                      { }
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

                      { }
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
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>

                { }
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

                    padding: 10,
                    marginBottom: 8,
                    color: isDark ? "#ffffff" : "#000000",
                  }}
                />
              </View>

              { }
              {isCreatingPinterestBoard && (
                <Modal
                  visible={pinterestModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setPinterestModalVisible(false)}
                >
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 20,
                    }}
                    activeOpacity={1}
                    onPress={() => setPinterestModalVisible(false)}
                  >
                    <TouchableOpacity
                      activeOpacity={1}
                      style={{
                        width: "100%",
                        backgroundColor: isDark ? "#161618" : "#fff",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDark ? "#fff" : "#d1d5db",
                        padding: 16,
                      }}
                    >
                      { }
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 20,
                            color: isDark ? "#ffffff" : "#000000",
                            flex: 1,
                          }}
                        >
                          Create New Pinterest Board
                        </Text>
                        <TouchableOpacity onPress={() => setIsCreatingPinterestBoard(false)}>
                          <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#000000"} />
                        </TouchableOpacity>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          color: isDark ? "#9ca3af" : "#6b7280",
                          marginBottom: 16,
                        }}
                      >
                        Create a new board to organize your pins
                      </Text>

                      { }
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

                      { }
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

                      { }
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
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              )}
            </View>
          )}

          { }
          {(platformState === "FACEBOOK" || platformState === "INSTAGRAM") && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                backgroundColor: isDark ? "#111827" : "#faebed",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <View>
                  <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>
                    Meta Boosting
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>
                    Reach more people on Facebook & Instagram
                  </ThemedText>
                </View>
                <Switch
                  value={isBoosting}
                  onValueChange={setIsBoosting}
                  trackColor={{ false: "#767577", true: "#0668E1" }}
                  thumbColor={isBoosting ? "#ffffff" : "#f4f3f4"}
                />
              </View>

              {isBoosting && (
                <View>
                  <ThemedText
                    style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}
                  >
                    Ad Account
                  </ThemedText>
                  {loadingMetaAccounts ? (
                    <ActivityIndicator
                      size="small"
                      color="#0668E1"
                      style={{ marginVertical: 10 }}
                    />
                  ) : metaAccounts.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => setMetaAccountModalVisible(true)}
                      style={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        marginBottom: 16,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View>
                        <ThemedText style={{ fontWeight: "600" }}>
                          {selectedMetaAccount?.name}
                        </ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                          {selectedMetaAccount?.currency} • ID:{" "}
                          {selectedMetaAccount?.account_id}
                        </ThemedText>
                      </View>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isDark ? "#9ca3af" : "#6b7280"}
                      />
                    </TouchableOpacity>
                  ) : (
                    <ThemedText
                      style={{
                        fontSize: 13,
                        color: "#ef4444",
                        marginBottom: 16,
                      }}
                    >
                      No Ad accounts linked
                    </ThemedText>
                  )}

                  { }
                  {selectedMetaAccount && (
                    <View style={{ marginBottom: 20 }}>
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          marginBottom: 12,
                        }}
                      >
                        Financial Status
                      </ThemedText>

                      <View
                        style={{
                          flexDirection: "row",
                          gap: 10,
                          marginBottom: 16,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            openMetaBilling(selectedMetaAccount.account_id)
                          }
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 11,
                              opacity: 0.6,
                              marginBottom: 4,
                            }}
                          >
                            Available Funds
                          </ThemedText>
                          <ThemedText
                            style={{
                              fontSize: 15,
                              fontWeight: "bold",
                              color: "#6b7280",
                            }}
                          >
                            Not Linked
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() =>
                            openMetaBilling(selectedMetaAccount.account_id)
                          }
                          style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#e5e7eb",
                          }}
                        >
                          <ThemedText
                            style={{
                              fontSize: 11,
                              opacity: 0.6,
                              marginBottom: 4,
                            }}
                          >
                            Lifetime Spent
                          </ThemedText>
                          <ThemedText
                            style={{ fontSize: 15, fontWeight: "bold" }}
                          >
                            {selectedMetaAccount.currency} 0.00
                          </ThemedText>
                        </TouchableOpacity>
                      </View>

                      { }
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() =>
                            openMetaBilling(selectedMetaAccount.account_id)
                          }
                          style={{
                            flex: 1,
                            backgroundColor: "#0668E1",
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "600",
                              fontSize: 13,
                            }}
                          >
                            Add Funds
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            openMetaBilling(selectedMetaAccount.account_id)
                          }
                          style={{
                            flex: 1.2,
                            backgroundColor: isDark ? "#374151" : "#f3f4f6",
                            paddingVertical: 10,
                            borderRadius: 10,
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: isDark ? "#4b5563" : "#e5e7eb",
                          }}
                        >
                          <ThemedText
                            style={{ fontWeight: "600", fontSize: 13 }}
                          >
                            Link Payment Method
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  { }
                  <Modal
                    visible={metaAccountModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setMetaAccountModalVisible(false)}
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
                          borderRadius: 16,
                          padding: 16,
                          maxHeight: "70%",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <ThemedText
                            style={{ fontSize: 18, fontWeight: "bold" }}
                          >
                            Select Ad Account
                          </ThemedText>
                          <TouchableOpacity
                            onPress={() => setMetaAccountModalVisible(false)}
                          >
                            <Ionicons
                              name="close"
                              size={24}
                              color={isDark ? "#fff" : "#000"}
                            />
                          </TouchableOpacity>
                        </View>

                        <FlatList
                          data={metaAccounts}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedMetaAccount(item);
                                setMetaAccountModalVisible(false);
                              }}
                              style={{
                                padding: 16,
                                borderRadius: 12,
                                marginBottom: 10,
                                backgroundColor:
                                  selectedMetaAccount?.id === item.id
                                    ? isDark
                                      ? "#1e3a8a"
                                      : "#eff6ff"
                                    : isDark
                                      ? "#111827"
                                      : "#f9fafb",
                                borderWidth: 1,
                                borderColor:
                                  selectedMetaAccount?.id === item.id
                                    ? "#0668E1"
                                    : isDark
                                      ? "#374151"
                                      : "#e5e7eb",
                              }}
                            >
                              <ThemedText style={{ fontWeight: "600" }}>
                                {item.name}
                              </ThemedText>
                              <ThemedText
                                style={{ fontSize: 12, opacity: 0.7 }}
                              >
                                {item.currency} • {item.account_id}
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    </View>
                  </Modal>

                  { }
                  <ThemedText
                    style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}
                  >
                    Goal
                  </ThemedText>
                  <View
                    style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}
                  >
                    <TouchableOpacity
                      onPress={() => setBoostingGoal("POST_ENGAGEMENT")}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor:
                          boostingGoal === "POST_ENGAGEMENT"
                            ? "#0668E1"
                            : isDark
                              ? "#374151"
                              : "#e5e7eb",
                        backgroundColor:
                          boostingGoal === "POST_ENGAGEMENT"
                            ? isDark
                              ? "#1e3a8a"
                              : "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        Engagement
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 11,
                          textAlign: "center",
                          opacity: 0.7,
                        }}
                      >
                        Likes, Shares & Comments
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setBoostingGoal("LEADS")}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor:
                          boostingGoal === "LEADS"
                            ? "#0668E1"
                            : isDark
                              ? "#374151"
                              : "#e5e7eb",
                        backgroundColor:
                          boostingGoal === "LEADS"
                            ? isDark
                              ? "#1e3a8a"
                              : "#eff6ff"
                            : "transparent",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          textAlign: "center",
                        }}
                      >
                        Leads
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 11,
                          textAlign: "center",
                          opacity: 0.7,
                        }}
                      >
                        Customer Form Capture
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  { }
                  <View
                    style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}
                  >
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        Daily Budget
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#e5e7eb",
                        }}
                      >
                        <ThemedText style={{ opacity: 0.5 }}>
                          {selectedMetaAccount?.currency || "INR"}{" "}
                        </ThemedText>
                        <TextInput
                          value={String(dailyBudget)}
                          onChangeText={(v) => setDailyBudget(Number(v) || 0)}
                          keyboardType="numeric"
                          style={{
                            color: isDark ? "#fff" : "#000",
                            padding: 10,
                            flex: 1,
                            fontWeight: "bold",
                          }}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        Days
                      </ThemedText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#e5e7eb",
                        }}
                      >
                        <TextInput
                          value={String(boostingDuration)}
                          onChangeText={(v) =>
                            setBoostingDuration(Number(v) || 0)
                          }
                          keyboardType="numeric"
                          style={{
                            color: isDark ? "#fff" : "#000",
                            padding: 10,
                            flex: 1,
                            fontWeight: "bold",
                          }}
                        />
                        <ThemedText style={{ opacity: 0.5 }}>days</ThemedText>
                      </View>
                    </View>
                  </View>

                  { }
                  <View
                    style={{
                      backgroundColor: isDark ? "#1f2937" : "#f8fafc",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <ThemedText
                      style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}
                    >
                      Estimated Daily Reach
                    </ThemedText>
                    <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>
                      {estimatedReach.min.toLocaleString()} -{" "}
                      {estimatedReach.max.toLocaleString()}
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      people / day
                    </ThemedText>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: isDark ? "#374151" : "#e5e7eb",
                        marginVertical: 12,
                      }}
                    />

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>
                        Total Spend
                      </ThemedText>
                      <ThemedText
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#0668E1",
                        }}
                      >
                        {selectedMetaAccount?.currency || "INR"} {totalBudget}
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText
                    style={{
                      fontSize: 10,
                      opacity: 0.5,
                      fontStyle: "italic",
                      marginBottom: 16,
                    }}
                  >
                    * Estimates are based on Meta's historical performance data.
                    Figures are in your local account currency.
                  </ThemedText>

                  { }
                  <View
                    style={{
                      backgroundColor: isDark ? "#374151" : "#fffbeb",
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#f59e0b",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "bold",
                        color: "#b45309",
                        marginBottom: 4,
                      }}
                    >
                      Scheduled Auto-Boost
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: "#b45309" }}>
                      Since this post isn't published yet, CampZeo will
                      automatically apply these settings when the post goes live
                      on Meta.
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          )}

          {platformState === "LINKEDIN" && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontWeight: "bold",
                  marginBottom: 8,
                  fontSize: 16,
                  color: isDark ? "#ffffff" : "#000000",
                }}
              >
                Post as
              </Text>

              <TouchableOpacity
                onPress={() => setLinkedinModalVisible(true)}
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db",
                  backgroundColor: isDark ? "#161618" : "#fff",
                  borderRadius: 9999,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: linkedinPostAs ? (isDark ? "#e5e7eb" : "#000000") : (isDark ? "#9ca3af" : "#6b7280") }}>
                  {linkedinPostAs === "PERSONAL" ? (
                    [userData?.firstName, userData?.lastName].filter(Boolean).join(" ")
                      ? `Personal Profile (${[userData?.firstName, userData?.lastName].filter(Boolean).join(" ")})`
                      : "Personal Profile"
                  ) : "Select author"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
              </TouchableOpacity>

              <Modal
                visible={linkedinModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLinkedinModalVisible(false)}
              >
                <TouchableOpacity
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)",
                    padding: 20,
                  }}
                  activeOpacity={1}
                  onPress={() => setLinkedinModalVisible(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    style={{
                      width: "100%",
                      backgroundColor: isDark ? "#161618" : "#fff",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? "#374151" : "#d1d5db",
                      padding: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <Text style={{ fontWeight: "bold", fontSize: 20, color: isDark ? "#ffffff" : "#000000", flex: 1 }}>
                        Post as
                      </Text>
                      <TouchableOpacity onPress={() => setLinkedinModalVisible(false)}>
                        <Ionicons name="close" size={24} color={isDark ? "#ffffff" : "#000000"} />
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280", marginBottom: 16 }}>
                      Select the profile to post to.
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setLinkedinPostAs(linkedinPostAs === "PERSONAL" ? null : "PERSONAL");
                        setLinkedinModalVisible(false);
                      }}
                      style={{
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        marginBottom: 8,
                        backgroundColor: linkedinPostAs === "PERSONAL" ? (isDark ? "#1e3a8a" : "#eff6ff") : (isDark ? "#1f2937" : "#f3f4f6"),
                        borderWidth: 1,
                        borderColor: linkedinPostAs === "PERSONAL" ? "#3b82f6" : "transparent"
                      }}
                    >
                      <Text style={{ color: linkedinPostAs === "PERSONAL" ? "#2563eb" : (isDark ? "#e5e7eb" : "#000000"), fontWeight: linkedinPostAs === "PERSONAL" ? "bold" : "normal" }}>
                        {[userData?.firstName, userData?.lastName].filter(Boolean).join(" ")
                          ? `Personal Profile (${[userData?.firstName, userData?.lastName].filter(Boolean).join(" ")})`
                          : "Personal Profile"}
                      </Text>
                    </TouchableOpacity>


                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            </View>
          )}

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

          { }
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

                  Alert.alert(
                    "Invalid Time",
                    `Please select a future time (for example, ${futureTime} instead of ${currentTime}).`,
                  );
                  return;
                }
                  0,
                );

                setPostDate(selectedDateTime);
              }}
            />
          )}

          { }
          {showPicker && (
            <DateTimePicker
              value={postDate ?? minSelectableEndDate}
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
                    base.getMinutes(),
                  ),
                );

                setShowTimePicker(true);
              }}
            />
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          {platformState === "FACEBOOK" && (
            <Preview
              platform="facebook"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              onChangeText={setMessage}
              onRemoveMedia={handleRemoveAttachment}
              coverImage={coverImage || undefined}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "INSTAGRAM" && (
            <Preview
              platform="instagram"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              onRemoveMedia={handleRemoveAttachment}
              coverImage={coverImage || undefined}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "LINKEDIN" && (
            <Preview
              platform="linkedin"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              onRemoveMedia={handleRemoveAttachment}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "WHATSAPP" && (
            <Preview
              platform="whatsapp"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              onRemoveMedia={handleRemoveAttachment}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "EMAIL" && (
            <Preview
              platform="email"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              senderEmail={senderEmail}
              subject={subject}
              text={message}
              onRemoveMedia={handleRemoveAttachment}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "SMS" && (
            <Preview
              platform="sms"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              timestamp={previewTimestamp}
            />
          )}

          {platformState === "PINTEREST" && (
            <Preview
              platform="pinterest"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              images={attachments?.map((a) => a.uri)}
              // timestamp={previewTimestamp}
              onRemoveMedia={handleRemoveAttachment}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
            />
          )}

          {platformState === "YOUTUBE" && (
            <Preview
              platform="youtube"
              profilePic={user?.imageUrl}
              username={`${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`}
              text={message}
              onRemoveMedia={handleRemoveAttachment}
              images={attachments?.map((a) => a.uri)}
              media={attachments?.map((a) => ({ uri: a.uri, type: a.type, name: a.name, size: a.size }))}
              timestamp={previewTimestamp}
              youtubeContentType={youTubeContentType}
              coverImage={customThumbnail ?? undefined}
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
          className="rounded-full mb-8 px-4 py-3 flex-row justify-center items-center"
          style={{
            backgroundColor: "#dc2626",
            borderRadius: 50,
            height: 48,
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

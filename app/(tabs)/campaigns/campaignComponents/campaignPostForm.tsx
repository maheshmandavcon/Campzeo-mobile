import { getUser } from "@/api/dashboardApi";
import { useCampaignPostForm } from "@/hooks/useCampaignPostForm";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@gluestack-ui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from '@react-native-picker/picker';
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import Preview from "./preview";

// ---------- Define Props Interface ----------
interface CampaignPostFormProps {
  platform: "EMAIL" | "SMS" | "INSTAGRAM" | "WHATSAPP" | "FACEBOOK" | "YOUTUBE" | "LINKEDIN" | "PINTEREST";
  existingPost?: any;
  campaignId?: string;
  onClose?: () => void;
}

const CampaignPostForm: React.FC<CampaignPostFormProps> = ({
  platform,
  existingPost = null,
  campaignId,
  onClose,
}) => {
  const isDark = useColorScheme() === "dark";

  const {
    // state
    platform: platformState, senderEmail, subject, message, attachments, postDate, loading, previewTimestamp,

    aiModalVisible, aiPrompt, aiResults, loadingAI, imageLoadingMap,

    imageModalVisible, imagePrompt, generatedImages, loadingImage,

    facebookPages, selectedFacebookPage, facebookContentType, isFacebookPageLoading, coverImage, coverUploading,

    youTubeContentType, youTubeTags, youTubeStatus, showStatusDropdown, isCreatingPlaylist, customThumbnail, playlistId, playlistTitle,
    playlists, showPlaylistDropdown, selectedPlaylist, newPlaylistName, selectedAccount,

    pinterestBoard, destinationLink, isCreatingPinterestBoard, pinterestModalVisible, newPinterestBoard, pinterestDescription, isPinterestBoardLoading, allPinterestBoards, loadingBoards,

    showPicker, showTimePicker,

    // setters
    setSenderEmail, setSubject, setMessage, setPostDate, setAiModalVisible, setAiPrompt, setImageModalVisible, setImagePrompt, setAttachments, setFacebookContentType, setYouTubeContentType, setYouTubeTags, setYouTubeStatus, setShowStatusDropdown, setIsCreatingPlaylist, setPlaylistId,
    setPlaylistTitle, setIsCreatingPinterestBoard, setPinterestBoard, setPinterestBoardId, setPinterestModalVisible, setNewPinterestBoard, setPinterestDescription, setDestinationLink, setShowPicker, setShowTimePicker, setImageLoadingMap, setSelectedAccount, setShowPlaylistDropdown, setSelectedPlaylist, setNewPlaylistName,

    // handlers
    handleSubmit, handleAddAttachment, handleRemoveAttachment, handleGenerateAIText, handleGenerateAIImage, handleCoverImageUpload, handleCustomThumbnailUpload, handleCreatePinterestBoard,
  } = useCampaignPostForm({
    platform,
    campaignId,
    existingPost,
    onClose,
  });

  const YOUTUBE_TYPES = [
    { label: "Standard Video", value: "VIDEO" },
    { label: "YouTube Short", value: "SHORT" },
    { label: "Playlist", value: "PLAYLIST" },
  ] as const;

  const linkedinAccounts = [
    { id: "1", name: "Company Page" },
    { id: "2", name: "Personal Profile" },
  ];

  const [postText, setPostText] = React.useState<string>(""); // post text input
  const [postImageUrl, setPostImageUrl] = React.useState<string | undefined>(undefined); // optional image

  const [userData, setUserData] = useState<any>(null);

  // ================= RENDER ATTACHMENTS =================

  const renderAttachmentItem = ({ item, index }: any) => {
    const isImage = item.type.startsWith("image/");
    const isVideo = item.type.startsWith("video/");

    return (
      <View
        className="flex-row items-center bg-gray-200 rounded-lg px-2 py-1 mr-2 mb-2"
      >
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
              resizeMode={ResizeMode.COVER}
              shouldPlay={true} // only first frame
              isMuted
              useNativeControls={false}
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

        <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
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
        <View className="flex-1"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>

          {platformState === "EMAIL" && (
            <>
              <Text style={{
                color: isDark ? "#ffffff" : "#000000",
                fontWeight: "bold",
                marginBottom: 8,
                marginLeft: 4,
              }}>
                Sender Email</Text>
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

          {/* SUBJECT */}
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
                  platformState === "EMAIL"
                    ? "Enter subject"
                    : "Enter title"
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

          {/* AI TEXT BUTTON FOR ALL PLATFORMS */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#dc2626",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 25,
              marginBottom: 8,
            }}
          >
            <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
              Text Generate AI Assistant
            </Text>
          </TouchableOpacity>

          {/* MESSAGE */}
          <Text style={{
            color: isDark ? "#ffffff" : "#000000",
            fontWeight: "bold",
            marginBottom: 8,
            marginLeft: 4,
          }}>Message</Text>
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
          {platformState !== "SMS" && (
            <TouchableOpacity
              onPress={() => setImageModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2563eb",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 25,
                marginBottom: 8,
                marginTop: 8,
              }}
            >
              <Ionicons
                name="sparkles"
                size={24}
                color="#fff"
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Image Generate AI Assistant
              </Text>
            </TouchableOpacity>
          )}

          {/* AI TEXT MODAL */}
          <Modal visible={aiModalVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
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
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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

                {loadingAI ? (
                  <View
                    style={{
                      height: 150, // fixed height
                      justifyContent: "center",
                      alignItems: "center",
                      marginVertical: 20,
                      borderRadius: 12,
                    }}
                  >
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: "#000" }}>
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
                        <Text style={{ fontWeight: "bold" }}>{item.subject}</Text>
                        <Text>{item.content}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <Text style={{ textAlign: "center", color: "#555", marginVertical: 12 }}>
                    No AI suggestions yet. Enter a prompt and tap Generate.
                  </Text>
                )}

                <Button onPress={() => setAiModalVisible(false)} style={{ backgroundColor: "#dc2626", marginTop: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
                </Button>
              </View>
            </View>
          </Modal>

          {/* AI IMAGE MODAL */}
          <Modal visible={imageModalVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
              <View style={{
                backgroundColor: isDark ? "#161618" : "#ffffff", // dark/light background
                borderRadius: 12,
                padding: 16,
                maxHeight: "70%",
                borderWidth: 1,
                borderColor: isDark ? "#ffffff" : "#d1d5db", // white border in dark, gray in light
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                  {/* AI Image Prompt Input */}
                  <TextInput
                    value={imagePrompt}
                    onChangeText={setImagePrompt}
                    placeholder="Enter prompt to generate image"
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray placeholder
                    style={{
                      flex: 1,
                      borderWidth: 1,
                      borderColor: isDark ? "#4b5563" : "#d1d5db", // dark/light border
                      borderRightWidth: 0, // connect with button
                      borderTopLeftRadius: 25,
                      borderBottomLeftRadius: 25,
                      paddingHorizontal: 16,
                      height: 48,
                      backgroundColor: isDark ? "#161618" : "#ffffff", // dark/light background
                      color: isDark ? "#ffffff" : "#000000", // text color
                    }}
                  />

                  {/* Generate Image Button */}
                  <TouchableOpacity
                    disabled={loadingImage}
                    onPress={handleGenerateAIImage}
                    style={{
                      backgroundColor: loadingImage
                        ? isDark ? "#4b5563" : "#aaa" // gray in dark mode when loading
                        : isDark ? "#1e40af" : "#2563eb", // dark blue in dark, blue in light
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
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: isDark ? "#fff" : "#000" }}>Generating image...</Text>
                  </View>
                ) : generatedImages.length > 0 ? (
                  <FlatList
                    data={generatedImages}
                    keyExtractor={(item, index) => item || index.toString()}
                    horizontal
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          // Add clicked image to attachments
                          setAttachments((prev) => [
                            ...prev,
                            {
                              uri: item,
                              name: "ai-image.jpg",
                              type: "image/jpeg",
                              uploading: false,
                            },
                          ]);
                          setImageModalVisible(false);
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

                          <Image
                            source={{ uri: item }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 6,
                              opacity: imageLoadingMap[item] ? 0 : 1,
                            }}
                            resizeMode="cover"
                            onLoadEnd={() =>
                              setImageLoadingMap((prev: Record<string, boolean>) => ({
                                ...prev,
                                [item]: false,
                              }))
                            }
                            onError={() => {
                              console.log("Image failed to load", item);
                              setImageLoadingMap((prev: Record<string, boolean>) => ({
                                ...prev,
                                [item]: false,
                              }));
                            }}
                          />
                        </View>

                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <Text style={{ color: "#555", marginVertical: 8 }}>No images yet. Enter a prompt and generate.</Text>
                )}

                <Button onPress={() => setImageModalVisible(false)} style={{ backgroundColor: "#dc2626", marginTop: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
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

              <FlatList
                data={attachments}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, index) => String(index)}
                renderItem={renderAttachmentItem}
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


          {platformState === "LINKEDIN" && (
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
              {/* Header with Icon */}
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

              {/* Dropdown */}
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

                  {/* 🔹 Placeholder */}
                  <Picker.Item
                    label="Select author"
                    value={null}
                    enabled={false}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />

                  {/* 🔹 Actual accounts */}
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
          )}

          {platformState === "FACEBOOK" && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                backgroundColor: isDark ? "#161618" : "#f3f4f6"
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

              {/* 🔄 Loading / Pages / Error */}
              {isFacebookPageLoading ? (
                <ActivityIndicator size="small" color="#1877F2" />
              ) : facebookPages.length > 0 ? (
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#e5e7eb" : "#000000",
                  }}
                >
                  {selectedFacebookPage || facebookPages[0].name}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#f87171",
                  }}
                >
                  No Facebook Pages found. Make sure you've connected your account and granted permissions.
                </Text>
              )}

              {/* ℹ️ Helper Text */}
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                Posts will be published to the selected page.
              </Text>
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

              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {/* Standard Post */}
                <TouchableOpacity
                  onPress={() => setFacebookContentType("STANDARD")}
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
                    onPress={handleCoverImageUpload}
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
                        <ActivityIndicator size="small" color={isDark ? "#fff" : "#2563eb"} style={{ marginRight: 6 }} />
                        <Text style={{ color: isDark ? "#fff" : "#2563eb", fontWeight: "bold", fontSize: 12 }}>
                          Uploading…
                        </Text>
                      </>
                    ) : (
                      <Text style={{ color: isDark ? "#fff" : "#2563eb", fontWeight: "bold", fontSize: 12 }}>
                        Upload Cover
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Preview */}
                  {coverImage && !coverUploading && (
                    <Image
                      source={{ uri: coverImage }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        marginTop: 8,
                        borderWidth: 1,
                        borderColor: isDark ? "#fff" : "#000",
                      }}
                      resizeMode="cover"
                    />
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
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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

                  {/* Playlist Button */}
                  {youTubeContentType === "PLAYLIST" && (
                    <View style={{ marginTop: 12 }}>
                      {/* Dropdown Button */}
                      <TouchableOpacity
                        onPress={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
                        style={{
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: isDark ? "#161618" : "#ffffff",
                        }}
                      >
                        <Text style={{ color: selectedPlaylist || isCreatingPlaylist ? (isDark ? "#ffffff" : "#000") : "#9ca3af" }}>
                          {isCreatingPlaylist
                            ? "Creating New Playlist..."
                            : selectedPlaylist
                              ? selectedPlaylist.name
                              : "Select a playlist"}
                        </Text>
                      </TouchableOpacity>

                      {/* Dropdown List */}
                      {showPlaylistDropdown && !isCreatingPlaylist && (
                        <View
                          style={{
                            marginTop: 8,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#d1d5db",
                            borderRadius: 8,
                            backgroundColor: isDark ? "#1f2933" : "#f3f4f6",
                          }}
                        >
                          {/* + Create New Playlist Button */}
                          <TouchableOpacity
                            onPress={() => {
                              setIsCreatingPlaylist(true);
                              setShowPlaylistDropdown(false); // hide dropdown
                            }}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: isDark ? "#374151" : "#d1d5db",
                              backgroundColor: isDark ? "#161618" : "#ffffff",
                            }}
                          >
                            <Text style={{ color: "#2563eb", fontWeight: "bold" }}>+ Create New Playlist</Text>
                          </TouchableOpacity>

                          {/* Existing Playlists */}
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
                                borderBottomColor: isDark ? "#374151" : "#d1d5db",
                              }}
                            >
                              <Text style={{ color: isDark ? "#ffffff" : "#000000" }}>{playlist.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {/* New Playlist Input */}
                      {isCreatingPlaylist && (
                        <View style={{ marginTop: 12 }}>
                          <TextInput
                            placeholder="Enter playlist name"
                            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
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
                              marginBottom: 8,
                            }}
                          />
                          {/* <TouchableOpacity
          onPress={() => {
            // call your create playlist handler here
            handleCreatePlaylist?.();
            setIsCreatingPlaylist(false);
            setNewPlaylistName("");
          }}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#2563eb",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
            Create Playlist
          </Text>
        </TouchableOpacity> */}
                        </View>
                      )}
                    </View>
                  )}

                </View>
              </View>

              {/* ---------- Tags ---------- */}
              <Text style={{ color: isDark ? "#ffffff" : "#000", fontWeight: "bold", marginBottom: 8 }}>
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
              <Text style={{ color: isDark ? "#ffffff" : "#000", fontWeight: "bold", marginBottom: 8 }}>
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
                      <Text style={{ color: isDark ? "#e5e7eb" : "#000" }}>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ---------- Thumbnail ---------- */}
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

              {/* ---------- Show Preview ---------- */}
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
              {/* Pinterest Settings Heading */}
              <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 16, color: isDark ? "#ffffff" : "#000000" }}>
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
                <Text style={{ fontWeight: "600", marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
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
                            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
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
                            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
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
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>Create</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Existing Boards List */}
                      <View style={{ maxHeight: 250 }}>
                        {loadingBoards ? (
                          <ActivityIndicator size="small" color="#2563eb" style={{ margin: 20 }} />
                        ) : allPinterestBoards.length === 0 ? (
                          <Text style={{ color: isDark ? "#e5e7eb" : "#000", margin: 12 }}>
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
                                  setPinterestBoardId(item.id)
                                  setPinterestBoard(item.name);
                                  setIsCreatingPinterestBoard(false);
                                  setPinterestModalVisible(false);
                                }}
                                style={{
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  borderRadius: 8,
                                  marginBottom: 6,
                                  backgroundColor: isDark ? "#161618" : "#f3f4f6",
                                }}
                              >
                                <Text style={{ color: isDark ? "#e5e7eb" : "#000000" }}>{item.name}</Text>
                              </TouchableOpacity>
                            )}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </Modal>

                {/* Destination Link */}
                <Text style={{ fontWeight: "600", marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
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
                      <Text style={{ fontWeight: "bold", fontSize: 20, color: isDark ? "#ffffff" : "#000000" }}>
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
                      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
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
                      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
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
                      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                        <TouchableOpacity onPress={() => setPinterestModalVisible(false)} style={{ marginRight: 16 }}>
                          <Text style={{ color: isDark ? "#9ca3af" : "#6b7280", fontWeight: "bold" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleCreatePinterestBoard} disabled={isPinterestBoardLoading}>
                          {isPinterestBoardLoading ? (
                            <ActivityIndicator size="small" color="#2563eb" />
                          ) : (
                            <Text style={{ color: "#2563eb", fontWeight: "bold" }}>Create board</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
            </View>
          )}

          {/* DATE TIME */}
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
            {/* Date Text */}
            <Text style={{ color: isDark ? "#9ca3af" : "#6b7280" }}>
              {postDate ? postDate.toLocaleString() : "Select Date & Time"}
            </Text>

            {/* Close / Clear Button */}
            {postDate && (
              <TouchableOpacity
                onPress={() => setPostDate(null)}
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

          {showPicker && (
            <DateTimePicker
              value={postDate || new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowPicker(false);
                if (date) {
                  setPostDate(date);
                  setShowTimePicker(true);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={postDate || new Date()}
              mode="time"
              onChange={(_, time) => {
                setShowTimePicker(false);
                if (time && postDate) {
                  setPostDate(
                    new Date(
                      postDate.getFullYear(),
                      postDate.getMonth(),
                      postDate.getDate(),
                      time.getHours(),
                      time.getMinutes()
                    )
                  );
                }
              }}
            />
          )}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
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
              images={attachments?.map(a => a.uri)}
              timestamp={previewTimestamp}
            />
          )}
        </View>

        <Button
          onPress={handleSubmit}
          className="rounded-full mb-8 px-4 py-3 flex-row justify-center items-center"
          style={{ backgroundColor: "#dc2626", borderRadius: 50, height: 48 }}
          disabled={loading}
        >
          <View className="flex-row justify-center items-center">
            {loading && (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {existingPost ? "Update Campaign Post" : "Create Campaign Post"}
            </Text>
          </View>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CampaignPostForm;
import { useState, useEffect } from "react";
import {
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  FlatList,
  Image,
  View as RNView,
  useColorScheme
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Text, Button, View } from "@gluestack-ui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from 'expo-image-picker';
import {
  createPostForCampaignApi,
  updatePostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
  createPinterestBoardApi,
  getFacebookPagesApi,
  uploadMediaApi
} from "@/api/campaign/campaignApi";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator } from "react-native";
import type { CampaignPostData } from "@/api/campaign/campaignApi";

interface Attachment {
  uri: string;
  name: string;
  type: string;
}

interface AIVariation {
  subject: string;
  content: string;
}

// ================= COMPONENT =================
export default function CampaignPostForm({
  platform,
  campaignId,
  onClose,
  onCreatedNavigate,
  existingPost,
}: {
  platform: string;
  campaignId?: string;
  onClose?: (newPost?: any) => void;
  onCreatedNavigate?: () => void;
  existingPost?: any;
}) {
  const { getToken } = useAuth();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [senderEmail, setSenderEmail] = useState(existingPost?.senderEmail || "");
  const [subject, setSubject] = useState(existingPost?.subject || "");
  const [message, setMessage] = useState(existingPost?.message || "");
  const [postDate, setPostDate] = useState(
    existingPost?.scheduledPostTime ? new Date(existingPost.scheduledPostTime) : null
  );
  // const [attachments, setAttachments] = useState<Attachment[]>(
  //   existingPost?.attachments || []
  // );

  // AI text states
  const [aiPrompt, setAiPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<AIVariation[]>([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // AI image states
  const [imagePrompt, setImagePrompt] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(existingPost?.image || undefined);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Date picker
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // const showWhatsAppContent = platform === "WHATSAPP";

  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const [pinterestBoard, setPinterestBoard] = useState<string>(""); // selected board
  const [pinterestModalVisible, setPinterestModalVisible] = useState(false);
  const [newPinterestBoard, setNewPinterestBoard] = useState("");
  const [pinterestDescription, setPinterestDescription] = useState("");

  const [isCreatingPinterestBoard, setIsCreatingPinterestBoard] = useState(false); // UI
  const [isPinterestBoardLoading, setIsPinterestBoardLoading] = useState(false);
  const [destinationLink, setDestinationLink] = useState<string>("");

  const [facebookContentType, setFacebookContentType] = useState<string>(
    existingPost?.facebookContentType || "STANDARD"
  );
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  // const [selectedFacebookPage, setSelectedFacebookPage] = useState<string | null>(null);
  const [isFacebookPageLoading, setIsFacebookPageLoading] = useState(false);
  // const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [facebookError, setFacebookError] = useState("");
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<string | null>(null);

  const [coverImage, setCoverImage] = useState<string | null>(
    existingPost?.coverImage || null
  );


  // ================= EFFECT =================
  // ================= FIXED ATTACHMENTS PREFILL =================
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!existingPost) return;

    // console.log("=== Prefilling Post ===");
    // console.log("existingPost:", existingPost);

    let prefilledAttachments: Attachment[] = [];

    // ✅ CASE 1: backend sends mediaUrls (string[])
    if (Array.isArray(existingPost.mediaUrls) && existingPost.mediaUrls.length > 0) {
      prefilledAttachments = existingPost.mediaUrls.map((url: string, index: number) => ({
        uri: url,
        name: `image-${index + 1}.jpg`,
        type: "image/jpeg",
      }));
    }

    // ✅ CASE 2: backend sends attachments (future-proof)
    if (Array.isArray(existingPost.attachments) && existingPost.attachments.length > 0) {
      prefilledAttachments = existingPost.attachments.map((file: any) => ({
        uri: file.fileUrl || file.uri,
        name: file.fileName || file.name || "attachment",
        type: file.mimeType || file.type || "application/octet-stream",
      }));
    }

    console.log("Final attachments state:", prefilledAttachments);
    setAttachments(prefilledAttachments);

    // other fields
    setSenderEmail(existingPost.senderEmail || "");
    setSubject(existingPost.subject || "");
    setMessage(existingPost.message || "");
    setPostDate(
      existingPost.scheduledPostTime
        ? new Date(existingPost.scheduledPostTime)
        : null
    );
  }, [existingPost]);

  // ================= HANDLE ATTACHMENTS =================
  const handleAddAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
      });

      if (result.canceled) return;

      const file = result.assets?.[0];
      if (!file) return;

      setAttachments((prev) => [
        ...prev,
        {
          uri: file.uri,
          name: file.name ?? "attachment",
          type: file.mimeType ?? "application/octet-stream",
        },
      ]);
    } catch (error) {
      console.error("Document picker error:", error);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // ================= CREATE OR EDIT POST =================
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Start loading
    setLoading(true);

    try {
      if (!subject || !message || !postDate || (platform === "EMAIL" && !senderEmail)) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      if (!campaignId) {
        Alert.alert("Campaign ID missing");
        return;
      }

      const postData: CampaignPostData = {
        subject,
        message,
        scheduledPostTime: postDate.toISOString(),
        type: platform,

        // ✅ THIS is what backend stores & returns
        mediaUrls: attachments.map(att => att.uri),
      };

      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      let response;
      if (existingPost?.id) {
        response = await updatePostForCampaignApi(
          Number(campaignId),
          Number(existingPost.id),
          postData,
          token
        );
      } else {
        response = await createPostForCampaignApi(Number(campaignId), postData, token);
      }

      onClose?.(response);

      if (!existingPost) {
        setSenderEmail("");
        setSubject("");
        setMessage("");
        setAiPrompt("");
        setPostDate(null);
        setImagePrompt("");
        setGeneratedImages([]);
        setSelectedImage(undefined);
      }

      onCreatedNavigate ? onCreatedNavigate() : router.back();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      // Stop loading
      setLoading(false);
    }
  };

  // ================= RENDER ATTACHMENTS =================
  const renderAttachmentItem = ({ item, index }: { item: Attachment; index: number }) => (
    <View className="flex-row items-center bg-gray-200 rounded-lg px-2 py-1 mr-2 mb-2">
      {item.type.startsWith("image/") && (
        <Image
          source={{ uri: item.uri }}
          style={{ width: 50, height: 50, borderRadius: 5, marginRight: 5 }}
        />
      )}
      <Text className="mr-2 text-gray-700" numberOfLines={1} style={{ maxWidth: 80 }}>
        {item.name}
      </Text>
      <TouchableOpacity onPress={() => handleRemoveAttachment(index)}>
        <Ionicons name="close-circle" size={20} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  // ================= AI TEXT =================
  const handleGenerateAIText = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Enter instruction like: add emoji, make promotional");
      return;
    }
    if (loadingAI) return;

    setLoadingAI(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const payload = {
        prompt: aiPrompt,
        context: { platform, existingContent: message || "" },
        mode: "generate-multiple",
      };

      const response = await generateAIContentApi(payload, token);

      if (!response?.variations || response.variations.length === 0) {
        throw new Error("No AI suggestions returned");
      }

      // ✅ Store both subject and content
      setAiResults(
        response.variations.slice(0, 3).map((v: any) => ({
          subject: v.subject,
          content: v.content,
        }))
      );

    } catch (error: any) {
      Alert.alert("AI Error", error?.message || "Failed to generate content");
    } finally {
      setLoadingAI(false);
    }
  };

  // ================= AI IMAGE =================
  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) {
      Alert.alert("Enter prompt to generate image");
      return;
    }
    if (loadingImage) return;

    setLoadingImage(true);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const response = await generateAIImageApi({ prompt: imagePrompt }, token);

      console.log("AI Image API Response:", response);

      const imageUrl = response?.images?.[0] || response?.imagePrompt || "https://picsum.photos/200";
      setGeneratedImages([imageUrl]);
      setSelectedImage(imageUrl);
    } catch (error: any) {
      Alert.alert("Image Generation Error", error?.message || "Failed to generate image");
    } finally {
      setLoadingImage(false);
    }
  };

  const [youTubeContentType, setYouTubeContentType] = useState<string>("Standard Video");
  const [youTubeTags, setYouTubeTags] = useState<string>("");
  const [youTubeStatus, setYouTubeStatus] = useState("Public");
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);

  const handleCreatePinterestBoard = async () => {
    if (!newPinterestBoard.trim()) {
      Alert.alert("Board name cannot be empty");
      return;
    }

    if (isPinterestBoardLoading) return;

    try {
      setIsPinterestBoardLoading(true);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await createPinterestBoardApi(
        {
          name: newPinterestBoard.trim(),
          description: pinterestDescription?.trim() || "",
          privacy: "PUBLIC",
        },
        token
      );

      // ✅ success
      setPinterestBoard(response?.data?.name || newPinterestBoard.trim());
      setNewPinterestBoard("");
      setPinterestDescription("");
      setPinterestModalVisible(false);
    } catch (error: any) {
      console.log("CREATE BOARD ERROR:", error?.response?.data || error);

      // ✅ handle backend error properly
      if (error?.response?.data?.error === "Pinterest not connected") {
        Alert.alert(
          "Pinterest Not Connected",
          "Please connect your Pinterest account before creating a board."
        );
      } else {
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to create board"
        );
      }
    } finally {
      // ✅ THIS IS THE MOST IMPORTANT LINE
      setIsPinterestBoardLoading(false);
    }
  };

  useEffect(() => {
    if (platform === "FACEBOOK") {
      fetchFacebookPages();
    }
  }, [platform]);

  const fetchFacebookPages = async () => {
    setIsFacebookPageLoading(true); // start loading
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const pages = await getFacebookPagesApi(token); // your API

      if (!pages || pages.length === 0) {
        setFacebookPages([]);
        setFacebookError(
          "No Facebook Pages found. Make sure you've connected your account and granted permissions."
        );
        setSelectedFacebookPage(null); // clear selection
      } else {
        setFacebookPages(pages);
        setFacebookError("");
        setSelectedFacebookPage(pages[0].name); // auto-select first page
      }
    } catch (err: any) {
      setFacebookPages([]);
      setSelectedFacebookPage(null);
      setFacebookError(
        err.message === "Facebook not connected"
          ? "No Facebook Pages found. Make sure you've connected your account and granted permissions."
          : "Failed to fetch Facebook Pages"
      );
    } finally {
      setIsFacebookPageLoading(false); // stop loading
    }
  };

  const handleCustomThumbnailUpload = async () => {
    // Ask permission
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ only images
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setCustomThumbnail(result.assets[0].uri);
    }
  };

  const handleCoverImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };


  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>

          {platform === "EMAIL" && (
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
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray-400 in dark, gray-500 in light
                value={senderEmail}
                onChangeText={setSenderEmail}
                keyboardType="email-address"
                className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white"
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db", // white in dark mode, gray-300 in light mode
                  borderRadius: 9999, // fully rounded
                  paddingHorizontal: 12,
                  height: 48,
                  marginBottom: 16,
                  backgroundColor: isDark ? "#161618" : "#ffffff", // dark/light bg
                  color: isDark ? "#e5e7eb" : "#111111", // text color
                }}
              />
            </>
          )}

          {/* SUBJECT */}
          {platform !== "SMS" && (
            <>
              <Text
                style={{
                  color: isDark ? "#ffffff" : "#000000",
                  fontWeight: "bold",
                  marginBottom: 8,
                  marginLeft: 4,
                }}
              >
                {platform === "EMAIL" ? "Subject" : "Title"}
              </Text>

              <TextInput
                placeholder={
                  platform === "EMAIL"
                    ? "Enter subject"
                    : "Enter title"
                }
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray-400 in dark, gray-500 in light
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
            placeholder={`Enter your ${platform} content here...`}
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

          {platform !== "SMS" && (
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
                    <Text style={{ marginTop: 12, fontWeight: "bold", color: "#000" }}>Generating image...</Text>
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
                            },
                          ]);
                          setImageModalVisible(false); // optional: close modal
                        }}
                      >
                        <Image
                          source={{ uri: item }}
                          style={{ width: 100, height: 100, marginRight: 8, borderRadius: 8 }}
                          resizeMode="cover"
                          onError={() => console.log("Image failed to load", item)}
                        />
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

          {/* ATTACHMENTS */}
          <Text style={{
            color: isDark ? "#ffffff" : "#000000",
            fontWeight: "bold",
            marginBottom: 8,
            marginLeft: 4,
          }}>
            Attachments
          </Text>
          <FlatList
            data={attachments}
            horizontal
            keyExtractor={(_, index) => String(index)}
            renderItem={renderAttachmentItem}
            ListHeaderComponent={
              <TouchableOpacity
                onPress={handleAddAttachment}
                className="flex-row items-center justify-center bg-blue-100 rounded-lg px-4 py-2 mr-2 mb-2"
              >
                <Ionicons name="add" size={24} color="#2563eb" />
              </TouchableOpacity>
            }
          />

          {platform === "FACEBOOK" && (
            <View
              style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db", // gray-700 / gray-300
                borderRadius: 12,
                padding: 14,
                marginTop: 12,
                marginBottom: 12,
                backgroundColor: isDark ? "#161618" : "#ffffff", // gray-900 / white
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
                    color: isDark ? "#e5e7eb" : "#000000", // gray-200 / black
                  }}
                >
                  {selectedFacebookPage || facebookPages[0].name}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#f87171", // red-400 (better visibility in dark)
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
                  color: isDark ? "#9ca3af" : "#6b7280", // gray-400 / gray-500
                }}
              >
                Posts will be published to the selected page.
              </Text>
            </View>
          )}

          {/* FACEBOOK CONTENT TYPE */}
          {(platform === "FACEBOOK" || platform === "INSTAGRAM") && (
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
                        ? "#3b82f6" // blue-500
                        : isDark
                          ? "#374151" // gray-700
                          : "#d1d5db", // gray-300

                    backgroundColor:
                      facebookContentType === "STANDARD"
                        ? isDark
                          ? "#1e3a8a" // dark blue bg
                          : "#eff6ff" // light blue bg
                        : isDark
                          ? "#161618" // dark surface
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
                        ? "#3b82f6" // blue-500
                        : isDark
                          ? "#374151" // gray-700
                          : "#d1d5db", // gray-300

                    backgroundColor:
                      facebookContentType === "REEL"
                        ? isDark
                          ? "#1e3a8a" // dark blue selected
                          : "#eff6ff" // light blue selected
                        : isDark
                          ? "#161618" // dark bg
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
                            : "#2563eb"           // ✅ white when selected
                          : isDark
                            ? "#ffffff"           // ✅ white when dark mode
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
                    onPress={handleCoverImageUpload}
                    style={{
                      backgroundColor: isDark ? "#1e3a8a" : "#eff6ff", // dark blue / light blue
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      alignItems: "center",
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: isDark ? "#3b82f6" : "#2563eb",
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#fff" : "#2563eb",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      Upload Cover
                    </Text>
                  </TouchableOpacity>

                  {/* Helper Text */}
                  <Text
                    style={{
                      fontSize: 10,
                      color: isDark ? "#9ca3af" : "#6b7280", // gray-400 / gray-500
                    }}
                  >
                    Recommended for vertical videos (9:16) under 90 seconds
                  </Text>
                </View>
              )}

            </View>
          )}


          {platform === "YOUTUBE" && (
            <View
              style={{
                backgroundColor: isDark ? "#161618" : "#f3f4f6", // gray-900 / gray-100
                borderRadius: 12,
                // padding: 12,
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
                  borderColor: isDark ? "#374151" : "#d1d5db", // gray-700 / gray-300
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

                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    {["Standard Video", "YouTube Short", "Playlist"].map((type) => {
                      const selected = youTubeContentType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setYouTubeContentType(type)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            marginHorizontal: 4,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: selected ? "#2563eb" : isDark ? "#374151" : "#d1d5db",
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
                            {type}
                          </Text>

                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Playlist Button */}
                  {youTubeContentType === "Playlist" && (
                    <TouchableOpacity
                      onPress={() => setIsCreatingPlaylist(true)}
                      style={{
                        marginTop: 8,
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isCreatingPlaylist ? "#2563eb" : isDark ? "#374151" : "#d1d5db",
                        backgroundColor: isDark ? "#111827" : "#ffffff",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: isDark
                            ? "#ffffff"         
                            : isCreatingPlaylist
                              ? "#2563eb"         
                              : "#000000",       
                          fontWeight: "bold",
                          fontSize: 12,
                        }}
                      >
                        + Create New Playlist
                      </Text>

                    </TouchableOpacity>
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
                  backgroundColor: isDark ? "#111827" : "#ffffff",
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
                  backgroundColor: isDark ? "#111827" : "#ffffff",
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
                    backgroundColor: isDark ? "#111827" : "#ffffff",
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
              <Text style={{ color: isDark ? "#ffffff" : "#000", fontWeight: "bold", marginBottom: 8 }}>
                Custom Thumbnail
              </Text>
              <TouchableOpacity
                onPress={handleCustomThumbnailUpload}
                style={{
                  backgroundColor: isDark ? "#1e3a8a" : "#dbeafe",
                  paddingVertical: 12,
                  borderRadius: 9999,
                  alignItems: "center",
                  marginBottom: 16,
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
            </View>
          )}

          {platform === "PINTEREST" && (
            <View style={{ borderRadius: 8 }}>
              {/* Pinterest Settings Heading */}
              <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 16, color: isDark ? "#ffffff" : "#000000" }}>
                Pinterest Settings
              </Text>

              {/* ---------- Select Board + Destination Link Section with Border ---------- */}
              <View
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "#374151" : "#d1d5db", // dark/light border
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                {/* Select Board */}
                <Text style={{ fontWeight: "600", marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
                  Select Board
                </Text>
                <TouchableOpacity
                  onPress={() => setIsCreatingPinterestBoard(true)}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d1d5db",
                    borderRadius: 9999,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: isDark ? "#9ca3af" : "#000000" }}>{pinterestBoard || "Select a board"}</Text>
                </TouchableOpacity>

                {/* + Create New Board */}
                {isCreatingPinterestBoard && (
                  <TouchableOpacity
                    onPress={() => setPinterestModalVisible(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: isDark ? "#374151" : "#d1d5db",
                      borderRadius: 9999,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 8,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#2563eb", fontWeight: "bold", fontSize: 12 }}>
                      + Create New Board
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Destination Link */}
                <Text style={{ fontWeight: "600", marginBottom: 8, color: isDark ? "#ffffff" : "#000000" }}>
                  Destination Link (Optional)
                </Text>
                <TextInput
                  placeholder="Enter destination link"
                  placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  value={destinationLink}
                  onChangeText={setDestinationLink}
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#d1d5db",
                    borderRadius: 9999,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
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
              backgroundColor: isDark ? "#161618" : "#ffffff",
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
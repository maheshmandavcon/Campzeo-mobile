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
} from "react-native";
import { Text, Button, View } from "@gluestack-ui/themed";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import {
  createPostForCampaignApi,
  updatePostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
} from "@/api/campaign/campaignApi";
import { Ionicons } from "@expo/vector-icons";
 
// ================= TYPES =================
interface CampaignPostData {
  senderEmail?: string;
  subject: string;
  message: string;
  scheduledPostTime: string;
  type: string;
  attachments?: { uri: string; name: string; type: string }[];
}
 
interface Attachment {
  uri: string;
  name: string;
  type: string;
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
 
  const [senderEmail, setSenderEmail] = useState(existingPost?.senderEmail || "");
  const [subject, setSubject] = useState(existingPost?.subject || "");
  const [message, setMessage] = useState(existingPost?.message || "");
  const [postDate, setPostDate] = useState(
    existingPost?.scheduledPostTime ? new Date(existingPost.scheduledPostTime) : null
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    existingPost?.attachments || []
  );
 
  // AI text states
  const [aiPrompt, setAiPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
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
  const [isCreatingPinterestBoard, setIsCreatingPinterestBoard] = useState(false);
  const [destinationLink, setDestinationLink] = useState<string>("");
  // ================= EFFECT =================
  useEffect(() => {
    if (generatedImages.length > 0 && !selectedImage) {
      setSelectedImage(generatedImages[0]);
    }
  }, [generatedImages]);
 
 
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
  const handleSubmit = async () => {
    if (!subject || !message || !postDate || (platform === "EMAIL" && !senderEmail)) {
      Alert.alert("⚠️ Please fill in all fields.");
      return;
    }
 
    if (!campaignId) {
      Alert.alert("Campaign ID missing");
      return;
    }
 
    const postData: CampaignPostData = {
      senderEmail: senderEmail || undefined,
      subject,
      message,
      scheduledPostTime: postDate.toISOString(),
      type: platform,
      attachments,
    };
 
    try {
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
 
      setAiResults(response.variations.slice(0, 3).map((v: any) => v.content));
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
 
      // Use 'images' array or fallback to 'imagePrompt'
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
  const [youTubeStatus, setYouTubeStatus] = useState<string>("");
  const [showStatusDropdown, setShowStatusDropdown] = useState<boolean>(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
 
  const handleCustomThumbnailUpload = async () => {
    // try {
    //   const result = await DocumentPicker.getDocumentAsync({
    //     type: "image/*",
    //     multiple: false,
    //   });
 
    //   // result.type is either 'success' or 'cancel'
    //   if (result.type === "cancel") return;
 
    //   // TypeScript knows that if not canceled, result is the success type
    //   setCustomThumbnail(result.uri);
    // } catch (error) {
    //   console.error("Thumbnail upload error:", error);
    // }
  };
 
 
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 bg-gray-100">
 
          {platform === "EMAIL" && (
            <>
              <Text className="mb-2 font-bold text-black ml-1">Sender Email</Text>
              <TextInput
                placeholder="sender@eg.com"
                value={senderEmail}
                onChangeText={setSenderEmail}
                keyboardType="email-address"
                className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white"
              />
            </>
          )}
 
          {/* SUBJECT */}
          <Text className="mb-2 font-bold text-black ml-1">Subject</Text>
          <TextInput
            placeholder="Enter subject/title"
            value={subject}
            onChangeText={setSubject}
            className="border border-gray-300 rounded-full px-3 h-12 mb-2 bg-white"
          />
 
          {/* AI TEXT BUTTON FOR ALL PLATFORMS */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)} // or setImageModalVisible(true)
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
          <Text className="mb-2 font-bold text-black ml-1">Message</Text>
          <TextInput
            placeholder={`Enter your ${platform} content here...`}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="border border-gray-300 rounded-lg p-3 mb-2 min-h-[120px] bg-white"
          />
 
          {/* AI IMAGE BUTTON */}
 
          <TouchableOpacity
            onPress={() => setImageModalVisible(true)}
            style={{
              flexDirection: "row",    // icon above text
              alignItems: "center",       // center horizontally
              justifyContent: "center",   // center vertically
              backgroundColor: "#2563eb",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 25,
              marginBottom: 16,
            }}
          >
            <Ionicons name="sparkles" size={24} color="#fff" style={{ marginRight: 12 }} />
            <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center", marginTop: 4 }}>
              Image Generate AI Assistant
            </Text>
          </TouchableOpacity>
 
          {/* AI TEXT MODAL */}
          <Modal visible={aiModalVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
              <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, maxHeight: "70%" }}>
                <View className="flex-row items-center mb-4">
                  <TextInput
                    value={aiPrompt}
                    onChangeText={setAiPrompt}
                    placeholder="e.g. add emoji, make promotional"
                    className="flex-1 border border-gray-300 border-r-0 rounded-l-full px-3 h-12 bg-white"
                  />
                  <TouchableOpacity
                    disabled={loadingAI}
                    onPress={handleGenerateAIText}
                    style={{
                      backgroundColor: loadingAI ? "#aaa" : "#dc2626",
                      height: 43,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopRightRadius: 25,
                      borderBottomRightRadius: 25,
                    }}
                  >
                    <Ionicons name="sparkles" size={24} color={loadingAI ? "#fff" : "#fff"} />
                  </TouchableOpacity>
                </View>
 
                {aiResults.length > 0 && (
                  <FlatList
                    data={aiResults}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setMessage(item);
                          setAiModalVisible(false);
                        }}
                        style={{
                          backgroundColor: "#f3f3f3",
                          padding: 12,
                          borderRadius: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
 
                <Button onPress={() => setAiModalVisible(false)} style={{ backgroundColor: "#aaa", marginTop: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
                </Button>
              </View>
            </View>
          </Modal>
 
          {/* AI IMAGE MODAL */}
          <Modal visible={imageModalVisible} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
              <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 16, maxHeight: "70%" }}>
                <View className="flex-row items-center mb-4">
                  <TextInput
                    value={imagePrompt}
                    onChangeText={setImagePrompt}
                    placeholder="Enter prompt to generate image"
                    className="flex-1 border border-gray-300 border-r-0 rounded-l-full px-3 h-12 bg-white"
                  />
                  <TouchableOpacity
                    disabled={loadingImage}
                    onPress={handleGenerateAIImage}
                    style={{backgroundColor: loadingImage ? "#aaa" : "#2563eb",
                      height: 43,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopRightRadius: 25,
                      borderBottomRightRadius: 25,
                    }}
                  >
                    <Ionicons name="sparkles" size={24} color={loadingImage ? "#fff" : "#fff"} />
                  </TouchableOpacity>
                </View>
 
                {generatedImages.length > 0 && (
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
                )}
 
 
                <Button onPress={() => setImageModalVisible(false)} style={{ backgroundColor: "#aaa", marginTop: 12 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Close</Text>
                </Button>
              </View>
            </View>
          </Modal>
 
          {/* ATTACHMENTS */}
          <Text className="mb-2 font-bold text-black ml-1">Attachments</Text>
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
 
          {platform === "YOUTUBE" && (
            <View className="bg-gray-100 rounded-lg shadow-md">
 
              {/* ---------- YouTube Settings Heading ---------- */}
              <Text className="text-lg font-bold mb-4">YouTube Settings</Text>
 
              {/* ---------- Content Type ---------- */}
              <View
                style={{
                  borderWidth: 2,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                {/* Heading */}
                <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
                  Content Type
                </Text>
 
                {/* Buttons */}
                <View style={{ marginBottom: 16 }}>
                  {/* Content Type Buttons */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    {["Standard Video", "YouTube Short", "Playlist"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setYouTubeContentType(type)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          marginHorizontal: 4,
                          borderRadius: 8,
                          backgroundColor: "#f3f3f3",
                          borderWidth: 2,
                          borderColor: youTubeContentType === type ? "#2563eb" : "#d1d5db",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                        }}
                      >
                        <Text
                          style={{
                            color: "#000",
                            fontWeight: "bold",
                            fontSize: 12, // small font
                          }}
                          numberOfLines={1}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
 
                  {/* Show this button only if "Playlist" is selected */}
                  {youTubeContentType === "Playlist" && (
                    <TouchableOpacity
                      onPress={() => setIsCreatingPlaylist(true)} // mark as clicked
                      style={{
                        paddingVertical: 10,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: isCreatingPlaylist ? "#2563eb" : "#d1d5db", // blue if clicked, gray otherwise
                        backgroundColor: "#fff",
                        alignItems: "center",
                        justifyContent: "center",
                        marginHorizontal: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: isCreatingPlaylist ? "#2563eb" : "#000",
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
 
              {/* ---------- Tags Input ---------- */}
              <Text className="font-semibold mb-2">Tags</Text>
              <TextInput
                placeholder="Enter tags separated by commas"
                value={youTubeTags}
                onChangeText={setYouTubeTags}
                className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white"
              />
 
              {/* ---------- Status Dropdown ---------- */}
              <Text className="font-semibold mb-2">Status</Text>
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
                className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white flex-row justify-between items-center"
              >
                <Text>{youTubeStatus || "Select status"}</Text>
                <Ionicons name={showStatusDropdown ? "chevron-up" : "chevron-down"} size={20} color="#000" />
              </TouchableOpacity>
              {showStatusDropdown && (
                <View className="bg-white border border-gray-300 rounded-lg mb-4">
                  {["Public", "Private", "Unlisted"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => {
                        setYouTubeStatus(status);
                        setShowStatusDropdown(false);
                      }}
                      className="px-4 py-2"
                    >
                      <Text>{status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
 
              {/* ---------- Custom Thumbnail ---------- */}
              <Text className="font-semibold mb-2">Custom Thumbnail</Text>
              <TouchableOpacity
                onPress={handleCustomThumbnailUpload}
                className="bg-blue-100 px-4 py-3 rounded-lg items-center mb-4"
              >
                <Text style={{ color: "#2563eb", fontWeight: "bold" }}>Upload Thumbnail</Text>
              </TouchableOpacity>
 
              {/* ---------- Optional: Show selected thumbnail ---------- */}
              {customThumbnail && (
                <Image
                  source={{ uri: customThumbnail }}
                  style={{ width: 120, height: 70, borderRadius: 8 }}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
 
          {platform === "PINTEREST" && (
            <View style={{ marginTop: 16, padding: 12, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8 }}>
              {/* Pinterest Settings Heading */}
              <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Pinterest Settings</Text>
 
              {/* Select Board */}
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Select Board</Text>
              <TouchableOpacity
                onPress={() => setIsCreatingPinterestBoard(true)}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                }}
              >
                <Text>{pinterestBoard || "Select a board"}</Text>
              </TouchableOpacity>
 
              {/* + Create New Board */}
              {isCreatingPinterestBoard && (
                <TouchableOpacity
                  onPress={() => {
                    // open modal or input for new board creation
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    borderRadius: 8,
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
              <Text style={{ fontWeight: "600", marginBottom: 4 }}>Destination Link (Optional)</Text>
              <TextInput
                placeholder="Enter destination link"
                value={destinationLink}
                onChangeText={setDestinationLink}
                style={{
                  borderWidth: 1,
                  borderColor: "#d1d5db",
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  marginBottom: 8,
                }}
              />
            </View>
          )}
 
          {/* DATE TIME */}
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="border border-gray-300 rounded-full px-3 py-3 bg-white mb-4"
          >
            <Text>{postDate ? postDate.toLocaleString() : "Select Date & Time"}</Text>
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
            className="rounded-full mb-8"
            style={{ backgroundColor: "#dc2626", borderRadius: 50 }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {existingPost ? "Update Campaign Post" : "Create Campaign Post"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
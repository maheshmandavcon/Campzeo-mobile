import React, { useState, useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import {
  createPostForCampaignApi,
  updatePostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
} from "@/api/campaign/campaignApi";

// ================= TYPES =================
interface CampaignPostData {
  senderEmail?: string;
  subject: string;
  message: string;
  scheduledPostTime: string;
  type: string;
  image?: string;
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

  const showWhatsAppContent = platform === "WHATSAPP";

  // ================= EFFECT =================
  useEffect(() => {
    if (generatedImages.length > 0 && !selectedImage) {
      setSelectedImage(generatedImages[0]);
    }
  }, [generatedImages]);

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
      image: selectedImage !== null ? selectedImage : undefined,
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

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 bg-gray-100">

          {/* SENDER EMAIL */}
          {platform === "EMAIL" && (
            <>
              <Text className="mb-2 font-bold text-black ml-1">Sender Email</Text>
              <TextInput
                placeholder="Enter sender email"
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
            className="border border-gray-300 rounded-full px-3 h-12 mb-4 bg-white"
          />

          {/* AI TEXT BUTTON */}
          {showWhatsAppContent && (
            <TouchableOpacity
              onPress={() => {
                setAiModalVisible(true);
                setAiResults([]);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#dc2626",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 25,
                marginBottom: 8,
              }}
            >
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Text Generate AI Assistant</Text>
            </TouchableOpacity>
          )}

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
          {showWhatsAppContent && (
            <TouchableOpacity
              onPress={() => {
                setImagePrompt("");
                setImageModalVisible(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#2563eb",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 25,
                marginBottom: 16,
              }}
            >
              <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ color: "#fff", fontWeight: "bold" }}>Image Generate AI Assistant</Text>
            </TouchableOpacity>
          )}

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
                    <Ionicons name="sparkles" size={24} color={loadingAI ? "#a67c00" : "#fff"} />
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
                    style={{
                      backgroundColor: loadingImage ? "#aaa" : "#2563eb",
                      height: 43,
                      paddingHorizontal: 16,
                      justifyContent: "center",
                      alignItems: "center",
                      borderTopRightRadius: 25,
                      borderBottomRightRadius: 25,
                    }}
                  >
                    <Ionicons name="sparkles" size={24} color={loadingImage ? "#a67c00" : "#fff"} />
                  </TouchableOpacity>
                </View>

                {generatedImages.length > 0 && (
                  <FlatList
                    data={generatedImages}
                    keyExtractor={(item, index) => item || index.toString()}
                    horizontal
                    renderItem={({ item }) => (
                      <TouchableOpacity onPress={() => setSelectedImage(item)}>
                        <Image
                          source={{ uri: item }}
                          style={{ width: 100, height: 100, marginRight: 8, borderRadius: 8 }}
                          resizeMode="cover"
                          onError={() => console.log("Image failed to load", item)}
                        />
                        {selectedImage === item && (
                          <View
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              backgroundColor: "#2563eb",
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          </View>
                        )}
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

          {/* POST TIME & SUBMIT */}
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

          <Button onPress={handleSubmit} className="rounded-full mb-8" style={{ backgroundColor: "#dc2626", borderRadius: 50 }}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>
              {existingPost ? "Update Campaign Post" : "Create Campaign Post"}
            </Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

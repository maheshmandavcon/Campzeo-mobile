import { useRef } from "react";
import { useState, useEffect } from "react";
import { Alert, useColorScheme } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import {
  createPostForCampaignApi,
  updatePostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
  createPinterestBoardApi,
  getFacebookPagesApi,
  uploadMediaApi,
  getPinterestBoardsApi,
} from "@/api/campaign/campaignApi";
import type { CampaignPostData } from "@/api/campaign/campaignApi";

export interface Attachment {
  uri: string;
  name: string;
  type: string;
  uploading?: boolean; 
}

export interface AIVariation {
  subject: string;
  content: string;
}

export function useCampaignPostForm({
  platform,
  campaignId,
  existingPost,
  onClose,
  onCreatedNavigate,
}: {
  platform: string;
  campaignId?: string;
  existingPost?: any;
  onClose?: (post?: any) => void;
  onCreatedNavigate?: () => void;
}) {
  const { getToken } = useAuth();
  const isDark = useColorScheme() === "dark";

  const hasPrefilledRef = useRef(false);

  // ================= BASIC =================
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [postDate, setPostDate] = useState<Date | null>(null);

  // ================= ATTACHMENTS =================
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // const [uploading, setUploading] = useState(false);

  // ================= AI TEXT =================
  const [aiPrompt, setAiPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResults, setAiResults] = useState<AIVariation[]>([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  // ================= AI IMAGE =================
  const [imagePrompt, setImagePrompt] = useState("");
  const [loadingImage, setLoadingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    existingPost?.image || undefined
  );
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // ================= DATE =================
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ================= FACEBOOK =================
  const [facebookContentType, setFacebookContentType] = useState("STANDARD");
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<
    string | null
  >(null);
  const [isFacebookPageLoading, setIsFacebookPageLoading] = useState(false);
  const [facebookError, setFacebookError] = useState("");

  // ================= PINTEREST =================
  const [pinterestBoard, setPinterestBoard] = useState("");
  const [allPinterestBoards, setAllPinterestBoards] = useState<string[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [pinterestModalVisible, setPinterestModalVisible] = useState(false);
  const [newPinterestBoard, setNewPinterestBoard] = useState("");
  const [pinterestDescription, setPinterestDescription] = useState("");
  const [isCreatingPinterestBoard, setIsCreatingPinterestBoard] =
    useState(false);
  const [isPinterestBoardLoading, setIsPinterestBoardLoading] = useState(false);
  const [destinationLink, setDestinationLink] = useState("");
  const [metadata, setMetadata] = useState<{
    boardId?: string;
    boardName?: string;
    link?: string;
  }>({});

  // ================= YOUTUBE =================
  const [youTubeContentType, setYouTubeContentType] =
    useState("Standard Video");
  const [youTubeTags, setYouTubeTags] = useState("");
  const [youTubeStatus, setYouTubeStatus] = useState("Public");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // ================= LOADING =================
  const [loading, setLoading] = useState(false);

  // ================= PREFILL =================
  useEffect(() => {
  if (!existingPost) return;
  if (hasPrefilledRef.current) return;

  hasPrefilledRef.current = true;

  let prefilledAttachments: Attachment[] = [];

  if (
    Array.isArray(existingPost.mediaUrls) &&
    existingPost.mediaUrls.length > 0
  ) {
    prefilledAttachments = existingPost.mediaUrls.map(
      (url: string, index: number) => ({
        uri: url,
        name: `image-${index + 1}.jpg`,
        type: "image/jpeg",
      })
    );
  }

  if (
    Array.isArray(existingPost.attachments) &&
    existingPost.attachments.length > 0
  ) {
    prefilledAttachments = existingPost.attachments.map((file: any) => ({
      uri: file.fileUrl || file.uri,
      name: file.fileName || file.name || "attachment",
      type: file.mimeType || file.type || "application/octet-stream",
    }));
  }

  setAttachments(prefilledAttachments);
}, [existingPost]);


  // ================= ATTACHMENTS =================
  const handleAddAttachment = async () => {
  try {
    const isYouTube = platform === "YOUTUBE";

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: isYouTube
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const isVideo = asset.type === "video";

    const tempAttachment: Attachment = {
      uri: asset.uri, // ✅ local preview
      name:
        asset.fileName ??
        `${isVideo ? "video" : "image"}-${Date.now()}.${
          isVideo ? "mp4" : "jpg"
        }`,
      type: isVideo ? "video/mp4" : "image/jpeg",
      uploading: true,
    };

    // ✅ show preview immediately
    setAttachments((prev) => [...prev, tempAttachment]);

    const token = await getToken();
    if (!token) throw new Error("Token missing");

    const uploadedUrl = await uploadMediaApi(
      {
        uri: asset.uri,
        name: tempAttachment.name,
        type: tempAttachment.type,
      },
      token
    );

    // ✅ replace local preview with uploaded URL
    setAttachments((prev) =>
      prev.map((a) =>
        a.uri === asset.uri
          ? { ...a, uri: uploadedUrl, uploading: false }
          : a
      )
    );
  } catch (error) {
    Alert.alert("Upload failed", "Media upload failed");
    setAttachments((prev) => prev.filter((a) => !a.uploading));
  }
};

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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

      const imageUrl =
        response?.images?.[0] ||
        response?.imagePrompt ||
        "https://picsum.photos/200";
      setGeneratedImages([imageUrl]);
      setSelectedImage(imageUrl);
    } catch (error: any) {
      Alert.alert(
        "Image Generation Error",
        error?.message || "Failed to generate image"
      );
    } finally {
      setLoadingImage(false);
    }
  };

  // ================= FACEBOOK =================
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
      setIsFacebookPageLoading(false); 
    }
  };

  // ================= PINTEREST =================
  const fetchBoards = async () => {
    setLoadingBoards(true);
    try {
      const token = await getToken();
      if (!token) return;

      const boards = await getPinterestBoardsApi(token);
      setAllPinterestBoards(boards.map((b: any) => b.name));
    } catch (err) {
      console.log("Failed to fetch Pinterest boards:", err);
    } finally {
      setLoadingBoards(false);
    }
  };

  useEffect(() => {
    if (pinterestModalVisible) {
      fetchBoards();
    }
  }, [pinterestModalVisible]);

  const handleCreatePinterestBoard = async () => {
    if (!newPinterestBoard.trim()) {
      Alert.alert("Board name cannot be empty");
      return;
    }

    if (isPinterestBoardLoading) return;

    try {
      setIsPinterestBoardLoading(true);

      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

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

      // 🔹 refresh boards immediately
      await fetchBoards();

      setPinterestModalVisible(false);
    } catch (error: any) {
      console.log("CREATE BOARD ERROR:", error?.response?.data || error);
      const errorMessage = error?.response?.data?.error;

      if (errorMessage?.includes("You already have a board with this name")) {
        Alert.alert(
          "Board Already Exists",
          "You already have a board with this name. Please choose a different name."
        );
      } else if (errorMessage === "Pinterest not connected") {
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
      setIsPinterestBoardLoading(false);
    }
  };

  // ================= MEDIA UPLOADS =================
  const handleCustomThumbnailUpload = async () => {
    // Ask permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
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

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // ✅ Validate required fields
      if (
        !subject ||
        !message ||
        !postDate ||
        (platform === "EMAIL" && !senderEmail)
      ) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      // ✅ Use campaignId prop OR fallback to existingPost.campaignId
      const campaignIdToUse =
        Number(campaignId) ||
        Number(existingPost?.campaignId) ||
        Number(existingPost?.campaign?.id);

      if (!campaignIdToUse) {
        Alert.alert("Campaign ID missing");
        setLoading(false);
        return;
      }

      const postData: CampaignPostData = {
        subject,
        message,
        type: platform,
        mediaUrls: attachments.map((a) => a.uri),
        scheduledPostTime: postDate?.toISOString() || "",
        pinterestBoard: pinterestBoard,
        destinationLink: destinationLink,
        metadata,
      };

      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      let response;
      if (existingPost?.id) {
        // ✅ Edit existing post
        response = await updatePostForCampaignApi(
          Number(campaignIdToUse),
          Number(existingPost.id),
          postData,
          token
        );
      } else {
        // ✅ Create new post
        response = await createPostForCampaignApi(
          Number(campaignIdToUse),
          postData,
          token
        );
      }

      onClose?.(response);

      // ✅ Reset form only if creating a new post
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
      setLoading(false);
    }
  };

  // ================= RETURN =================
  return {
    isDark,

    // state
    platform,
    senderEmail,
    subject,
    message,
    postDate,
    attachments,
    aiPrompt,
    aiResults,
    aiModalVisible,
    imagePrompt,
    generatedImages,
    imageModalVisible,
    facebookPages,
    facebookContentType,
    selectedFacebookPage,
    pinterestBoard,
    pinterestModalVisible,
    newPinterestBoard,
    destinationLink,
    youTubeContentType,
    youTubeTags,
    youTubeStatus,
    showStatusDropdown,
    isCreatingPlaylist,
    showPicker,
    showTimePicker,
    loading,
    loadingAI,
    loadingImage,
    isPinterestBoardLoading,
    dropdownVisible,
    allPinterestBoards,
    loadingBoards,
    isCreatingPinterestBoard,
    pinterestDescription,
    isFacebookPageLoading,
    existingPost,

    // setters
    setSenderEmail,
    setSubject,
    setMessage,
    setPostDate,
    setAttachments,
    setAiPrompt,
    setAiModalVisible,
    setImagePrompt,
    setImageModalVisible,
    setFacebookContentType,
    setSelectedFacebookPage,
    setPinterestModalVisible,
    setPinterestBoard,
    setNewPinterestBoard,
    setDropdownVisible,
    setDestinationLink,
    setYouTubeContentType,
    setYouTubeTags,
    setYouTubeStatus,
    setShowStatusDropdown,
    setIsCreatingPlaylist,
    setIsCreatingPinterestBoard,
    setPinterestDescription,
    setShowPicker,
    setShowTimePicker,

    // actions
    handleAddAttachment,
    handleRemoveAttachment,
    handleGenerateAIText,
    handleGenerateAIImage,
    handleCreatePinterestBoard,
    handleCustomThumbnailUpload,
    handleCoverImageUpload,
    handleSubmit,
  };
}

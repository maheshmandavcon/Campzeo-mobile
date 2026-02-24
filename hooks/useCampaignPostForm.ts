import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, useColorScheme } from "react-native";

import type { AIImageResponse, CampaignPostData } from "@/api/campaignApi";
import {
  createPinterestBoardApi,
  createPostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
  getFacebookPagesApi,
  getPinterestBoardsApi,
  updatePostForCampaignApi,
  uploadMediaApi,
} from "@/api/campaignApi";

export interface Attachment {
  uri: string;
  uploadedUrl?: string;
  name: string;
  type: string;
  uploading: boolean;
  progress?: number;
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
  const [imageLoadingMap, setImageLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    existingPost?.image || undefined,
  );
  const [imageModalVisible, setImageModalVisible] = useState(false);
  // const [imageLoadingMap, setImageLoadingMap] = useState<Record<string, boolean>>({});
  const [imageErrorMap, setImageErrorMap] = useState<Record<string, boolean>>(
    {},
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ================= DATE =================
  const [showPicker, setShowPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // ================= DATE CONSTRAINTS =================
  const today = new Date();
  today.setSeconds(0, 0);

  // -------- START DATE --------
  const campaignStartDate = existingPost?.campaign?.startDate
    ? new Date(existingPost.campaign.startDate)
    : null;

  // Minimum start date
  const minSelectableStartDate = (() => {
    if (campaignStartDate && campaignStartDate > today) {
      return campaignStartDate;
    }
    return today;
  })();

  // -------- END DATE --------
  const campaignEndDate = existingPost?.campaign?.endDate
    ? new Date(existingPost.campaign.endDate)
    : null;

  const minSelectableEndDate = minSelectableStartDate;
  const maxSelectableEndDate = campaignEndDate ?? undefined;

  // console.log("campaignStartDate", campaignStartDate);
  // console.log("minSelectableStartDate", minSelectableStartDate);
  // console.log("campaignEndDate", campaignEndDate);
  // console.log("minSelectableEndDate", minSelectableEndDate);

  // ================= FACEBOOK =================
  const [facebookContentType, setFacebookContentType] = useState("STANDARD");
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<
    string | null
  >(null);
  const [isFacebookPageLoading, setIsFacebookPageLoading] = useState(false);
  const [facebookError, setFacebookError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  // ================= PINTEREST =================
  const [pinterestBoard, setPinterestBoard] = useState("");
  const [PinterestBoardId, setPinterestBoardId] = useState<string | undefined>(
    undefined,
  );
  const [allPinterestBoards, setAllPinterestBoards] = useState<
    { id: string; name: string }[]
  >([]);
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
    destinationLink?: string;
  }>({});

  // ================= PREVIEW TIMESTEMP =================
  const previewTimestamp = postDate
    ? postDate.toLocaleString([], {
        // day: "2-digit",
        // month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Just now";

  // ================= LINKEDIN =================
  const [selectedAccount, setSelectedAccount] = useState<string>();

  // ================= YOUTUBE =================
  const [youTubeContentType, setYouTubeContentType] = useState<
    "VIDEO" | "SHORT" | "PLAYLIST"
  >("VIDEO");
  const [youTubeTags, setYouTubeTags] = useState("");
  const [youTubeStatus, setYouTubeStatus] = useState("Public");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [customThumbnail, setCustomThumbnail] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState<string | undefined>(undefined);
  const [playlistTitle, setPlaylistTitle] = useState<string>("");
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  // ================= LOADING =================
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  function inferMediaType(uri: string) {
    if (!uri) return "application/octet-stream";
    const ext = uri.split(".").pop()?.toLowerCase();
    if (!ext) return "application/octet-stream";

    if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "gif") return "image/gif";
    if (ext === "mp4") return "video/mp4";
    if (ext === "mov") return "video/quicktime";
    return "application/octet-stream";
  }

  function getFileNameFromUrl(url: string) {
    try {
      const cleanUrl = url.split("?")[0];
      return cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1);
    } catch {
      return `ai-image-${Date.now()}.jpg`;
    }
  }

  function getMimeFromUrl(url: string) {
    const ext = url.split(".").pop()?.toLowerCase();
    if (ext === "webp") return "image/webp";
    if (ext === "png") return "image/png";
    return "image/jpeg";
  }

  // AI IMAGE LOADING
  useEffect(() => {
    if (!generatedImages.length) return;

    const map: Record<string, boolean> = {};
    generatedImages.forEach((url) => {
      map[url] = true;
    });

    setImageLoadingMap(map);
  }, [generatedImages]);

  // ================= PREFILL =================
  useEffect(() => {
    if (!existingPost || hasPrefilledRef.current) return;

    hasPrefilledRef.current = true;

    // ✅ BASIC FIELDS
    setSenderEmail(existingPost.senderEmail || "");
    setSubject(existingPost.subject || "");
    setMessage(existingPost.message || "");
    setPostDate(
      existingPost.scheduledPostTime
        ? new Date(existingPost.scheduledPostTime)
        : null,
    );

    // ✅ PINTEREST
    if (existingPost.type === "PINTEREST") {
      setPinterestBoardId(existingPost.metadata?.boardId || "");
      setPinterestBoard(existingPost.metadata?.boardName || "");
      setDestinationLink(existingPost.metadata?.destinationLink || "");
    }

    // ✅ YOUTUBE
    if (existingPost.type === "YOUTUBE") {
      // normalize content type
      const typeMap: Record<string, "VIDEO" | "SHORT" | "PLAYLIST"> = {
        VIDEO: "VIDEO",
        SHORT: "SHORT",
        SHORT_VIDEO: "SHORT",
        SHORTS: "SHORT",
        "YOUTUBE SHORT": "SHORT",
        PLAYLIST: "PLAYLIST",
      };

      const tags = Array.isArray(existingPost.metadata?.tags)
        ? existingPost.metadata.tags
        : [];
      setYouTubeTags(tags.join(", "));

      const savedType = existingPost.metadata?.postType || "VIDEO";
      setYouTubeContentType(typeMap[savedType] ?? "VIDEO");

      // normalize privacy/status
      const savedPrivacy = existingPost.metadata?.privacy || "PUBLIC";
      setYouTubeStatus(
        savedPrivacy.toLowerCase() === "private"
          ? "Private"
          : savedPrivacy.toLowerCase() === "unlisted"
            ? "Unlisted"
            : "Public",
      );

      // handle tags (array or comma string)
      let tagsArray: string[] = [];
      if (Array.isArray(existingPost.metadata?.tags)) {
        tagsArray = existingPost.metadata.tags;
      } else if (typeof existingPost.metadata?.tags === "string") {
        tagsArray = existingPost.metadata.tags
          .split(",")
          .map((t: string) => t.trim());
      }
      setYouTubeTags(tagsArray.join(", "));

      // other fields
      setCustomThumbnail(existingPost.metadata?.thumbnailUrl || null);
      setPlaylistId(existingPost.metadata?.playlistId);
      setPlaylistTitle(existingPost.metadata?.playlistTitle || "");
    }

    // ✅ FACEBOOK / INSTAGRAM

    if (existingPost.type === "FACEBOOK" || existingPost.type === "INSTAGRAM") {
      const typeMap: Record<string, "STANDARD" | "REEL"> = {
        STANDARD: "STANDARD",
        POST: "STANDARD",

        REEL: "REEL",
        SHORT: "REEL",
        SHORT_VIDEO: "REEL",
        VIDEO: "REEL",
      };

      const savedType = existingPost.metadata?.postType ?? "STANDARD";

      setFacebookContentType(typeMap[savedType] ?? "STANDARD");
      setCoverImage(existingPost.metadata?.coverImage || null);
    }

    // ✅ LINKEDIN

    if (existingPost.type === "LINKEDIN") {
      const authorId = existingPost.metadata?.authorId;

      if (authorId) {
        setSelectedAccount(String(authorId)); // must be string
      }
    }

    // ================= ATTACHMENTS =================
    const prefilledAttachments: Attachment[] = [];

    if (Array.isArray(existingPost.attachments)) {
      prefilledAttachments.push(
        ...existingPost.attachments.map((file: any, index: number) => ({
          uri: file.uploadedUrl || file.fileUrl || file.uri,
          uploadedUrl: file.uploadedUrl || file.fileUrl || file.uri,
          name: file.fileName || file.name || `attachment-${index + 1}`,
          type:
            file.mimeType ||
            file.type ||
            inferMediaType(file.fileUrl || file.uri),
          uploading: false,
        })),
      );
    }

    if (Array.isArray(existingPost.mediaUrls)) {
      prefilledAttachments.push(
        ...existingPost.mediaUrls.map((url: string, index: number) => ({
          uri: url,
          uploadedUrl: url,
          name: getFileNameFromUrl(url),
          type: getMimeFromUrl(url),
          uploading: false,
        })),
      );
    }

    setAttachments(prefilledAttachments);
  }, [existingPost]);

  // ================= ATTACHMENTS =================

  // async function handleAddAttachment() {
  //   try {
  //     const isYouTube = platform === "YOUTUBE";

  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes:
  //         platform === "YOUTUBE"
  //           ? ImagePicker.MediaTypeOptions.Videos
  //           : ImagePicker.MediaTypeOptions.All,
  //       quality: 0.8,
  //     });

  //     if (result.canceled) return;

  //     const asset = result.assets[0];
  //     const isVideo = asset.type === "video";

  //     const tempAttachment: Attachment = {
  //       uri: asset.uri,
  //       name:
  //         asset.fileName ??
  //         `${isVideo ? "video" : "image"}-${Date.now()}.${
  //           isVideo ? "mp4" : "jpg"
  //         }`,
  //       type: isVideo ? "video/mp4" : "image/jpeg",
  //       uploading: true,
  //     };

  //     setAttachments((prev) => [...prev, tempAttachment]);

  //     // ⬇️ upload
  //     const finalUrl = await uploadMediaApi({
  //       uri: asset.uri,
  //       name: tempAttachment.name,
  //       type: tempAttachment.type,
  //     });

  //     if (finalUrl == null) {
  //       throw new Error("Upload failed: no Url returned");
  //     }

  //     setAttachments((prev) =>
  //       prev.map((a) =>
  //         a.uri === asset.uri ? { ...a, uri: finalUrl, uploading: false } : a,
  //       ),
  //     );
  //   } catch (error) {
  //     console.error(error);
  //     Alert.alert("Upload failed", "Media upload failed");
  //     setAttachments((prev) => prev.filter((a) => !a.uploading));
  //   }
  // }

  // async function handleAddAttachment() {
  //   try {
  //     const isYouTube = platform === "YOUTUBE";

  //     const result = await ImagePicker.launchImageLibraryAsync({
  //       mediaTypes: isYouTube ? ["videos"] : ["images", "videos"],
  //       quality: 0.8,
  //     });

  //     if (result.canceled) return;

  //     const asset = result.assets[0];
  //     const isVideo = asset.type === "video";

  //     // ✅ Validate media limit (max 10 files)
  //     if (attachments.length + 1 > 10) {
  //       Alert.alert(
  //         "Upload limit",
  //         "You can upload a maximum of 10 media files",
  //       );
  //       return;
  //     }

  //     const tempAttachment: Attachment = {
  //       uri: asset.uri,
  //       name:
  //         asset.fileName ??
  //         `${isVideo ? "video" : "image"}-${Date.now()}.${
  //           isVideo ? "mp4" : "jpg"
  //         }`,
  //       type: isVideo ? "video/mp4" : "image/jpeg",
  //       uploading: true,
  //     };

  //     setAttachments((prev) => [...prev, tempAttachment]);
  //     setUploadingMedia(true);
  //     setUploadProgress(0);

  //     // ⬇️ Upload with token using new backend endpoint
  //     const token = await getToken();
  //     if (!token) {
  //       throw new Error("No authentication token available");
  //     }

  //     const finalUrl = await uploadMediaApi(
  //       {
  //         uri: asset.uri,
  //         name: tempAttachment.name,
  //         type: tempAttachment.type,
  //       },
  //       token,
  //       // (progress) => setUploadProgress(progress),
  //     );

  //     if (finalUrl == null || typeof finalUrl !== "string") {
  //       throw new Error("Upload failed: no Url returned");
  //     }

  //     setAttachments((prev) =>
  //       prev.map((a) =>
  //         a.uri === asset.uri
  //           ? { ...a, uri: finalUrl, uploadedUrl: finalUrl, uploading: false }
  //           : a,
  //       ),
  //     );

  //     // ✅ Auto-detect Content Type for Instagram/Facebook
  //     if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
  //       if (isVideo) {
  //         setFacebookContentType("REEL");
  //         Alert.alert("Success", "Video detected: Switched to Reel/Video mode");
  //       } else if (attachments.length === 0 && !isVideo) {
  //         // Only switch to STANDARD if it's the first upload and it's an image
  //         setFacebookContentType("STANDARD");
  //       }
  //     }

  //     // Alert.alert("Success", "File uploaded successfully");
  //   } catch (error: any) {
  //     console.error("Attachment upload error:", error);
  //     Alert.alert("Upload failed", error?.message || "Media upload failed");
  //     setAttachments((prev) => prev.filter((a) => !a.uploading));
  //   } finally {
  //     setUploadingMedia(false);
  //     setUploadProgress(0);
  //   }
  // }

  // permission for upload
  async function handleAddAttachment() {
    try {
      // 1️⃣ Always ask permission when user taps "+"
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow access to photos and videos to upload media.",
        );
        return;
      }

      // 2️⃣ Open picker ONLY after permission
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

      // 3️⃣ Validate max media limit
      if (attachments.length + 1 > 10) {
        Alert.alert(
          "Upload limit",
          "You can upload a maximum of 10 media files",
        );
        return;
      }

      const tempAttachment: Attachment = {
        uri: asset.uri,
        name:
          asset.fileName ??
          `${isVideo ? "video" : "image"}-${Date.now()}.${
            isVideo ? "mp4" : "jpg"
          }`,
        type: isVideo ? "video/mp4" : "image/jpeg",
        uploading: true,
      };

      setAttachments((prev) => [...prev, tempAttachment]);
      setUploadingMedia(true);
      setUploadProgress(0);

      // 4️⃣ Upload to backend
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const finalUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: tempAttachment.name,
          type: tempAttachment.type,
        },
        token,
      );

      if (!finalUrl) {
        throw new Error("Upload failed: no URL returned");
      }

      // 5️⃣ Replace temp attachment with uploaded one
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === asset.uri
            ? {
                ...a,
                uri: finalUrl,
                uploadedUrl: finalUrl,
                uploading: false,
              }
            : a,
        ),
      );

      // 6️⃣ Auto content-type detection
      if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
        if (isVideo) {
          setFacebookContentType("REEL");
        } else if (attachments.length === 0) {
          setFacebookContentType("STANDARD");
        }
      }
    } catch (error: any) {
      console.error("Attachment upload error:", error);
      Alert.alert("Upload failed", error?.message || "Media upload failed");

      setAttachments((prev) => prev.filter((a) => !a.uploading));
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  }

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
          subject: platform === "SMS" ? "" : (v.subject ?? ""),
          content: v.content,
        })),
      );
    } catch (error: any) {
      Alert.alert("AI Error", error?.message || "Failed to generate content");
    } finally {
      setLoadingAI(false);
    }
  };

  // ================= AI IMAGE =================
  // const handleGenerateAIImage = async () => {
  //   if (!imagePrompt.trim()) {
  //     Alert.alert("Enter a prompt to generate an image");
  //     return;
  //   }

  //   if (loadingImage) return;

  //   setLoadingImage(true);

  //   try {
  //     const token = await getToken();
  //     if (!token) throw new Error("Authentication token missing");

  //     const response = await generateAIImageApi({ prompt: imagePrompt }, token);

  //     const imageUrl = response?.images?.[0];

  //     // 🚫 API responded but no image
  //     // if (!imageUrl) {
  //     //   const failedKey = `failed-${Date.now()}`;

  //     //   setGeneratedImages((prev) => [...prev, failedKey]);

  //     //   setImageLoadingMap((prev) => ({
  //     //     ...prev,
  //     //     [failedKey]: false,
  //     //   }));

  //     //   setImageErrorMap((prev) => ({
  //     //     ...prev,
  //     //     [failedKey]: true,
  //     //   }));

  //     //   // Alert.alert(
  //     //   //   "Image Generation Failed",
  //     //   //   "The AI could not generate an image.",
  //     //   //   [
  //     //   //     {
  //     //   //       text: "OK",
  //     //   //       onPress: () => {
  //     //   //         setImageModalVisible(false);
  //     //   //       },
  //     //   //     },
  //     //   //   ],
  //     //   // );

  //     //   return;
  //     // }

  //     // ✅ Valid image
  //     setGeneratedImages((prev) => [...prev, imageUrl]);

  //     setImageLoadingMap((prev) => ({
  //       ...prev,
  //       [imageUrl]: true,
  //     }));

  //     setImageErrorMap((prev) => ({
  //       ...prev,
  //       [imageUrl]: false,
  //     }));
  //   } catch (error: any) {
  //     Alert.alert(
  //       "Image Generation Error",
  //       error?.message || "Something went wrong while generating the image.",
  //     );
  //   } finally {
  //     setLoadingImage(false);
  //   }
  // };

  const handleSelectGeneratedImage = (imageUrl: string) => {
  setAttachments((prev) => {
    // 🚫 Prevent duplicate selection
    if (prev.some((att) => att.uri === imageUrl)) {
      return prev;
    }

    return [
      ...prev,
      {
        uri: imageUrl,
        name: "ai-image.jpg",
        type: "image/jpeg",
        uploading: false,
      },
    ];
  });

  setImageModalVisible(false);
};

  function normalizeAIImageUrl(url: string) {
    // if (!url) return url;

    // // Remove query params temporarily
    // const [base, query] = url.split("?");

    // // Replace .webp with .jpg
    // if (base.endsWith(".webp")) {
    //   return base.replace(".webp", ".jpg") + (query ? "?" + query : "");
    // }

    return url;
  }

  const handleGenerateAIImage = async () => {
    if (!imagePrompt.trim()) {
      Alert.alert("Enter a prompt to generate an image");
      return;
    }

    if (loadingImage) return;

    setLoadingImage(true);
    console.log("Starting AI image generation for prompt:", imagePrompt);

    try {
      const token = await getToken();
      console.log(
        "Retrieved auth token:",
        token ? "✅ token available" : "❌ no token",
      );
      if (!token) throw new Error("Authentication token missing");

      const response: AIImageResponse = await generateAIImageApi(
        { prompt: imagePrompt },
        token,
      );
      console.log("AI Image API Response:", response);

      const rawImageUrl = response?.imageUrl || response?.imagePrompt;

      if (!rawImageUrl) {
        Alert.alert("Image Generation Failed", "No image URL returned");
        return;
      }

      const imageUrl = normalizeAIImageUrl(rawImageUrl);
      // if (!imageUrl) {
      //   console.warn("API responded but no image returned", response);
      //   Alert.alert("Image Generation Failed", "The AI could not generate an image.");
      //   return;
      // }

      console.log("Generated image URL:", imageUrl);

      const fileName = getFileNameFromUrl(imageUrl);
      const mimeType = getMimeFromUrl(imageUrl);

      const aiAttachment: Attachment = {
        uri: imageUrl,
        uploadedUrl: imageUrl, // IMPORTANT
        name: fileName, // REAL filename
        type: mimeType,
        uploading: false,
      };

      setGeneratedImages((prev) => [...prev, imageUrl]);
      // setAttachments((prev) => [...prev, aiAttachment]);
      setImageLoadingMap((prev) => ({ ...prev, [imageUrl]: true }));
      setImageErrorMap((prev) => ({ ...prev, [imageUrl]: false }));

      console.log(
        "State updated: generatedImages, imageLoadingMap, imageErrorMap",
      );
    } catch (error: any) {
      console.error(
        "Error generating AI image:",
        error?.response || error?.message || error,
      );
      Alert.alert(
        "Image Generation Error",
        error?.message || "Something went wrong while generating the image.",
      );
    } finally {
      setLoadingImage(false);
      console.log(
        "Image generation process completed, loadingImage set to false",
      );
    }
  };

  // ================= FACEBOOK =================
  useEffect(() => {
    if (platform === "FACEBOOK") {
      fetchFacebookPages();
    }
  }, [platform]);

  const fetchFacebookPages = async () => {
    setIsFacebookPageLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const pages = await getFacebookPagesApi(token);

      if (!pages || pages.length === 0) {
        setFacebookPages([]);
        setFacebookError(
          "No Facebook Pages found. Make sure you've connected your account and granted permissions.",
        );
        setSelectedFacebookPage(null);
      } else {
        setFacebookPages(pages);
        setFacebookError("");
        setSelectedFacebookPage(pages[0].name);
      }
    } catch (err: any) {
      setFacebookPages([]);
      setSelectedFacebookPage(null);
      setFacebookError(
        err.message === "Facebook not connected"
          ? "No Facebook Pages found. Make sure you've connected your account and granted permissions."
          : "Failed to fetch Facebook Pages",
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
      if (!token) throw new Error("Authentication token missing");

      const boards = await getPinterestBoardsApi(token);
      console.log("pinterest board array", boards);
      setAllPinterestBoards(
        boards.map((board: any) => ({
          id: board.id,
          name: board.name,
        })),
      );
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
        token,
      );

      // ✅ success
      setPinterestBoard(response?.data?.name || newPinterestBoard.trim());
      setPinterestBoardId(response?.data?.id);

      setMetadata((prev) => ({
        ...prev,
        boardId: response?.data?.id,
        boardName: response?.data?.name || newPinterestBoard.trim(),
      }));
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
          "You already have a board with this name. Please choose a different name.",
        );
      } else if (errorMessage === "Pinterest not connected") {
        Alert.alert(
          "Pinterest Not Connected",
          "Please connect your Pinterest account before creating a board.",
        );
      } else {
        Alert.alert(
          "Error",
          error?.response?.data?.message || "Failed to create board",
        );
      }
    } finally {
      setIsPinterestBoardLoading(false);
    }
  };

  // ================= MEDIA UPLOADS =================
  const handleCustomThumbnailUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const uploadedUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: `thumbnail-${Date.now()}.jpg`,
          type: "image/jpeg",
        },
        token,
      );

      if (uploadedUrl && typeof uploadedUrl === "string") {
        setCustomThumbnail(uploadedUrl);
      } else {
        throw new Error("Failed to upload thumbnail: no URL returned");
      }
    } catch (error: any) {
      Alert.alert(
        "Upload failed",
        error?.message || "Failed to upload thumbnail",
      );
    }
  };

  const handleCoverImageUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    try {
      setCoverUploading(true);

      const token = await getToken();
      if (!token) {
        throw new Error("No authentication token available");
      }

      const uploadedUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: `cover-${Date.now()}.jpg`,
          type: "image/jpeg",
        },
        token,
        (progress) => {
          console.log("Cover Upload Progress:", progress);
        },
      );

      if (uploadedUrl && typeof uploadedUrl === "string") {
        setCoverImage(uploadedUrl);
      } else {
        throw new Error("Failed to upload cover image: no URL returned");
      }
    } catch (error: any) {
      console.error("Cover upload error:", error);
      Alert.alert(
        "Upload failed",
        error?.message || "Failed to upload cover image",
      );
    } finally {
      setCoverUploading(false);
    }
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // ================= VALIDATION =================
      // Common required fields
      if (
        !message
        //  || !postDate
      ) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      const mediaRequiredPlatforms = ["INSTAGRAM", "YOUTUBE", "PINTEREST"];
      if (
        mediaRequiredPlatforms.includes(platform) &&
        attachments.length === 0
      ) {
        Alert.alert(
          "⚠️ Missing Media",
          "Please add at least one image or video for this platform.",
        );
        return;
      }

      // Email-specific validation
      if (platform === "EMAIL" && (!subject || !senderEmail)) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      // Platforms that require subject
      const subjectRequiredPlatforms = [
        "FACEBOOK",
        "INSTAGRAM",
        "LINKEDIN",
        "YOUTUBE",
        "PINTEREST",
      ];

      if (subjectRequiredPlatforms.includes(platform) && !subject) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      // ================= CAMPAIGN ID =================
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

      // ================= TAGS =================
      const parsedTags = youTubeTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const postData: CampaignPostData = {
        senderEmail, // working
        subject, // working
        message, // working
        type: platform, // working
        mediaUrls: attachments.map((a) => a.uploadedUrl || a.uri), // working
        scheduledPostTime: postDate?.toISOString() || "", // working
        pinterestBoard, // working

        metadata: {
          ...metadata,

          // ================= COMMON =================
          tags: parsedTags, // working

          // ================= PINTEREST =================
          ...(platform === "PINTEREST" && {
            boardId: PinterestBoardId, // working
            boardName: pinterestBoard, // working
            destinationLink: metadata.destinationLink, // working
          }),

          // ================= YOUTUBE =================
          ...(platform === "YOUTUBE" && {
            postType: youTubeContentType,
            privacy: youTubeStatus, // working
            thumbnailUrl: customThumbnail || null,
            playlistId,
            playlistTitle,
          }),

          // ================= FACEBOOK / INSTAGRAM =================
          ...(platform === "FACEBOOK" || platform === "INSTAGRAM"
            ? {
                postType: facebookContentType,
                coverImage: coverImage || null,
              }
            : {}),

          // ================= LINKEDIN =================
          ...(platform === "LINKEDIN" && {
            authorId: selectedAccount,
            authorType: "ORGANIZATION",
          }),
        },
      };

      const isFutureDateTime = (date: Date) => {
        return date.getTime() > Date.now();
      };

      // ================= SCHEDULE VALIDATION =================
      if (postDate) {
        if (!isFutureDateTime(postDate)) {
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

          setLoading(false);
          return;
        }
      }

      // ================= API CALL =================
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      let response;
      console.log("post data is", postData);
      if (existingPost?.id) {
        // ✅ Edit existing post
        response = await updatePostForCampaignApi(
          Number(campaignIdToUse),
          Number(existingPost.id),
          postData,
          token,
        );
      } else {
        // ✅ Create new post
        response = await createPostForCampaignApi(
          Number(campaignIdToUse),
          postData,
          token,
        );
      }
      onClose?.(response);

      // ================= RESET (ONLY CREATE) =================
      if (!existingPost) {
        setSenderEmail("");
        setSubject("");
        setMessage("");
        setAiPrompt("");
        setPostDate(null);
        setImagePrompt("");
        setGeneratedImages([]);
        setSelectedImage(undefined);
        setCoverImage(null);
      }

      onCreatedNavigate ? onCreatedNavigate() : router.back();
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong";

      Alert.alert("⚠️ Scheduling Error", apiMessage);
    } finally {
      setLoading(false);
    }
  };

  // ================= RETURN =================
  return {
    isDark,
    // state
    platform,
    previewTimestamp,
    senderEmail,
    subject,
    message,
    postDate,
    attachments,
    aiPrompt,
    aiResults,
    aiModalVisible,
    imageLoadingMap,
    imagePrompt,
    generatedImages,
    imageModalVisible,
    facebookPages,
    coverImage,
    coverUploading,
    facebookContentType,
    selectedFacebookPage,
    isFacebookPageLoading,
    pinterestBoard,
    pinterestModalVisible,
    newPinterestBoard,
    allPinterestBoards,
    isPinterestBoardLoading,
    pinterestDescription,
    destinationLink,
    youTubeContentType,
    youTubeTags,
    youTubeStatus,
    playlistId,
    playlistTitle,
    customThumbnail,
    showStatusDropdown,
    isCreatingPlaylist,
    showPicker,
    showTimePicker,
    loading,
    loadingAI,
    loadingImage,
    dropdownVisible,
    loadingBoards,
    isCreatingPinterestBoard,
    existingPost,
    uploadProgress,
    uploadingMedia,
    playlists,
    showPlaylistDropdown,
    selectedPlaylist,
    newPlaylistName,
    selectedAccount,
    minSelectableStartDate,
    minSelectableEndDate,
    maxSelectableEndDate,
    imageErrorMap,

    // setters
    setSenderEmail,
    setSubject,
    setMessage,
    setPostDate,
    setAttachments,
    setAiPrompt,
    setAiModalVisible,
    setImageLoadingMap,
    setImagePrompt,
    setImageModalVisible,
    setFacebookContentType,
    setSelectedFacebookPage,
    setPinterestModalVisible,
    setPinterestBoard,
    setPinterestBoardId,
    setNewPinterestBoard,
    setDropdownVisible,
    setDestinationLink,
    setYouTubeContentType,
    setYouTubeTags,
    setPlaylistId,
    setPlaylistTitle,
    setYouTubeStatus,
    setShowStatusDropdown,
    setIsCreatingPlaylist,
    setIsCreatingPinterestBoard,
    setPinterestDescription,
    setShowPicker,
    setShowTimePicker,
    setUploadProgress,
    setUploadingMedia,
    setShowPlaylistDropdown,
    setSelectedPlaylist,
    setNewPlaylistName,
    setSelectedAccount,
    setImageErrorMap,

    // actions
    handleAddAttachment,
    handleRemoveAttachment,
    handleGenerateAIText,
    handleGenerateAIImage,
    handleCreatePinterestBoard,
    handleCustomThumbnailUpload,
    handleCoverImageUpload,
    handleSelectGeneratedImage,
    handleSubmit,
  };
}

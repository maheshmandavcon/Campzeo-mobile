import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { getUser } from "@/api/dashboardApi";
import Toast from "react-native-toast-message";

import type { AIImageResponse, CampaignPostData } from "@/api/campaignApi";
import {
  createPinterestBoardApi,
  createPostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
  getFbPages,
  getLeedForm,
  getPinterestBoardsApi,
  updatePostForCampaignApi,
  uploadMediaApi,
  getYoutubePlaylists,
  createYoutubePlaylist,
} from "@/api/campaignApi";
import { de } from "zod/v4/locales";

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
  isLoading?: boolean;
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

  // ================= ORG ID =================
  const [organisationId, setOrganisationId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        const user = await getUser();
        const orgId = user?.organisation?.id;
        if (orgId) {
          setOrganisationId(orgId);
          console.log("🏢 Organisation ID loaded:", orgId);
        }
      } catch (err) {
        console.warn("Could not fetch organisationId:", err);
      }
    };
    fetchOrgId();
  }, [existingPost]);

  // ================= BASIC =================
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [postDate, setPostDate] = useState<Date | null>(null);

  // ================= ATTACHMENTS =================
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const hasImage = attachments.some((a) => a.type?.startsWith("image/"));
  const hasVideo = attachments.some((a) => a.type?.startsWith("video/"));
  const hasAttachment = attachments.length > 0;
  const [canSelectStandard, setCanSelectStandard] = useState(hasImage);
  const [canSelectReel, setCanSelectReel] = useState(hasVideo && !hasImage);

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
  const [selectingImage, setSelectingImage] = useState<string | null>(null);

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
  const [selectedFacebookPageId, setSelectedFacebookPageId] = useState<string | null>(existingPost?.facebookPageId || null);
  const [selectedFacebookPageAccessToken, setSelectedFacebookPageAccessToken] = useState<string | null>(existingPost?.facebookPageAccessToken || null);
  const [instagramBusinessId, setInstagramBusinessId] = useState<string | null>(existingPost?.instagramBusinessId || null);
  const [leadFormId, setLeadFormId] = useState<string | null>(existingPost?.leadFormId || null);
  const [leadForms, setLeadForms] = useState<any[]>([]);
  const [isLoadingLeadForms, setIsLoadingLeadForms] = useState(false);
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

  const PLATFORM_LABELS: Record<string, string> = {
    INSTAGRAM: "Instagram",
    YOUTUBE: "YouTube",
    PINTEREST: "Pinterest",
    FACEBOOK: "Facebook",
    LINKEDIN: "LinkedIn",
    EMAIL: "Email",
  };

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

  // useEffect(() => {
  //   const imageCount = attachments.filter((a) =>
  //     a.type?.startsWith("image/"),
  //   ).length;
  //   const videoCount = attachments.filter((a) =>
  //     a.type?.startsWith("video/"),
  //   ).length;

  //   const isCombo = imageCount > 0 && videoCount > 0;

  //   // Can select STANDARD → always true if combo OR images exist
  //   setCanSelectStandard(imageCount > 0 || isCombo);

  //   // Can select REEL → only if videos exist AND NO images
  //   setCanSelectReel(videoCount > 0 && imageCount === 0);

  //   // Auto-set facebookContentType based on rules
  //   if (isCombo) {
  //     setFacebookContentType("STANDARD");
  //   } else if (videoCount > 0 && imageCount === 0) {
  //     setFacebookContentType("REEL");
  //   } else if (imageCount > 0 && videoCount === 0) {
  //     setFacebookContentType("STANDARD");
  //   } else {
  //     setFacebookContentType("STANDARD"); // default
  //   }
  // }, [attachments]);

  useEffect(() => {
    const imageCount = attachments.filter((a) =>
      a.type?.startsWith("image/"),
    ).length;

    const videoCount = attachments.filter((a) =>
      a.type?.startsWith("video/"),
    ).length;

    const isCombo = imageCount > 0 && videoCount > 0;

    setCanSelectStandard(imageCount > 0 || isCombo);
    setCanSelectReel(videoCount > 0 && imageCount === 0);

    // ✅ DO NOT override content type if editing
    if (existingPost) return;

    // ✅ Only auto-detect when creating new post
    if (isCombo) {
      setFacebookContentType("STANDARD");
    } else if (videoCount > 0 && imageCount === 0) {
      setFacebookContentType("REEL");
    } else if (imageCount > 0 && videoCount === 0) {
      setFacebookContentType("STANDARD");
    } else {
      setFacebookContentType("STANDARD");
    }
  }, [attachments]);

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

  // function getMimeFromUrl(url: string) {
  //   const ext = url.split(".").pop()?.toLowerCase();
  //   if (ext === "webp") return "image/webp";
  //   if (ext === "png") return "image/png";
  //   return "image/jpeg";
  // }
  function getMimeFromUrl(url: string) {
    return "image/jpeg"; // ✅ safest
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

    console.log("🔍 PREFILL existingPost:", existingPost);
    console.log("🔍 PREFILL metadata:", existingPost?.metadata);

    // Safely parse JSON metadata string if applicable
    if (existingPost && typeof existingPost.metadata === "string" && existingPost.metadata.trim().length > 0) {
      try {
        existingPost.metadata = JSON.parse(existingPost.metadata);
      } catch (e) {
        console.warn("Could not parse existingPost.metadata string:", e);
      }
    }

    console.log(
      "🔍 PREFILL coverImage from metadata:",
      existingPost?.metadata?.coverImage,
    );
    console.log("🔍 PREFILL coverImage root:", existingPost?.coverImage);
    console.log("🔍 PREFILL thumbnailUrl:", existingPost?.thumbnailUrl);

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

    if (existingPost.type === "FACEBOOK" || existingPost.type === "INSTAGRAM") {
      const typeMap: Record<string, "STANDARD" | "REEL"> = {
        STANDARD: "STANDARD",
        POST: "STANDARD",
        REEL: "REEL",
        SHORT: "REEL",
        SHORT_VIDEO: "REEL",
        VIDEO: "REEL",
      };

      let contentType: "STANDARD" | "REEL" = "STANDARD";
      if (existingPost.metadata?.postType) {
        contentType = existingPost.metadata.postType;
      } else if (existingPost.videoUrl) {
        contentType = "REEL";
      } else {
        contentType = "STANDARD";
      }
      setFacebookContentType(contentType);

      const savedCover =
        existingPost.metadata?.coverImage ||
        existingPost.metadata?.thumbnailUrl ||
        null;
      console.log("🎯 SAVED COVER FROM MEDIA URLS:", savedCover);
      setCoverImage(savedCover);

      if (existingPost.instagramBusinessId) {
        setInstagramBusinessId(existingPost.instagramBusinessId);
      }
    }

    // ✅ LINKEDIN
    if (existingPost.type === "LINKEDIN") {
      const authorId = existingPost.metadata?.authorId;

      if (authorId) {
        setSelectedAccount(String(authorId));
      }
    }

    // ================= ATTACHMENTS =================
    const prefilledAttachments: Attachment[] = [];

    // Get the cover image to exclude it from attachments (for Reel posts)
    let coverImageToExclude: string | null = null;
    if (existingPost.type === "FACEBOOK" || existingPost.type === "INSTAGRAM") {
      if (existingPost.metadata?.coverImage) {
        coverImageToExclude = existingPost.metadata.coverImage;
      } else if (existingPost.metadata?.thumbnailUrl) {
        coverImageToExclude = existingPost.metadata.thumbnailUrl;
      }
    }

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
        ...existingPost.mediaUrls
          .filter((url: string) => {
            // Exclude cover image from attachments
            if (coverImageToExclude && url === coverImageToExclude) {
              console.log("Excluding cover image from attachments:", url);
              return false;
            }
            return true;
          })
          .map((url: string, index: number) => ({
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
        mediaTypes: isYouTube ? ["videos"] : ["images", "videos"],
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
          `${isVideo ? "video" : "image"}-${Date.now()}.${isVideo ? "mp4" : "jpg"
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

      console.log(`🖼️ Initiating upload for media (${tempAttachment.type}):`, tempAttachment.name);
      const finalUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: tempAttachment.name,
          type: tempAttachment.type,
        },
        token,
        undefined,
        {
          organisationId,
          campaignId,
          isReel: isVideo,
          platform,
        }
      );
      console.log(`✅ Upload complete. Attachment URI:`, finalUrl);

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
      // if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
      //   if (isVideo) {
      //     setFacebookContentType("REEL");
      //   } else if (attachments.length === 0) {
      //     setFacebookContentType("STANDARD");
      //   }
      // }
      // 6️⃣ Auto content-type detection (FIXED)
      if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
        if (isVideo) {
          // If ANY video uploaded → force REEL
          setFacebookContentType("REEL");
        } else {
          // If only images AND no video exists in attachments → STANDARD
          const hasExistingVideo = attachments.some((a) =>
            a.type?.startsWith("video/"),
          );

          if (!hasExistingVideo) {
            setFacebookContentType("STANDARD");
          }
        }
      }

      if (platform === "YOUTUBE" && isVideo) {
        const durationSec = (asset.duration || 0) / 1000;
        const w = asset.width || 0;
        const h = asset.height || 0;
        
        // YouTube Short criteria: vertical orientation and <= 3 minutes
        if (h > w && durationSec > 0 && durationSec <= 180) {
          setYouTubeContentType("SHORT");
        } else {
          setYouTubeContentType("VIDEO");
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

  // const handleRemoveAttachment = (uri: string) => {
  //   setAttachments((prev) =>
  //     prev.filter((att) => att.uri !== uri && att.uploadedUrl !== uri),
  //   );
  // };
  const handleRemoveAttachment = (uri: string) => {
    setAttachments((prev) => {
      const updated = prev.filter(
        (att) => att.uri !== uri && att.uploadedUrl !== uri,
      );

      // 🔥 Auto revert to STANDARD if no videos left
      if (
        (platform === "FACEBOOK" || platform === "INSTAGRAM") &&
        !updated.some((a) => a.type?.startsWith("video/"))
      ) {
        setFacebookContentType("STANDARD");
      }

      return updated;
    });
  };

  // ================= AI TEXT =================
  const handleGenerateAIText = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Enter instruction like: add emoji, make promotional");
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
      const orgId = user?.orgId;
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const prompt = `Generate 3 distinct message variations for ${platform || "social media"} about: \"${aiPrompt}\". \n    Return the response ONLY as a JSON array of objects with the exact structure: \n    [{\"title\": \"Creative Title\", \"content\": \"The main body content\", \"hashtags\": \"comma, separated, tags\"}]\n    Variation 1: Professional\n    Variation 2: Creative\n    Variation 3: Concise\n    Do not include any extra text outside the JSON array.`;

      const payload = {
        prompt,
        message: prompt,
        context: { platform, existingContent: message || "" },
        mode: "generate-multiple",
      };

      console.log("🤖 Generating 3 AI variations with single payload API request...");

      const res = await generateAIContentApi(orgId, payload, token);
      // console.log("🤖 AI Content API Response received:", res);

      const rawMessage = res?.message || res?.content || "";
      if (!rawMessage) {
        throw new Error("No content received from AI generator");
      }

      // Robust JSON extracting parser
      const extractJsonArray = (str: string) => {
        try {
          return JSON.parse(str);
        } catch (e) {
          const match = str.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            try {
              return JSON.parse(match[0]);
            } catch (innerError) {
              console.warn("Failed to parse matched JSON substring:", innerError);
            }
          }
          throw e;
        }
      };

      const parsedVariations = extractJsonArray(rawMessage);
      if (!Array.isArray(parsedVariations)) {
        throw new Error("Invalid response format from AI generator: expected JSON array");
      }

      const results = parsedVariations.map((item: any) => {
        const subject = item.title || item.subject || "";
        const contentText = item.content || "";

        // Format hashtags elegantly as #tag1 #tag2 instead of "tag1, tag2"
        const formattedHashtags = item.hashtags
          ? item.hashtags
            .split(",")
            .map((tag: string) => {
              const trimmed = tag.trim();
              if (!trimmed) return "";
              return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
            })
            .filter(Boolean)
            .join(" ")
          : "";

        const content = formattedHashtags
          ? `${contentText}\n\n${formattedHashtags}`
          : contentText;

        return {
          subject,
          content,
          isLoading: false,
        };
      });

      // Ensure we have exactly 3 results to bind to our variations list
      while (results.length < 3) {
        results.push({
          subject: "",
          content: "No additional variation returned by AI",
          isLoading: false,
        });
      }

      setAiResults(results.slice(0, 3));
    } catch (error: any) {
      console.error("❌ AI Content Generation Error:", error);
      const errorMsg = error?.message || "AI API request failed";

      setAiResults([
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
        { subject: "", content: `Error: ${errorMsg}`, isLoading: false },
      ]);
      Alert.alert("AI Generation Error", errorMsg);
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

  // const handleSelectGeneratedImage = async (imageUrl: string) => {
  //   try {      
  //     if (selectingImage) return;

  //     setSelectingImage(imageUrl);

  //     const token = await getToken();
  //     if (!token) throw new Error("Token missing");

  //     console.log(`🤖 Initiating upload for AI generated image:`, imageUrl);
  //     const uploadedUrl = await uploadMediaApi(
  //       {
  //         uri: imageUrl,
  //         name: `ai-image-${Date.now()}.jpg`,
  //         type: "image/jpeg",
  //       },
  //       token,
  //       undefined,
  //       {
  //         organisationId,
  //         campaignId,
  //         isReel: false,
  //         platform,
  //       }
  //     );
  //     console.log(`✅ AI image upload complete. Attachment URI:`, uploadedUrl);

  //     setAttachments((prev) => [
  //       ...prev,
  //       {
  //         uri: uploadedUrl,
  //         uploadedUrl: uploadedUrl,
  //         name: "ai-image.jpg",
  //         type: "image/jpeg",
  //         uploading: false,
  //       },
  //     ]);

  //     setSelectedImage(imageUrl);

  //     // small delay makes UX smoother
  //     setTimeout(() => {
  //       setImageModalVisible(false);
  //       setSelectingImage(null);
  //     }, 300);
  //   } catch (error: any) {
  //   console.log("AI IMAGE UPLOAD ERROR:", error);
  //  console.log("ERROR RESPONSE:", error?.response);
  //  console.log("ERROR MESSAGE:", error?.message);

  //  setSelectingImage(null);

  //  Alert.alert(
  //     "Upload failed",
  //     error?.message || "Unable to upload AI image"
  //  );
  //   }
  // };

  const handleSelectGeneratedImage = async (imageUrl: string) => {
    try {
      if (selectingImage) return;

      setSelectingImage(imageUrl);

      // Directly save AI image URL
      setAttachments((prev) => [
        ...prev,
        {
          uri: imageUrl,
          uploadedUrl: imageUrl,
          name: `ai-image-${Date.now()}.webp`,
          type: "image/webp",
          uploading: false,
        },
      ]);

      setSelectedImage(imageUrl);

      setTimeout(() => {
        setImageModalVisible(false);
        setSelectingImage(null);
      }, 300);

    } catch (error: any) {
      console.log("AI IMAGE ERROR:", error);

      setSelectingImage(null);

      Alert.alert(
        "Error",
        error?.message || "Failed to use AI image"
      );
    }
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

      // const aiAttachment: Attachment = {
      //   uri: imageUrl,
      //   uploadedUrl: imageUrl, // IMPORTANT
      //   name: fileName, // REAL filename
      //   type: mimeType,
      //   uploading: false,
      // };

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
    if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
      fetchFacebookPages();
    }
  }, [platform]);

  const fetchLeadForms = async (pageId: string, pageAccessToken: string) => {
    if (!pageId || !pageAccessToken) return;
    setIsLoadingLeadForms(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      console.log(`🔌 Fetching Lead Forms for Page ID: ${pageId}...`);
      const response = await getLeedForm(pageId, pageAccessToken, token);
      const forms = response?.forms?.data || [];
      console.log(`📬 Loaded ${forms.length} Lead Forms.`);
      setLeadForms(forms);
    } catch (err) {
      console.warn("Failed to fetch Lead Forms:", err);
      setLeadForms([]);
    } finally {
      setIsLoadingLeadForms(false);
    }
  };

  const handleSelectFacebookPage = async (pageId: string) => {
    const pageObj = facebookPages.find((p: any) => String(p.id) === String(pageId));
    if (pageObj) {
      setSelectedFacebookPage(pageObj.name);
      setSelectedFacebookPageId(pageObj.id);
      setSelectedFacebookPageAccessToken(pageObj.access_token);
      
      const instaId = pageObj.instagram_business_account?.id || pageObj.instagramBusinessId || pageObj.instagram_business_account_id || null;
      setInstagramBusinessId(instaId);

      setLeadFormId(null);
      setLeadForms([]);
      await fetchLeadForms(pageObj.id, pageObj.access_token);
    } else {
      setSelectedFacebookPage(null);
      setSelectedFacebookPageId(null);
      setSelectedFacebookPageAccessToken(null);
      setInstagramBusinessId(null);
      setLeadFormId(null);
      setLeadForms([]);
    }
  };

  const fetchFacebookPages = async () => {
    setIsFacebookPageLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      console.log("🔌 Loading Facebook Pages using getFbPages...");
      const response = await getFbPages(token);
      const pages = response?.pages?.data || [];

      if (!pages || pages.length === 0) {
        setFacebookPages([]);
        setFacebookError(
          "No Facebook Pages found. Make sure you've connected your account and granted permissions.",
        );
        setSelectedFacebookPage(null);
        setSelectedFacebookPageId(null);
        setSelectedFacebookPageAccessToken(null);
        setLeadForms([]);
      } else {
        setFacebookPages(pages);
        setFacebookError("");

        // If in Edit Mode and matches existingPost
        if (existingPost?.facebookPageId) {
          const match = pages.find((p: any) => String(p.id) === String(existingPost.facebookPageId));
          if (match) {
            setSelectedFacebookPage(match.name);
            setSelectedFacebookPageId(match.id);
            setSelectedFacebookPageAccessToken(match.access_token);
            
            const instaId = match.instagram_business_account?.id || match.instagramBusinessId || match.instagram_business_account_id || existingPost.instagramBusinessId || null;
            setInstagramBusinessId(instaId);

            await fetchLeadForms(match.id, match.access_token);
            if (existingPost.leadFormId) {
              setLeadFormId(String(existingPost.leadFormId));
            }
            return;
          }
        }

        // Default to the first page
        const firstPage = pages[0];
        if (firstPage) {
          setSelectedFacebookPage(firstPage.name);
          setSelectedFacebookPageId(firstPage.id);
          setSelectedFacebookPageAccessToken(firstPage.access_token);
          
          const firstInstaId = firstPage.instagram_business_account?.id || firstPage.instagramBusinessId || firstPage.instagram_business_account_id || null;
          setInstagramBusinessId(firstInstaId);

          await fetchLeadForms(firstPage.id, firstPage.access_token);
        }
      }
    } catch (err: any) {
      setFacebookPages([]);
      setSelectedFacebookPage(null);
      setSelectedFacebookPageId(null);
      setSelectedFacebookPageAccessToken(null);
      setFacebookError("Failed to fetch Facebook Pages");
      setLeadForms([]);
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
      // console.log("pinterest board array", boards);
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

  // ================= YOUTUBE PLAYLISTS =================
  const fetchYoutubePlaylists = async () => {
    setLoadingPlaylists(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const response = await getYoutubePlaylists(token);
      const list = response?.playlists || [];
      const mapped = list.map((item: any) => ({
        id: item.id,
        name: item.title,
      }));
      setPlaylists(mapped);

      // If in Edit Mode and matches existingPost
      if (existingPost?.youtubePlaylistId) {
        const match = mapped.find((p: any) => String(p.id) === String(existingPost.youtubePlaylistId));
        if (match) {
          setSelectedPlaylist(match);
          setPlaylistId(match.id);
          setPlaylistTitle(match.name);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch YouTube playlists:", err);
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleCreateYoutubePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert("Playlist title cannot be empty");
      return;
    }
    setLoadingPlaylists(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      console.log(`🔌 Creating YouTube playlist with title: ${newPlaylistName.trim()}...`);
      const response = await createYoutubePlaylist(
        {
          title: newPlaylistName.trim(),
          privacy: "public",
        },
        token
      );

      // Successfully created! Let's clear create state and reload list
      setIsCreatingPlaylist(false);
      setNewPlaylistName("");
      
      // Let's reload playlists so the created playlist appears in the dropdown list
      await fetchYoutubePlaylists();

      // If the response contains the new playlist data, auto-select it!
      const createdId = response?.data?.id || response?.playlist?.id;
      const createdTitle = response?.data?.title || response?.playlist?.title || newPlaylistName.trim();
      if (createdId) {
        const newSel = { id: createdId, name: createdTitle };
        setSelectedPlaylist(newSel);
        setPlaylistId(createdId);
        setPlaylistTitle(createdTitle);
      } else {
        Toast.show({
          type: "success",
          text1: "Playlist Created",
          text2: "Your playlist was created successfully."
        });
      }
    } catch (error: any) {
      console.error("Failed to create YouTube playlist:", error);
      Alert.alert("Error", error.message || "Failed to create YouTube playlist");
    } finally {
      setLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (platform === "YOUTUBE") {
      fetchYoutubePlaylists();
    }
  }, [platform]);

  const handleCustomThumbnailUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
        undefined,
        {
          organisationId,
        }
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

  // const handleCoverImageUpload = async () => {
  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ["images"],
  //     allowsEditing: true,
  //     aspect: [9, 16],
  //     quality: 1,
  //   });

  //   if (result.canceled) return;

  //   const asset = result.assets[0];

  //   try {
  //     setCoverUploading(true);

  //     const token = await getToken();
  //     if (!token) {
  //       throw new Error("No authentication token available");
  //     }

  //     const uploadedUrl = await uploadMediaApi(
  //       {
  //         uri: asset.uri,
  //         name: `cover-${Date.now()}.jpg`,
  //         type: "image/jpeg",
  //       },
  //       token,
  //       (progress) => {
  //         console.log("Cover Upload Progress:", progress);
  //       },
  //     );

  //     if (uploadedUrl && typeof uploadedUrl === "string") {
  //       setCoverImage(uploadedUrl);
  //     } else {
  //       throw new Error("Failed to upload cover image: no URL returned");
  //     }
  //   } catch (error: any) {
  //     console.error("Cover upload error:", error);
  //     Alert.alert(
  //       "Upload failed",
  //       error?.message || "Failed to upload cover image",
  //     );
  //   } finally {
  //     setCoverUploading(false);
  //   }
  // };

  const handleCoverImageUpload = async () => {
    console.log("[Cover] Image picker opened");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (result.canceled) {
      console.log("[Cover] Image picker canceled");
      return;
    }

    const asset = result.assets[0];
    console.log("[Cover] Image selected:", asset.uri);

    try {
      setCoverUploading(true);
      console.log("[Cover] Upload started");

      const token = await getToken();
      if (!token) {
        console.error("[Cover] No token available");
        throw new Error("No token available");
      }
      console.log("[Cover] Token retrieved");

      const uploadedUrl = await uploadMediaApi(
        {
          uri: asset.uri,
          name: `cover-${Date.now()}.jpg`,
          type: "image/jpeg",
        },
        token,
        undefined,
        {
          organisationId,
          campaignId,
          platform,
          isReel: false,
        }
      );

      if (uploadedUrl && typeof uploadedUrl === "string") {
        console.log("[Cover] Upload finished, URL:", uploadedUrl);
        setCoverImage(uploadedUrl); // ✅ correctly set coverImage state
      } else {
        console.error("[Cover] Upload finished but no URL returned");
        throw new Error("No URL returned");
      }
    } catch (error: any) {
      console.error("[Cover] Upload error:", error);
      Alert.alert(
        "Upload failed",
        error?.message || "Failed to upload cover image",
      );
    } finally {
      setCoverUploading(false);
      console.log("[Cover] Upload state set to false");
    }
  };
  // ================= SUBMIT =================
  const handleSubmit = async () => {
    const user = await getUser();
    const userId = user.id;
    const orgId = user.organisationId;
    if (loading) return;
    setLoading(true);

    try {
      // ================= BASIC VALIDATION =================
      if (!message) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

      const mediaRequiredPlatforms = ["INSTAGRAM", "YOUTUBE", "PINTEREST"];

      if (
        mediaRequiredPlatforms.includes(platform) &&
        attachments.length === 0
      ) {
        const platformName = PLATFORM_LABELS[platform] ?? platform;
        Alert.alert(
          "⚠️ Missing Media",
          `Please add at least one image or video for ${platformName}.`
        );
        return;
      }

      if (platform === "EMAIL" && (!subject || !senderEmail)) {
        Alert.alert("⚠️ Please fill in all fields.");
        return;
      }

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
      const campaignIdToUse =
        Number(campaignId) ||
        Number(existingPost?.campaignId) ||
        Number(existingPost?.campaign?.id);

      if (!campaignIdToUse) {
        Toast.show({
          type: "error",
          text1: "Campaign ID missing",
          text2: "Please select a valid campaign."
        });
        return;
      }

      // ================= PINTEREST MESSAGE LIMIT VALIDATION =================
      if (platform === "PINTEREST" && message.length > 800) {
        Toast.show({
          type: "error",
          text1: "Message Too Long",
          text2: `Pinterest limit is 800 characters. Currently: ${message.length}`
        });
        return;
      }

      // ================= TAGS =================
      const parsedTags = youTubeTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // ================= MEDIA VALIDATION =================
      const mediaUrls = attachments
        .filter(
          (a): a is typeof a & { uploadedUrl: string } =>
            !!a.uploadedUrl &&
            !!a.type &&
            (a.type.startsWith("image/") || a.type.startsWith("video/"))
        )
        .map((a) => a.uploadedUrl);

      console.log("MEDIA URLS BEING SENT:", mediaUrls);

      const invalidMedia = attachments.filter(
        (a) =>
          !a.uploadedUrl ||
          !a.type ||
          (!a.type.startsWith("image/") && !a.type.startsWith("video/"))
      );

      if (invalidMedia.length > 0) {
        Alert.alert(
          "Invalid Media",
          "Some media files are not uploaded properly. Please reselect them."
        );
        return;
      }

      // ================= BUILD CLEAN METADATA =================
      let finalMetadata: any = {};
      const socialPlatforms = ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "PINTEREST", "LINKEDIN"];
      if (socialPlatforms.includes(platform)) {
        finalMetadata.tags = parsedTags;
      }

      // YOUTUBE
      if (platform === "YOUTUBE") {
        finalMetadata = {
          ...finalMetadata,
          postType: youTubeContentType,
          privacy: youTubeStatus,
          thumbnailUrl: customThumbnail || null,
          playlistId,
          playlistTitle,
        };
      }

      // FACEBOOK / INSTAGRAM
      if (platform === "FACEBOOK" || platform === "INSTAGRAM") {
        const isActuallyReel = facebookContentType === "REEL";
        finalMetadata = {
          ...finalMetadata,
          postType: facebookContentType,
          isReel: isActuallyReel,
          coverImage: coverImage || null,
          coverUrl: coverImage || null,
          thumbnailUrl: coverImage || null,
        };
      }

      // LINKEDIN
      if (platform === "LINKEDIN") {
        finalMetadata = {
          ...finalMetadata,
          authorId: selectedAccount,
          authorType: "ORGANIZATION",
        };
      }

      // PINTEREST
      if (platform === "PINTEREST") {
        finalMetadata = {
          ...finalMetadata,
          boardId: PinterestBoardId,
          boardName: pinterestBoard,
          destinationLink: metadata?.destinationLink || "",
        };
      }

      // ================= BUILD POST DATA =================
      // Get selected Facebook page details if applicable
      const selectedPageObj = facebookPages.find(
        (p) => p.name === selectedFacebookPage
      );

      // ================= BUILD POST DATA =================
      const postData: any = {
        campaignId: campaignIdToUse,
        contentType: existingPost?.contentType || "POST",
        facebookPageAccessToken: selectedFacebookPageAccessToken || existingPost?.facebookPageAccessToken || "",
        facebookPageId: selectedFacebookPageId || existingPost?.facebookPageId || "",
        facebookPageName: selectedFacebookPage || existingPost?.facebookPageName || "",
        instagramBusinessId: instagramBusinessId || existingPost?.instagramBusinessId || "",
        leadFormId: leadFormId ? Number(leadFormId) : (existingPost?.leadFormId || null),
        mediaUrls,
        message: message || "",
        pinterestBoardId: PinterestBoardId || existingPost?.pinterestBoardId || "",
        pinterestLink: destinationLink || metadata?.destinationLink || existingPost?.pinterestLink || "",
        scheduledPostTime: postDate?.toISOString() || new Date().toISOString(),
        senderEmail: senderEmail || null,
        subject: subject || "",
        thumbnailUrl: coverImage || customThumbnail || existingPost?.thumbnailUrl || null,
        type: platform,
        youtubeContentType: youTubeContentType || existingPost?.youtubeContentType || "VIDEO",
        youtubePlaylistId: playlistId || existingPost?.youtubePlaylistId || "",
        youtubePlaylistTitle: playlistTitle || existingPost?.youtubePlaylistTitle || "",
        youtubePrivacy: youTubeStatus ? youTubeStatus.toLowerCase() : (existingPost?.youtubePrivacy || "public"),
        youtubeTags: parsedTags || existingPost?.youtubeTags || [],
      };

      if (existingPost?.id) {
        postData.id = existingPost.id;
      }

      console.log(
        "FINAL CREATE/UPDATE PAYLOAD:",
        JSON.stringify(postData, null, 2)
      );

      // ================= SCHEDULE VALIDATION =================
      const isFutureDateTime = (date: Date) =>
        date.getTime() > Date.now();

      if (postDate && !isFutureDateTime(postDate)) {
        const now = new Date();
        const future = new Date(now.getTime() + 60 * 1000);

        Alert.alert(
          "Invalid Time",
          `Please select a future time (for example, ${future.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}).`
        );

        return;
      }

      // ================= API CALL =================
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      let response;

      if (existingPost?.id) {
        response = await updatePostForCampaignApi(

          Number(campaignIdToUse),
          Number(existingPost.id),
          orgId,
          userId,
          postData,
          token
        );
      } else {
        response = await createPostForCampaignApi(
          Number(campaignIdToUse),
          orgId,
          postData,
          token
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
    selectingImage,
    imageModalVisible,
    facebookPages,
    selectedFacebookPageId,
    selectedFacebookPageAccessToken,
    instagramBusinessId,
    leadFormId,
    leadForms,
    isLoadingLeadForms,
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
    hasVideo,
    hasImage,
    hasAttachment,
    canSelectStandard,
    canSelectReel,
    loadingPlaylists,

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
    setSelectedFacebookPageId,
    setSelectedFacebookPageAccessToken,
    setInstagramBusinessId,
    setLeadFormId,
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
    setCanSelectStandard,
    setCanSelectReel,
    setCoverImage,
    setCustomThumbnail,

    // actions
    handleAddAttachment,
    handleRemoveAttachment,
    handleGenerateAIText,
    handleGenerateAIImage,
    handleCreatePinterestBoard,
    handleCustomThumbnailUpload,
    handleCoverImageUpload,
    handleSelectGeneratedImage,
    handleSelectFacebookPage,
    handleSubmit,
    fetchYoutubePlaylists,
    handleCreateYoutubePlaylist,
  };
}

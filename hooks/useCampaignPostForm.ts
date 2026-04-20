import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, useColorScheme } from "react-native";
import { getUser } from "@/api/dashboardApi";

import type { AIImageResponse, CampaignPostData, FacebookPage } from "@/api/campaignApi";
import {
  createPinterestBoardApi,
  createPostForCampaignApi,
  generateAIContentApi,
  generateAIImageApi,
  getFacebookPagesApi,
  getPinterestBoardsApi,
  updatePostForCampaignApi,
  uploadMediaApi,
  getMetaAdsAccountsApi,
  MetaAdsAccount,
} from "@/api/campaignApi";

import { templetApi, TemplateData } from "@/api/templetApi";
import https from "@/api/https";


export interface Attachment {
  uri: string;
  uploadedUrl?: string;
  name: string;
  type: string;
  size?: string;
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
  }, []);


  // ================= FACEBOOK =================
  const [facebookContentType, setFacebookContentType] = useState("STANDARD");
  const [facebookPages, setFacebookPages] = useState<any[]>([]);
  const [selectedFacebookPage, setSelectedFacebookPage] = useState<
    FacebookPage | null
  >(null);
  const [isFacebookPageLoading, setIsFacebookPageLoading] = useState(false);
  const [facebookError, setFacebookError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);

  // ================= LEAD FORMS =================
  const [selectedLeadForm, setSelectedLeadForm] = useState<{ id: string, name: string } | null>(null);
  const [allLeadForms, setAllLeadForms] = useState<{ id: string, name: string }[]>([]);
  const [isLeadFormLoading, setIsLeadFormLoading] = useState(false);
  const [leadFormModalVisible, setLeadFormModalVisible] = useState(false);
  
  // ================= FETCH LEAD FORMS =================
  useEffect(() => {
    const fetchLeadForms = async () => {
      const pageId = selectedFacebookPage?.id;
      const pageAccessToken = selectedFacebookPage?.accessToken || (selectedFacebookPage as any)?.access_token;
      
      console.log("[LeadForms] selectedFacebookPage:", JSON.stringify(selectedFacebookPage));
      console.log("[LeadForms] pageId:", pageId, "hasToken:", !!pageAccessToken);

      if (!pageId || !pageAccessToken) {
        console.log("[LeadForms] Skipping fetch - missing pageId or accessToken");
        setAllLeadForms([]);
        setSelectedLeadForm(null);
        return;
      }

      setIsLeadFormLoading(true);
      try {
        const token = await getToken();
        const res = await https.get(`/socialmedia/facebook/lead-forms`, {
          params: { 
            pageId, 
            pageAccessToken 
          },
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("[LeadForms] API response:", JSON.stringify(res.data?.forms?.length || 0), "forms");
        setAllLeadForms(res.data?.forms || []);
      } catch (err) {
        console.error("[LeadForms] Failed to fetch lead forms", err);
        setAllLeadForms([]);
      } finally {
        setIsLeadFormLoading(false);
      }
    };

    fetchLeadForms();
  }, [selectedFacebookPage]);

  // ================= ATTACHMENTS =================
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const hasImage = attachments.some((a) => a.type?.startsWith("image/"));
  const hasVideo = attachments.some((a) => a.type?.startsWith("video/"));
  const hasDocument = attachments.some((a) => !a.type?.startsWith("image/") && !a.type?.startsWith("video/"));
  const hasAttachment = attachments.length > 0;
  const [canSelectStandard, setCanSelectStandard] = useState(hasImage || hasDocument);
  const [canSelectReel, setCanSelectReel] = useState(hasVideo && !hasImage && !hasDocument);

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
    if (campaignStartDate) {
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

  // ================= BASIC =================
  const [senderEmail, setSenderEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [postDate, setPostDate] = useState<Date | null>(null);

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

  // ================= TEMPLATES =================
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await templetApi.getTemplatesByPlatform(platform);
        if (response.success) {
          setTemplates(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, [platform]);

  const handleSelectTemplate = (template: TemplateData | null) => {
    setSelectedTemplate(template);
    if (template) {
      if (template.subject) setSubject(template.subject);
      if (template.content) setMessage(template.content);

      if (template.mediaUrls && template.mediaUrls.length > 0) {
        const templateAttachments = template.mediaUrls.map((url, index) => ({
          uri: normalizeUrl(url),
          uploadedUrl: url,
          name: `template-media-${index + 1}`,
          type: getMimeFromUrl(url),
          size: undefined, // Template media size not typically available
          uploading: false,
        }));
        setAttachments(templateAttachments);
      }
    } else {
      // Revert to original content from existingPost if editing, or clear if new
      setSubject(existingPost?.subject || "");
      setMessage(existingPost?.message || "");
      
      const prefilledAttachments: Attachment[] = [];
      if (existingPost) {
        // Re-reconstruct original attachments logic
        if (Array.isArray(existingPost.attachments)) {
          prefilledAttachments.push(
            ...existingPost.attachments.map((file: any, index: number) => ({
              uri: normalizeUrl(file.uploadedUrl || file.fileUrl || file.uri),
              uploadedUrl: file.uploadedUrl || file.fileUrl || file.uri,
              name: file.fileName || file.name || `attachment-${index + 1}`,
              type: file.mimeType || file.type || inferMediaType(file.fileUrl || file.uri),
              uploading: false,
            }))
          );
        }
        if (Array.isArray(existingPost.mediaUrls)) {
          prefilledAttachments.push(
            ...existingPost.mediaUrls.map((url: string) => ({
              uri: normalizeUrl(url),
              uploadedUrl: url,
              name: getFileNameFromUrl(url),
              type: getMimeFromUrl(url),
              uploading: false,
            }))
          );
        }
      }
      setAttachments(prefilledAttachments);
    }
  };

  function normalizeUrl(url: string) {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("file:")
    ) {
      return getMediaPreviewUrl(url);
    }
    const baseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL?.replace("/api/", "") ||
      "https://campzeo.com";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  function getMediaPreviewUrl(url: string): string {
    if (!url) return "";

    const id = extractGoogleDriveId(url);
    if (id) {
      // Use the provided storage proxy URL
      const fileName = getFileNameFromUrl(url) || "media";
      return `https://storage.campzeo.com/api/upload/google-drive/view?id=${id}&file=${encodeURIComponent(
        fileName,
      )}`;
    }

    return url;
  }

  function extractGoogleDriveId(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      // Handle standard and subdomain patterns
      if (
        url.includes("googleusercontent.com") ||
        url.includes("drive.google.com")
      ) {
        // Pattern: /d/ID
        if (url.includes("/d/")) {
          const parts = url.split("/d/")[1]?.split(/[/?=]/);
          if (parts && parts[0]) return parts[0];
        }
        // Pattern: ?id=
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get("id");
        if (id) return id;
      }
    } catch {
      // Regex fallbacks
      const dMatch = url.match(/\/d\/([^/?=]+)/);
      if (dMatch) return dMatch[1];
      const idMatch = url.match(/[?&]id=([^?&]+)/);
      if (idMatch) return idMatch[1];
    }
    return null;
  }
  // ================= META BOOSTING =================
  const [metaAccounts, setMetaAccounts] = useState<MetaAdsAccount[]>([]);
  const [loadingMetaAccounts, setLoadingMetaAccounts] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [selectedMetaAccount, setSelectedMetaAccount] = useState<MetaAdsAccount | null>(null);
  const [boostingGoal, setBoostingGoal] = useState<"POST_ENGAGEMENT" | "LEADS">("POST_ENGAGEMENT");
  const [dailyBudget, setDailyBudget] = useState(5);
  const [boostingDuration, setBoostingDuration] = useState(7);

  useEffect(() => {
    const fetchMetaAccounts = async () => {
      if (platform !== "FACEBOOK" && platform !== "INSTAGRAM") return;
      setLoadingMetaAccounts(true);
      try {
        const token = await getToken();
        if (token) {
          const accounts = await getMetaAdsAccountsApi(token);
          setMetaAccounts(accounts);
          if (accounts.length > 0) {
            setSelectedMetaAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch meta ads accounts:", err);
      } finally {
        setLoadingMetaAccounts(false);
      }
    };
    fetchMetaAccounts();
  }, [platform]);

  const totalBudget = dailyBudget * boostingDuration;
  const estimatedReach = {
    min: Math.floor(dailyBudget * 60),
    max: Math.floor(dailyBudget * 80)
  };

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
    
    // Check for Google Drive direct links or common storage patterns
    if (uri.includes("googleusercontent.com") || uri.includes("lh3.googleusercontent.com")) {
      return "image/jpeg";
    }

    const ext = uri.split(".").pop()?.toLowerCase();
    if (!ext || ext.length > 5) return "image/jpeg"; // Default to image if no clear extension

    if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "gif") return "image/gif";
    if (ext === "webp") return "image/webp";
    if (ext === "mp4") return "video/mp4";
    if (ext === "mov") return "video/quicktime";
    
    return "image/jpeg"; // Default fallback for media lists
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
    if (!url) return "image/jpeg";
    return inferMediaType(url);
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
    // Only prefill if we have a real post object with an ID, and we haven't prefilled yet
    const isRealPost = existingPost && (existingPost.id || existingPost._id);
    if (!isRealPost || hasPrefilledRef.current) return;

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
      setCoverImage(savedCover);
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
          uri: normalizeUrl(file.uploadedUrl || file.fileUrl || file.uri),
          uploadedUrl: file.uploadedUrl || file.fileUrl || file.uri,
          name: file.fileName || file.name || `attachment-${index + 1}`,
          type:
            file.mimeType ||
            file.type ||
            inferMediaType(file.fileUrl || file.uri),
          size: file.fileSize || file.size,
          uploading: false,
        })),
      );
    }

    if (Array.isArray(existingPost.mediaUrls)) {
      prefilledAttachments.push(
        ...existingPost.mediaUrls
          .filter((url: string) => {
            // Only exclude cover image from attachments if it's a REEL/SHORT where separate cover UI is shown
            const isReelOrShort = 
              facebookContentType === "REEL" || 
              youTubeContentType === "SHORT";

            if (isReelOrShort && coverImageToExclude && url === coverImageToExclude) {
              console.log("Excluding cover image from attachments list (rendered separately as cover):", url);
              return false;
            }
            return true;
          })
          .map((url: string, index: number) => ({
            uri: normalizeUrl(url),
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
  const handleAddAttachment = async () => {
    try {
      if (platform === "EMAIL") {
        await handlePickMedia("document");
      } else {
        await handlePickMedia("image");
      }
    } catch (error: any) {
      console.error("Add attachment error:", error);
    }
  };

  const handlePickMedia = async (mode: "image" | "document") => {
    try {
      let pickedAsset: any = null;

      if (mode === "image") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Please allow access to photos and videos.");
          return;
        }

        const isYouTube = platform === "YOUTUBE";
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: isYouTube
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.All,
          quality: 0.8,
          selectionLimit: 1,
        });

        if (result.canceled) return;
        const asset = result.assets[0];
        pickedAsset = {
          uri: asset.uri,
          name: asset.fileName ?? `${asset.type === "video" ? "video" : "image"}-${Date.now()}.${asset.type === "video" ? "mp4" : "jpg"}`,
          type: asset.type === "video" ? "video/mp4" : "image/jpeg",
          size: asset.fileSize,
        };
      } else {
        // Document Mode
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (result.canceled) return;
        const asset = result.assets[0];
        pickedAsset = {
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType ?? "application/octet-stream",
          size: asset.size,
        };
      }

      if (!pickedAsset) return;

      // 3️⃣ Validate max media limit
      if (attachments.length + 1 > 10) {
        Alert.alert("Upload limit", "You can upload a maximum of 10 media files");
        return;
      }

      const isVideo = pickedAsset.type.startsWith("video/");

      const tempAttachment: Attachment = {
        uri: pickedAsset.uri,
        name: pickedAsset.name,
        type: pickedAsset.type,
        size: pickedAsset.size ? `${(pickedAsset.size / 1024).toFixed(1)} KB` : undefined,
        uploading: true,
      };

      setAttachments((prev) => [...prev, tempAttachment]);
      setUploadingMedia(true);
      setUploadProgress(0);

      // 4️⃣ Upload to backend
      const token = await getToken();
      if (!token) throw new Error("No authentication token available");

      const finalUrl = await uploadMediaApi(
        {
          uri: pickedAsset.uri,
          name: pickedAsset.name,
          type: pickedAsset.type,
        },
        token,
        (progress) => {
          const visualProgress = Math.min(Math.round(progress), 99);
          setUploadProgress(visualProgress);
          setAttachments((prev) =>
            prev.map((a) =>
              a.uri === pickedAsset.uri ? { ...a, progress: visualProgress } : a
            )
          );
        },
        { organisationId, campaignId, isReel: isVideo, platform }
      );

      if (!finalUrl) throw new Error("Upload failed: no URL returned");

      // 5️⃣ Replace temp attachment with uploaded one
      setAttachments((prev) =>
        prev.map((a) =>
          a.uri === pickedAsset.uri
            ? { ...a, uploadedUrl: finalUrl, progress: 100, uploading: false }
            : a
        )
      );

      // 6️⃣ Auto content-type detection
      if (platform === "INSTAGRAM" || platform === "FACEBOOK") {
        if (isVideo) {
          setFacebookContentType("REEL");
        } else {
          const hasExistingVideo = attachments.some((a) => a.type?.startsWith("video/"));
          if (!hasExistingVideo) {
            setFacebookContentType("STANDARD");
          }
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
  };

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

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token missing");

      const payload = {
        prompt: aiPrompt,
        context: { platform, existingContent: message || "" }, // ✅ existingContent required
        mode: "generate-multiple",
      };

      const response = await generateAIContentApi(payload, token);

      if (!response) throw new Error("No AI response returned");

      let aiSuggestions: { subject: string; content: string }[] = [];

      if (response.variations?.length > 0) {
        // Normal platforms: use variations
        aiSuggestions = response.variations.slice(0, 3).map((v: any) => ({
          subject: platform === "SMS" ? "" : (v.subject ?? ""),
          content: v.content,
        }));
      } else if (platform === "SMS" && response.content) {
        // SMS fallback: use single content
        aiSuggestions = [{ subject: "", content: response.content }];
      } else {
        throw new Error("No AI suggestions returned");
      }

      setAiResults(aiSuggestions);
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

  const handleSelectGeneratedImage = async (imageUrl: string) => {
    try {
      if (selectingImage) return; 

      setSelectingImage(imageUrl); 

      const token = await getToken();
      if (!token) throw new Error("Token missing");

      console.log(`🤖 Initiating upload for AI generated image:`, imageUrl);
      const uploadedUrl = await uploadMediaApi(
        {
          uri: imageUrl,
          name: `ai-image-${Date.now()}.jpg`,
          type: "image/jpeg",
        },
        token,
        undefined,
        {
          organisationId,
          campaignId,
          isReel: false,
          platform,
        }
      );
      console.log(`✅ AI image upload complete. Attachment URI:`, uploadedUrl);

      setAttachments((prev) => [
        ...prev,
        {
          uri: uploadedUrl,
          uploadedUrl: uploadedUrl,
          name: "ai-image.jpg",
          type: "image/jpeg",
          uploading: false,
        },
      ]);

      setSelectedImage(imageUrl);

      // small delay makes UX smoother
      setTimeout(() => {
        setImageModalVisible(false);
        setSelectingImage(null);
      }, 300);
    } catch (error) {
      setSelectingImage(null);
      Alert.alert("Upload failed", "Unable to upload AI image");
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
        setSelectedFacebookPage(pages[0]);
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

      setPinterestBoard(response?.data?.name || newPinterestBoard.trim());
      setPinterestBoardId(response?.data?.id);

      setMetadata((prev) => ({
        ...prev,
        boardId: response?.data?.id,
        boardName: response?.data?.name || newPinterestBoard.trim(),
      }));
      setNewPinterestBoard("");
      setPinterestDescription("");
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
      Alert.alert("Campaign ID missing");
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
          (platform === "EMAIL" || 
           a.type.startsWith("image/") || 
           a.type.startsWith("video/"))
      )
      .map((a) => a.uploadedUrl);

    console.log("MEDIA URLS BEING SENT:", mediaUrls);

    const invalidMedia = attachments.filter(
      (a) =>
        !a.uploadedUrl ||
        !a.type ||
        (platform !== "EMAIL" && !a.type.startsWith("image/") && !a.type.startsWith("video/"))
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

        if (isBoosting && selectedMetaAccount) {
          finalMetadata.boosting = {
            accountId: selectedMetaAccount.id,
            accountName: selectedMetaAccount.name,
            goal: boostingGoal,
            dailyBudget: dailyBudget,
            durationDays: boostingDuration,
            totalBudget: totalBudget,
            currency: selectedMetaAccount.currency,
          };
        }
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
    const postData: CampaignPostData = {
      senderEmail,
      subject,
      message,
      type: platform,
      mediaUrls,
      scheduledPostTime: postDate?.toISOString() || new Date().toISOString(),
      metadata: finalMetadata,
      thumbnailUrl: coverImage || customThumbnail || null,
      // Root level fields for better backend Create API compatibility
      isReel: (platform === "FACEBOOK" || platform === "INSTAGRAM") ? (facebookContentType === "REEL") : undefined,
      postType: (platform === "FACEBOOK" || platform === "INSTAGRAM") ? facebookContentType : undefined,
      coverImage: (platform === "FACEBOOK" || platform === "INSTAGRAM") ? (coverImage || null) : undefined,

      ...(platform === "PINTEREST"
        ? {
            pinterestBoardId: PinterestBoardId,
            pinterestLink: metadata?.destinationLink || "",
          }
        : {}),
    };

    console.log(
      "FINAL CREATE/UPDATE PAYLOAD:",
      JSON.stringify(postData, null, 2)
    );

    // ================= API CALL =================

    // ================= API CALL =================
    const token = await getToken();
    if (!token) throw new Error("Authentication token missing");

    let response;

    if (existingPost?.id) {
      response = await updatePostForCampaignApi(
        Number(campaignIdToUse),
        Number(existingPost.id),
        postData,
        token
      );
    } else {
      response = await createPostForCampaignApi(
        Number(campaignIdToUse),
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
    selectedLeadForm,
    allLeadForms,
    isLeadFormLoading,
    leadFormModalVisible,


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
    hasDocument,
    hasAttachment,
    canSelectStandard,
    canSelectReel,

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
    setTemplateModalVisible,
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
    setIsBoosting,
    setSelectedMetaAccount,
    setBoostingGoal,
    setDailyBudget,
    setBoostingDuration,
    setSelectedLeadForm,
    setLeadFormModalVisible,


    // actions
    handleAddAttachment,
    handleRemoveAttachment,
    handleGenerateAIText,
    handleGenerateAIImage,
    handleCreatePinterestBoard,
    handleCustomThumbnailUpload,
    handleCoverImageUpload,
    handleSelectGeneratedImage,
    handleSelectTemplate,
    handleSubmit,
  };

}

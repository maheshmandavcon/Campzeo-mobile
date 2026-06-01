import https from "./https";

// ---------------------- Types ---------------------- //

export interface CampaignData {
  id?: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  contactIds: number[];
}

export interface CampaignPostData {
  senderEmail: string | null;
  subject: string;
  message: string;
  type: string;
  mediaUrls?: string[];
  scheduledPostTime?: string | null;

  pinterestBoardId?: string;
  pinterestLink?: string;
  thumbnailUrl?: string | null;

  isReel?: boolean;
  postType?: string;
  coverImage?: string | null;

  facebookPageAccessToken?: string;
  facebookPageId?: string;
  facebookPageName?: string;
  instagramBusinessId?: string;
  leadFormId?: number | null;

  metadata?: {
    destinationLink?: string;
    tags?: string[];
    postType?: string;
    privacy?: string;
    playlistId?: string;
    playlistTitle?: string;
    coverImage?: string | null;
    isReel?: boolean;
    coverUrl?: string | null;
  };
}

// social status to check which accounts are connected :
export const getSocialStatus = async (token?: string) => {
  try {
    const response = await https.get("user/social-status", {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Get Social Status API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// ---------------------- Campaign APIs ---------------------- //

// Create a new campaign

export const createCampaignApi = async (data: CampaignData) => {
  try {
    const response = await https.post("Campaigns/AddCampaign", data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Create Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Get campaigns

export const getCampaignsApi = async (orgId: number,
  page: number = 1,
  limit: number = 10,
) => {
  try {
    // console.log("orgId", orgId);
    // const params: any = { page, limit };
    const response = await https.get(`Campaigns?organisationId=${orgId}&page=${page}&limit=${limit}&sortBy=createdAt&sortOrder=desc`);
    return response.data;
  } catch (error: any) {
    console.error("Get Campaigns API Error:", error.response || error.message);
    throw error;
  }
};

// Get single campaign by ID

export const getCampaignByIdApi = async (id: number, orgId: number, token: string) => {

  try {
    const response = await https.get(`Campaigns/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      }
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Get Campaign By ID API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Update campaign by ID

export const updateCampaignApi = async (data: CampaignData, token: string) => {
  try {
    const response = await https.put(`Campaigns/UpdateCampaign`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Update Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Delete campaign

export const deleteCampaignApi = async (id: number, organisationId: number, token?: string) => {
  let data = {
    id,
    organisationId,
  }
  console.log("delete", data);

  try {
    const response = await https.post(`Campaigns/DeleteCampaign`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Delete Campaign API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// ---------------------- Campaign Post APIs ---------------------- //

// Get posts for a specific campaign

export const getPostsByCampaignIdApi = async (campaignId: number, orgId: number) => {
  try {
    const res = await https.get(`Campaigns/${campaignId}/posts?organisationId=${orgId}`);
    // console.log("reeeesss",res.data);

    return res.data;
  } catch (error: any) {
    console.error("Get Posts Error:", error.response?.data || error.message);
    return null;
  }
};
// Get get specific post details

export const getPostDetails = async (campaignId: number, postId: number, orgId: number, token: string) => {
  try {
    const res = await https.get(`Campaigns/${campaignId}/posts/${postId}?organisationId=${orgId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    // console.log("reeeesss",res.data);

    return res.data;
  } catch (error: any) {
    console.error("Get Posts Error:", error.response?.data || error.message);
    return null;
  }
};



// Create a post for a specific campaign

export const createPostForCampaignApi = async (
  campaignId: number,
  orgId: number,
  data: CampaignPostData,
  token?: string,
) => {
  try {
    const response = await https.post(`Campaigns/${campaignId}/posts?organisationId=${orgId}`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // console.log("FINAL PAYLOAD BEFORE API:", JSON.stringify(data, null, 2));
    // console.log("Create Post API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Create Post API Error:", error.response || error.message);
    throw error;
  }
};

// Delete a post for a specific campaign
// Note: Can only delete posts in DRAFT or SCHEDULED status

// export const deletePostForCampaignApi = async (
//   campaignId: number,
//   postId: number,
// ) => {
//   try {
//     const response = await https.delete(
//       `/campaigns/${campaignId}/posts/${postId}`,
//       {
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//     console.log("Delete Post API Response:", response.data);
//     return response.data;
//   } catch (error: any) {
//     console.error(
//       "Delete Post API Error:",
//       error.response?.data || error.message,
//     );
//     throw error;
//   }
// };

// Share a campaign post

export const shareCampaignPostApi = async (
  orgId: number,
  campaignId: number,
  postId: number,
  contactIds: number[],
) => {
  try {
    const response = await https.post(
      `Campaigns/${campaignId}/posts/${postId}/send?organisationId=${orgId}`,
      { contactIds },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    console.log("✅ Share Post API Response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Send Campaign Post API Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Update (Edit) a post for a specific campaign

export const updatePostForCampaignApi = async (
  campaignId: number,
  postId: number,
  orgId: number,
  userId: string,
  data: CampaignPostData,
  token?: string,
) => {
  try {
    const response = await https.put(
      `Campaigns/${campaignId}/posts/${postId}?organisationId=${orgId}&userId=${userId}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error("Update Post API Error:", error.response || error.message);
    throw error;
  }
};

export const deletePostForCampaignApi = async (
  orgId: number,
  campaignId: number,
  postId: number,
) => {
  try {
    const response = await https.delete(
      `Campaigns/${campaignId}/posts/${postId}?organisationId=${orgId}`,
    );
    return response.data;
  } catch (error: any) {
    console.error("Delete Post API Error:", error.response || error.message);
    throw error;
  }
};

// ---------------------- AI APIs ---------------------- //

// Generate AI Content

export interface AIContentRequest {
  prompt: string;
  context: { platform: string; existingContent: string };
  mode: string;
  message?: string;
}

export interface AIVariation {
  subject: string;
  content: string;
}

export interface AIContentResponse {
  success: boolean;
  content: string;
  subject: string;
  variations: AIVariation[];
}

export const generateAIContentApi = async (
  orgId: number,
  data: AIContentRequest,
  token?: string,
) => {
  try {
    const finalPayload = {
      ...data,
      organisationId: orgId,
    };

    const response = await https.post("AI/groq-chat", finalPayload, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "AI Content Generation API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Generate AI Image

// export interface AIImageRequest {
//   prompt: string;
//   count?: number;
// }

// export interface AIImageResponse {
//   success: boolean;
//   images?: string[];
//   imagePrompt: string;
//   message: string;
// }

// export const generateAIImageApi = async (
//   data: AIImageRequest,
//   token?: string,
// ) => {
//   try {
//     const response = await https.post("/ai/generate-image", data, {
//       headers: {
//         "Content-Type": "application/json",
//         ...(token && { Authorization: `Bearer ${token}` }),
//       },
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error(
//       "AI Image Generation API Error:",
//       error.response || error.message,
//     );
//     throw error;
//   }
// };

export interface AIImageRequest {
  prompt: string;
  count?: number;
}

export interface AIImageResponse {
  imagePrompt?: string;
  imageUrl?: string;
  message?: string;
  provider?: string;
  success?: boolean;
}

export const generateAIImageApi = async (
  data: AIImageRequest,
  token?: string,
) => {
  try {
    const response = await https.post("AI/generate-image", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // Log the full response for debugging
    // console.log("AI Image Generation Response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      "AI Image Generation API Error:",
      error.response ? error.response.data : error.message,
    );
    throw error;
  }
};

// ---------------------- Pinterest APIs ---------------------- //

// Create Pinterest Boards

export const createPinterestBoardApi = async (
  payload: {
    name: string;
    description?: string;
    privacy: "PUBLIC";
  },
  token?: string,
) => {
  try {
    const response = await https.post(
      "SocialMedia/Pinterest/Boards",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "Create Pinterest Board API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

// Get Pinterest Boards

export const getPinterestBoardsApi = async (token?: string) => {
  try {
    const res = await https.get("/socialmedia/pinterest/boards", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return res.data.boards || [];
  } catch (error: any) {
    console.error(
      "Get Pinterest Boards API Error:",
      error.response || error.message,
    );
    return [];
  }
};

// ---------------------- Facebook APIs ---------------------- //

export const getFbPages = async (token?: string) => {
  try {
    const response = await https.get("SocialMedia/facebook/pages", {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Get Fb Pages API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

export const getLeedForm = async (pageId: string, pageAccessToken: string, token?: string) => {
  try {
    const response = await https.get(`SocialMedia/facebook/lead-forms?pageId=${pageId}&pageAccessToken=${pageAccessToken}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Get Leed Form API Error:",
      error.response || error.message,
    );
    throw error;
  }
};

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
  category?: string;
}

export const getFacebookPagesApi = async (
  token?: string,
): Promise<FacebookPage[]> => {
  try {
    const response = await https.get("/socialmedia/facebook/pages", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    if (response.data.error) throw new Error(response.data.error);
    const rawPages = response.data.pages || [];
    return rawPages.map((p: any) => ({
      id: p.id,
      name: p.name,
      accessToken: p.accessToken || p.access_token,
      category: p.category,
    }));
  } catch (error: any) {
    throw error;
  }
};

// ---------------------- Meta Ads APIs ---------------------- //

export interface MetaAdsAccount {
  name: string;
  account_id: string;
  account_status: number;
  currency: string;
  balance: string;
  id: string;
}

export const getMetaAdsAccountsApi = async (
  token?: string,
): Promise<MetaAdsAccount[]> => {
  try {
    const response = await https.get("/socialmedia/meta-ads/accounts", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data.accounts || [];
  } catch (error: any) {
    console.error(
      "Get Meta Ads Accounts API Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// ---------------------- YouTube APIs ---------------------- //

export interface YouTubePlaylist {
  id: string;
  title: string;
}

export const getYouTubePlaylistsApi = async (
  token?: string,
): Promise<YouTubePlaylist[]> => {
  try {
    const response = await https.get("/youtube/playlists", {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data.playlists || response.data || [];
  } catch (error: any) {
    console.error(
      "Get YouTube Playlists API Error:",
      error.response?.data || error.message,
    );
    return [];
  }
};

// ---------------------- Upload Media API ---------------------- //

export const uploadMediaApi = async (
  attachment: { uri: string; name: string; type: string },
  token: string,
  onProgress?: (percentage: number) => void,
  options?: {
    organisationId?: number | string;
    campaignId?: string | number;
    isReel?: boolean;
    platform?: string;
  },
): Promise<string> => {
  try {
    console.log("🔄 Starting upload process via new API for:", attachment.name);

    const params: string[] = [];
    if (options?.organisationId !== undefined && options?.organisationId !== "") {
      params.push(`organisationId=${options.organisationId}`);
    }
    if (options?.campaignId !== undefined && options?.campaignId !== "") {
      params.push(`campaignId=${options.campaignId}`);
    }
    if (options?.platform) {
      params.push(`platform=${options.platform}`);
    }
    if (options?.isReel !== undefined) {
      params.push(`isReel=${options.isReel ? "true" : "false"}`);
    }

    const uploadUrl = `Upload` + (params.length > 0 ? `?${params.join("&")}` : "");
    console.log("📍 Upload Endpoint:", uploadUrl);

    const formData = new FormData();
    formData.append("file", {
      uri: attachment.uri,
      name: attachment.name,
      type: attachment.type,
    } as any);

    const response = await https.post(uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    const result = response.data;
    if (result.success && result.url) {
      console.log("✅ File uploaded successfully:", result.url);
      return result.url;
    } else {
      throw new Error(result.message || "Upload failed: No URL returned from server");
    }
  } catch (error: any) {
    const serverMessage = error.response?.data?.message || error.response?.data || error.message;
    console.error("Upload Media API Error:", serverMessage);
    throw new Error(serverMessage);
  }
};

// Get YouTube Playlists
export const getYoutubePlaylists = async (token: string) => {
  try {
    const response = await https.get("Youtube/Playlists", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-api-key": process.env.EXPO_PUBLIC_APP_API_KEY || "",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Get Youtube Playlists API Error:", error.response || error.message);
    throw error;
  }
};

// Create YouTube Playlist
export const createYoutubePlaylist = async (data: { title: string; privacy?: string }, token: string) => {
  try {
    const response = await https.post("Youtube/Playlists", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Create Youtube Playlist API Error:", error.response || error.message);
    throw error;
  }
};

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
  scheduledPostTime: string;

  pinterestBoardId?: string;
  pinterestLink?: string;
  thumbnailUrl?: string | null;

  isReel?: boolean;
  postType?: string;
  coverImage?: string | null;

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

// ---------------------- Campaign APIs ---------------------- //

// Create a new campaign

export const createCampaignApi = async (data: CampaignData) => {
  try {
    const response = await https.post("/campaigns", data, {
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

export const getCampaignsApi = async (
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  try {
    const params: any = { page, limit };
    if (search) params.search = search;
    const response = await https.get("/campaigns", { params });
    return response.data;
  } catch (error: any) {
    console.error("Get Campaigns API Error:", error.response || error.message);
    throw error;
  }
};

// Get single campaign by ID

export const getCampaignByIdApi = async (id: number) => {
  try {
    const response = await https.get(`/campaigns/${id}`);
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

export const updateCampaignApi = async (id: number, data: CampaignData) => {
  try {
    const response = await https.put(`/campaigns/${id}`, data, {
      headers: { "Content-Type": "application/json" },
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

export const deleteCampaignApi = async (id: number) => {
  try {
    const response = await https.delete(`/campaigns/${id}`);
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

export const getPostsByCampaignIdApi = async (campaignId: number) => {
  try {
    const res = await https.get(`/campaigns/${campaignId}/posts`);
    return res.data;
  } catch (error: any) {
    console.error("Get Posts Error:", error.response?.data || error.message);
    return null;
  }
};

// Create a post for a specific campaign

export const createPostForCampaignApi = async (
  campaignId: number,
  data: CampaignPostData,
  token?: string,
) => {
  console.log(
    "🧩 [CreatePost] Payload being sent:",
    JSON.stringify(data, null, 2),
  );
  try {
    const response = await https.post(`/campaigns/${campaignId}/posts`, data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    console.log("FINAL PAYLOAD BEFORE API:", JSON.stringify(data, null, 2));
    console.log("Create Post API Response:", response.data);
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
  campaignId: number,
  postId: number,
  contactIds: number[],
) => {
  console.log("📤 [SharePost] campaignId:", campaignId);
  console.log("📤 [SharePost] postId:", postId);
  console.log("📤 [SharePost] contactIds:", contactIds);

  try {
    const response = await https.post(
      `/campaigns/${campaignId}/posts/${postId}/send`,
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
  data: CampaignPostData,
  token?: string,
) => {
  try {
    const response = await https.put(
      `/campaigns/${campaignId}/posts/${postId}`,
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
  campaignId: number,
  postId: number,
) => {
  try {
    const response = await https.delete(
      `/campaigns/${campaignId}/posts/${postId}`,
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
  data: AIContentRequest,
  token?: string,
) => {
  try {
    const response = await https.post("/ai/generate-content", data, {
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
    const response = await https.post("/ai/generate-image", data, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    // Log the full response for debugging
    console.log("AI Image Generation Response:", response.data);

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
      "/socialmedia/pinterest/boards",
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

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
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
    return response.data.pages || [];
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

export const getMetaAdsAccountsApi = async (token?: string): Promise<MetaAdsAccount[]> => {
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
    console.log("🔄 Starting upload process for:", attachment.name);

    // Get Base URL from env and ensure correct formatting
    const baseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
    const uploadRefUrl = `${baseUrl}/upload/google-drive/resumable`;

    console.log("📍 Token Endpoint:", uploadRefUrl);

    // 1️⃣ Initialize resumable upload
    const payload = {
      fileName: attachment.name,
      mimeType: attachment.type,

      ...(options?.organisationId !== undefined && {
        organisationId: options.organisationId,
      }),

      ...(options?.campaignId !== undefined && {
        campaignId: String(options.campaignId),
      }),

      ...(options?.isReel !== undefined && {
        isReel: options.isReel,
      }),

      ...(options?.platform && {
        platform: options.platform,
      }),
    };

    const initRes = await fetch(uploadRefUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!initRes.ok) {
      const errorText = await initRes.text();
      throw new Error(`Upload init failed: ${initRes.status} ${errorText}`);
    }

    const initData = await initRes.json();

    // Extract upload URL from initData
    const uploadUrl =
      initData.data?.uploadUrl ||
      initData.uploadUrl ||
      initData.url ||
      initData.resumableUrl;

    if (!uploadUrl) {
      console.error("No uploadUrl returned from POST init:", initData);
      throw new Error(
        "Upload failed: No upload URL returned from backend init step",
      );
    }

    // 2️⃣ Read file as Blob
    const fileResponse = await fetch(attachment.uri);
    const blob = await fileResponse.blob();

    console.log("📤 Uploading bytes to:", uploadUrl);
    
    const responseContent = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", attachment.type);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            onProgress(percentComplete);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload PUT failed: ${xhr.status} ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload PUT network error"));
      xhr.send(blob);
    });

    // 4️⃣ Get result from response
    let uploadResult: any = {};
    try {
      if (responseContent && typeof responseContent === "string") {
        uploadResult = JSON.parse(responseContent);
      } else if (responseContent && typeof responseContent === "object") {
        uploadResult = responseContent;
      }
    } catch {
      console.log("PUT response is not JSON");
    }

    const resultData = uploadResult.data || uploadResult;
    const fileId = resultData?.id || initData.data?.id;
    let publicUrl = "";

    if (resultData?.url) {
      publicUrl = resultData.url;
    } else if (fileId) {
      publicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    } else {
      publicUrl = uploadUrl;
    }


    console.log("✅ File uploaded successfully:", publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error("Upload Media API Error:", error.message);
    throw error;
  }
};

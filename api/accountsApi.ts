import https from "./https";

export type FacebookPage = {
  id: string;
  name: string;
  access_token?: string;
  accessToken?: string;
};

// To connect the platform
export const getPlatform = async (platform: string) => {
  try {
    const response = await https.get(`/SocialMedia/auth-url?platform=${platform}`);
    return response.data;
  } catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
};

// To check status that wheather user is connected to the platform or not
export const getSocialStatus = async () => {
  try {
    const response = await https.get("user/social-status");
    return response.data;
  } catch (error) {
    console.error("Fetching platform Error:", error);
    throw error;
  }
};

export const getFbPages = async (): Promise<FacebookPage[]> => {
  try {
    const response = await https.get("SocialMedia/facebook/pages");
    const pages = response.data?.pages?.data || response.data?.pages || [];
    return Array.isArray(pages) ? pages : [];
  } catch (error) {
    console.error("Failed to get Facebook Pages", error);
    throw error;
  }
};

export const saveFacebookPage = async (
  pageId: string,
  pageAccessToken: string,
) => {
  try {
    const response = await https.post("SocialMedia/facebook/save-page", {
      pageId,
      pageAccessToken,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to save Facebook Page", error);
    throw error;
  }
};

// To disconnect the platform post the platform name
export const disconnectPlatform = async (platform: string) => {
  try {
    const response = await https.post("SocialMedia/disconnect", { platform });
    return response.data;
  } catch (error) {
    console.error("Disconnecting Accounts Error:", error);
    throw error; // IMPORTANT
  }
};

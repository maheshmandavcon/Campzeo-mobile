import https from "./https";

// To connect the platform 
export const getPlatform = async (platform: string) => {
  try {
    const response = await https.get(`/socialmedia/auth-url?platform=${platform}`);    
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

// To disconnect the platform post the platform name
export const disconnectPlatform = async (platform: string) => {
  try {
    const response = await https.post("socialmedia/disconnect",{ platform });
    return response.data; 

  } catch (error) {
    console.error("Disconnecting Accounts Error:", error);
    throw error; // IMPORTANT
  }
};
